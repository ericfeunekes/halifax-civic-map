# Halifax Civic Map Agent Guide

## Project Overview

- `index.html` - static application shell and control/sidebar layout.
- `styles.css` - responsive layout, map/legend/sidebar styling, popup and inspection panel styling.
- `app.js` - Leaflet map, source registry, public-data fetchers, filters, visual signals, summaries, and selected-record inspection.
- `.github/workflows/pages.yml` - GitHub Pages deployment workflow.
- `docs/` - durable architecture, workflow, source, testing, QA, and deployment docs.

This is a personal public-data map for exploring what civic records say is happening near a Halifax-area place. It is not a generic sales demo and it should not make legal, engineering, ownership, safety, insurance, or property-level claims.

## Workflows

Before non-trivial work:

- Confirm the repo root is `/Users/ericfeunekes/coding/halifax-civic-map` before editing, committing, or pushing.
- Read `docs/ARCHITECTURE.md` for source and module boundaries.
- Read `docs/DATA_SOURCES.md` before adding, removing, renaming, or reinterpreting any data source.
- Read `docs/TESTING.md` and `QA.md` before changing map rendering, layer fetching, filters, summaries, or deployment.
- Check `docs/plans/backlog.md` for known candidate layers and deferred issues.

When finishing work:

- Run the proof expected by `docs/TESTING.md`.
- Use `agent-browser` QA for UI or data-fetch changes.
- Update docs when behavior, source boundaries, or deployment mechanics change.
- Follow `docs/runbooks/closeout.md` before declaring the work done.

After context loss or a long pause:

1. Re-read this file.
2. Re-read the docs relevant to the current change.
3. Check `git status --short --branch`.
4. Restate the active task, completed work, and next proof before editing.

## Module Coordination

- Adding a layer requires updating `LAYERS` / `SOURCE_LINKS` in `app.js`, popup rows, summary behavior if relevant, `docs/DATA_SOURCES.md`, and QA coverage.
- Changing date/status filters requires checking permit, traffic, Cityworks, and project records because they use different field names.
- Changing visual encodings requires updating the UI labels, legend behavior if relevant, and the caveats in `README.md` or `docs/ARCHITECTURE.md`.
- Changing deployment requires updating `.github/workflows/pages.yml`, `docs/DEPLOYMENT.md`, and `docs/runbooks/closeout.md` if proof changes.
- The vault copy under `/Users/ericfeunekes/ai notes/initiatives/halifax-civic-map/app` is no longer the active development source; use this repo.
- Do not edit or commit the old vault checkout as a second source tree. If the vault initiative context is stale, update the vault overview/log separately and keep repo work in this checkout.

## Build And Verify

- Syntax: `node --check app.js`
- Local serve: `python3 -m http.server 8765`
- Local URL: `http://127.0.0.1:8765`
- Public URL: `https://ericfeunekes.github.io/halifax-civic-map/`
- QA browser: use `agent-browser`, not visual inspection by memory.

## Invariants

- Public data only. Do not add authenticated, private, ownership/title, or personal records.
- Do not keep a layer active until the exact endpoint is verified and returns the expected Halifax/HRM geography.
- Do not make source claims stronger than the public fields support.
- Wide-radius results can hit record caps; summaries must caveat incompleteness when caps are reached.
- Proof claims must name the exact surface tested: local server, Tailscale URL, or GitHub Pages URL.
