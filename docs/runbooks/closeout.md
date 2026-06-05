# Closeout Runbook

Before declaring work done:

1. Check repo state with `git status --short --branch`.
2. Run `node --check app.js` after JavaScript edits.
3. Run `agent-browser` QA for UI/data/deployment changes.
4. For deployed changes, verify the GitHub Pages workflow completed successfully.
5. Smoke-test the public Pages URL after deployment.
6. Update docs if behavior, source boundaries, deployment, or proof expectations changed.
7. Confirm docs are discoverable:
   - root `AGENTS.md` points to required docs;
   - `docs/AGENTS.md` can route to every doc in `docs/`;
   - `CLAUDE.md` and `docs/CLAUDE.md` symlinks resolve.
8. Record follow-ups in `docs/plans/backlog.md`.
9. State residual risks explicitly in the final response.
