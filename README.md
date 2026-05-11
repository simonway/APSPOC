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

- frontend UI: `http://localhost:8080/`
- backend API: `http://localhost:8081/`
- solver API: `http://localhost:8000/`

The frontend assets live in `backend/src/main/resources/static`. The browser app now calls the backend API on `8081` directly, so a simple static file server on `8080` is enough for local development.

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

```bash
python3 -m http.server 8080 -d backend/src/main/resources/static
```

## Start Backend

```bash
cd backend
SERVER_PORT=8081 mvn spring-boot:run
```

After the backend starts, the backend API is available at:

```text
http://localhost:8081/
```

The frontend should be served separately on:

```text
http://localhost:8080/
```
Test the service is started or not:
lsof -nP -iTCP:8081 -sTCP:LISTEN
{"status":"UP"}

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

## Local Workspace Notes

Some local environments may carry helper scripts or proxy tooling alongside this repository. Those files are not part of the APS product scope or release scope.

- do not include local-only helper files such as `auto_switch_proxy.py` in APS commit or release planning
- if a local helper file repeatedly appears in `git status`, prefer local exclusion or `skip-worktree` handling
- release and acceptance scope should stay limited to APS product code, docs, scripts, and sample packages

Reference:

- [本地运行、重启、验收与排障](/Users/simon/Documents/MyProgramming/APSPOC/docs/runbooks/本地运行_重启_验收_排障.md:1)
- [2026-05-11_v0.2.0_pre-release_状态说明.md](/Users/simon/Documents/MyProgramming/APSPOC/docs/release/2026-05-11_v0.2.0_pre-release_状态说明.md:1)

## Submit a Sample Job

```bash
curl -X POST http://localhost:8081/api/v1/schedule/jobs \
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
