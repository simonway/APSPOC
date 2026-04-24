#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
INFRA_MARKER="$RUNTIME_DIR/infra.started"

FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
SOLVER_PID_FILE="$RUNTIME_DIR/solver.pid"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"

log() {
    printf '[stop] %s\n' "$*"
}

warn() {
    printf '[stop] WARN: %s\n' "$*" >&2
}

read_pid() {
    local pid_file="$1"
    if [[ -f "$pid_file" ]]; then
        tr -d '[:space:]' < "$pid_file"
    fi
    return 0
}

pid_is_running() {
    local pid="${1:-}"
    [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

stop_service() {
    local name="$1"
    local pid_file="$2"
    local pid
    local deadline

    pid="$(read_pid "$pid_file")"
    if [[ -z "$pid" ]]; then
        log "$name 没有运行记录，跳过"
        return 0
    fi

    if ! pid_is_running "$pid"; then
        rm -f "$pid_file"
        log "$name 已停止"
        return 0
    fi

    log "停止 $name (PID $pid) ..."
    kill "$pid" 2>/dev/null || true

    deadline=$((SECONDS + 20))
    while (( SECONDS < deadline )); do
        if ! pid_is_running "$pid"; then
            rm -f "$pid_file"
            log "$name 已停止"
            return 0
        fi
        sleep 1
    done

    warn "$name 未在预期时间内退出，执行强制终止"
    kill -9 "$pid" 2>/dev/null || true
    rm -f "$pid_file"
}

stop_service "frontend" "$FRONTEND_PID_FILE"
stop_service "backend" "$BACKEND_PID_FILE"
stop_service "solver" "$SOLVER_PID_FILE"

if [[ -f "$INFRA_MARKER" ]]; then
    if command -v docker >/dev/null 2>&1 && (cd "$ROOT_DIR" && docker compose version >/dev/null 2>&1); then
        log "停止 docker compose 基础设施 ..."
        (
            cd "$ROOT_DIR"
            docker compose stop postgres redis
        )
    else
        warn "找不到 docker compose，无法自动停止 PostgreSQL / Redis。"
    fi
    rm -f "$INFRA_MARKER"
fi

log "停止流程完成"
