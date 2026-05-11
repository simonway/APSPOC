#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import time
import uuid
from http.cookiejar import CookieJar
from pathlib import Path
from typing import Any
from urllib import error, request
from urllib.request import HTTPCookieProcessor, build_opener

ROOT_DIR = Path(__file__).resolve().parents[1]
RUNTIME_DIR = ROOT_DIR / ".runtime"
SUMMARY_PATH = RUNTIME_DIR / "release-smoke-summary.json"

BACKEND_BASE_URL = os.environ.get("APS_BACKEND_BASE_URL", "http://127.0.0.1:8081")
DEFAULT_USERNAME = os.environ.get("APS_SMOKE_USERNAME", "admin")
DEFAULT_PASSWORD = os.environ.get("APS_SMOKE_PASSWORD", "admin123")
PLANNER_USERNAME = os.environ.get("APS_SMOKE_PLANNER_USERNAME", "planner")
PLANNER_PASSWORD = os.environ.get("APS_SMOKE_PLANNER_PASSWORD", "planner123")
APPROVER_USERNAME = os.environ.get("APS_SMOKE_APPROVER_USERNAME", "approver")
APPROVER_PASSWORD = os.environ.get("APS_SMOKE_APPROVER_PASSWORD", "approver123")
VIEWER_USERNAME = os.environ.get("APS_SMOKE_VIEWER_USERNAME", "viewer")
VIEWER_PASSWORD = os.environ.get("APS_SMOKE_VIEWER_PASSWORD", "viewer123")
POLL_TIMEOUT_SECONDS = int(os.environ.get("APS_SMOKE_POLL_TIMEOUT_SECONDS", "60"))
JOB_SUCCESS_STATUSES = {"DONE", "SUCCEEDED"}
JOB_FAILURE_STATUSES = {"FAILED", "TIMEOUT", "CANCELLED"}
JOB_TERMINAL_STATUSES = JOB_SUCCESS_STATUSES | JOB_FAILURE_STATUSES


class SmokeError(RuntimeError):
    pass


class BackendSmokeClient:
    def __init__(self, base_url: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.cookie_jar = CookieJar()
        self.opener = build_opener(HTTPCookieProcessor(self.cookie_jar))

    def request_json(
        self,
        path: str,
        *,
        method: str = "GET",
        body: dict[str, Any] | None = None,
    ) -> tuple[int, Any, dict[str, str]]:
        data = None
        headers: dict[str, str] = {}
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        return self._request(path, method=method, data=data, headers=headers)

    def request_bytes(
        self,
        path: str,
        *,
        method: str = "GET",
        data: bytes | None = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[int, bytes, dict[str, str]]:
        return self._request(path, method=method, data=data, headers=headers or {})

    def upload_csv(self, path: str, filename: str, content: str) -> tuple[int, Any, dict[str, str]]:
        boundary = "----APSBoundary" + uuid.uuid4().hex
        body = bytearray()
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8")
        )
        body.extend(b"Content-Type: text/csv\r\n\r\n")
        body.extend(content.encode("utf-8"))
        body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))
        return self._request(
            path,
            method="POST",
            data=bytes(body),
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )

    def _request(
        self,
        path: str,
        *,
        method: str,
        data: bytes | None,
        headers: dict[str, str],
    ) -> tuple[int, Any, dict[str, str]]:
        req = request.Request(self.base_url + path, data=data, headers=headers, method=method)
        try:
            with self.opener.open(req, timeout=20) as response:
                payload = response.read()
                content_type = response.headers.get("Content-Type", "")
                parsed = decode_payload(payload, content_type)
                return response.status, parsed, dict(response.headers)
        except error.HTTPError as exc:
            payload = exc.read().decode("utf-8", errors="replace")
            raise SmokeError(
                f"{method} {path} failed with HTTP {exc.code}: {payload.strip() or exc.reason}"
            ) from exc
        except error.URLError as exc:
            raise SmokeError(f"{method} {path} failed: {exc.reason}") from exc


def decode_payload(payload: bytes, content_type: str) -> Any:
    if not payload:
        return None
    if "application/json" in content_type:
        return json.loads(payload.decode("utf-8"))
    return payload


