# Sample Package Expected Checks

## Sample Summary

- dataVersion: `snow_beer_packaging_v1_2026_05_06`
- scheduleStartAt: `2026-12-24T00:00:00Z`
- horizonMinutes: `8640`
- resources: `3`
- demands: `16`
- requested demand quantity: `73`
- planned demand quantity: `47`
- inventory-covered demand quantity: `26`
- inventory balances: `23`
- inventory demands: `16`
- generated operations/tasks: `47`
- downtimes: `2`
- setup rules: `6`
- precedence pairs: `0`
- fixed first-operation constraints: `0`
- baseline bridge adjustments: `0`
- product codes: `31015630002000000, 31015630003000000, 31015630004000000, 31015630005000000, 31015630006000000`

## Baseline Checks

- Canonical `03/04/05/06/14` CSV files should pass the current import-batch endpoints without manual edits.
- Legacy `11/12/13` CSV exports should still pass the current flat `resources/tasks/downtimes` import endpoints.
- `08_generated_schedule_request.json` should be directly submittable to `POST /api/v1/schedule/jobs`.
- All generated task candidate resources must exist in `02_resources.csv`.
- All generated predecessor ids must point to other generated task ids.
- All generated task `materialInputs/materialOutputs` must use positive integer quantities.
- All generated downtimes must stay within the request horizon.
- Any baseline bridge adjustments should be reviewable in `10_generated_operation_metadata.json` under `bridgeAdjustments`.

## Semantic Checks

- Each demand expands into a linear operation chain in `10_generated_operation_metadata.json`.
- Every non-first operation must list exactly one predecessor operation id.
- Setup rules cover cross-family switches used by the sample setup groups.
- Every operation should preserve the recipe-level material inputs and resolved material outputs.
- Demand-level fixed resource and fixed start are intentionally mapped onto the first operation only.

## UAT Walkthrough Checks

- `01_request_context.csv` enables `objectiveWeights.earliness = 2`; a fresh version generated from this package should persist that field into `sourceRequestJson`.
- Fresh versions generated from the current backend should also persist `inventoryDemands.priority`, otherwise inventory coverage replay on the Gantt view is incomplete.
- `GET /api/v1/versions/{versionId}/gantt-data` should return non-empty `inventoryCoverages`; the current sample smoke returns `10`.
- `dem_a500_spot_1224` should appear as a fully covered inventory marker rather than a packaging task bar.
- `12/29` due lots should cluster around `12/28-12/29`; they should no longer all finish on `12/24-12/25` as in the old tardiness-only baseline.

## Known Bridge Limits

- `12_import_ready_tasks.csv` is a legacy flat-task compatibility export and does not carry material IO because the current task import endpoint does not support those columns.
- If a fixed first-operation interval conflicts with a hard downtime window, the baseline request may relax `pinnedStartMinutes` while retaining the original constraint in metadata.
- Finished-goods inventory coverage is supported by the generator; interpret the exact inventory emphasis from the package README because some samples focus on raw materials while others also use opening finished-goods stock.
- Use `10_generated_operation_metadata.json` as the semantic source of truth for future V2/V3 solver and import work.
