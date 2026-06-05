# Workflow

## Development Loop

1. Start from `AGENTS.md` and the docs relevant to the change.
2. Keep changes small and source-specific.
3. Run `node --check app.js` after JavaScript edits.
4. Run browser QA with `agent-browser` for any UI, map, fetch, filter, summary, or deployment-affecting change.
5. Update docs when behavior or source boundaries change.
6. Commit and push only after local QA passes.
7. Watch the GitHub Pages workflow after pushing.
8. Smoke-test the public Pages URL when the workflow succeeds.

## Active Development Location

Use this repo:

```text
/Users/ericfeunekes/coding/halifax-civic-map
```

Before editing, committing, or pushing, confirm:

```bash
git rev-parse --show-toplevel
```

The earlier vault copy under `/Users/ericfeunekes/ai notes/initiatives/halifax-civic-map/app` is historical context, not the active development source. Do not repair, commit, or push from that checkout as part of repo work. If the vault initiative notes are stale, update the vault overview/log as context and keep the product repo changes here.

## Change Routing

| Change | Read First | Required Proof |
| --- | --- | --- |
| New data source/layer | `DATA_SOURCES.md`, `ARCHITECTURE.md` | Endpoint sample, `node --check`, browser QA |
| Filter/date/status logic | `ARCHITECTURE.md`, `TESTING.md` | Existing address smoke test plus targeted filter check |
| Map rendering/legend/sidebar | `ARCHITECTURE.md`, `QA.md` | Browser screenshot or computed layout check |
| Selected-record inspection | `ARCHITECTURE.md`, `QA.md` | Dense address search and panel count check |
| GitHub Pages workflow | `DEPLOYMENT.md`, `runbooks/closeout.md` | Workflow success plus public URL smoke test |
| Docs-only change | `docs/AGENTS.md` | Link/path sanity, symlink check, git status; no full browser data QA unless deployment or visible app behavior changed |

## Release Path

`main` is the release branch. Pushing to `main` triggers the GitHub Pages workflow. Do not call work deployed until the workflow completes and the public URL has been smoke-tested.