def ensure_status(actual: int, expected: int, context: str) -> None:
    if actual != expected:
        raise SmokeError(f"{context}: expected HTTP {expected}, got {actual}")


def first_version_by_status(versions: list[dict[str, Any]], status: str) -> dict[str, Any] | None:
    return next((version for version in versions if version.get("status") == status), None)


def login(client: BackendSmokeClient, username: str, password: str, context: str) -> dict[str, Any]:
    status, payload, _ = client.request_json(
        "/api/v1/auth/login",
        method="POST",
        body={"username": username, "password": password},
    )
    ensure_status(status, 200, context)
    if not isinstance(payload, dict):
        raise SmokeError(f"{context}: invalid response body")
    return payload


def get_session(client: BackendSmokeClient, context: str) -> dict[str, Any]:
    status, payload, _ = client.request_json("/api/v1/auth/session")
    ensure_status(status, 200, context)
    if not isinstance(payload, dict):
        raise SmokeError(f"{context}: invalid response body")
    return payload


def build_import_payloads() -> dict[str, str]:
    return {
        "resources": "id,label,resourceType,sortOrder\nreactor_01,Reactor-01,REACTOR,1\n",
        "tasks": (
            "id,label,productCode,durationMinutes,dueMinutes,priority,candidateResourceIds,pinnedResourceId,pinnedStartMinutes\n"
            "batch_a,Batch A,PA-101,480,960,5,\"reactor_01,reactor_02\",reactor_01,120\n"
        ),
        "downtimes": (
            "id,resourceId,startMinutes,endMinutes,downtimeType,source,description\n"
            "maintenance_a,reactor_01,240,420,MAINTENANCE,CALENDAR,Window\n"
        ),
    }


def build_material_flow_payloads() -> dict[str, str]:
    return {
        "resources": "id,label,resourceType,sortOrder\nreactor_r01,Reactor-R01,REACTOR,1\n",
        "recipes": (
            "recipeId,productCode,operationCode,operationName,sequence,durationMinutes,"
            "candidateResourceIds,materialInputs,materialOutputs,setupGroup\n"
            "rcp_fg100_v1,FG-100,REACT,Reaction Stage,1,60,reactor_r01,RM-100:1,FG-100:1,REACT_A\n"
        ),
        "demands": "demandId,productCode,quantity,dueMinutes,priority\nord_fg100_001,FG-100,1,180,5\n",
        "inventory-balances": "itemCode,availableQuantity,availableFromMinutes,safetyStockQuantity\nRM-100,1,0,0\n",
    }


def poll_job(client: BackendSmokeClient, job_id: str, context: str = "poll schedule job") -> dict[str, Any]:
    deadline = time.time() + POLL_TIMEOUT_SECONDS
    last_job: dict[str, Any] | None = None
    while time.time() < deadline:
        status, payload, _ = client.request_json(f"/api/v1/schedule/jobs/{job_id}")
        ensure_status(status, 200, context)
        if not isinstance(payload, dict):
            raise SmokeError(f"{context}: invalid response body")
        last_job = payload
        if payload.get("status") in JOB_TERMINAL_STATUSES:
            return payload
        time.sleep(1)
    raise SmokeError(f"{context}: job {job_id} did not finish within {POLL_TIMEOUT_SECONDS} seconds: {last_job}")


