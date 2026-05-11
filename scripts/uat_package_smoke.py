#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any

from release_smoke import BACKEND_BASE_URL
from release_smoke import DEFAULT_PASSWORD
from release_smoke import DEFAULT_USERNAME
from release_smoke import BackendSmokeClient
from release_smoke import JOB_SUCCESS_STATUSES
from release_smoke import JOB_TERMINAL_STATUSES
from release_smoke import SmokeError
from release_smoke import ensure_status

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_PACKAGE_DIR = ROOT_DIR / "docs" / "sample-packages" / "UAT_v1_sample_package"
DEFAULT_SUMMARY_PATH = ROOT_DIR / ".runtime" / "uat-package-smoke-summary.json"
DEFAULT_POLL_TIMEOUT_SECONDS = int(os.environ.get("APS_UAT_SMOKE_POLL_TIMEOUT_SECONDS", "180"))

IMPORT_SPECS: tuple[tuple[str, str, str], ...] = (
    ("resources", "02_resources.csv", "resources"),
    ("recipes", "03_recipes.csv", "recipes"),
    ("demands", "04_demands.csv", "demands"),
    ("downtimes", "05_downtimes.csv", "downtimes"),
    ("setup-rules", "06_setup_rules.csv", "setupRules"),
    ("inventory-balances", "14_inventory_balances.csv", "inventoryBalances"),
)

CSV_ENCODINGS: tuple[str, ...] = ("utf-8-sig", "utf-8", "gb18030", "gbk")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the UAT sample package import-batch -> scenario generation -> scheduling smoke."
    )
    parser.add_argument(
        "package_dir",
        nargs="?",
        default=str(DEFAULT_PACKAGE_DIR),
        help="Path to the UAT sample package directory",
    )
    parser.add_argument(
        "--summary-path",
        default=str(DEFAULT_SUMMARY_PATH),
        help="Path to the generated JSON summary",
    )
    parser.add_argument(
        "--poll-timeout-seconds",
        type=int,
        default=DEFAULT_POLL_TIMEOUT_SECONDS,
        help="How long to wait for the schedule job to finish",
    )
    parser.add_argument(
        "--time-limit-seconds",
        type=int,
        help="Override solverConfig.timeLimitSeconds from 01_request_context.csv",
    )
    parser.add_argument(
        "--num-search-workers",
        type=int,
        help="Override solverConfig.numSearchWorkers from 01_request_context.csv",
    )
    return parser.parse_args()


def read_text_with_fallback(path: Path) -> str:
    last_error: UnicodeDecodeError | None = None
    for encoding in CSV_ENCODINGS:
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError as exc:
            last_error = exc
    raise SmokeError(f"Failed to decode {path} with supported encodings: {CSV_ENCODINGS}: {last_error}")


def load_request_context(package_dir: Path) -> dict[str, str]:
    context_path = package_dir / "01_request_context.csv"
    reader = csv.DictReader(io.StringIO(read_text_with_fallback(context_path)))
    context: dict[str, str] = {}
    for row in reader:
        field = (row.get("field") or "").strip()
        value = (row.get("value") or "").strip()
        if field:
            context[field] = value
    required_fields = {
        "scenarioName",
        "dataVersion",
        "scheduleStartAt",
        "horizonMinutes",
        "objectiveWeights.tardiness",
        "objectiveWeights.makespan",
        "solverConfig.timeLimitSeconds",
        "solverConfig.numSearchWorkers",
    }
    missing_fields = sorted(field for field in required_fields if field not in context)
    if missing_fields:
        raise SmokeError("UAT request context is missing required fields: " + ", ".join(missing_fields))
    return context


def poll_job(
    client: BackendSmokeClient,
    job_id: str,
    *,
    timeout_seconds: int,
    context: str = "poll uat package schedule job",
) -> dict[str, Any]:
    deadline = time.time() + timeout_seconds
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
    raise SmokeError(f"{context}: job {job_id} did not finish within {timeout_seconds} seconds: {last_job}")


