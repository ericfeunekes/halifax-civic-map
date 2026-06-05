# Testing

This repo has no build system. Current proof is a combination of JavaScript syntax checks, Python snapshot-builder tests, local snapshot generation, GitHub Actions deployment proof, and browser QA.

## Fast Checks

Run after any JavaScript edit:

```bash
node --check app.js
```

Run after snapshot-builder edits:

```bash
/usr/bin/env python3 -m unittest discover -s tests
```

Run after source, coverage, or generated-data changes:

```bash
/usr/bin/env python3 scripts/build_snapshot.py --output-dir data --sqlite-path data/civic.sqlite
```

Run after workflow edits:

```bash
git status --short --branch
```

Then push and watch the GitHub Pages workflow.

## Browser QA Is Required For

- Map rendering changes.
- Source fetcher changes.
- Snapshot builder or manifest changes.
- Layer registry changes.
- Filters and visual encodings.
- Summary or selected-record panel behavior.
- Cache-busting changes in `index.html`.
- Deployment or GitHub Pages workflow changes.

Use `agent-browser`; do not claim UI proof from code inspection alone.

## Standard Smoke Addresses

- `6241 Quinpool Road` - known to return stacked permit/traffic records and exercises the Selected Records panel.
- A 10 km radius around the same address - exercises wide radius, caps, Cityworks, roads, active travelways, schools, and child care when broad layers are enabled.

## Expected Proof Claims

A good proof note names:

- surface tested: local server, Tailscale, or GitHub Pages;
- address/radius used;
- layer counts or panel counts observed;
- console/page error state;
- whether the GitHub Pages workflow succeeded when deployment was involved.
- whether the app loaded static snapshot data or fell back to live provider calls.

## Current Test Gaps

- No unit tests for browser-side filtering or source dispatch.
- No mechanical link/pointer check for docs.
- No mocked fixture suite for every external data-source schema.
- No visual regression test for map layout.

These gaps are acceptable for now because the app is a small static tool, but browser QA is mandatory until automated coverage exists.