def run_material_flow_smoke(client: BackendSmokeClient) -> dict[str, Any]:
    run_id = uuid.uuid4().hex[:8]
    feasible_data_version = f"smoke_material_feasible_{run_id}"
    infeasible_data_version = f"smoke_material_infeasible_{run_id}"
    payloads = build_material_flow_payloads()

    def import_bundle(data_version: str, *, include_inventory: bool) -> dict[str, Any]:
        imported: dict[str, Any] = {}
        for name in ("resources", "recipes", "demands"):
            status, payload, _ = client.upload_csv(
                f"/api/v1/model-import/{name}?dataVersion={data_version}",
                f"{name}.csv",
                payloads[name],
            )
            ensure_status(status, 200, f"material-flow import {name}")
            imported[name] = payload
        if include_inventory:
            status, payload, _ = client.upload_csv(
                f"/api/v1/model-import/inventory-balances?dataVersion={data_version}",
                "inventory-balances.csv",
                payloads["inventory-balances"],
            )
            ensure_status(status, 200, "material-flow import inventory-balances")
            imported["inventory-balances"] = payload
        return imported

    feasible_imports = import_bundle(feasible_data_version, include_inventory=True)
    import_bundle(infeasible_data_version, include_inventory=False)

    def generate_scenario(data_version: str, scenario_name: str) -> dict[str, Any]:
        status, payload, _ = client.request_json(
            "/api/v1/schedule/scenarios/from-import-batches",
            method="POST",
            body={
                "scenarioName": scenario_name,
                "dataVersion": data_version,
                "scheduleStartAt": "2026-05-05T08:00:00Z",
                "horizonMinutes": 480,
                "objectiveWeights": {"tardiness": 100, "makespan": 1},
                "solverConfig": {"timeLimitSeconds": 10, "numSearchWorkers": 1},
            },
        )
        ensure_status(status, 200, "material-flow scenario generation")
        if not isinstance(payload, dict):
            raise SmokeError("material-flow scenario generation: invalid response body")
        return payload

    def get_scenario(scenario_id: str) -> dict[str, Any]:
        status, payload, _ = client.request_json(f"/api/v1/schedule/scenarios/{scenario_id}")
        ensure_status(status, 200, "material-flow get scenario detail")
        if not isinstance(payload, dict):
            raise SmokeError("material-flow get scenario detail: invalid response body")
        return payload

    feasible_scenario = generate_scenario(feasible_data_version, f"material-feasible-{run_id}")
    feasible_scenario_detail = get_scenario(feasible_scenario["scenario"]["scenarioId"])
    feasible_schedule_request = feasible_scenario["scenario"]["scheduleRequest"]
    status, payload, _ = client.request_json(
        "/api/v1/schedule/jobs",
        method="POST",
        body=feasible_schedule_request,
    )
    ensure_status(status, 202, "submit feasible material-flow schedule job")
    feasible_job = poll_job(client, payload["jobId"], "poll feasible material-flow job")
    if feasible_job.get("status") not in JOB_SUCCESS_STATUSES:
        raise SmokeError(f"feasible material-flow job ended unexpectedly: {feasible_job}")
    if feasible_job.get("solverStatus") not in {"OPTIMAL", "FEASIBLE"}:
        raise SmokeError(f"feasible material-flow job returned unexpected solverStatus: {feasible_job}")

    infeasible_scenario = generate_scenario(infeasible_data_version, f"material-infeasible-{run_id}")
    status, payload, _ = client.request_json(
        "/api/v1/schedule/jobs",
        method="POST",
        body=infeasible_scenario["scenario"]["scheduleRequest"],
    )
    ensure_status(status, 202, "submit infeasible material-flow schedule job")
    failed_job_id = payload["jobId"]
    infeasible_job = poll_job(client, failed_job_id, "poll infeasible material-flow job")
    if infeasible_job.get("status") != "FAILED":
        raise SmokeError(f"infeasible material-flow job ended unexpectedly: {infeasible_job}")
    if "INFEASIBLE" not in str(infeasible_job.get("errorMessage")):
        raise SmokeError(f"infeasible material-flow job did not surface INFEASIBLE: {infeasible_job}")

    status, payload, _ = client.request_json(
        f"/api/v1/schedule/jobs/{failed_job_id}/retry",
        method="POST",
    )
    ensure_status(status, 202, "retry infeasible material-flow schedule job")
    if not isinstance(payload, dict) or "jobId" not in payload:
        raise SmokeError("retry infeasible material-flow schedule job: invalid response body")
    retried_job = poll_job(client, payload["jobId"], "poll retried infeasible material-flow job")
    if retried_job.get("status") != "FAILED":
        raise SmokeError(f"retried infeasible material-flow job ended unexpectedly: {retried_job}")

    return {
        "runId": run_id,
        "feasibleDataVersion": feasible_data_version,
        "infeasibleDataVersion": infeasible_data_version,
        "recipeImport": feasible_imports["recipes"],
        "feasibleScenario": {
            "scenarioId": feasible_scenario["scenario"]["scenarioId"],
            "operationCount": feasible_scenario["scenario"]["operationCount"],
            "persistedOperationCount": feasible_scenario_detail.get("operationCount"),
            "taskMaterialInputs": feasible_schedule_request["tasks"][0].get("materialInputs"),
            "taskMaterialOutputs": feasible_schedule_request["tasks"][0].get("materialOutputs"),
            "inventoryDemands": feasible_schedule_request.get("inventoryDemands"),
            "jobStatus": feasible_job.get("status"),
            "solverStatus": feasible_job.get("solverStatus"),
            "versionId": feasible_job.get("versionId"),
        },
        "infeasibleScenario": {
            "jobStatus": infeasible_job.get("status"),
            "solverStatus": infeasible_job.get("solverStatus"),
            "errorMessage": infeasible_job.get("errorMessage"),
        },
        "retryScenario": {
            "jobStatus": retried_job.get("status"),
            "solverStatus": retried_job.get("solverStatus"),
            "errorMessage": retried_job.get("errorMessage"),
        },
    }


