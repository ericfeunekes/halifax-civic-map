import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

from scripts import build_snapshot


class BuildSnapshotTest(unittest.TestCase):
    def test_geometry_bounds_handles_nested_coordinates(self):
        geometry = {
            "type": "MultiLineString",
            "coordinates": [
                [[-63.6, 44.6], [-63.5, 44.7]],
                [[-63.7, 44.8], [-63.4, 44.55]],
            ],
        }

        self.assertEqual(build_snapshot.geometry_bounds(geometry), (-63.7, 44.55, -63.4, 44.8))

    def test_write_layer_replaces_existing_rows(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = Path(tmp_dir) / "civic.sqlite"
            conn = sqlite3.connect(db_path)
            try:
                build_snapshot.init_db(conn)
                layer = build_snapshot.Layer(
                    id="test",
                    label="Test",
                    source="Fixture",
                    category="permit",
                    source_type="arcgis-layer",
                    url="https://example.test/query",
                )
                first = {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {"type": "Point", "coordinates": [-63.57, 44.65]},
                            "properties": {"OBJECTID": 1},
                        }
                    ],
                }
                second = {"type": "FeatureCollection", "features": []}

                build_snapshot.write_layer(conn, layer, first, "2026-06-05T00:00:00Z")
                build_snapshot.write_layer(conn, layer, second, "2026-06-06T00:00:00Z")

                feature_count = conn.execute("SELECT COUNT(*) FROM features WHERE layer_id = 'test'").fetchone()[0]
                layer_count = conn.execute("SELECT record_count FROM layers WHERE id = 'test'").fetchone()[0]
            finally:
                conn.close()

        self.assertEqual(feature_count, 0)
        self.assertEqual(layer_count, 0)

    def test_write_json_outputs_compact_json(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "manifest.json"
            build_snapshot.write_json(path, {"layers": {"test": {"record_count": 1}}})

            payload = json.loads(path.read_text(encoding="utf-8"))

        self.assertEqual(payload["layers"]["test"]["record_count"], 1)

    def test_export_from_sqlite_refuses_empty_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_dir = Path(tmp_dir) / "data"
            conn = sqlite3.connect(Path(tmp_dir) / "civic.sqlite")
            try:
                build_snapshot.init_db(conn)

                with self.assertRaisesRegex(ValueError, "no layer metadata"):
                    build_snapshot.export_from_sqlite(conn, output_dir, build_snapshot.DEFAULT_BBOX)
            finally:
                conn.close()

    def test_export_from_sqlite_uses_persisted_coverage(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_dir = Path(tmp_dir) / "data"
            conn = sqlite3.connect(Path(tmp_dir) / "civic.sqlite")
            custom_coverage = {
                "name": "test",
                "label": "Test coverage",
                "west": -63.6,
                "south": 44.6,
                "east": -63.5,
                "north": 44.7,
            }
            feature = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [-63.55, 44.65]},
                        "properties": {"OBJECTID": 1},
                    }
                ],
            }
            empty = {"type": "FeatureCollection", "features": []}
            try:
                build_snapshot.init_db(conn)
                build_snapshot.write_snapshot_metadata(conn, "2026-06-05T00:00:00Z", custom_coverage)
                for index, layer in enumerate(build_snapshot.LAYERS):
                    build_snapshot.write_layer(
                        conn,
                        layer,
                        feature if index == 0 else empty,
                        "2026-06-05T00:00:00Z",
                    )

                build_snapshot.export_from_sqlite(conn, output_dir)
            finally:
                conn.close()

            manifest = json.loads((output_dir / "manifest.json").read_text(encoding="utf-8"))

        self.assertEqual(manifest["coverage"], custom_coverage)
        self.assertEqual(manifest["layers"][build_snapshot.LAYERS[0].id]["record_count"], 1)

    def test_export_from_sqlite_requires_coverage_for_legacy_database(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_dir = Path(tmp_dir) / "data"
            conn = sqlite3.connect(Path(tmp_dir) / "civic.sqlite")
            feature = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [-63.55, 44.65]},
                        "properties": {"OBJECTID": 1},
                    }
                ],
            }
            empty = {"type": "FeatureCollection", "features": []}
            try:
                build_snapshot.init_db(conn)
                for index, layer in enumerate(build_snapshot.LAYERS):
                    build_snapshot.write_layer(
                        conn,
                        layer,
                        feature if index == 0 else empty,
                        "2026-06-05T00:00:00Z",
                    )
                conn.execute("DELETE FROM snapshot_metadata")
                conn.commit()

                with self.assertRaisesRegex(ValueError, "does not store coverage metadata"):
                    build_snapshot.export_from_sqlite(conn, output_dir)

                build_snapshot.export_from_sqlite(conn, output_dir, build_snapshot.DEFAULT_BBOX)
            finally:
                conn.close()

            manifest = json.loads((output_dir / "manifest.json").read_text(encoding="utf-8"))

        self.assertEqual(manifest["coverage"], build_snapshot.DEFAULT_BBOX)
        self.assertTrue(all(layer["capped"] for layer in manifest["layers"].values()))

    def test_export_from_sqlite_refuses_mixed_layer_generations(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_dir = Path(tmp_dir) / "data"
            conn = sqlite3.connect(Path(tmp_dir) / "civic.sqlite")
            feature = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [-63.55, 44.65]},
                        "properties": {"OBJECTID": 1},
                    }
                ],
            }
            empty = {"type": "FeatureCollection", "features": []}
            try:
                build_snapshot.init_db(conn)
                build_snapshot.write_snapshot_metadata(conn, "2026-06-05T00:00:00Z", build_snapshot.DEFAULT_BBOX)
                for index, layer in enumerate(build_snapshot.LAYERS):
                    build_snapshot.write_layer(
                        conn,
                        layer,
                        feature if index == 0 else empty,
                        "2026-06-05T00:00:00Z" if index == 0 else "2026-06-04T00:00:00Z",
                    )

                with self.assertRaisesRegex(ValueError, "mixed layer generations"):
                    build_snapshot.export_from_sqlite(conn, output_dir)
            finally:
                conn.close()

    def test_export_from_sqlite_refuses_feature_count_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_dir = Path(tmp_dir) / "data"
            conn = sqlite3.connect(Path(tmp_dir) / "civic.sqlite")
            try:
                build_snapshot.init_db(conn)
                build_snapshot.write_snapshot_metadata(conn, "2026-06-05T00:00:00Z", build_snapshot.DEFAULT_BBOX)
                for layer in build_snapshot.LAYERS:
                    conn.execute(
                        """
                        INSERT INTO layers(id, label, source, category, source_type, generated_at, record_count, capped)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            layer.id,
                            layer.label,
                            layer.source,
                            layer.category,
                            layer.source_type,
                            "2026-06-05T00:00:00Z",
                            1,
                            0,
                        ),
                    )
                conn.commit()

                with self.assertRaisesRegex(ValueError, "feature count mismatch"):
                    build_snapshot.export_from_sqlite(conn, output_dir)
            finally:
                conn.close()

    def test_export_from_sqlite_refuses_stale_feature_generation(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_dir = Path(tmp_dir) / "data"
            conn = sqlite3.connect(Path(tmp_dir) / "civic.sqlite")
            feature = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [-63.55, 44.65]},
                        "properties": {"OBJECTID": 1},
                    }
                ],
            }
            empty = {"type": "FeatureCollection", "features": []}
            try:
                build_snapshot.init_db(conn)
                build_snapshot.write_snapshot_metadata(conn, "2026-06-05T00:00:00Z", build_snapshot.DEFAULT_BBOX)
                for index, layer in enumerate(build_snapshot.LAYERS):
                    build_snapshot.write_layer(
                        conn,
                        layer,
                        feature if index == 0 else empty,
                        "2026-06-05T00:00:00Z",
                    )
                conn.execute(
                    "UPDATE features SET generated_at = ? WHERE layer_id = ?",
                    ("2026-06-04T00:00:00Z", build_snapshot.LAYERS[0].id),
                )
                conn.commit()

                with self.assertRaisesRegex(ValueError, "stale feature rows"):
                    build_snapshot.export_from_sqlite(conn, output_dir)
            finally:
                conn.close()

    def test_failed_export_from_sqlite_leaves_existing_output_intact(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            output_dir = Path(tmp_dir) / "data"
            chunk_dir = output_dir / "chunks" / "building"
            chunk_dir.mkdir(parents=True)
            manifest_path = output_dir / "manifest.json"
            chunk_path = chunk_dir / "x0_y0.geojson"
            manifest_path.write_text('{"existing":true}', encoding="utf-8")
            chunk_path.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")

            conn = sqlite3.connect(Path(tmp_dir) / "civic.sqlite")
            feature = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [-63.55, 44.65]},
                        "properties": {"OBJECTID": 1},
                    }
                ],
            }
            empty = {"type": "FeatureCollection", "features": []}
            try:
                build_snapshot.init_db(conn)
                for index, layer in enumerate(build_snapshot.LAYERS):
                    build_snapshot.write_layer(
                        conn,
                        layer,
                        feature if index == 0 else empty,
                        "2026-06-05T00:00:00Z",
                    )
                conn.execute("DELETE FROM snapshot_metadata")
                conn.commit()

                with self.assertRaisesRegex(ValueError, "does not store coverage metadata"):
                    build_snapshot.export_from_sqlite(conn, output_dir)
            finally:
                conn.close()

            self.assertEqual(manifest_path.read_text(encoding="utf-8"), '{"existing":true}')
            self.assertTrue(chunk_path.exists())


if __name__ == "__main__":
    unittest.main()
