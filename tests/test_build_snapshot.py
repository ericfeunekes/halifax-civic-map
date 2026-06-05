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


if __name__ == "__main__":
    unittest.main()
