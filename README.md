# APS POC

Runnable APS POC workspace for the current MVP/UAT stage.

## Scope

This repository starts with a lean but runnable flow:

- `backend/`: Spring Boot orchestration service
- `solver/`: FastAPI + OR-Tools scheduling engine
- `compose.yaml`: PostgreSQL and Redis for the next persistence step
- `docs/sample-job-request.json`: sample payload to run the first schedule job

Baseline capabilities retained from the original Phase 1 POC:

- async schedule job submission
- solver callback-free polling flow
- PostgreSQL-backed job/version persistence in the backend
- multi-resource scheduling in the solver
- resource downtime windows in solver and Gantt output
- Gantt-friendly response shape from the backend

PostgreSQL is now part of the runnable backend path. Redis remains provisioned for the next queueing step, but is not yet wired into the execution flow.

## Current Delivery Status

The current recommended project status is:

> Phase 2 roadmap closure is complete and the product is ready for business demo / UAT / release validation.

In practical terms, the current codebase already supports:

- formal import for `Resource / Recipe / Demand / Downtime / InventoryBalance / SetupRule`
- scenario generation from imported master data
- solver submission with `precedence`, `setupRules`, material IO, and inventory semantics
- durable backend job lifecycle with `CREATED / QUEUED / RUNNING / SUCCEEDED / FAILED / TIMEOUT / CANCELLED`
- job `cancel / retry` and restart-time queue resume from persisted request snapshots
- version list, Gantt, diff, history, release note, submit, approve, reject, publish, rollback, and trial solve
- backend-enforced `Admin / Planner / Approver / Viewer` role model wired through session auth and UI actions

For the canonical status wording and latest validation records, see:

- `docs/release/2026-05-09_二期路线图闭环更新.md`
- `docs/release/2026-05-11_发布验收_smoke_记录.md`
- `docs/release/2026-05-08_二期完成度与收尾建议.md` (historical baseline)

## Repo Layout

```text
APSPOC/
├── backend/
├── solver/
├── docs/
└── compose.yaml
```

## Local Port Convention

This document assumes the following local port layout:

- frontend UI: `http://127.0.0.1:8080/`
- backend API: `http://127.0.0.1:8081/`
- solver API: `http://127.0.0.1:8000/`

The preferred local frontend is the React workbench in `frontend/`. The browser app calls the backend API on `8081` directly. The previous static UI still lives in `backend/src/main/resources/static` and remains recoverable from the Spring Boot backend while the React migration is in progress.

## Start Infra

```bash
docker compose up -d
```

If Docker is not available, the backend can also run against local Homebrew services:

```bash
brew services start postgresql@16
brew services start redis
createuser aps
createdb -O aps aps_poc
```

## Quick Start Scripts

If you want the repo to manage the local runtime for you, use:

```bash
./startup.sh
./stop.sh
```

`./startup.sh` checks local prerequisites, optionally boots PostgreSQL / Redis, and starts:

- frontend `8080`
- backend `8081`
- solver `8000`

Runtime logs are written to:

```text
.runtime/logs/frontend.log
.runtime/logs/backend.log
.runtime/logs/solver.log
```

## Start Solver

```bash
cd solver
python3 -m uvicorn app.main:app --reload --port 8000
```

## Start Frontend

The preferred local frontend is the React workbench in `frontend/`:

```bash
cd frontend
npm install
VITE_APS_API_BASE_URL=http://127.0.0.1:8081 npm run dev -- --host 127.0.0.1 --port 8080
```

The React app runs at:

```text
http://127.0.0.1:8080/
```

The previous static UI remains recoverable from the Spring Boot backend while the React migration is in progress:

```text
http://127.0.0.1:8081/
```

If npm is not available, `./startup.sh` falls back to serving `backend/src/main/resources/static` on port `8080` with Python.

## Start Backend

```bash
cd backend
SERVER_PORT=8081 mvn spring-boot:run
```

After the backend starts, the backend API is available at:

```text
http://127.0.0.1:8081/
```

The React frontend should be served separately on:

```text
http://127.0.0.1:8080/
```

The legacy static UI is also available from the backend root during the React migration.

Check whether the backend is listening:

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN
curl -fsS http://127.0.0.1:8081/actuator/health
```

Expected health response:

```json
{"status":"UP"}
```

## Login

The UI now opens with a login page before loading schedule data.

Default local credentials:

- username: `admin`
- password: `admin123`

To override the first bootstrapped credentials for a fresh database, set:

```bash
export APS_AUTH_USERNAME=your-user
export APS_AUTH_PASSWORD=your-password
```

The login page supports both Chinese and English, and the selected language is applied to the whole UI.
After signing in, use the `Account Settings` action in the top-right area of the workspace to change the username and password.

## Claude CLI Proxy

This repo also contains `auto_switch_proxy.py` for the Claude CLI -> Claude primary / Codex fallback setup.

- project-level Claude config now points this repo to `http://127.0.0.1:4000`
- `scripts/claude-session-start-proxy.sh` can auto-start the local proxy on session start
- the script now treats older proxy builds on `4000` as stale and restarts them with the current repo version
- the proxy now sends Claude CLI traffic to Claude first and only falls back to Codex Responses when Claude is unavailable

Notes:

- the proxy start hook only starts the local proxy process; it does not replace your Anthropic API key
- the proxy config is project-scoped through `.claude/settings.json`, so it applies in this repo and its subdirectories, not globally
- if `claude` reports `Bad CPU type in executable` on macOS, you are launching an `arm64` Claude binary from an `x86_64` shell, so run Claude from a native `arm64` terminal instead

## Submit a Sample Job

```bash
curl -X POST http://127.0.0.1:8081/api/v1/schedule/jobs \
  -H 'Content-Type: application/json' \
  --data @../docs/sample-job-request.json
```

Useful backend endpoints on `http://localhost:8081`:

- `GET /api/v1/health`
- `GET /api/v1/schedule/jobs/{jobId}`
- `GET /api/v1/versions`
- `GET /api/v1/versions/{versionId}/gantt-data`
- `GET /api/v1/versions/{versionId}/history`
- `GET /api/v1/versions/{versionId}/diff?baseVersionId={baseVersionId}`
- `POST /api/v1/versions/{versionId}/publish`
- `POST /api/v1/versions/{versionId}/rollback`

## Release Verification

Run the release verification script before tagging or merging a release branch:

```bash
./scripts/verify-release.sh
```

Useful modes:

```bash
./scripts/verify-release.sh --tests-only
./scripts/verify-release.sh --smoke-only
```

The smoke summary is written to:

```text
.runtime/release-smoke-summary.json
```

Related release documents:

- `CHANGELOG.md`
- `docs/release/2026-04-27_发布收口验收记录.md`
- `docs/release/2026-05-09_二期路线图闭环更新.md`
- `docs/release/2026-05-11_发布验收_smoke_记录.md`
- `docs/release/2026-05-11_发布前测试数据清理清单.md`
- `docs/release/2026-05-08_二期完成度与收尾建议.md`
- `docs/release/版本发布治理清单.md`
- `docs/runbooks/本地运行_重启_验收_排障.md`

## Current Priorities

Recommended follow-up work from the current state:

1. keep using the `2026-05-09` roadmap-closure wording in release notes, demos, and UAT materials
2. run `./scripts/verify-release.sh` on release candidates and attach `.runtime` smoke summaries to the acceptance record
3. complete release notes, runbooks, changelog, and defect closeout materials for the target release branch
4. decide whether the next environment needs queue/distributed-execution hardening beyond the current single-node async executor
