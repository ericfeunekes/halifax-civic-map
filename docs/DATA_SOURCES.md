# Data Sources

This app uses public, unauthenticated sources only.

GitHub Actions harvests the active data sources daily and before each Pages deploy. The public browser app reads generated static files from GitHub Pages first, so normal user searches do not re-query HRM/NS/Socrata providers. Live provider queries remain as fallback when the static snapshot is unavailable or the selected point is outside snapshot coverage.

Snapshot coverage is the urban HRM core: Halifax peninsula, Dartmouth, Bedford, Sackville, Spryfield, and Herring Cove area.

The heaviest default-off layers are guarded above 5 km in the browser snapshot path. Narrow to 5 km or less to load Public ROW permits, Cityworks service requests, Cityworks work orders, Active Travelways, and NS addressable roads.

## Active Sources

| Layer | Source | Access Pattern | Notes |
| --- | --- | --- | --- |
| HRM civic address search | HRM CivicAddresses FeatureServer | Live ArcGIS query by parsed street/number | Used for typeahead and exact address selection. |
| Building permits | HRM PPL&C geolocated permits layer 0 | Action harvest, static GeoJSON, live fallback | Core permit signal. |
| Construction permits | HRM PPL&C geolocated permits layer 1 | Action harvest, static GeoJSON, live fallback | Core permit signal. |
| Engineering permits | HRM PPL&C geolocated permits layer 2 | Action harvest, static GeoJSON, live fallback | Core permit signal. |
| Halifax Water permits | HRM PPL&C geolocated permits layer 3 | Action harvest, static GeoJSON, live fallback | Core permit signal. |
| Land-use approvals | HRM PPL&C geolocated permits layer 4 | Action harvest, static GeoJSON, live fallback | Core permit/planning signal. |
| Public ROW permits | HRM PPL&C geolocated permits layer 6 | Action harvest, static GeoJSON, live fallback | Default off because it can hit caps quickly. |
| Traffic studies | HRM Traffic Studies FeatureServer | Action harvest, static GeoJSON, live fallback | Speed, volume, turning, pedestrian, bike, and related studies. |
| Service requests | HRM Cityworks Service Requests table | Action harvest converts lat/lon table to static GeoJSON | Operational signal, default off. |
| Work orders | HRM Cityworks Work Orders table | Action harvest converts Web Mercator table to static GeoJSON | Operational signal, default off. |
| NSDPW road projects | NSDPW Capital Projects Work Plan 2025-2030 layer 1 | Action harvest, static GeoJSON, live fallback | Provincial project signal, default off. |
| NSDPW bridge projects | NSDPW Capital Projects Work Plan 2025-2030 layer 0 | Action harvest, static GeoJSON, live fallback | Provincial project signal, default off. |
| Active travelways | HRM Active Travelways FeatureServer | Action harvest, static GeoJSON, live fallback | Active transportation infrastructure, not current activity. |
| Provincial traffic sections | Nova Scotia Traffic Volume Sections | Action harvest via Socrata GeoJSON `within_box` | Contextual road sections, default off. |
| NS addressable roads | NSCAF Addressable Roads | Action harvest via Socrata GeoJSON `within_box` | Contextual road network, default off. |
| Child care | Nova Scotia Child Care Directory | Action harvest via Socrata JSON points | Area context, default off. |
| Public schools | Nova Scotia Public Schools | Action harvest via Socrata JSON points | Area context, default off. |

## Source Addition Checklist

Before adding an active layer:

1. Verify the exact endpoint with sample records.
2. Confirm returned geography is Halifax/HRM or the intended Nova Scotia context.
3. Confirm unauthenticated browser access works from GitHub Pages.
4. Confirm geometry is usable, or document how table coordinates are converted.
5. Add popup rows and source-specific caveats.
6. Add summary behavior only when the field signal is useful.
7. QA with `agent-browser` on the deployed or local browser surface.

## Candidate Sources

- Active planning applications.
- Zoning and land-use by-law areas.
- Public flood extents/coastal hazard if a non-token-gated endpoint is found.
- Public trees, parks, and washrooms.
- Transit stops/routes/headways.
- Live road closures, parking bans, outages, water disruptions, or construction notices.
- Residential rental registry and residential standards violations.

Candidate sources stay out of `LAYERS` until the checklist is satisfied.
