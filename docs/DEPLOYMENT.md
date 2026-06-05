# Deployment

The app deploys as a static GitHub Pages site.

## Public URL

```text
https://ericfeunekes.github.io/halifax-civic-map/
```

## Repository

```text
https://github.com/ericfeunekes/halifax-civic-map
```

## Workflow

`.github/workflows/pages.yml` deploys on every push to `main`, on manual dispatch, and on a daily schedule.

The workflow:

1. checks out the repo;
2. sets up Python;
3. runs the snapshot-builder unit tests;
4. fetches the verified public data sources into `data/civic.sqlite`;
5. exports `data/manifest.json` and spatial GeoJSON chunks under `data/chunks/`;
6. configures GitHub Pages;
7. uploads the repository root, including generated data, as the static site artifact;
8. deploys to Pages.

Generated data is served from GitHub Pages but not committed to git. The SQLite file is a build/local-analysis artifact; the browser reads static JSON/GeoJSON files.

The repo is configured for Pages `build_type=workflow`, HTTPS enforced, public.

## Release Procedure

```bash
git status --short --branch
node --check app.js
/usr/bin/env python3 -m unittest discover -s tests
/usr/bin/env python3 scripts/build_snapshot.py --output-dir data --sqlite-path data/civic.sqlite
git push
gh run list --repo ericfeunekes/halifax-civic-map --limit 3
gh run watch <run-id> --repo ericfeunekes/halifax-civic-map --exit-status
```

Then smoke-test the public URL with `agent-browser`.

## Notes

The workflow sets `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` so the Pages action chain has been exercised against GitHub's Node 24 runner behavior. GitHub may still annotate that the referenced action tags target Node 20 until upstream action tags are updated.
