# Sample Package Expected Checks

## Sample Summary

- dataVersion: `snow_beer_phase4_maturity_window_2026_07_01`
- scheduleStartAt: `2026-12-24T00:00:00Z`
- horizonMinutes: `4320`
- resources: `5`
- demands: `1`
- requested demand quantity: `1`
- planned demand quantity: `1`
- inventory-covered demand quantity: `0`
- inventory balances: `5`
- inventory demands: `1`
- generated operations/tasks: `5`
- downtimes: `0`
- setup rules: `0`
- fermentation tank rule cases: `0`
- precedence pairs: `4`
- fixed first-operation constraints: `0`
- baseline bridge adjustments: `0`
- product codes: `31015630002000000`

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
- Generated operation metadata includes the `MATURATION_WAIT` maturity proxy operation.
- The maturity proxy sits between fermentation and filtration in the operation chain.
- `MATURATION_WAIT` consumes `FERMENTED_A500_LOT` and outputs `MATURED_A500_LOT`.
- Filtration consumes `MATURED_A500_LOT`, proving filtration cannot bypass the maturity proxy.
- This is a POC maturity-window approximation, not exact fermentation tank residency support.
- Every operation should preserve the recipe-level material inputs and resolved material outputs.
- Demand-level fixed resource and fixed start are intentionally mapped onto the first operation only.

## Known Bridge Limits

- `12_import_ready_tasks.csv` is a legacy flat-task compatibility export and does not carry material IO because the current task import endpoint does not support those columns.
- If a fixed first-operation interval conflicts with a hard downtime window, the baseline request may relax `pinnedStartMinutes` while retaining the original constraint in metadata.
- Finished-goods inventory coverage is supported by the generator; interpret the exact inventory emphasis from the package README because some samples focus on raw materials while others also use opening finished-goods stock.
- Use `10_generated_operation_metadata.json` as the semantic source of truth for future V2/V3 solver and import work.
