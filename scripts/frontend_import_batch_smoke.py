#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import select
import shutil
import subprocess
import tempfile
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from websockets.sync.client import connect

ROOT_DIR = Path(__file__).resolve().parents[1]
RUNTIME_DIR = ROOT_DIR / ".runtime"
SUMMARY_PATH = RUNTIME_DIR / "frontend-import-batch-smoke-summary.json"
SCREENSHOT_DIR = RUNTIME_DIR / "frontend-import-batch-smoke"
PACKAGE_DIR = ROOT_DIR / "docs" / "sample-packages" / "UAT_v1_sample_package"

FRONTEND_BASE_URL = os.environ.get("APS_FRONTEND_BASE_URL", "http://127.0.0.1:8080/")
DEFAULT_USERNAME = os.environ.get("APS_SMOKE_USERNAME", "admin")
DEFAULT_PASSWORD = os.environ.get("APS_SMOKE_PASSWORD", "admin123")
POLL_TIMEOUT_SECONDS = int(os.environ.get("APS_FRONTEND_SMOKE_TIMEOUT_SECONDS", "240"))
CHROME_BINARY = os.environ.get(
    "APS_CHROME_BINARY",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
)

IMPORT_FILE_NAMES = {
    "resources": "02_resources.csv",
    "recipes": "03_recipes.csv",
    "demands": "04_demands.csv",
    "inventory-balances": "14_inventory_balances.csv",
    "downtimes": "05_downtimes.csv",
    "setup-rules": "06_setup_rules.csv",
}

CSV_ENCODINGS: tuple[str, ...] = ("utf-8-sig", "utf-8", "gb18030", "gbk")


class FrontendSmokeError(RuntimeError):
    pass


@dataclass
class SessionContext:
    target_id: str
    session_id: str


def build_import_files(package_dir: Path) -> dict[str, Path]:
    return {
        kind: package_dir / filename
        for kind, filename in IMPORT_FILE_NAMES.items()
    }


