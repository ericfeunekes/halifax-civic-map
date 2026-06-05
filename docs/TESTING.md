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

Run local browser performance benchmarks after snapshot-shape, rendering,
filtering, or map-interaction changes:

```bash
npm run perf:local
```

The performance harness serves the current repo checkout on
`http://127.0.0.1:8765/halifax-civic-map/`, matching the GitHub Pages project
route. It drives headless Chrome against that route, lets production external
assets such as Leaflet from unpkg and OSM tiles load normally, and fails if
civic data comes from live HRM, Nova Scotia, Socrata, ArcGIS, or Nominatim
provider requests. Before comparing optimization variants, materialize each
candidate static build into `data/` from local source/raw artifacts. The
deployed app must still remain GitHub Pages-compatible static HTML/CSS/JS plus
generated static data files.

Use `--offline-assets` only for deterministic local debugging when external
asset network access is unavailable. Do not use that mode as the primary
performance proof because it stubs production Leaflet and tile behavior.

To benchmark an alternate generated data shape without replacing `data/`, pass a
local candidate directory that contains a `manifest.json` entrypoint:

```bash
npm run perf:local -- --data-dir path/to/candidate-data
```

To regenerate the static chunk files from an existing local SQLite snapshot
without calling providers:

```bash
/usr/bin/env python3 scripts/build_snapshot.py --from-sqlite --output-dir data --sqlite-path data/civic.sqlite
```

New SQLite snapshots persist their source coverage and capped-layer metadata.
Older SQLite files without persisted coverage must pass the original coverage
explicitly with `--bbox=west,south,east,north`; otherwise the export refuses to
create a valid-looking snapshot with unknown coverage. Use the `--bbox=...`
form because Halifax longitudes are negative. Older SQLite files without trusted
capped-layer metadata are exported conservatively with harvest caps marked so
the browser does not suppress completeness warnings.

The candidate data directory does not have to use the current GeoJSON chunk
layout. Performance-improvement work may change static data models, chunking,
indexes, property shapes, compression, binary sidecars, or browser loaders as
long as the result can be served by GitHub Pages and the app still runs as a
static site. The harness measures whatever the app loads from `/data/`, so
format changes show up through data request count, decoded MB, scenario
duration, UX milestones, long tasks, JS heap, DOM size, rendered layers, and
visible/raw record counts.

Benchmark output is written under `performance-results/`:

- `local-performance-report.csv` - stable one-row-per-checkpoint metrics for
  trend comparison.
- `local-performance-report.json` - detailed timings, resource entries,
  browser metrics, warnings, and per-layer app state.
- `local-performance-report.md` - readable summary for notes or PRs.

The CSV includes user-perceived UX milestone columns, total scenario duration,
local data resource count and decoded MB, long tasks, JS heap, DOM node count,
event listener count, rendered layer count, visible/raw record counts, live
fallback count, skipped broad-layer count, page errors, and redraw/interaction
stress timings. The JSON report also records local data-directory file count,
bytes on disk, manifest mode/schema, and extension-level file totals so static
model changes can be compared even before browser load begins.

## Performance Work Contract

Performance work has two separate local-data surfaces:

- Raw source payloads are the captured public-provider responses used to rebuild
  candidate static data shapes without repeatedly calling the providers.
- Generated static app data is the GitHub Pages-compatible `manifest.json`
  entrypoint plus whatever static files the browser actually loads.

Do not treat generated browser data or SQLite alone as proof that source data is
available in raw form for rebuild experiments. If a performance task includes
trying alternate export shapes, first establish where the raw source payloads
live or add an explicit raw-capture/offline-rebuild step. Then run the browser
performance harness against each generated candidate with `--data-dir`.

Performance proof should represent user-perceived improvement and general load
reduction. A good run includes both:

- UX checkpoints: map/control readiness, first records visible, summary visible,
  render settled, redraw stress, map pan/zoom/click, page errors, and long tasks.
- Load checkpoints: local data request count, decoded MB, static file count and
  bytes, rendered layer count, visible/raw record counts, heap, DOM nodes, live
  fallback count, and broad-layer skip/cap behavior.

When an optimization reduces load by skipping chunks, narrowing a static query,
capping prefetch/display candidates, or otherwise accepting incomplete broad
results, treat the user-facing completeness warning as part of the correctness
contract. The proof must show both the metric win and the caveat behavior:

- record counts for benchmark scenarios that are expected to stay stable;
- cap/skip counts in the performance CSV/JSON;
- visible warning text for affected selected layers in browser QA;
- a filtered state where an affected selected layer may have zero visible
  records, to confirm the warning does not disappear because the layer is absent
  from the current visible counts.

Warning advice must match the mitigation. Date/status filters can make display
caps easier to inspect, but they do not fetch omitted static chunks after a
prefetch guard; prefetch-cap warnings should tell users to narrow the radius or
use a smaller generated slice before relying on completeness.

Dependencies are acceptable for local test tooling when they improve measurement
quality, but benchmarked app candidates must remain deployable as static
GitHub Pages assets.

### Benchmark Realism Rules

The primary benchmark must represent the public app route and loading behavior,
not a convenient local approximation. Use the GitHub Pages project path
(`/halifax-civic-map/`) and production external assets by default. Do not treat
a root-path run, file URL, stubbed Leaflet, stubbed map tiles, disabled external
assets, or a provider-mocked civic data path as the main performance proof.

The one thing that should stay local for performance experiments is civic source
data. Candidate data models may change format, file layout, chunking, indexes,
compression, or browser loader code, but they must be served through the same
static route shape the Pages app will use. If a debugging mode stubs production
assets, label it as offline/debug-only and rerun the primary benchmark before
claiming user-facing performance improvement.

### Reviewing Performance Proof

When reviewing or extending the performance harness, treat metric integrity as a
ship gate. A faster number is not useful if the harness warmed the app state,
sampled a milestone before the browser could reach it, or benchmarked a data
surface that could not represent the public Pages app.

Check these before accepting performance results:

- Scenarios that claim load cost must start from a fresh app page or be clearly
  labelled as warmed-cache measurements. Resetting browser resource timings is
  not enough if `app.js` keeps an in-memory snapshot chunk cache.
- UX milestone columns must be measured from the scenario start and must prove
  the named UI state. For example, `summary_visible_ms` should wait for the
  data-backed summary for the current record total, not just for any pre-existing
  summary text.
- Interaction and redraw stress should dispatch the same DOM events a user
  triggers. Direct calls to older broad redraw helpers can be useful debugging
  probes, but they do not prove optimized production event paths.
- Provider protection should fail closed. The primary run should have zero civic
  provider requests and zero unexpected blocked external requests; only declared
  production assets such as Leaflet and map tiles should be allowed through.
- Offline SQLite export must be validated before benchmarking generated data:
  coverage must be known, every configured layer must be present, layer and
  feature row counts must match, layer and feature generations must be coherent,
  and unknown legacy capped metadata must remain conservative so the browser
  does not suppress completeness warnings.

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
