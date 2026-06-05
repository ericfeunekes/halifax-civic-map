# Docs Guide

This directory is the durable documentation system for Halifax Civic Map.

## Entry Points

- `ARCHITECTURE.md` - system shape, source boundaries, and code map.
- `DATA_SOURCES.md` - public endpoint inventory, source caveats, and layer-addition rules.
- `WORKFLOW.md` - how work moves from idea to deployed change.
- `TESTING.md` - automated and semi-automated proof contract.
- `../QA.md` - browser and real-data quality checks.
- `DEPLOYMENT.md` - GitHub Pages release path.
- `RUNBOOKS.md` - operational runbook index.
- `runbooks/closeout.md` - completion checklist.
- `plans/backlog.md` - future layers and deferred work.

## Placement Rules

- Put source endpoint details in `DATA_SOURCES.md`.
- Put code structure, dependency direction, and app behavior boundaries in `ARCHITECTURE.md`.
- Put repeatable operator steps in `runbooks/`.
- Put future ideas and unverified source candidates in `plans/backlog.md`.
- Keep README user-facing and concise; detailed agent/developer guidance belongs here.

When a doc move or rename changes discovery, update root `AGENTS.md`, this file, and `RUNBOOKS.md` if runbook routing is affected.