def login(client: BackendSmokeClient) -> dict[str, Any]:
    status, payload, _ = client.request_json(
        "/api/v1/auth/login",
        method="POST",
        body={"username": DEFAULT_USERNAME, "password": DEFAULT_PASSWORD},
    )
    ensure_status(status, 200, "login")
    if not isinstance(payload, dict):
        raise SmokeError("login: invalid response body")
    return payload


def import_package(
    client: BackendSmokeClient,
    package_dir: Path,
    data_version: str,
) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for endpoint, filename, payload_key in IMPORT_SPECS:
        content = read_text_with_fallback(package_dir / filename)
        status, payload, _ = client.upload_csv(
            f"/api/v1/model-import/{endpoint}?dataVersion={data_version}",
            filename,
            content,
        )
        ensure_status(status, 200, f"import {endpoint}")
        if not isinstance(payload, dict):
            raise SmokeError(f"import {endpoint}: invalid response body")
        rows = payload.get(payload_key)
        if not isinstance(rows, list):
            raise SmokeError(f"import {endpoint}: missing `{payload_key}` rows")
        summary[endpoint] = {
            "importId": payload.get("importId"),
            "status": payload.get("status"),
            "successCount": payload.get("successCount"),
            "failureCount": payload.get("failureCount"),
            "rows": len(rows),
        }
    return summary


def generate_scenario_from_import_batches(
    client: BackendSmokeClient,
    context: dict[str, str],
    *,
    data_version: str,
    scenario_name: str,
    time_limit_seconds: int,
    num_search_workers: int,
) -> dict[str, Any]:
    status, payload, _ = client.request_json(
        "/api/v1/schedule/scenarios/from-import-batches",
        method="POST",
        body={
            "scenarioName": scenario_name,
            "dataVersion": data_version,
            "scheduleStartAt": context["scheduleStartAt"],
            "horizonMinutes": int(context["horizonMinutes"]),
            "objectiveWeights": {
                "tardiness": int(context["objectiveWeights.tardiness"]),
                "earliness": int(context.get("objectiveWeights.earliness", "0")),
                "makespan": int(context["objectiveWeights.makespan"]),
            },
            "solverConfig": {
                "timeLimitSeconds": time_limit_seconds,
                "numSearchWorkers": num_search_workers,
            },
        },
    )
    ensure_status(status, 200, "generate scenario from import batches")
    if not isinstance(payload, dict):
        raise SmokeError("generate scenario from import batches: invalid response body")
    if not isinstance(payload.get("scenario"), dict):
        raise SmokeError("generate scenario from import batches: missing scenario payload")
    return payload


def get_generated_scenario(
    client: BackendSmokeClient,
    scenario_id: str,
) -> dict[str, Any]:
    status, payload, _ = client.request_json(f"/api/v1/schedule/scenarios/{scenario_id}")
    ensure_status(status, 200, "get generated scenario detail")
    if not isinstance(payload, dict):
        raise SmokeError("get generated scenario detail: invalid response body")
    return payload


def submit_schedule_job(client: BackendSmokeClient, schedule_request: dict[str, Any]) -> dict[str, Any]:
    status, payload, _ = client.request_json(
        "/api/v1/schedule/jobs",
        method="POST",
        body=schedule_request,
    )
    ensure_status(status, 202, "submit uat package schedule job")
    if not isinstance(payload, dict) or "jobId" not in payload:
        raise SmokeError("submit uat package schedule job: invalid response body")
    return payload


def validate_final_job(final_job: dict[str, Any]) -> None:
    if final_job.get("status") not in JOB_SUCCESS_STATUSES:
        raise SmokeError(f"uat package schedule job ended unexpectedly: {final_job}")
    if final_job.get("solverStatus") not in {"OPTIMAL", "FEASIBLE"}:
        raise SmokeError(f"uat package schedule job returned unexpected solverStatus: {final_job}")


