# Testing

This repo has no build system and no automated unit test suite yet. Current proof is a combination of syntax checks and browser QA against live public endpoints.

## Fast Checks

Run after any JavaScript edit:

```bash
node --check app.js
```

Run after workflow edits:

```bash
git status --short --branch
```

Then push and watch the GitHub Pages workflow.

## Browser QA Is Required For

- Map rendering changes.
- Source fetcher changes.
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

## Current Test Gaps

- No unit tests for filtering, source dispatch, or coordinate conversion.
- No mechanical link/pointer check for docs.
- No mocked fixture suite for data-source regressions.
- No visual regression test for map layout.

These gaps are acceptable for now because the app is a small static tool, but browser QA is mandatory until automated coverage exists.
