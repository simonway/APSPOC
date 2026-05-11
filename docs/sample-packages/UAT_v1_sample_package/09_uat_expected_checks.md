# UAT Expected Checks

## Sample Summary

- dataVersion: `uat_v1_2026_04_28`
- scheduleStartAt: `2026-05-05T08:00:00Z`
- horizonMinutes: `10080`
- resources: `10`
- demands: `8`
- requested demand quantity: `8`
- planned demand quantity: `8`
- inventory-covered demand quantity: `0`
- inventory balances: `8`
- inventory demands: `8`
- generated operations/tasks: `22`
- downtimes: `6`
- setup rules: `6`
- precedence pairs: `14`
- fixed first-operation constraints: `3`
- baseline bridge adjustments: `1`
- product codes: `PA-101, PA-102, RS-301, SOL-201`

## Baseline Checks

- Canonical `03/04/05/06/14` CSV files should pass the current import-batch endpoints without manual edits.
- Legacy `11/12/13` CSV exports should still pass the current flat `resources/tasks/downtimes` import endpoints.
- `08_generated_schedule_request.json` should be directly submittable to `POST /api/v1/schedule/jobs`.
- All generated task candidate resources must exist in `02_resources.csv`.
- All generated predecessor ids must point to other generated task ids.
- All generated task `materialInputs/materialOutputs` must use positive integer quantities.
- All generated downtimes must stay within the request horizon.
- Any baseline bridge adjustments should be reviewable in `10_generated_operation_metadata.json` under `bridgeAdjustments`.

## MVP/UAT Semantic Checks

- Each demand expands into a linear operation chain in `10_generated_operation_metadata.json`.
- Every non-first operation must list exactly one predecessor operation id.
- Setup rules cover cross-family switches used by the sample setup groups.
- Every operation should preserve the recipe-level material inputs and resolved material outputs.
- Demand-level fixed resource and fixed start are intentionally mapped onto the first operation only.

## Known Bridge Limits

- `12_import_ready_tasks.csv` is a legacy flat-task compatibility export and does not carry material IO because the current task import endpoint does not support those columns.
- If a fixed first-operation interval conflicts with a hard downtime window, the baseline request may relax `pinnedStartMinutes` while retaining the original constraint in metadata.
- Finished-goods inventory coverage is supported by the generator, but this sample keeps inventory rows focused on raw materials for clearer smoke behavior.
- Use `10_generated_operation_metadata.json` as the semantic source of truth for future V2/V3 solver and import work.
