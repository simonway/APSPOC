# APS POC

First runnable skeleton for an APS POC based on the study notes in `../APS学习笔记`.

## Scope

This repository starts with a lean but runnable flow:

- `backend/`: Spring Boot orchestration service
- `solver/`: FastAPI + OR-Tools scheduling engine
- `compose.yaml`: PostgreSQL and Redis for the next persistence step
- `docs/sample-job-request.json`: sample payload to run the first schedule job

Current focus is the Phase 1 POC baseline:

- async schedule job submission
- solver callback-free polling flow
- PostgreSQL-backed job/version persistence in the backend
- multi-resource scheduling in the solver
- resource downtime windows in solver and Gantt output
- Gantt-friendly response shape from the backend

PostgreSQL is now part of the runnable backend path. Redis remains provisioned for the next queueing step, but is not yet wired into the execution flow.

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

This repo also contains `auto_switch_proxy.py` for the Claude CLI -> Codex primary / Claude fallback setup.

- project-level Claude config now points this repo to `http://127.0.0.1:4000`
- `scripts/claude-session-start-proxy.sh` can auto-start the local proxy on session start
- the script now treats older proxy builds on `4000` as stale and restarts them with the current repo version

Notes:

- the proxy start hook only starts the local proxy process; it does not replace your Anthropic API key
- if `claude` reports `Bad CPU type in executable` on macOS, you are launching an `arm64` Claude binary from an `x86_64` shell, so run Claude from a native `arm64` terminal instead

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
- `POST /api/v1/versions/{versionId}/publish`
- `POST /api/v1/versions/{versionId}/rollback`

## Next Steps

Planned follow-up work after the skeleton is stable:

1. move async execution state to Redis-backed queues
2. add import pipeline for Recipe, Resource, and Demand master data
3. connect the future Gantt frontend to the version and Gantt APIs
4. add version diff, publish history, and rollback audit trail
