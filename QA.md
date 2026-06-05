# QA

QA proves that the app works in a real browser against real public data. It is not replaced by `node --check`.

## Tools

- `agent-browser` for browser automation, snapshots, console checks, error checks, and screenshots.
- GitHub Actions for Pages deployment proof.

## Standard QA Flow

For UI/data changes:

1. Open the target URL with `agent-browser`.
2. Search `6241 Quinpool Road`.
3. Select `6241 QUINPOOL RD, HALIFAX`.
4. Wait for data fetches to settle.
5. Check relevant counts or visible text.
6. Run `agent-browser errors`.
7. Run `agent-browser console`.

For snapshot/data-shape changes, also run the broad-layer flow:

1. Open a fresh `agent-browser` session.
2. Enable all layer toggles before selecting a place, so the page performs one data refresh instead of one refresh per checkbox.
3. Set radius to 10 km.
4. Search `6241 Quinpool Road`.
5. Wait a bounded interval, then inspect summary text, layer counts, page errors, and console output.
6. Treat a non-settling or browser-blocking broad run as a failed proof. Do not close by saying provider load was reduced if the browser became unusable; fix the snapshot export shape, field pruning, display caps, or broad-radius guards first.

For deployment changes:

1. Push to `main`.
2. Watch `Deploy GitHub Pages` to success, including the snapshot-builder test and static data build steps.
3. Open `https://ericfeunekes.github.io/halifax-civic-map/`.
4. Repeat the smoke search.
5. Confirm the nearby brief says the data came from a generated snapshot, not only live fallback.

## Feature-Specific Checks

### Selected Records

Expected for `6241 QUINPOOL RD, HALIFAX` at 500 m with default layers:

- Selected Records panel should populate after address selection.
- It should show multiple records grouped by layer.
- As of the last checked public data, it showed 12 records: 6 construction permits, 4 traffic studies, and 2 building permits.

Counts may drift as public datasets change; the contract is multiple grouped records, not an exact permanent count.

### Static Snapshot

Expected for the public Pages URL after a successful workflow:

- `data/manifest.json` is present.
- The nearby brief includes snapshot generation and coverage text.
- `agent-browser errors` is empty.
- Live fallback should not be needed for `6241 Quinpool Road`, because it is inside the configured urban HRM coverage box.

### Wide Radius

For 10 km wide scans, enable broad context layers and expect some layers to hit caps. The brief must show cap warnings when caps are reached.

The static snapshot path intentionally guards the heaviest default-off layers above 5 km. At 10 km, Public ROW permits, Cityworks service requests, Cityworks work orders, Active Travelways, and NS addressable roads may be skipped with a brief note instructing the user to narrow the radius. This protects browser performance while keeping those layers available for tighter neighbourhood scans.

The wide-radius proof is both a data proof and a performance proof. Long-running `agent-browser wait` commands, blocked `errors`/`console` calls, or a browser daemon that becomes unresponsive are evidence that the payload/render path is too heavy, even if the data source providers are protected.

### Visual Layout

The legend must sit outside the map area as a separate bottom strip. It must not cover map markers.

## Evidence Location

Record notable QA outcomes in commit messages, PR notes, or `docs/plans/` when tied to planned work. For one-off local work, a concise final response is enough if it names the exact surface and result.
