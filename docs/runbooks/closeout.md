# Closeout Runbook

Before declaring work done:

1. Check repo state with `git status --short --branch`.
2. Confirm the active repo root with `git rev-parse --show-toplevel`; it must be `/Users/ericfeunekes/coding/halifax-civic-map`.
3. Run `node --check app.js` after JavaScript edits.
4. Run `/usr/bin/env python3 -m unittest discover -s tests` after snapshot-builder or workflow edits.
5. Run `/usr/bin/env python3 scripts/build_snapshot.py --output-dir data --sqlite-path data/civic.sqlite` after source harvesting, coverage, generated-data, or workflow behavior changes.
6. Run `agent-browser` QA for UI/data/deployment changes.
7. For docs-only changes, verify link/path sanity, `CLAUDE.md` symlinks, and repo cleanliness; do not claim full browser data QA unless the app surface changed.
8. For deployed changes, verify the GitHub Pages workflow completed successfully.
9. Smoke-test the public Pages URL after deployment.
10. Update docs if behavior, source boundaries, deployment, or proof expectations changed.
11. Confirm docs are discoverable:
   - root `AGENTS.md` points to required docs;
   - `docs/AGENTS.md` can route to every doc in `docs/`;
   - `CLAUDE.md` and `docs/CLAUDE.md` symlinks resolve.
12. Record follow-ups in `docs/plans/backlog.md`.
13. State residual risks explicitly in the final response.