def build_summary(
    client: BackendSmokeClient,
    *,
    context: dict[str, str],
    package_dir: Path,
    data_version: str,
    scenario_name: str,
    import_summary: dict[str, Any],
    generated: dict[str, Any],
    final_job: dict[str, Any],
) -> dict[str, Any]:
    scenario = generated["scenario"]
    persisted_scenario = get_generated_scenario(client, scenario["scenarioId"])
    schedule_request = scenario["scheduleRequest"]
    if not isinstance(schedule_request, dict):
        raise SmokeError("generate scenario from import batches: missing scheduleRequest")
    tasks = schedule_request.get("tasks")
    if not isinstance(tasks, list) or not tasks:
        raise SmokeError("generate scenario from import batches: scheduleRequest has no tasks")

    return {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "backendBaseUrl": BACKEND_BASE_URL,
        "username": DEFAULT_USERNAME,
        "packageDir": str(package_dir),
        "sourceDataVersion": context["dataVersion"],
        "dataVersion": data_version,
        "scenarioName": scenario_name,
        "imports": import_summary,
        "sourceImportBatchIds": generated.get("sourceImportBatchIds"),
        "solverConfig": schedule_request.get("solverConfig"),
        "scenario": {
            "scenarioId": scenario.get("scenarioId"),
            "resourceCount": scenario.get("resourceCount"),
            "demandCount": scenario.get("demandCount"),
            "requestedDemandQuantity": scenario.get("requestedDemandQuantity"),
            "plannedDemandQuantity": scenario.get("plannedDemandQuantity"),
            "inventoryBalanceCount": scenario.get("inventoryBalanceCount"),
            "inventoryCoveredQuantity": scenario.get("inventoryCoveredQuantity"),
            "operationCount": scenario.get("operationCount"),
            "persistedOperationCount": persisted_scenario.get("operationCount"),
            "precedencePairCount": scenario.get("precedencePairCount"),
            "bridgeAdjustmentCount": scenario.get("bridgeAdjustmentCount"),
            "taskCount": len(tasks),
            "setupRuleCount": len(schedule_request.get("setupRules", [])),
            "inventoryDemandCount": len(schedule_request.get("inventoryDemands", [])),
            "firstTaskMaterialInputs": tasks[0].get("materialInputs"),
            "firstTaskMaterialOutputs": tasks[0].get("materialOutputs"),
        },
        "job": {
            "jobId": final_job.get("jobId"),
            "status": final_job.get("status"),
            "solverStatus": final_job.get("solverStatus"),
            "versionId": final_job.get("versionId"),
            "errorMessage": final_job.get("errorMessage"),
        },
    }


def main() -> int:
    args = parse_args()
    package_dir = Path(args.package_dir).resolve()
    summary_path = Path(args.summary_path).resolve()
    context = load_request_context(package_dir)

    run_id = uuid.uuid4().hex[:8]
    data_version = f"{context['dataVersion']}_smoke_{run_id}"
    scenario_name = f"uat-package-smoke-{run_id}"
    time_limit_seconds = args.time_limit_seconds or int(context["solverConfig.timeLimitSeconds"])
    num_search_workers = args.num_search_workers or int(context["solverConfig.numSearchWorkers"])
    poll_timeout_seconds = max(args.poll_timeout_seconds, time_limit_seconds + 60)

    client = BackendSmokeClient(BACKEND_BASE_URL)
    login(client)
    import_summary = import_package(client, package_dir, data_version)
    generated = generate_scenario_from_import_batches(
        client,
        context,
        data_version=data_version,
        scenario_name=scenario_name,
        time_limit_seconds=time_limit_seconds,
        num_search_workers=num_search_workers,
    )
    schedule_request = generated["scenario"]["scheduleRequest"]
    if not isinstance(schedule_request, dict):
        raise SmokeError("generate scenario from import batches: missing scheduleRequest")
    submitted_job = submit_schedule_job(client, schedule_request)
    final_job = poll_job(
        client,
        submitted_job["jobId"],
        timeout_seconds=poll_timeout_seconds,
    )
    final_job["jobId"] = submitted_job["jobId"]
    validate_final_job(final_job)

    summary = build_summary(
        client,
        context=context,
        package_dir=package_dir,
        data_version=data_version,
        scenario_name=scenario_name,
        import_summary=import_summary,
        generated=generated,
        final_job=final_job,
    )

    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SmokeError as exc:
        print(f"[uat-package-smoke] ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