class ChromeCdpClient:
    def __init__(self, chrome_binary: str, profile_dir: Path) -> None:
        if not Path(chrome_binary).exists():
            raise FrontendSmokeError(f"Chrome binary not found: {chrome_binary}")

        self.proc = subprocess.Popen(
            [
                chrome_binary,
                "--headless=new",
                "--disable-gpu",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-background-networking",
                "--disable-extensions",
                "--disable-sync",
                f"--user-data-dir={profile_dir}",
                "--remote-debugging-address=127.0.0.1",
                "--remote-debugging-port=0",
                "about:blank",
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        if self.proc.stderr is None:
            raise FrontendSmokeError("Failed to capture Chrome stderr")
        self._stderr = self.proc.stderr
        ws_url = self._read_devtools_ws_url(timeout=15.0)
        self._stderr_drain_thread = threading.Thread(target=self._drain_stderr, daemon=True)
        self._stderr_drain_thread.start()
        self._connection = connect(ws_url, open_timeout=10.0, close_timeout=1.0, max_size=None)
        self._next_id = 1
        self._pending_events: list[dict[str, Any]] = []

    def close(self) -> None:
        try:
            self._connection.close()
        except Exception:
            pass
        if self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.proc.kill()
                self.proc.wait(timeout=5)

    def send_command(
        self,
        method: str,
        params: dict[str, Any] | None = None,
        *,
        session_id: str | None = None,
        timeout: float = 10.0,
    ) -> dict[str, Any]:
        message_id = self._next_id
        self._next_id += 1

        payload: dict[str, Any] = {"id": message_id, "method": method}
        if params:
            payload["params"] = params
        if session_id:
            payload["sessionId"] = session_id

        self._connection.send(json.dumps(payload, separators=(",", ":")))

        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            message = self._read_message(deadline)
            if message.get("id") == message_id:
                if "error" in message:
                    raise FrontendSmokeError(
                        f"CDP command {method} failed: {json.dumps(message['error'], ensure_ascii=False)}"
                    )
                return message.get("result", {})
            self._pending_events.append(message)

        raise FrontendSmokeError(f"Timed out waiting for response to {method}")

    def wait_for_event(
        self,
        method: str,
        *,
        session_id: str | None = None,
        timeout: float = 10.0,
    ) -> dict[str, Any]:
        deadline = time.monotonic() + timeout
        while True:
            for index, event in enumerate(self._pending_events):
                if event.get("method") != method:
                    continue
                if session_id and event.get("sessionId") != session_id:
                    continue
                return self._pending_events.pop(index)

            if time.monotonic() >= deadline:
                raise FrontendSmokeError(f"Timed out waiting for event {method}")

            event = self._read_message(deadline)
            if event.get("method") == method and (not session_id or event.get("sessionId") == session_id):
                return event
            self._pending_events.append(event)

    def evaluate(
        self,
        expression: str,
        *,
        session_id: str,
        await_promise: bool = True,
        return_by_value: bool = True,
        timeout: float = 10.0,
    ) -> Any:
        result = self.send_command(
            "Runtime.evaluate",
            {
                "expression": expression,
                "awaitPromise": await_promise,
                "returnByValue": return_by_value,
            },
            session_id=session_id,
            timeout=timeout,
        )
        value = result.get("result", {})
        if value.get("subtype") == "error":
            raise FrontendSmokeError(f"Runtime evaluate error: {value}")
        if "exceptionDetails" in result:
            raise FrontendSmokeError(f"Runtime evaluate exception: {result['exceptionDetails']}")
        return value.get("value")

    def capture_screenshot(self, path: Path, *, session_id: str, timeout: float = 10.0) -> None:
        result = self.send_command(
            "Page.captureScreenshot",
            {"format": "png", "captureBeyondViewport": True},
            session_id=session_id,
            timeout=timeout,
        )
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(result["data"]))

    def set_file_input_files(
        self,
        selector: str,
        files: list[str],
        *,
        session_id: str,
        timeout: float = 10.0,
    ) -> None:
        root = self.send_command("DOM.getDocument", {"depth": 1}, session_id=session_id, timeout=timeout)
        node_id = self.send_command(
            "DOM.querySelector",
            {"nodeId": root["root"]["nodeId"], "selector": selector},
            session_id=session_id,
            timeout=timeout,
        ).get("nodeId")
        if not node_id:
            raise FrontendSmokeError(f"Could not find file input {selector}")
        self.send_command(
            "DOM.setFileInputFiles",
            {"nodeId": node_id, "files": files},
            session_id=session_id,
            timeout=timeout,
        )

    def _read_message(self, deadline: float) -> dict[str, Any]:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise FrontendSmokeError("Timed out waiting for Chrome DevTools data")
        try:
            payload = self._connection.recv(timeout=remaining)
        except TimeoutError as exc:
            raise FrontendSmokeError("Timed out waiting for Chrome DevTools data") from exc
        except Exception as exc:
            raise FrontendSmokeError(f"Chrome DevTools websocket closed unexpectedly: {exc}") from exc

        if isinstance(payload, bytes):
            payload = payload.decode("utf-8")
        return json.loads(payload)

    def _read_devtools_ws_url(self, timeout: float) -> str:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            remaining = deadline - time.monotonic()
            ready, _, _ = select.select([self._stderr], [], [], remaining)
            if not ready:
                continue
            line = self._stderr.readline()
            if not line:
                break
            marker = "DevTools listening on "
            if marker in line:
                return line.split(marker, 1)[1].strip()
        raise FrontendSmokeError("Timed out waiting for Chrome DevTools websocket URL")

    def _drain_stderr(self) -> None:
        while True:
            line = self._stderr.readline()
            if not line:
                return


def parse_request_context(path: Path) -> dict[str, str]:
    last_error: UnicodeDecodeError | None = None
    for encoding in CSV_ENCODINGS:
        try:
            with path.open("r", encoding=encoding) as handle:
                reader = csv.DictReader(handle)
                return {row["field"]: row["value"] for row in reader if row.get("field")}
        except UnicodeDecodeError as exc:
            last_error = exc
    raise FrontendSmokeError(
        f"Failed to decode request context {path} with supported encodings {CSV_ENCODINGS}: {last_error}"
    )


def build_datetime_local(value: str) -> str:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.strftime("%Y-%m-%dT%H:%M")


def wait_for_condition(
    client: ChromeCdpClient,
    expression: str,
    *,
    session_id: str,
    timeout: float,
    interval: float = 0.5,
    description: str,
) -> Any:
    deadline = time.monotonic() + timeout
    last_value: Any = None
    while time.monotonic() < deadline:
        last_value = client.evaluate(expression, session_id=session_id, timeout=min(10.0, timeout))
        if last_value:
            return last_value
        time.sleep(interval)
    raise FrontendSmokeError(f"Timed out waiting for {description}; last value: {last_value!r}")


def create_browser_session(client: ChromeCdpClient) -> SessionContext:
    target_id = client.send_command("Target.createTarget", {"url": "about:blank"}, timeout=10.0)["targetId"]
    attached = client.send_command(
        "Target.attachToTarget",
        {"targetId": target_id, "flatten": True},
        timeout=10.0,
    )
    session_id = attached["sessionId"]

    client.send_command("Page.enable", session_id=session_id, timeout=10.0)
    client.send_command("Runtime.enable", session_id=session_id, timeout=10.0)
    client.send_command("DOM.enable", session_id=session_id, timeout=10.0)
    client.send_command("Network.enable", session_id=session_id, timeout=10.0)
    client.send_command(
        "Emulation.setDeviceMetricsOverride",
        {"width": 1440, "height": 2200, "deviceScaleFactor": 1, "mobile": False},
        session_id=session_id,
        timeout=10.0,
    )
    return SessionContext(target_id=target_id, session_id=session_id)


def navigate_to_frontend(client: ChromeCdpClient, session: SessionContext) -> None:
    client.send_command(
        "Page.navigate",
        {"url": FRONTEND_BASE_URL},
        session_id=session.session_id,
        timeout=10.0,
    )
    client.wait_for_event("Page.loadEventFired", session_id=session.session_id, timeout=15.0)
    wait_for_condition(
        client,
        "document.readyState === 'complete' && Boolean(document.getElementById('login-form'))",
        session_id=session.session_id,
        timeout=15.0,
        description="login page ready",
    )


def login(client: ChromeCdpClient, session: SessionContext, username: str, password: str) -> dict[str, Any]:
    username_json = json.dumps(username, ensure_ascii=False)
    password_json = json.dumps(password, ensure_ascii=False)
    client.evaluate(
        f"""
(() => {{
  const setValue = (id, value) => {{
    const element = document.getElementById(id);
    element.value = value;
    element.dispatchEvent(new Event('input', {{ bubbles: true }}));
    element.dispatchEvent(new Event('change', {{ bubbles: true }}));
  }};
  setValue('username-input', {username_json});
  setValue('password-input', {password_json});
  document.getElementById('login-form').requestSubmit();
  return true;
}})()
""",
        session_id=session.session_id,
        timeout=10.0,
    )

    wait_for_condition(
        client,
        """
(() => {
  const appShell = document.getElementById('app-shell');
  const sessionUser = document.getElementById('session-user');
  return appShell && !appShell.classList.contains('hidden') && sessionUser && sessionUser.textContent.trim();
})()
""",
        session_id=session.session_id,
        timeout=POLL_TIMEOUT_SECONDS,
        description="frontend login success",
    )

    return client.evaluate(
        """
(() => ({
  currentUser: document.getElementById('session-user')?.textContent?.trim() || '',
  totalVersions: document.getElementById('summary-total-versions')?.textContent?.trim() || '',
  lastRefresh: document.getElementById('summary-last-refresh')?.textContent?.trim() || ''
}))()
""",
        session_id=session.session_id,
        timeout=10.0,
    )


def open_model_dialog(client: ChromeCdpClient, session: SessionContext) -> None:
    client.evaluate(
        """
(() => {
  document.getElementById('versions-open-model-button').click();
  return true;
})()
""",
        session_id=session.session_id,
        timeout=10.0,
    )
    wait_for_condition(
        client,
        """
(() => {
  const overlay = document.getElementById('model-overlay');
  return overlay && !overlay.classList.contains('hidden');
})()
""",
        session_id=session.session_id,
        timeout=10.0,
        description="model dialog open",
    )


def fill_model_form(client: ChromeCdpClient, session: SessionContext, context: dict[str, str]) -> dict[str, str]:
    scenario_name = f"{context['scenarioName']}-ui-smoke-{uuid.uuid4().hex[:8]}"
    data_version = f"{context['dataVersion']}_ui_smoke_{uuid.uuid4().hex[:8]}"
    schedule_start_local = build_datetime_local(context["scheduleStartAt"])
    form_values = {
        "scenarioName": scenario_name,
        "dataVersion": data_version,
        "scheduleStart": schedule_start_local,
        "horizonMinutes": context["horizonMinutes"],
        "tardinessWeight": context["objectiveWeights.tardiness"],
        "earlinessWeight": context.get("objectiveWeights.earliness", "0"),
        "makespanWeight": context["objectiveWeights.makespan"],
        "timeLimitSeconds": context["solverConfig.timeLimitSeconds"],
        "numSearchWorkers": context["solverConfig.numSearchWorkers"],
    }

    client.evaluate(
        f"""
(() => {{
  const values = {json.dumps(form_values, ensure_ascii=False)};
  const pairs = [
    ['model-scenario-name-input', values.scenarioName],
    ['model-data-version-input', values.dataVersion],
    ['model-schedule-start-input', values.scheduleStart],
    ['model-horizon-input', values.horizonMinutes],
    ['model-tardiness-input', values.tardinessWeight],
    ['model-earliness-input', values.earlinessWeight],
    ['model-makespan-input', values.makespanWeight],
    ['model-time-limit-input', values.timeLimitSeconds],
    ['model-workers-input', values.numSearchWorkers],
  ];
  for (const [id, value] of pairs) {{
    const element = document.getElementById(id);
    element.value = value;
    element.dispatchEvent(new Event('input', {{ bubbles: true }}));
    element.dispatchEvent(new Event('change', {{ bubbles: true }}));
  }}
  return values;
}})()
""",
        session_id=session.session_id,
        timeout=10.0,
    )
    return form_values


def upload_import_batch(
    client: ChromeCdpClient,
    session: SessionContext,
    kind: str,
    file_path: Path,
) -> dict[str, Any]:
    selector = f"#model-batch-{kind}-input"
    client.set_file_input_files(selector, [str(file_path)], session_id=session.session_id, timeout=10.0)

    return wait_for_condition(
        client,
        f"""
(() => {{
  const text = document.getElementById('model-batch-{kind}-status')?.textContent?.trim() || '';
  if (!text || text.includes('No import batch uploaded yet.') || text.includes('当前还没有导入批次。')) {{
    return null;
  }}
  return {{
    text,
    feedback: document.getElementById('model-feedback')?.textContent?.trim() || '',
  }};
}})()
""",
        session_id=session.session_id,
        timeout=POLL_TIMEOUT_SECONDS,
        description=f"{kind} import result",
    )


def collect_import_statuses(client: ChromeCdpClient, session: SessionContext) -> dict[str, dict[str, Any]]:
    return client.evaluate(
        """
(() => {
  const keys = ['resources', 'recipes', 'demands', 'inventory-balances', 'downtimes', 'setup-rules'];
  const result = {};
  for (const key of keys) {
    result[key] = {
      statusText: document.getElementById(`model-batch-${key}-status`)?.textContent?.trim() || '',
      errorLink: document.getElementById(`model-batch-${key}-errors-link`)?.getAttribute('href') || '',
    };
  }
  result.modelFeedback = document.getElementById('model-feedback')?.textContent?.trim() || '';
  return result;
})()
""",
        session_id=session.session_id,
        timeout=10.0,
    )


def submit_schedule(client: ChromeCdpClient, session: SessionContext) -> dict[str, Any]:
    client.evaluate(
        """
(() => {
  document.getElementById('model-submit-button').click();
  return true;
})()
""",
        session_id=session.session_id,
        timeout=10.0,
    )

    wait_for_condition(
        client,
        """
(() => {
  const title = document.getElementById('job-status-text')?.textContent?.trim() || '';
  return ['已受理', 'Job Accepted', '运行中', 'Running', '求解完成', 'Solve Completed'].includes(title);
})()
""",
        session_id=session.session_id,
        timeout=20.0,
        description="job accepted",
    )

    return wait_for_condition(
        client,
        """
(() => {
  const title = document.getElementById('job-status-text')?.textContent?.trim() || '';
  if (title !== '求解完成' && title !== 'Solve Completed') {
    return null;
  }
  return {
    title,
    detail: document.getElementById('job-status-detail')?.textContent?.trim() || '',
    viewerTitle: document.getElementById('viewer-title')?.textContent?.trim() || '',
    viewerSubtitle: document.getElementById('viewer-subtitle')?.textContent?.trim() || '',
    totalVersions: document.getElementById('summary-total-versions')?.textContent?.trim() || '',
    selectedStatus: document.getElementById('summary-selected-status')?.textContent?.trim() || '',
  };
})()
""",
        session_id=session.session_id,
        timeout=POLL_TIMEOUT_SECONDS,
        interval=1.0,
        description="job completion",
    )


def verify_draft_bulk_selection(client: ChromeCdpClient, session: SessionContext) -> dict[str, Any]:
    wait_for_condition(
        client,
        """
(() => document.querySelectorAll('.version-list-item.has-selector .version-item-checkbox').length > 0
  && Boolean(document.getElementById('select-all-draft-versions-button')))()
""",
        session_id=session.session_id,
        timeout=20.0,
        description="draft bulk-select controls",
    )

    client.evaluate(
        """
(() => {
  document.getElementById('select-all-draft-versions-button').click();
  return true;
})()
""",
        session_id=session.session_id,
        timeout=10.0,
    )

    selected_state = wait_for_condition(
        client,
        """
(() => {
  const draftCheckboxes = Array.from(document.querySelectorAll('.version-list-item.has-selector .version-item-checkbox'));
  const selectedCount = draftCheckboxes.filter((checkbox) => checkbox.checked).length;
  if (!draftCheckboxes.length || selectedCount !== draftCheckboxes.length) {
    return null;
  }
  return {
    draftCount: draftCheckboxes.length,
    selectedCount,
    selectAllLabel: document.getElementById('select-all-draft-versions-button')?.textContent?.trim() || '',
    deleteLabel: document.getElementById('delete-draft-versions-button')?.textContent?.trim() || '',
  };
})()
""",
        session_id=session.session_id,
        timeout=10.0,
        description="all draft versions selected",
    )

    client.evaluate(
        """
(() => {
  document.getElementById('select-all-draft-versions-button').click();
  return true;
})()
""",
        session_id=session.session_id,
        timeout=10.0,
    )

    cleared_state = wait_for_condition(
        client,
        """
(() => {
  const draftCheckboxes = Array.from(document.querySelectorAll('.version-list-item.has-selector .version-item-checkbox'));
  const selectedCount = draftCheckboxes.filter((checkbox) => checkbox.checked).length;
  if (selectedCount !== 0) {
    return null;
  }
  return {
    draftCount: draftCheckboxes.length,
    selectedCount,
    selectAllLabel: document.getElementById('select-all-draft-versions-button')?.textContent?.trim() || '',
    deleteLabel: document.getElementById('delete-draft-versions-button')?.textContent?.trim() || '',
  };
})()
""",
        session_id=session.session_id,
        timeout=10.0,
        description="draft bulk selection cleared",
    )

    return {
        "afterSelectAll": selected_state,
        "afterClear": cleared_state,
    }


def run_smoke(
    *,
    package_dir: Path,
    summary_path: Path,
    screenshot_dir: Path,
    username: str,
    password: str,
) -> dict[str, Any]:
    package_dir = package_dir.resolve()
    summary_path = summary_path.resolve()
    screenshot_dir = screenshot_dir.resolve()
    request_context = parse_request_context(package_dir / "01_request_context.csv")
    import_files = build_import_files(package_dir)
    for required_file in import_files.values():
        if not required_file.exists():
            raise FrontendSmokeError(f"Missing import file: {required_file}")

    screenshot_dir.mkdir(parents=True, exist_ok=True)
    summary_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="aps-ui-smoke-chrome-") as profile_dir:
        client = ChromeCdpClient(CHROME_BINARY, Path(profile_dir))
        try:
            session = create_browser_session(client)
            navigate_to_frontend(client, session)
            client.capture_screenshot(screenshot_dir / "01_login.png", session_id=session.session_id)

            login_info = login(client, session, username, password)
            client.capture_screenshot(screenshot_dir / "02_logged_in.png", session_id=session.session_id)

            open_model_dialog(client, session)
            form_values = fill_model_form(client, session, request_context)
            client.capture_screenshot(screenshot_dir / "03_model_dialog.png", session_id=session.session_id)

            import_results: dict[str, Any] = {}
            for kind, file_path in import_files.items():
                import_results[kind] = upload_import_batch(client, session, kind, file_path)
            import_statuses = collect_import_statuses(client, session)
            client.capture_screenshot(screenshot_dir / "04_imported_batches.png", session_id=session.session_id)

            submit_result = submit_schedule(client, session)
            client.capture_screenshot(screenshot_dir / "05_submit_done.png", session_id=session.session_id)
            draft_bulk_selection = verify_draft_bulk_selection(client, session)
            client.capture_screenshot(screenshot_dir / "06_draft_bulk_selection.png", session_id=session.session_id)

            summary = {
                "frontendUrl": FRONTEND_BASE_URL,
                "packageDir": str(package_dir),
                "username": username,
                "login": login_info,
                "formValues": form_values,
                "importResults": import_results,
                "importStatuses": import_statuses,
                "submitResult": submit_result,
                "draftBulkSelection": draft_bulk_selection,
                "screenshots": {
                    "login": str((screenshot_dir / "01_login.png").relative_to(ROOT_DIR)),
                    "loggedIn": str((screenshot_dir / "02_logged_in.png").relative_to(ROOT_DIR)),
                    "modelDialog": str((screenshot_dir / "03_model_dialog.png").relative_to(ROOT_DIR)),
                    "importedBatches": str((screenshot_dir / "04_imported_batches.png").relative_to(ROOT_DIR)),
                    "submitDone": str((screenshot_dir / "05_submit_done.png").relative_to(ROOT_DIR)),
                    "draftBulkSelection": str((screenshot_dir / "06_draft_bulk_selection.png").relative_to(ROOT_DIR)),
                },
            }
            summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
            return summary
        finally:
            client.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the frontend formal import-batch -> schedule UI smoke in headless Chrome."
    )
    parser.add_argument(
        "--package-dir",
        type=Path,
        default=PACKAGE_DIR,
        help="Path to the sample package used for frontend import-batch smoke",
    )
    parser.add_argument("--summary-path", type=Path, default=SUMMARY_PATH)
    parser.add_argument("--screenshot-dir", type=Path, default=SCREENSHOT_DIR)
    parser.add_argument("--username", default=DEFAULT_USERNAME)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument(
        "--clean-output",
        action="store_true",
        help="Remove any existing screenshot output directory before running.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.clean_output and args.screenshot_dir.exists():
        shutil.rmtree(args.screenshot_dir)

    try:
        summary = run_smoke(
            package_dir=args.package_dir.resolve(),
            summary_path=args.summary_path,
            screenshot_dir=args.screenshot_dir,
            username=args.username,
            password=args.password,
        )
    except FrontendSmokeError as exc:
        print(f"[frontend-import-batch-smoke] ERROR: {exc}")
        return 1

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
