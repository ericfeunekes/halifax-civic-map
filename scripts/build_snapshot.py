#!/usr/bin/env python3
"""Build a static Halifax civic data snapshot for GitHub Pages.

The script fetches verified public data sources once, stores normalized features
in SQLite, and exports static GeoJSON files plus a manifest for the browser app.
It intentionally uses only the Python standard library so GitHub Actions can run
the daily refresh without dependency setup.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import sqlite3
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_BBOX = {
    "name": "urban_hrm_core",
    "label": "Halifax peninsula, Dartmouth, Bedford, Sackville, Spryfield, and Herring Cove area",
    "west": -63.75,
    "south": 44.55,
    "east": -63.43,
    "north": 44.82,
}
CHUNK_DEGREES = 0.025

SOURCE_LINKS = {
    "pplc": "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/PPLC_Permits_Geolocated/FeatureServer",
    "traffic_studies": "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/arcgis/rest/services/HRM_Traffic_Studies/FeatureServer/0",
    "active_travelways": "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/Active_Travelways/FeatureServer/0",
    "service_requests": "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/Cityworks_Service_Requests/FeatureServer/0",
    "work_orders": "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/Cityworks_Work_Orders/FeatureServer/0",
    "nspw_projects": "https://services2.arcgis.com/11XBiaBYA9Ep0yNJ/ArcGIS/rest/services/NSDPW_Capital_Projects_Work_Plan_2025_2030/FeatureServer",
    "ns_roads": "https://data.novascotia.ca/resource/xtdd-axm7.geojson",
    "ns_traffic_sections": "https://data.novascotia.ca/resource/vg5n-eehf.geojson",
    "child_care": "https://data.novascotia.ca/resource/3j9v-yimg.json",
    "schools": "https://data.novascotia.ca/resource/iyap-ttn5.json",
}


@dataclass(frozen=True)
class Layer:
    id: str
    label: str
    source: str
    category: str
    source_type: str
    url: str
    where: str = "1=1"
    geometry_field: str | None = None
    order_by: str | None = None


LAYERS = [
    Layer("building", "Building permits", "HRM PPL&C Building Permits", "permit", "arcgis-layer", f"{SOURCE_LINKS['pplc']}/0/query"),
    Layer("construction", "Construction permits", "HRM PPL&C Construction Permits", "permit", "arcgis-layer", f"{SOURCE_LINKS['pplc']}/1/query"),
    Layer("engineering", "Engineering permits", "HRM PPL&C Engineering Permits", "permit", "arcgis-layer", f"{SOURCE_LINKS['pplc']}/2/query"),
    Layer("water", "Halifax Water permits", "HRM PPL&C Halifax Water Permits", "permit", "arcgis-layer", f"{SOURCE_LINKS['pplc']}/3/query"),
    Layer("landuse", "Land-use approvals", "HRM PPL&C Land Use Approvals", "permit", "arcgis-layer", f"{SOURCE_LINKS['pplc']}/4/query"),
    Layer("row", "Public ROW permits", "HRM PPL&C Public Works ROW Permits", "permit", "arcgis-layer", f"{SOURCE_LINKS['pplc']}/6/query"),
    Layer("traffic-studies", "Traffic studies", "HRM Traffic Studies", "traffic", "arcgis-layer", f"{SOURCE_LINKS['traffic_studies']}/query"),
    Layer(
        "service-requests",
        "Service requests",
        "HRM Cityworks Service Requests",
        "disruption",
        "arcgis-latlon-table",
        f"{SOURCE_LINKS['service_requests']}/query",
        order_by="REQUEST_ID DESC",
    ),
    Layer(
        "work-orders",
        "Work orders",
        "HRM Cityworks Work Orders",
        "disruption",
        "arcgis-webmercator-table",
        f"{SOURCE_LINKS['work_orders']}/query",
        order_by="DATE_INITIATED DESC",
    ),
    Layer("nspw-road-projects", "Provincial road projects", "NSDPW Capital Projects Work Plan 2025-2030", "project", "arcgis-layer", f"{SOURCE_LINKS['nspw_projects']}/1/query"),
    Layer("nspw-bridge-projects", "Provincial bridge projects", "NSDPW Capital Projects Work Plan 2025-2030", "project", "arcgis-layer", f"{SOURCE_LINKS['nspw_projects']}/0/query"),
    Layer("active-travelways", "Active travelways", "HRM Active Travelways", "mobility", "arcgis-layer", f"{SOURCE_LINKS['active_travelways']}/query"),
    Layer("traffic-volume-sections", "Provincial traffic sections", "Nova Scotia Traffic Volume Sections", "road", "socrata-geojson", SOURCE_LINKS["ns_traffic_sections"]),
    Layer("ns-roads", "NS addressable roads", "NSCAF Addressable Roads", "road", "socrata-geojson", SOURCE_LINKS["ns_roads"]),
    Layer("child-care", "Child care", "Nova Scotia Child Care Directory", "community", "socrata-point-json", SOURCE_LINKS["child_care"], where="county='Halifax County'", geometry_field="georeference"),
    Layer("schools", "Public schools", "Nova Scotia Public Schools", "community", "socrata-point-json", SOURCE_LINKS["schools"], geometry_field="geo_location"),
]

ESSENTIAL_FIELDS = {
    "OBJECTID",
    "ObjectId",
    "GLOBALID",
    "GlobalID",
    "PERMIT_NUMBER",
    "PERMIT_NAME",
    "PERMIT_STATUS",
    "Permit_Status",
    "PRIMARY_WORK_TYPE",
    "Primary_Work_Type",
    "WORK_TYPE",
    "PRIMARY_WORK_SCOPE",
    "Primary_Work_Scope",
    "WORK_SCOPE",
    "CIVIC_ADDRESS",
    "Civic_Address",
    "CIVIC_NUMBER",
    "CIVIC_NUM",
    "CIV_NUM",
    "ADDRESS",
    "LOCATION",
    "STREET",
    "STREET_NAME",
    "PID",
    "DATE_OF_SUBMISSION",
    "DATE_OF_PERMIT_ISSUANCE",
    "ISSUED_DATE",
    "Issued_Date",
    "COMPLETED_DATE",
    "EXPIRATION_DATE",
    "DATE_INSPECTION_COMPLETED",
    "WORK_DESCRIPTION",
    "Work_Description",
    "DESCRIPTION",
    "NET_NEW_UNITS",
    "Net_New_Units",
    "ESTIMATED_PROJECT_VALUE",
    "Estimated_Project_Value",
    "STUDY_TYPE",
    "REQ_NUM",
    "STREETNAME1",
    "STREETNAME2",
    "SURVEYDATE1",
    "SURVEYDATE2",
    "ADDDATE",
    "F85TH_PER",
    "AAWT",
    "YEAR",
    "HYPERLINK",
    "STATUS",
    "PRIORITY",
    "REQUEST_ID",
    "REQUEST_CATEGORY",
    "ASSET_TYPE",
    "DATE_INITIATED",
    "ACTUAL_START_DATE",
    "DATE_CLOSED",
    "ACTUAL_FINISH_DATE",
    "WORK_ORDER_CAUSE",
    "RESOLUTION",
    "DEPT_RESPONSIBILITY",
    "WORK_ORDER",
    "WORK_ORDER_ID",
    "PRJ_TYPE",
    "PRJ_STAT",
    "PRJ_DUR",
    "PRJ_YR_ST",
    "PRJ_YR_END",
    "PRJ_DESC",
    "MNAME",
    "ASSETCODE",
    "ASSETGRP",
    "OWNER",
    "MAT",
    "ASSETSTAT",
    "LENGTH",
    "WIDTH",
    "INSTYR",
    "WINT_MAINT",
    "ACCESSIBLE",
    "Shape__Length",
    "street",
    "sect_desc",
    "comm",
    "roadclass",
    "owner",
    "anum",
    "section_id",
    "segid",
    "dir",
    "shape_leng",
    "sectkm_dat",
    "county",
    "facility_name",
    "facility_type",
    "age_range",
    "address",
    "city",
    "total_licence_capacity",
    "annual_inspection",
    "annual_unannounced_inspection",
    "phone",
    "email",
    "school_name",
    "board_name",
    "start_grade",
    "end_grade",
    "civic_address_line_1",
    "civic_address_line_2",
    "telephone",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Build static civic data snapshot")
    parser.add_argument("--output-dir", default="data", help="Directory for exported static data")
    parser.add_argument("--sqlite-path", default="data/civic.sqlite", help="SQLite output path")
    parser.add_argument("--bbox", default=None, help="Coverage bbox as west,south,east,north")
    parser.add_argument("--timeout", type=int, default=45, help="HTTP timeout in seconds")
    parser.add_argument("--max-pages", type=int, default=20, help="Safety cap for paginated source requests")
    parser.add_argument("--from-sqlite", action="store_true", help="Export static data from an existing SQLite snapshot without provider fetches")
    args = parser.parse_args()

    bbox_arg_provided = args.bbox is not None
    bbox = parse_bbox(args.bbox) if args.bbox else DEFAULT_BBOX
    output_dir = Path(args.output_dir)
    sqlite_path = Path(args.sqlite_path)
    if args.from_sqlite and not sqlite_path.exists():
        raise FileNotFoundError(f"--from-sqlite requires an existing SQLite snapshot: {sqlite_path}")
    output_dir.mkdir(parents=True, exist_ok=True)
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(sqlite_path)
    try:
        init_db(conn)
        if args.from_sqlite:
            export_from_sqlite(conn, output_dir, bbox if bbox_arg_provided else None)
            return 0

        reset_generated_exports(output_dir)
        generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        layer_entries = {}
        for layer in LAYERS:
            print(f"Fetching {layer.id}...", flush=True)
            started = time.monotonic()
            geojson, capped = fetch_layer(layer, bbox, args.timeout, args.max_pages)
            geojson = prune_geojson_properties(geojson)
            write_layer(conn, layer, geojson, generated_at, capped)
            chunks = write_layer_chunks(output_dir, layer, geojson, bbox)
            layer_entries[layer.id] = {
                "id": layer.id,
                "label": layer.label,
                "source": layer.source,
                "category": layer.category,
                "source_type": layer.source_type,
                "chunked": True,
                "chunk_degrees": CHUNK_DEGREES,
                "chunks": chunks,
                "record_count": len(geojson["features"]),
                "capped": capped,
                "seconds": round(time.monotonic() - started, 2),
            }

        write_snapshot_metadata(conn, generated_at, bbox)
        manifest = {
            "generated_at": generated_at,
            "schema_version": 1,
            "coverage": bbox,
            "mode": "static-snapshot",
            "layers": layer_entries,
        }
        write_json(output_dir / "manifest.json", manifest)
        return 0
    finally:
        conn.close()


def export_from_sqlite(conn: sqlite3.Connection, output_dir: Path, fallback_bbox: dict[str, Any] | None = None) -> None:
    validate_sqlite_snapshot(conn)
    generated_at = sqlite_generated_at(conn) or datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    bbox = sqlite_snapshot_coverage(conn) or fallback_bbox
    if bbox is None:
        raise ValueError("SQLite snapshot does not store coverage metadata; pass --bbox west,south,east,north for this legacy database")
    capped_layers = sqlite_capped_layers(conn)
    layer_entries = {}
    reset_generated_exports(output_dir)
    for layer in LAYERS:
        geojson = read_layer_geojson(conn, layer.id)
        chunks = write_layer_chunks(output_dir, layer, geojson, bbox)
        layer_entries[layer.id] = {
            "id": layer.id,
            "label": layer.label,
            "source": layer.source,
            "category": layer.category,
            "source_type": layer.source_type,
            "chunked": True,
            "chunk_degrees": CHUNK_DEGREES,
            "chunks": chunks,
            "record_count": len(geojson["features"]),
            "capped": capped_layers.get(layer.id, False),
            "seconds": 0,
        }

    manifest = {
        "generated_at": generated_at,
        "schema_version": 1,
        "coverage": bbox,
        "mode": "static-snapshot",
        "layers": layer_entries,
    }
    write_json(output_dir / "manifest.json", manifest)


def sqlite_generated_at(conn: sqlite3.Connection) -> str | None:
    row = conn.execute("SELECT generated_at FROM layers ORDER BY generated_at DESC LIMIT 1").fetchone()
    return row[0] if row else None


def write_snapshot_metadata(conn: sqlite3.Connection, generated_at: str, coverage: dict[str, Any]) -> None:
    conn.execute("DELETE FROM snapshot_metadata")
    conn.executemany(
        "INSERT INTO snapshot_metadata(key, value_json) VALUES (?, ?)",
        [
            ("generated_at", json.dumps(generated_at, separators=(",", ":"), ensure_ascii=False)),
            ("coverage", json.dumps(coverage, separators=(",", ":"), ensure_ascii=False)),
            ("capped_metadata", json.dumps(True, separators=(",", ":"), ensure_ascii=False)),
        ],
    )
    conn.commit()


def sqlite_snapshot_coverage(conn: sqlite3.Connection) -> dict[str, Any] | None:
    if not sqlite_table_exists(conn, "snapshot_metadata"):
        return None
    row = conn.execute("SELECT value_json FROM snapshot_metadata WHERE key = 'coverage'").fetchone()
    return json.loads(row[0]) if row else None


def validate_sqlite_snapshot(conn: sqlite3.Connection) -> None:
    layer_rows = conn.execute("SELECT id, record_count, generated_at FROM layers").fetchall()
    if not layer_rows:
        raise ValueError("SQLite snapshot has no layer metadata; refusing to export an empty static snapshot")
    layer_metadata = {row[0]: {"record_count": int(row[1]), "generated_at": row[2]} for row in layer_rows}
    layer_ids = set(layer_metadata)
    expected_ids = {layer.id for layer in LAYERS}
    missing = sorted(expected_ids - layer_ids)
    if missing:
        raise ValueError(f"SQLite snapshot is missing layer metadata for: {', '.join(missing)}")
    feature_rows = conn.execute(
        """
        SELECT layer_id, COUNT(*), COUNT(DISTINCT generated_at), MIN(generated_at), MAX(generated_at)
        FROM features
        GROUP BY layer_id
        """
    ).fetchall()
    feature_metadata = {
        layer_id: {
            "record_count": int(record_count),
            "generation_count": int(generation_count),
            "min_generated_at": min_generated_at,
            "max_generated_at": max_generated_at,
        }
        for layer_id, record_count, generation_count, min_generated_at, max_generated_at in feature_rows
    }
    unexpected_feature_layers = sorted(set(feature_metadata) - layer_ids)
    if unexpected_feature_layers:
        raise ValueError(f"SQLite snapshot has feature rows for unknown layers: {', '.join(unexpected_feature_layers)}")
    for layer_id, metadata in layer_metadata.items():
        feature_info = feature_metadata.get(
            layer_id,
            {"record_count": 0, "generation_count": 0, "min_generated_at": None, "max_generated_at": None},
        )
        if feature_info["record_count"] != metadata["record_count"]:
            raise ValueError(
                f"SQLite snapshot feature count mismatch for {layer_id}: "
                f"layers.record_count={metadata['record_count']} features={feature_info['record_count']}"
            )
        if feature_info["record_count"] and (
            feature_info["generation_count"] != 1
            or feature_info["min_generated_at"] != metadata["generated_at"]
            or feature_info["max_generated_at"] != metadata["generated_at"]
        ):
            raise ValueError(f"SQLite snapshot has stale feature rows for {layer_id}; rerun the source harvest before exporting")
    generated_values = {row[2] for row in layer_rows}
    if len(generated_values) != 1:
        raise ValueError("SQLite snapshot contains mixed layer generations; rerun the source harvest before exporting")
    metadata_generated_at = sqlite_metadata_value(conn, "generated_at")
    if metadata_generated_at is not None and metadata_generated_at != next(iter(generated_values)):
        raise ValueError("SQLite snapshot metadata generation does not match layer data; rerun the source harvest before exporting")
    total_records = sum(int(row[1]) for row in layer_rows)
    if total_records == 0:
        raise ValueError("SQLite snapshot has zero recorded features across all layers; refusing to export")


def sqlite_capped_layers(conn: sqlite3.Connection) -> dict[str, bool]:
    if sqlite_metadata_value(conn, "capped_metadata") is not True:
        return {layer.id: True for layer in LAYERS}
    rows = conn.execute("SELECT id, capped FROM layers").fetchall()
    return {layer_id: bool(capped) for layer_id, capped in rows}


def sqlite_metadata_value(conn: sqlite3.Connection, key: str) -> Any:
    if not sqlite_table_exists(conn, "snapshot_metadata"):
        return None
    row = conn.execute("SELECT value_json FROM snapshot_metadata WHERE key = ?", (key,)).fetchone()
    return json.loads(row[0]) if row else None


def read_layer_geojson(conn: sqlite3.Connection, layer_id: str) -> dict[str, Any]:
    rows = conn.execute(
        """
        SELECT properties_json, geometry_json
        FROM features
        WHERE layer_id = ?
        ORDER BY feature_index
        """,
        (layer_id,),
    ).fetchall()
    features = [
        {
            "type": "Feature",
            "geometry": json.loads(geometry_json),
            "properties": json.loads(properties_json),
        }
        for properties_json, geometry_json in rows
    ]
    return feature_collection(features)


def parse_bbox(value: str) -> dict[str, Any]:
    parts = [float(part.strip()) for part in value.split(",")]
    if len(parts) != 4:
        raise ValueError("--bbox must be west,south,east,north")
    west, south, east, north = parts
    return {"name": "custom", "label": "Custom bbox", "west": west, "south": south, "east": east, "north": north}


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS layers (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          source TEXT NOT NULL,
          category TEXT NOT NULL,
          source_type TEXT NOT NULL,
          generated_at TEXT NOT NULL,
          record_count INTEGER NOT NULL,
          capped INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS features (
          layer_id TEXT NOT NULL,
          feature_index INTEGER NOT NULL,
          geometry_type TEXT,
          min_lon REAL,
          min_lat REAL,
          max_lon REAL,
          max_lat REAL,
          properties_json TEXT NOT NULL,
          geometry_json TEXT NOT NULL,
          generated_at TEXT NOT NULL,
          PRIMARY KEY (layer_id, feature_index)
        );
        CREATE INDEX IF NOT EXISTS idx_features_bbox ON features(layer_id, min_lon, min_lat, max_lon, max_lat);
        CREATE TABLE IF NOT EXISTS snapshot_metadata (
          key TEXT PRIMARY KEY,
          value_json TEXT NOT NULL
        );
        """
    )
    ensure_column(conn, "layers", "capped", "INTEGER NOT NULL DEFAULT 0")
    conn.commit()


def ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    if sqlite_column_exists(conn, table, column):
        return
    conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def sqlite_column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(row[1] == column for row in rows)


def sqlite_table_exists(conn: sqlite3.Connection, table: str) -> bool:
    row = conn.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", (table,)).fetchone()
    return row is not None


def reset_generated_exports(output_dir: Path) -> None:
    for child in ["layers", "chunks", "combined"]:
        path = output_dir / child
        if path.exists():
            shutil.rmtree(path)
    manifest_path = output_dir / "manifest.json"
    if manifest_path.exists():
        manifest_path.unlink()


def write_layer(conn: sqlite3.Connection, layer: Layer, geojson: dict[str, Any], generated_at: str, capped: bool = False) -> None:
    features = geojson.get("features", [])
    conn.execute("DELETE FROM features WHERE layer_id = ?", (layer.id,))
    conn.execute("DELETE FROM layers WHERE id = ?", (layer.id,))
    conn.execute(
        "INSERT INTO layers(id, label, source, category, source_type, generated_at, record_count, capped) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (layer.id, layer.label, layer.source, layer.category, layer.source_type, generated_at, len(features), int(capped)),
    )
    rows = []
    for index, feature in enumerate(features):
        geometry = feature.get("geometry") or {}
        bounds = geometry_bounds(geometry)
        rows.append(
            (
                layer.id,
                index,
                geometry.get("type"),
                bounds[0],
                bounds[1],
                bounds[2],
                bounds[3],
                json.dumps(feature.get("properties") or {}, separators=(",", ":"), ensure_ascii=False),
                json.dumps(geometry, separators=(",", ":"), ensure_ascii=False),
                generated_at,
            )
        )
    conn.executemany(
        """
        INSERT INTO features(layer_id, feature_index, geometry_type, min_lon, min_lat, max_lon, max_lat, properties_json, geometry_json, generated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()


def write_layer_chunks(output_dir: Path, layer: Layer, geojson: dict[str, Any], coverage: dict[str, Any]) -> list[dict[str, Any]]:
    chunks: dict[str, list[dict[str, Any]]] = {}
    for feature in geojson.get("features", []):
        bounds = geometry_bounds(feature.get("geometry") or {})
        if bounds[0] is None:
            continue
        for chunk_id in chunk_ids_for_bounds(bounds, coverage):
            chunks.setdefault(chunk_id, []).append(feature)

    entries = []
    layer_dir = output_dir / "chunks" / layer.id
    layer_dir.mkdir(parents=True, exist_ok=True)
    for chunk_id, features in sorted(chunks.items()):
        path = layer_dir / f"{chunk_id}.geojson"
        write_json(path, feature_collection(features))
        entries.append(
            {
                "id": chunk_id,
                "path": f"chunks/{layer.id}/{chunk_id}.geojson",
                "bbox": chunk_bbox(chunk_id, coverage),
                "record_count": len(features),
            }
        )
    return entries


def chunk_ids_for_bounds(bounds: tuple[float | None, float | None, float | None, float | None], coverage: dict[str, Any]) -> list[str]:
    min_lon, min_lat, max_lon, max_lat = bounds
    if min_lon is None or min_lat is None or max_lon is None or max_lat is None:
        return []
    west = max(float(min_lon), coverage["west"])
    east = min(float(max_lon), coverage["east"])
    south = max(float(min_lat), coverage["south"])
    north = min(float(max_lat), coverage["north"])
    if west > east or south > north:
        return []

    min_x = int(math.floor((west - coverage["west"]) / CHUNK_DEGREES))
    max_x = int(math.floor((east - coverage["west"]) / CHUNK_DEGREES))
    min_y = int(math.floor((south - coverage["south"]) / CHUNK_DEGREES))
    max_y = int(math.floor((north - coverage["south"]) / CHUNK_DEGREES))
    return [f"x{x}_y{y}" for x in range(min_x, max_x + 1) for y in range(min_y, max_y + 1)]


def chunk_bbox(chunk_id: str, coverage: dict[str, Any]) -> dict[str, float]:
    x_part, y_part = chunk_id.split("_")
    x = int(x_part.removeprefix("x"))
    y = int(y_part.removeprefix("y"))
    west = coverage["west"] + x * CHUNK_DEGREES
    south = coverage["south"] + y * CHUNK_DEGREES
    return {
        "west": west,
        "south": south,
        "east": west + CHUNK_DEGREES,
        "north": south + CHUNK_DEGREES,
    }


def fetch_layer(layer: Layer, bbox: dict[str, Any], timeout: int, max_pages: int) -> tuple[dict[str, Any], bool]:
    if layer.source_type == "arcgis-layer":
        return fetch_arcgis_layer(layer, bbox, timeout, max_pages)
    if layer.source_type == "arcgis-latlon-table":
        return fetch_arcgis_latlon_table(layer, bbox, timeout, max_pages)
    if layer.source_type == "arcgis-webmercator-table":
        return fetch_arcgis_webmercator_table(layer, bbox, timeout, max_pages)
    if layer.source_type == "socrata-geojson":
        return fetch_socrata_geojson(layer, bbox, timeout, max_pages)
    if layer.source_type == "socrata-point-json":
        return fetch_socrata_point_json(layer, bbox, timeout, max_pages)
    raise ValueError(f"Unsupported source type: {layer.source_type}")


def fetch_arcgis_layer(layer: Layer, bbox: dict[str, Any], timeout: int, max_pages: int) -> tuple[dict[str, Any], bool]:
    features: list[dict[str, Any]] = []
    for page in range(max_pages):
        params = {
            "f": "geojson",
            "where": layer.where,
            "outFields": "*",
            "returnGeometry": "true",
            "geometry": f"{bbox['west']},{bbox['south']},{bbox['east']},{bbox['north']}",
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
            "outSR": "4326",
            "resultRecordCount": "2000",
            "resultOffset": str(page * 2000),
        }
        geojson = request_json(layer.url, params, timeout)
        check_error(layer, geojson)
        batch = geojson.get("features") or []
        features.extend(batch)
        exceeded = bool(geojson.get("properties", {}).get("exceededTransferLimit") or geojson.get("exceededTransferLimit"))
        if len(batch) < 2000 and not exceeded:
            return feature_collection(features), False
    return feature_collection(features), True


def fetch_arcgis_latlon_table(layer: Layer, bbox: dict[str, Any], timeout: int, max_pages: int) -> tuple[dict[str, Any], bool]:
    where = " AND ".join(
        [
            f"LATITUDE >= {bbox['south']}",
            f"LATITUDE <= {bbox['north']}",
            f"LONGITUDE >= {bbox['west']}",
            f"LONGITUDE <= {bbox['east']}",
        ]
    )
    return fetch_arcgis_table(layer, where, lambda props: [number(props.get("LONGITUDE")), number(props.get("LATITUDE"))], timeout, max_pages)


def fetch_arcgis_webmercator_table(layer: Layer, bbox: dict[str, Any], timeout: int, max_pages: int) -> tuple[dict[str, Any], bool]:
    west, south = lon_lat_to_web_mercator(bbox["west"], bbox["south"])
    east, north = lon_lat_to_web_mercator(bbox["east"], bbox["north"])
    where = " AND ".join(
        [
            f"X_COORDINATE >= {west}",
            f"X_COORDINATE <= {east}",
            f"Y_COORDINATE >= {south}",
            f"Y_COORDINATE <= {north}",
        ]
    )
    return fetch_arcgis_table(
        layer,
        where,
        lambda props: web_mercator_to_lon_lat(number(props.get("X_COORDINATE")), number(props.get("Y_COORDINATE"))),
        timeout,
        max_pages,
    )


def fetch_arcgis_table(layer: Layer, where: str, coordinate_getter: Any, timeout: int, max_pages: int) -> tuple[dict[str, Any], bool]:
    features: list[dict[str, Any]] = []
    for page in range(max_pages):
        params = {
            "f": "json",
            "where": where,
            "outFields": "*",
            "returnGeometry": "false",
            "resultRecordCount": "2000",
            "resultOffset": str(page * 2000),
        }
        if layer.order_by:
            params["orderByFields"] = layer.order_by
        payload = request_json(layer.url, params, timeout)
        check_error(layer, payload)
        batch = payload.get("features") or []
        for row in batch:
            props = row.get("attributes") or row.get("properties") or {}
            coords = coordinate_getter(props)
            if not coords or not all(isinstance(item, (int, float)) and math.isfinite(item) for item in coords):
                continue
            features.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": coords}, "properties": props})
        exceeded = bool(payload.get("exceededTransferLimit"))
        if len(batch) < 2000 and not exceeded:
            return feature_collection(features), False
    return feature_collection(features), True


def fetch_socrata_geojson(layer: Layer, bbox: dict[str, Any], timeout: int, max_pages: int) -> tuple[dict[str, Any], bool]:
    features: list[dict[str, Any]] = []
    for page in range(max_pages):
        params = {
            "$limit": "5000",
            "$offset": str(page * 5000),
            "$where": f"within_box(the_geom,{bbox['north']},{bbox['west']},{bbox['south']},{bbox['east']})",
        }
        payload = request_json(layer.url, params, timeout)
        check_error(layer, payload)
        batch = payload.get("features") or []
        features.extend(batch)
        if len(batch) < 5000:
            return feature_collection(features), False
    return feature_collection(features), True


def fetch_socrata_point_json(layer: Layer, bbox: dict[str, Any], timeout: int, max_pages: int) -> tuple[dict[str, Any], bool]:
    features: list[dict[str, Any]] = []
    for page in range(max_pages):
        params = {"$limit": "5000", "$offset": str(page * 5000)}
        if layer.where:
            params["$where"] = layer.where
        records = request_json(layer.url, params, timeout)
        if not isinstance(records, list):
            check_error(layer, records)
            raise ValueError(f"{layer.id} did not return a list")
        for props in records:
            geometry = props.get(layer.geometry_field or "")
            coords = geometry.get("coordinates") if isinstance(geometry, dict) else None
            if not coords or len(coords) < 2:
                continue
            lon, lat = number(coords[0]), number(coords[1])
            if lon is None or lat is None:
                continue
            if not (bbox["west"] <= lon <= bbox["east"] and bbox["south"] <= lat <= bbox["north"]):
                continue
            features.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]}, "properties": props})
        if len(records) < 5000:
            return feature_collection(features), False
    return feature_collection(features), True


def request_json(url: str, params: dict[str, str], timeout: int) -> Any:
    full_url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(full_url, headers={"User-Agent": "halifax-civic-map snapshot builder"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = response.read()
    return json.loads(body.decode("utf-8"))


def check_error(layer: Layer, payload: Any) -> None:
    if isinstance(payload, dict) and payload.get("error"):
        error = payload["error"]
        message = error.get("message") if isinstance(error, dict) else str(error)
        raise ValueError(f"{layer.id} query failed: {message}")


def feature_collection(features: list[dict[str, Any]]) -> dict[str, Any]:
    return {"type": "FeatureCollection", "features": features}


def prune_geojson_properties(geojson: dict[str, Any]) -> dict[str, Any]:
    return {
        **geojson,
        "features": [
            {
                **feature,
                "properties": {
                    key: value
                    for key, value in (feature.get("properties") or {}).items()
                    if key in ESSENTIAL_FIELDS or key.startswith("Shape__")
                },
            }
            for feature in geojson.get("features", [])
        ],
    }


def write_json(path: Path, payload: Any) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)


def geometry_bounds(geometry: dict[str, Any]) -> tuple[float | None, float | None, float | None, float | None]:
    coords = list(iter_coordinate_pairs(geometry.get("coordinates")))
    if not coords:
        return (None, None, None, None)
    lons = [coord[0] for coord in coords]
    lats = [coord[1] for coord in coords]
    return (min(lons), min(lats), max(lons), max(lats))


def iter_coordinate_pairs(value: Any) -> Any:
    if not isinstance(value, list):
        return
    if len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
        yield [float(value[0]), float(value[1])]
        return
    for item in value:
        yield from iter_coordinate_pairs(item)


def lon_lat_to_web_mercator(lon: float, lat: float) -> tuple[float, float]:
    x = (lon * 20037508.34) / 180
    bounded_lat = max(min(lat, 85.05112878), -85.05112878)
    y = math.log(math.tan(((90 + bounded_lat) * math.pi) / 360)) / (math.pi / 180)
    return x, (y * 20037508.34) / 180


def web_mercator_to_lon_lat(x: float | None, y: float | None) -> list[float] | None:
    if x is None or y is None:
        return None
    lon = (x / 20037508.34) * 180
    lat = (math.atan(math.exp(((y / 20037508.34) * 180 * math.pi) / 180)) * 360) / math.pi - 90
    return [lon, lat]


def number(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if math.isfinite(parsed) else None


if __name__ == "__main__":
    sys.exit(main())
