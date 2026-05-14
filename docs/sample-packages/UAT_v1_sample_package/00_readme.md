# UAT_v1 Sample Package

This package bridges the current APS baseline and the next MVP/UAT stage.

It stores the sample in the canonical `Resource / Recipe / Demand / Downtime / SetupRule / InventoryBalance` structure required by the product documents, while also generating:

- a current `schedule request` JSON that already carries precedence, setup, material flow, and inventory semantics
- canonical CSV inputs for the current import-batch endpoints
- legacy flat-task compatibility CSV exports for the older `resources/tasks/downtimes` import path
- operation-level metadata for UAT review and solver traceability

## Files

- `01_request_context.csv`: scenario, dataVersion, horizon, solver weights, and config
- `02_resources.csv`: resource master
- `03_recipes.csv`: product operation template
- `04_demands.csv`: UAT demand rows
- `05_downtimes.csv`: downtime windows
- `06_setup_rules.csv`: setup/changeover rules
- `07_data_issue_log.csv`: sample quality notes
- `14_inventory_balances.csv`: raw-material opening inventory for material-flow smoke
- `08_generated_schedule_request.json`: current API-ready request body
- `09_uat_expected_checks.md`: expected checks for UAT and review
- `10_generated_operation_metadata.json`: operation graph, precedence pairs, setup rules, demand coverage, and inventory metadata
- `11_import_ready_resources.csv`: legacy flat import compatibility export
- `12_import_ready_tasks.csv`: legacy flat import compatibility export
- `13_import_ready_downtimes.csv`: legacy flat import compatibility export

## Build

From the repo root:

```bash
rtk python3 scripts/build_uat_sample_package.py
```

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py --check
```

End-to-end smoke:

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/UAT_v1_sample_package
```

Smoke summary defaults to:

```text
.runtime/uat-package-smoke-summary.json
```

## Bridge Rules

- `03/04/05/06/14` are the canonical source files for the current import-batch flow.
- `08_generated_schedule_request.json` is built from the same canonical source data and is directly submittable to `POST /api/v1/schedule/jobs`.
- The generated request already carries `predecessorTaskIds`, `setupRules`, `materialInputs`, `materialOutputs`, `inventoryBalances`, and `inventoryDemands`.
- Demand-level `fixedResourceId` and `fixedStartMinutes` are intentionally applied to the first generated operation only.
- `12_import_ready_tasks.csv` keeps precedence and setup columns for the legacy flat task import, but does not carry material IO because that endpoint does not support `materialInputs/materialOutputs`.
- If the final recipe operation omits `materialOutputs`, the generator falls back to `productCode:1` for backward compatibility.
