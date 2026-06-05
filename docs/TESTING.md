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

## Snapshot Performance Contract

Snapshot/data changes must prove both sides of the contract:

- Provider protection: normal searches read generated GitHub Pages snapshot data rather than re-querying every civic source.
- Browser usability: the generated payload and rendering path settle in a bounded real-browser smoke test.

For snapshot builder, manifest, chunking, field-pruning, display-cap, or broad-radius guard changes, run the standard 500 m `6241 Quinpool Road` smoke and the all-layer 10 km smoke described in `QA.md`. If `agent-browser wait`, `errors`, or `console` calls hang because the page is overloaded, treat that as a failed test. The fix belongs in export shape, field pruning, chunk selection, display caps, or broad-radius guards before the work is considered done.

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
