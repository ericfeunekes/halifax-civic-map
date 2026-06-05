# Generated Data

This directory is populated by `scripts/build_snapshot.py`.

The GitHub Pages workflow runs the snapshot build before uploading the static site artifact, so generated files are served from GitHub Pages without being committed to git.

Local generated files are ignored:

- `data/manifest.json`
- `data/chunks/**/*.geojson`
- `data/civic.sqlite`

Run locally:

```bash
/usr/bin/env python3 scripts/build_snapshot.py --output-dir data --sqlite-path data/civic.sqlite
```
