# Data Sources

This app uses public, unauthenticated sources only.

## Active Sources

| Layer | Source | Access Pattern | Notes |
| --- | --- | --- | --- |
| HRM civic address search | HRM CivicAddresses FeatureServer | ArcGIS query by parsed street/number | Used for typeahead and exact address selection. |
| Building permits | HRM PPL&C geolocated permits layer 0 | ArcGIS radius query | Core permit signal. |
| Construction permits | HRM PPL&C geolocated permits layer 1 | ArcGIS radius query | Core permit signal. |
| Engineering permits | HRM PPL&C geolocated permits layer 2 | ArcGIS radius query | Core permit signal. |
| Halifax Water permits | HRM PPL&C geolocated permits layer 3 | ArcGIS radius query | Core permit signal. |
| Land-use approvals | HRM PPL&C geolocated permits layer 4 | ArcGIS radius query | Core permit/planning signal. |
| Public ROW permits | HRM PPL&C geolocated permits layer 6 | ArcGIS radius query | Default off because it can hit caps quickly. |
| Traffic studies | HRM Traffic Studies FeatureServer | ArcGIS radius query | Speed, volume, turning, pedestrian, bike, and related studies. |
| Service requests | HRM Cityworks Service Requests table | ArcGIS table query, client converts lat/lon to points | Operational signal, default off. |
| Work orders | HRM Cityworks Work Orders table | ArcGIS table query, client converts Web Mercator coordinates to points | Operational signal, default off. |
| NSDPW road projects | NSDPW Capital Projects Work Plan 2025-2030 layer 1 | ArcGIS radius query | Provincial project signal, default off. |
| NSDPW bridge projects | NSDPW Capital Projects Work Plan 2025-2030 layer 0 | ArcGIS radius query | Provincial project signal, default off. |
| Active travelways | HRM Active Travelways FeatureServer | ArcGIS radius query | Active transportation infrastructure, not current activity. |
| Provincial traffic sections | Nova Scotia Traffic Volume Sections | Socrata GeoJSON `within_box`, client radius clipping | Contextual road sections, default off. |
| NS addressable roads | NSCAF Addressable Roads | Socrata GeoJSON `within_box`, client radius clipping | Contextual road network, default off. |
| Child care | Nova Scotia Child Care Directory | Socrata JSON points, client radius clipping | Area context, default off. |
| Public schools | Nova Scotia Public Schools | Socrata JSON points, client radius clipping | Area context, default off. |

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
