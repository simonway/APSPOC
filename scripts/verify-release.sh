#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RUN_TESTS=1
RUN_SMOKE=1

log() {
    printf '[verify-release] %s\n' "$*"
}

die() {
    printf '[verify-release] ERROR: %s\n' "$*" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || die "未找到命令: $1"
}

usage() {
    cat <<'EOF'
Usage: ./scripts/verify-release.sh [--tests-only] [--smoke-only]

  --tests-only   只运行自动化测试和静态检查
  --smoke-only   只运行本地三端与 API smoke 检查
EOF
}

while (($# > 0)); do
    case "$1" in
        --tests-only)
            RUN_TESTS=1
            RUN_SMOKE=0
            ;;
        --smoke-only)
            RUN_TESTS=0
            RUN_SMOKE=1
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            usage
            die "未知参数: $1"
            ;;
    esac
    shift
done

if (( RUN_TESTS )); then
    require_command mvn
    require_command python3
    require_command node
    require_command git

    log "运行 backend 单元测试 ..."
    (
        cd "$ROOT_DIR/backend"
        mvn test
    )

    log "运行 solver 单元测试 ..."
    (
        cd "$ROOT_DIR/solver"
        python3 -m unittest discover -s tests -p 'test_*.py'
    )

    if [[ -f "$ROOT_DIR/frontend/package.json" ]]; then
        require_command npm
        log "运行 React frontend 单元测试 ..."
        (
            cd "$ROOT_DIR/frontend"
            npm test -- --run
        )

        log "运行 React frontend 构建检查 ..."
        (
            cd "$ROOT_DIR/frontend"
            npm run build
        )
    fi

    log "运行旧版 frontend 静态语法检查 ..."
    (
        cd "$ROOT_DIR"
        node --check backend/src/main/resources/static/app.js
    )

    log "检查 git diff 格式问题 ..."
    (
        cd "$ROOT_DIR"
        git diff --check
    )
fi

if (( RUN_SMOKE )); then
    require_command curl
    require_command lsof
    require_command python3

    log "检查本地端口监听 ..."
    lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null
    lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null
    lsof -nP -iTCP:8000 -sTCP:LISTEN >/dev/null

    log "检查 frontend / backend / solver 健康状态 ..."
    frontend_root_html="$(curl -fsS http://127.0.0.1:8080/)"
    grep -Eq '<div id="root"></div>|/src/main\.tsx|APS高级排程工作台|APS Control Deck|/app\.js' <<<"$frontend_root_html"
    curl -fsS -I http://127.0.0.1:8081/app.js >/dev/null
    curl -fsS http://127.0.0.1:8081/actuator/health >/dev/null
    curl -fsS http://127.0.0.1:8000/health >/dev/null

    log "运行认证、样例排程、导入导出、物料平衡、版本治理 smoke ..."
    (
        cd "$ROOT_DIR"
        python3 scripts/release_smoke.py
    )

    log "运行 Snow Beer 第三期主链路 UAT sample package 导入批次到排程 smoke ..."
    (
        cd "$ROOT_DIR"
        python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_main_chain_phase3
    )

    log "smoke 汇总已写入 .runtime/release-smoke-summary.json"
    log "UAT package smoke 汇总已写入 .runtime/uat-package-smoke-summary.json"
fi

log "发布回归完成"
