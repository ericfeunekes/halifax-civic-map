# Architecture

Halifax Civic Map is a static browser app. There is no backend, build step, database, or local cache. The browser fetches public geospatial endpoints directly and renders them with Leaflet over OpenStreetMap tiles.

## Runtime Shape

```text
index.html
  loads Leaflet CSS/JS from unpkg
  loads styles.css and app.js

app.js
  source registry -> fetch dispatcher -> raw GeoJSON/records
  filters -> rendered Leaflet layers
  summaries -> sidebar brief and selected-record panel
```

## Core Modules In `app.js`

- Source registry: `SOURCE_LINKS` and `LAYERS` define endpoints, categories, colors, and source types.
- Fetching: `queryLayer` dispatches to ArcGIS spatial queries, ArcGIS coordinate tables, Socrata GeoJSON, and Socrata point JSON.
- Filtering: date, permit status, and traffic-study type filters redraw already-returned records.
- Rendering: Leaflet `L.geoJSON` renders points, lines, polygons, popups, and same-street traffic sketch lines.
- Summaries: the sidebar brief ranks recent/notable permit signals, traffic signals, disruption signals, and area context.
- Inspection: the Selected Records panel lists all visible records near a selected address/marker, grouped by layer.

## Data Flow

1. User searches an HRM civic address or clicks the map.
2. The app queries active layers within the selected radius.
3. Raw results are stored by layer.
4. Filters produce visible records from raw results without refetching.
5. Visible records render to the map and summary panels.
6. Selected-record inspection reuses visible records; it does not make another API call.

## Source Boundaries

The app consumes public HRM, Nova Scotia, OpenStreetMap, and Nominatim sources. It must not depend on authenticated systems, private ownership/title records, or non-public household data.

Every new source must be verified against the exact endpoint before becoming an active layer. A search result or similarly named service is not enough.

## Known Limits

- ArcGIS and Socrata record caps can make wide-radius results incomplete.
- Permit records are public signals, not proof that work is happening today.
- Traffic-study sketch lines interpolate between study points on the same named street; they are not continuous measured road-segment data.
- Cityworks records are operational signals; status/date fields can be noisy.
- Flood extent services found so far require tokens and are not active layers.