def main() -> int:
    admin_client = BackendSmokeClient(BACKEND_BASE_URL)
    planner_client = BackendSmokeClient(BACKEND_BASE_URL)
    approver_client = BackendSmokeClient(BACKEND_BASE_URL)
    viewer_client = BackendSmokeClient(BACKEND_BASE_URL)
    summary: dict[str, Any] = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "backendBaseUrl": BACKEND_BASE_URL,
        "username": DEFAULT_USERNAME,
    }

    summary["logins"] = {
        "admin": login(admin_client, DEFAULT_USERNAME, DEFAULT_PASSWORD, "admin login"),
        "planner": login(planner_client, PLANNER_USERNAME, PLANNER_PASSWORD, "planner login"),
        "approver": login(approver_client, APPROVER_USERNAME, APPROVER_PASSWORD, "approver login"),
        "viewer": login(viewer_client, VIEWER_USERNAME, VIEWER_PASSWORD, "viewer login"),
    }
    summary["sessions"] = {
        "admin": get_session(admin_client, "admin session"),
        "planner": get_session(planner_client, "planner session"),
        "approver": get_session(approver_client, "approver session"),
        "viewer": get_session(viewer_client, "viewer session"),
    }

    status, payload, _ = admin_client.request_json("/api/v1/versions")
    ensure_status(status, 200, "list versions before sample")
    if not isinstance(payload, list):
        raise SmokeError("versions before sample: invalid response body")
    versions_before = payload
    released_before = first_version_by_status(versions_before, "RELEASED")
    summary["versionsBefore"] = len(versions_before)
    summary["releasedBefore"] = None if released_before is None else released_before["versionId"]

    status, payload, _ = planner_client.request_json("/api/v1/schedule/jobs/sample", method="POST")
    ensure_status(status, 202, "submit sample job")
    if not isinstance(payload, dict) or "jobId" not in payload:
        raise SmokeError("sample job submission: invalid response body")
    summary["sampleSubmission"] = payload

    final_job = poll_job(planner_client, payload["jobId"])
    if final_job.get("status") not in JOB_SUCCESS_STATUSES:
        raise SmokeError(f"sample job ended with unexpected status: {final_job}")
    summary["sampleJobFinal"] = final_job

    status, payload, _ = admin_client.request_json("/api/v1/versions")
    ensure_status(status, 200, "list versions after sample")
    if not isinstance(payload, list):
        raise SmokeError("versions after sample: invalid response body")
    versions_after = payload
    summary["versionsAfter"] = len(versions_after)

    new_version_id = final_job.get("versionId")
    if not new_version_id:
        raise SmokeError(f"sample job did not return a versionId: {final_job}")

    if len(versions_after) >= 2:
        latest = versions_after[0]["versionId"]
        base_version_id = versions_after[1]["versionId"]
        status, payload, _ = admin_client.request_json(
            f"/api/v1/versions/{latest}/diff?baseVersionId={base_version_id}"
        )
        ensure_status(status, 200, "version diff")
        summary["versionDiff"] = {
            "targetVersionId": latest,
            "baseVersionId": base_version_id,
            "changedTaskCount": payload["summary"]["changedTaskCount"],
            "addedTaskCount": payload["summary"]["addedTaskCount"],
            "removedTaskCount": payload["summary"]["removedTaskCount"],
        }

    status, payload, headers = admin_client.request_bytes("/api/v1/model-import/template")
    ensure_status(status, 200, "export import template")
    if not isinstance(payload, (bytes, bytearray)):
        raise SmokeError("template export: expected workbook bytes")
    summary["templateExport"] = {
        "contentType": headers.get("Content-Type"),
        "size": len(payload),
    }

    import_payloads = build_import_payloads()
    import_results: dict[str, Any] = {}
    for name, csv_content in import_payloads.items():
        status, payload, _ = admin_client.upload_csv(
            f"/api/v1/model-import/{name}",
            f"{name}.csv",
            csv_content,
        )
        ensure_status(status, 200, f"import {name}")
        expected_field = {
            "resources": "resources",
            "tasks": "tasks",
            "downtimes": "downtimes",
        }[name]
        import_results[name] = len(payload[expected_field])
    summary["importSmoke"] = import_results
    summary["materialFlowSmoke"] = run_material_flow_smoke(admin_client)

    status, payload, _ = planner_client.request_json(
        f"/api/v1/versions/{new_version_id}/release-note",
        method="PUT",
        body={"releaseNote": "Release closure smoke note"},
    )
    ensure_status(status, 200, "update release note")
    summary["releaseNoteSaved"] = payload.get("releaseNote")

    status, payload, _ = planner_client.request_json(
        f"/api/v1/versions/{new_version_id}/ready-for-release",
        method="POST",
        body={"comment": "Release smoke submit", "releaseNote": "Release closure smoke note"},
    )
    ensure_status(status, 200, "submit for release")
    summary["readyForRelease"] = payload.get("status")

    status, payload, _ = approver_client.request_json(
        f"/api/v1/versions/{new_version_id}/reject",
        method="POST",
        body={"comment": "Release smoke reject"},
    )
    ensure_status(status, 200, "reject version")
    summary["rejectedVersion"] = {
        "versionId": payload.get("versionId"),
        "status": payload.get("status"),
    }

    status, payload, _ = planner_client.request_json(
        f"/api/v1/versions/{new_version_id}/ready-for-release",
        method="POST",
        body={"comment": "Release smoke resubmit", "releaseNote": "Release closure smoke note"},
    )
    ensure_status(status, 200, "resubmit for release")
    summary["resubmittedForRelease"] = payload.get("status")

    status, payload, _ = approver_client.request_json(
        f"/api/v1/versions/{new_version_id}/approve",
        method="POST",
        body={"comment": "Release smoke approve"},
    )
    ensure_status(status, 200, "approve version")
    summary["approvedVersion"] = {
        "versionId": payload.get("versionId"),
        "status": payload.get("status"),
    }

    status, payload, _ = approver_client.request_json(
        f"/api/v1/versions/{new_version_id}/publish",
        method="POST",
        body={"comment": "Release smoke publish", "releaseNote": "Release closure smoke note"},
    )
    ensure_status(status, 200, "publish version")
    summary["publishedVersion"] = {
        "versionId": payload.get("versionId"),
        "status": payload.get("status"),
    }

    status, payload, _ = admin_client.request_json(f"/api/v1/versions/{new_version_id}/history")
    ensure_status(status, 200, "version history")
    summary["versionHistory"] = [item["eventType"] for item in payload[:5]]

    status, payload, _ = viewer_client.request_json("/api/v1/versions/audit-history")
    ensure_status(status, 200, "audit history")
    summary["auditHistoryCount"] = len(payload)

    if released_before is not None and released_before["versionId"] != new_version_id:
        status, payload, _ = approver_client.request_json(
            f"/api/v1/versions/{released_before['versionId']}/rollback",
            method="POST",
            body={"comment": "Release smoke rollback"},
        )
        ensure_status(status, 200, "rollback previous release")
        summary["rollback"] = {
            "targetVersionId": payload.get("versionId"),
            "status": payload.get("status"),
        }

    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SmokeError as exc:
        print(f"[release-smoke] ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
