# sites

> ✅ **Verified Working** — CI, auto-merge, and Cloudflare Workers are configured and active.

[![CI](https://github.com/BlackRoad-OS/sites/actions/workflows/ci.yml/badge.svg)](https://github.com/BlackRoad-OS/sites/actions/workflows/ci.yml)
[![Deploy to Cloudflare Workers](https://github.com/BlackRoad-OS/sites/actions/workflows/deploy.yml/badge.svg)](https://github.com/BlackRoad-OS/sites/actions/workflows/deploy.yml)
[![Auto Merge](https://github.com/BlackRoad-OS/sites/actions/workflows/auto-merge.yml/badge.svg)](https://github.com/BlackRoad-OS/sites/actions/workflows/auto-merge.yml)

## Overview

BlackRoad OS web sites and pages — served at the edge via Cloudflare Workers.

## Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| **CI** | Push / PR | Lint, validate, and test |
| **Deploy** | Push to `main` / manual | Deploy to Cloudflare Workers |
| **Auto Merge** | PR labeled `automerge` or Dependabot | Squash-merge automatically |
| **Worker Tasks** | Manual / daily cron | Dispatch long-running tasks to the edge worker |

## Cloudflare Workers

The edge worker lives in `workers/index.js` and is configured by `wrangler.toml`.

### Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Landing page |
| `/health` | GET | Worker health check |
| `/api/tasks` | POST | Dispatch a background task |

### Background Tasks

Invoke via the **Worker Tasks** workflow or directly via `POST /api/tasks`:

```json
{
  "task": "health-check",
  "target": "https://blackroad.io"
}
```

Supported tasks: `health-check`, `cache-warm`, `index-sites`.

## Setup

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `WORKER_SECRET` | Bearer token for `/api/tasks` endpoint |

### Auto-Merge

Auto-merge is enabled for:
- PRs created by **Dependabot**
- PRs with the `automerge` or `auto-merge` label

Uses `gh pr merge --auto --squash` with `GITHUB_TOKEN`.