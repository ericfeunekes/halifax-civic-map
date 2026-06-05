# Deployment

The app deploys as a static GitHub Pages site.

## Public URL

```text
https://ericfeunekes.github.io/halifax-civic-map/
```

## Repository

```text
https://github.com/ericfeunekes/halifax-civic-map
```

## Workflow

`.github/workflows/pages.yml` deploys on every push to `main`.

The workflow:

1. checks out the repo;
2. configures GitHub Pages;
3. uploads the repository root as the static site artifact;
4. deploys to Pages.

The repo is configured for Pages `build_type=workflow`, HTTPS enforced, public.

## Release Procedure

```bash
git status --short --branch
node --check app.js
git push
gh run list --repo ericfeunekes/halifax-civic-map --limit 3
gh run watch <run-id> --repo ericfeunekes/halifax-civic-map --exit-status
```

Then smoke-test the public URL with `agent-browser`.

## Notes

The workflow sets `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` so the Pages action chain has been exercised against GitHub's Node 24 runner behavior. GitHub may still annotate that the referenced action tags target Node 20 until upstream action tags are updated.
