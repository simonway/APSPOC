#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
LOG_DIR="$RUNTIME_DIR/logs"
INFRA_MARKER="$RUNTIME_DIR/infra.started"

FRONTEND_PORT=8080
SOLVER_PORT=8000
BACKEND_PORT=8081
POSTGRES_PORT=5432
REDIS_PORT=6379

FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
SOLVER_PID_FILE="$RUNTIME_DIR/solver.pid"
BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"

mkdir -p "$LOG_DIR"

log() {
    printf '[startup] %s\n' "$*"
}

warn() {
    printf '[startup] WARN: %s\n' "$*" >&2
}

die() {
    printf '[startup] ERROR: %s\n' "$*" >&2
    exit 1
}

has_command() {
    command -v "$1" >/dev/null 2>&1
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

cleanup_stale_pidfile() {
    local pid_file="$1"
    local pid

    pid="$(read_pid "$pid_file")"
    if [[ -n "$pid" ]] && ! pid_is_running "$pid"; then
        rm -f "$pid_file"
    fi
}

listener_pid() {
    local port="$1"
    lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

port_in_use() {
    local port="$1"
    [[ -n "$(listener_pid "$port")" ]]
}

wait_for_port() {
    local port="$1"
    local timeout_seconds="$2"
    local deadline=$((SECONDS + timeout_seconds))

    while (( SECONDS < deadline )); do
        if port_in_use "$port"; then
            return 0
        fi
        sleep 1
    done

    return 1
}

wait_for_http() {
    local url="$1"
    local port="$2"
    local timeout_seconds="$3"
    local deadline=$((SECONDS + timeout_seconds))

    if ! has_command curl; then
        wait_for_port "$port" "$timeout_seconds"
        return $?
    fi

    while (( SECONDS < deadline )); do
        if curl -fsS --max-time 2 "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done

    return 1
}

quoted_command() {
    printf '%q ' "$@"
}

start_service() {
    local name="$1"
    local pid_file="$2"
    local port="$3"
    local workdir="$4"
    local ready_url="$5"
    local timeout_seconds="$6"
    shift 6
    local -a cmd=( "$@" )

    local pid
    local log_file="$LOG_DIR/${name}.log"
    local command_string

    cleanup_stale_pidfile "$pid_file"
    pid="$(read_pid "$pid_file")"

    if pid_is_running "$pid"; then
        log "$name 已在运行 (PID $pid)"
        return 0
    fi

    if port_in_use "$port"; then
        die "$name 需要的端口 $port 已被占用 (PID $(listener_pid "$port"))。请先执行 ./stop.sh 或手工释放端口。"
    fi

    command_string="$(quoted_command "${cmd[@]}")"

    log "启动 $name ..."
    (
        cd "$workdir"
        nohup bash -lc "set -euo pipefail; trap 'pkill -P \$\$ >/dev/null 2>&1 || true' EXIT TERM INT; ${command_string} & child=\$!; wait \$child" \
            >"$log_file" 2>&1 &
        echo $! > "$pid_file"
    )

    pid="$(read_pid "$pid_file")"
    if ! pid_is_running "$pid"; then
        tail -n 40 "$log_file" >&2 || true
        die "$name 启动失败，请查看日志：$log_file"
    fi

    if ! wait_for_http "$ready_url" "$port" "$timeout_seconds"; then
        tail -n 40 "$log_file" >&2 || true
        die "$name 启动超时，请查看日志：$log_file"
    fi

    log "$name 已启动，日志：$log_file"
}

ensure_infra() {
    if port_in_use "$POSTGRES_PORT"; then
        log "检测到 PostgreSQL 已在端口 $POSTGRES_PORT 运行，跳过基础设施启动"
        return 0
    fi

    if ! has_command docker; then
        die "未检测到 PostgreSQL 正在运行，且本机没有 docker。请先启动数据库后再执行脚本。"
    fi

    if ! (cd "$ROOT_DIR" && docker compose version >/dev/null 2>&1); then
        die "未检测到可用的 docker compose。请先启动数据库后再执行脚本。"
    fi

    log "启动 PostgreSQL / Redis 基础设施 ..."
    (
        cd "$ROOT_DIR"
        docker compose up -d postgres redis
    )
    : > "$INFRA_MARKER"

    local deadline=$((SECONDS + 120))
    while (( SECONDS < deadline )); do
        if (
            cd "$ROOT_DIR"
            docker compose exec -T postgres pg_isready -U aps -d aps_poc >/dev/null 2>&1
        ); then
            break
        fi
        sleep 2
    done

    if ! port_in_use "$POSTGRES_PORT"; then
        die "PostgreSQL 启动失败，请检查 docker compose 状态。"
    fi

    if port_in_use "$REDIS_PORT"; then
        log "Redis 已启动"
    else
        warn "Redis 尚未监听端口 $REDIS_PORT，但这不会阻止当前 POC 启动。"
    fi
}

require_local_tools() {
    has_command python3 || die "未找到 python3。"
    has_command mvn || die "未找到 mvn。"
    has_command lsof || die "未找到 lsof。"
}

require_local_tools
ensure_infra

start_service \
    "solver" \
    "$SOLVER_PID_FILE" \
    "$SOLVER_PORT" \
    "$ROOT_DIR/solver" \
    "http://127.0.0.1:${SOLVER_PORT}/health" \
    60 \
    python3 -m uvicorn app.main:app --host 127.0.0.1 --port "$SOLVER_PORT"

start_service \
    "backend" \
    "$BACKEND_PID_FILE" \
    "$BACKEND_PORT" \
    "$ROOT_DIR/backend" \
    "http://127.0.0.1:${BACKEND_PORT}/actuator/health" \
    180 \
    env SERVER_PORT="$BACKEND_PORT" mvn spring-boot:run

start_frontend() {
    if [[ -f "$ROOT_DIR/frontend/package.json" ]] && [[ -x "$ROOT_DIR/frontend/node_modules/.bin/vite" ]] && has_command npm; then
        start_service \
            "frontend" \
            "$FRONTEND_PID_FILE" \
            "$FRONTEND_PORT" \
            "$ROOT_DIR/frontend" \
            "http://127.0.0.1:${FRONTEND_PORT}/" \
            60 \
            env VITE_APS_API_BASE_URL="http://127.0.0.1:${BACKEND_PORT}" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
        return 0
    fi

    warn "未检测到 React frontend、npm 或已安装的 Vite 依赖，使用旧版静态前端。"
    start_service \
        "frontend" \
        "$FRONTEND_PID_FILE" \
        "$FRONTEND_PORT" \
        "$ROOT_DIR" \
        "http://127.0.0.1:${FRONTEND_PORT}/" \
        30 \
        python3 -m http.server "$FRONTEND_PORT" -d "$ROOT_DIR/backend/src/main/resources/static" --bind 127.0.0.1
}

start_frontend

cat <<EOF

系统已启动：
  Frontend: http://127.0.0.1:${FRONTEND_PORT}/
  Backend : http://127.0.0.1:${BACKEND_PORT}/
  Solver  : http://127.0.0.1:${SOLVER_PORT}/

默认登录账号：
  用户名: admin
  密码  : admin123

日志目录：
  $LOG_DIR
EOF
