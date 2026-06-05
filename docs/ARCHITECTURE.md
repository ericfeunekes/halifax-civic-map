# Architecture

Halifax Civic Map is a static browser app backed by a scheduled static data snapshot. There is no runtime backend. GitHub Actions fetches verified public geospatial endpoints, writes a local SQLite build artifact, exports chunked static GeoJSON plus a manifest under `data/`, and GitHub Pages serves the app and generated data files.

## Runtime Shape

```text
index.html
  loads Leaflet CSS/JS from unpkg
  loads styles.css and app.js

GitHub Actions
  tests scripts/build_snapshot.py
  fetches verified public sources daily and on deploy
  writes data/civic.sqlite plus data/manifest.json and data/chunks/**/*.geojson

app.js
  source registry -> snapshot fetcher -> live fallback fetcher -> raw GeoJSON/records
  filters -> rendered Leaflet layers
  summaries -> sidebar brief and selected-record panel
```

## Core Modules In `app.js`

- Source registry: `SOURCE_LINKS` and `LAYERS` define endpoints, categories, colors, and source types.
- Snapshot builder: `scripts/build_snapshot.py` fetches verified layers over the urban HRM coverage box, stores normalized features in SQLite, prunes properties to fields the app uses, and exports spatial GeoJSON chunks plus `data/manifest.json`.
- Fetching: `queryLayer` reads intersecting static snapshot chunks when the selected point is inside the snapshot coverage. If the snapshot is unavailable or the point is outside coverage, it falls back to live ArcGIS/Socrata queries.
- Filtering: date, permit status, and traffic-study type filters redraw already-returned records.
- Rendering: Leaflet `L.geoJSON` renders points, lines, polygons, popups, and same-street traffic sketch lines.
- Summaries: the sidebar brief ranks recent/notable permit signals, traffic signals, disruption signals, and area context.
- Inspection: the Selected Records panel lists all visible records near a selected address/marker, grouped by layer.

## Data Flow

1. GitHub Actions runs the snapshot builder daily and before every Pages deploy.
2. User searches an HRM civic address or clicks the map.
3. The app loads `data/manifest.json`, then active layer chunks from `data/chunks/`.
4. The browser radius-filters the static layer records around the selected place.
5. If the snapshot is missing or outside coverage, live provider fetches are used as fallback.
6. Raw results are stored by layer.
7. Filters produce visible records from raw results without refetching.
8. Visible records render to the map and summary panels.
9. Selected-record inspection reuses visible records; it does not make another API call.

## Source Boundaries

The app consumes public HRM, Nova Scotia, OpenStreetMap, and Nominatim sources. It must not depend on authenticated systems, private ownership/title records, or non-public household data.

Every new source must be verified against the exact endpoint before becoming an active layer. A search result or similarly named service is not enough.

## Known Limits

- ArcGIS and Socrata record caps can make wide-radius results incomplete.
- Static snapshot files are generated, not committed. The SQLite file is a local/build artifact, not a browser query engine.
- Very broad all-layer searches can still be heavy. The browser loads spatial chunks, applies display caps, and skips the heaviest default-off layers above 5 km with an explicit brief note. Large operational/context layers should be inspected at tighter neighbourhood radii.
- Permit records are public signals, not proof that work is happening today.
- Traffic-study sketch lines interpolate between study points on the same named street; they are not continuous measured road-segment data.
- Cityworks records are operational signals; status/date fields can be noisy.
- Flood extent services found so far require tokens and are not active layers.
