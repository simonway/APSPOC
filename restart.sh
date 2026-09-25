#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

printf '[restart] 正在停止全部服务...\n'
"$ROOT_DIR/stop.sh"

printf '[restart] 正在启动全部服务...\n'
exec "$ROOT_DIR/startup.sh"
