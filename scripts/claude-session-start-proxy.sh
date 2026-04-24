#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${AUTO_SWITCH_PROXY_PROJECT_ROOT:-$(cd -- "${SCRIPT_DIR}/.." && pwd)}"
PROXY_SCRIPT="${PROJECT_ROOT}/auto_switch_proxy.py"
PROXY_PORT="${AUTO_SWITCH_PROXY_PORT:-4000}"
LOG_FILE="${AUTO_SWITCH_PROXY_LOG:-/tmp/auto_switch_proxy.log}"
LOCK_DIR="/tmp/auto_switch_proxy_start.lock"
PYTHON_BIN="/Library/Frameworks/Python.framework/Versions/3.11/bin/python3.11"
HEALTH_URL="http://127.0.0.1:${PROXY_PORT}/health"
STARTUP_ATTEMPTS="${AUTO_SWITCH_PROXY_STARTUP_ATTEMPTS:-12}"
STARTUP_SLEEP_SECONDS="${AUTO_SWITCH_PROXY_STARTUP_SLEEP_SECONDS:-0.5}"
SHUTDOWN_ATTEMPTS="${AUTO_SWITCH_PROXY_SHUTDOWN_ATTEMPTS:-10}"
SHUTDOWN_SLEEP_SECONDS="${AUTO_SWITCH_PROXY_SHUTDOWN_SLEEP_SECONDS:-0.5}"

if [ ! -f "${PROXY_SCRIPT}" ]; then
    exit 0
fi

if [ ! -x "${PYTHON_BIN}" ]; then
    PYTHON_BIN="$(command -v python3 || true)"
fi

if [ -z "${PYTHON_BIN}" ]; then
    exit 0
fi

check_health() {
    HEALTH_URL="${HEALTH_URL}" "${PYTHON_BIN}" - <<'PY'
import json
import os
import sys
import urllib.request

url = os.environ["HEALTH_URL"]
try:
    with urllib.request.urlopen(url, timeout=1.5) as response:
        payload = json.loads(response.read().decode("utf-8"))
except Exception:
    sys.exit(1)

if (
    payload.get("status") == "ok"
    and payload.get("app") == "auto_switch_proxy"
    and payload.get("design") == "anthropic-ingress -> primary codex/responses -> fallback claude"
    and payload.get("primary_provider")
    and payload.get("primary_url")
    and payload.get("claude_url")
):
    sys.exit(0)

if payload.get("status") == "ok" and payload.get("app") == "auto_switch_proxy":
    sys.exit(2)

sys.exit(1)
PY
}

wait_for_port_release() {
    local attempt=0
    while [ "${attempt}" -lt "${SHUTDOWN_ATTEMPTS}" ]; do
        if ! lsof -nP -iTCP:"${PROXY_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
            return 0
        fi
        sleep "${SHUTDOWN_SLEEP_SECONDS}"
        attempt=$((attempt + 1))
    done
    return 1
}

stop_stale_proxy() {
    local stale_pid
    stale_pid="$(lsof -tiTCP:"${PROXY_PORT}" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -z "${stale_pid}" ]; then
        return 0
    fi

    kill "${stale_pid}" >/dev/null 2>&1 || true
    if wait_for_port_release; then
        return 0
    fi

    kill -9 "${stale_pid}" >/dev/null 2>&1 || true
    wait_for_port_release
}

if ! mkdir "${LOCK_DIR}" 2>/dev/null; then
    exit 0
fi

cleanup() {
    rmdir "${LOCK_DIR}" 2>/dev/null || true
}

trap cleanup EXIT

if check_health; then
    exit 0
else
    health_status=$?
fi

if [ "${AUTO_SWITCH_PROXY_DRY_RUN:-0}" = "1" ]; then
    exit 0
fi

if [ "${health_status}" -eq 2 ]; then
    stop_stale_proxy || true
fi

if lsof -nP -iTCP:"${PROXY_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port ${PROXY_PORT} is already in use, but ${HEALTH_URL} is not healthy." >>"${LOG_FILE}"
    exit 1
fi

nohup "${PYTHON_BIN}" "${PROXY_SCRIPT}" >>"${LOG_FILE}" 2>&1 </dev/null &

attempt=0
while [ "${attempt}" -lt "${STARTUP_ATTEMPTS}" ]; do
    if check_health; then
        exit 0
    fi
    sleep "${STARTUP_SLEEP_SECONDS}"
    attempt=$((attempt + 1))
done

echo "auto_switch_proxy failed health check after startup." >>"${LOG_FILE}"
exit 1
