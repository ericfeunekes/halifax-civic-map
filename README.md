# Halifax Civic Map

Static local web app for exploring what public Halifax civic data says is going on near a selected place.

## GitHub Pages

This folder is a standalone static-site repository. The GitHub Actions workflow in `.github/workflows/pages.yml` deploys the repository root to GitHub Pages on every push to `main`.

After the repository is pushed to GitHub, enable Pages with **Source: GitHub Actions** in the repository settings. The workflow can also be run manually from the Actions tab.

## Open

Open `index.html` directly in a browser, or run a small static server from this directory:

```bash
python3 -m http.server 8765
```

Then visit `http://127.0.0.1:8765`.

## Tailscale Serve

This Mac can serve the app inside the tailnet at `/civic-map`:

```bash
bash "/Users/ericfeunekes/ai notes/_serve/setup-civic-map.sh"
```

The setup script runs a localhost-only static server on port `8767` and maps it through Tailscale Serve at:

```text
https://robie-imac.tailae8a7b.ts.net/civic-map/
```

To remove it:

```bash
bash "/Users/ericfeunekes/ai notes/_serve/teardown-civic-map.sh"
```

## Current Layers

- HRM PPL&C Building Permits
- HRM PPL&C Construction Permits
- HRM PPL&C Engineering Permits
- HRM PPL&C Halifax Water Permits
- HRM PPL&C Land Use Approvals
- HRM PPL&C Public Works ROW Permits
- HRM Traffic Studies
- HRM Cityworks Service Requests
- HRM Cityworks Work Orders
- NSDPW Capital Projects Work Plan 2025-2030 road projects
- NSDPW Capital Projects Work Plan 2025-2030 bridge/culvert projects
- HRM Active Travelways
- Nova Scotia Traffic Volume Sections
- NSCAF Addressable Roads
- Nova Scotia Child Care Directory
- Nova Scotia Public Schools

## Current Controls

- HRM civic-address typeahead for numbered street addresses, with OSM/Nominatim fallback for fuzzy places.
- Radius filter around the selected point, from 250 m to 15 km. The broad range is intended for peninsula plus Spryfield/Herring Cove style scans, not full-HRM completeness.
- Date period filter: all dates, last 30 days, last 90 days, last 6 months, last year, or custom range.
- Date basis filter: any relevant date, permit submitted, permit issued, permit completed, permit expires, inspection completed, traffic survey date, or record added.
- Permit status filter: all statuses, open/uncompleted, completed only, or closed/expired/withdrawn.
- Since-date shortcut chips: since last visit, 7 days, 30 days, 90 days, this year, or clear dates.
- Traffic-study type filter: speed, volume, turning counts, pedestrian counts, bike studies, or speed display signs.
- Traffic visual encodings: color by speed, volume, study type, or year; size by volume, speed, or fixed size.
- Same-street traffic-study sketch lines, with configurable line thickness by average volume, average speed, or study count.
- Permit attention signals: new, open, stale open, high value, housing units, review/friction, expiring soon, and notable work types.
- Disruption context: Cityworks service requests/work orders plus NSDPW road and bridge/culvert project records.
- Area context: active-travelway segments, provincial road-section context, child-care facilities, and public schools.

## Boundaries

- Public data only.
- Permit records are useful signals, not proof that work is currently happening.
- Traffic-study records show where counts/speed studies exist; they are not a full safety model.
- Traffic-study sketch lines interpolate between public study points on the same named street. They are not continuous measured road-segment data.
- Permit attention signals are heuristics for what to inspect first, not official quality, risk, compliance, or approval judgments.
- Cityworks service/work records are operational signals. Status, dates, and closure state can be noisy; inspect the popup before treating a record as a current disruption.
- Active travelways and NS road-section layers can hit record caps at wide radius and are best used as context layers, not exhaustive network models.
- Flood extent services found in HRM ArcGIS search currently require tokens, so flood is documented as a candidate source rather than active-mapped in this static app.
- This app does not provide legal, title, ownership, surveying, engineering, insurance, or property-level advice.

## Next Layers To Add

- Active planning applications
- Zoning and land-use by-law areas
- Public flood extents and coastal hazard if a non-token-gated endpoint is found
- Public trees, parks, and public washrooms
- Transit feeds and route/headway context
- Live road closures, parking bans, outages, or water disruptions if queryable public feeds are verified
