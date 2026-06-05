# Closeout Runbook

Before declaring work done:

1. Check repo state with `git status --short --branch`.
2. Confirm the active repo root with `git rev-parse --show-toplevel`; it must be `/Users/ericfeunekes/coding/halifax-civic-map`.
3. Run `node --check app.js` after JavaScript edits.
4. Run `agent-browser` QA for UI/data/deployment changes.
5. For docs-only changes, verify link/path sanity, `CLAUDE.md` symlinks, and repo cleanliness; do not claim full browser data QA unless the app surface changed.
6. For deployed changes, verify the GitHub Pages workflow completed successfully.
7. Smoke-test the public Pages URL after deployment.
8. Update docs if behavior, source boundaries, deployment, or proof expectations changed.
9. Confirm docs are discoverable:
   - root `AGENTS.md` points to required docs;
   - `docs/AGENTS.md` can route to every doc in `docs/`;
   - `CLAUDE.md` and `docs/CLAUDE.md` symlinks resolve.
10. Record follow-ups in `docs/plans/backlog.md`.
11. State residual risks explicitly in the final response.
