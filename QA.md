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

For deployment changes:

1. Push to `main`.
2. Watch `Deploy GitHub Pages` to success.
3. Open `https://ericfeunekes.github.io/halifax-civic-map/`.
4. Repeat the smoke search.

## Feature-Specific Checks

### Selected Records

Expected for `6241 QUINPOOL RD, HALIFAX` at 500 m with default layers:

- Selected Records panel should populate after address selection.
- It should show multiple records grouped by layer.
- As of the last checked public data, it showed 12 records: 6 construction permits, 4 traffic studies, and 2 building permits.

Counts may drift as public datasets change; the contract is multiple grouped records, not an exact permanent count.

### Wide Radius

For 10 km wide scans, enable broad context layers and expect some layers to hit caps. The brief must show cap warnings when caps are reached.

### Visual Layout

The legend must sit outside the map area as a separate bottom strip. It must not cover map markers.

## Evidence Location

Record notable QA outcomes in commit messages, PR notes, or `docs/plans/` when tied to planned work. For one-off local work, a concise final response is enough if it names the exact surface and result.
