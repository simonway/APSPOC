# Snow Beer Packaging V1 Precedence High-Utilization Backend Smoke Notes

## Run Snapshot

- run time: `2026-05-16T02:11:47Z`
- package: `docs/sample-packages/snow_beer_packaging_v1_precedence_high_util`
- backend: `current code on :18080`
- dataVersion: `snow_beer_packaging_v1_precedence_high_util_2026_05_15_smoke_702d4be6`
- scenarioId: `scn-27d2fd19-cdf3-4cd9-b39d-eb7f711a51f3`
- jobId: `job-f44e909a-18b4-4086-9cc6-2de0d0908914`
- versionId: `ver-7e343a90-c424-4c10-ab93-4aa795126c41`
- result: `SUCCEEDED / FEASIBLE`

## Full-Chain Result

- `resources / recipes / demands / downtimes / setup-rules / inventory-balances` all imported with `VALIDATED` status and `0` failures.
- `05_downtimes.csv` is header-only in this high-utilization variant and imported as a valid optional section with `successCount = 0`.
- scenario generation succeeded with:
  - `requestedDemandQuantity = 73`
  - `inventoryCoveredQuantity = 26`
  - `plannedDemandQuantity = 47`
  - `operationCount = 94`
  - `precedencePairCount = 47`
  - `bridgeAdjustmentCount = 0`
- schedule job completed successfully and persisted one draft version.

## KPI Snapshot

- `totalWeightedTardiness = 0`
- `lateTaskCount = 0`
- `totalMakespan = 3555 min`
- `averageUtilization = 0.9592`

## Interpretation

- this package preserves the Snow Beer precedence coverage from the baseline precedence package:
  - the base Snow Beer package produced `precedencePairCount = 0`
  - this high-utilization precedence variant produces `precedencePairCount = 47`
- the high-utilization assumptions materially change top-level schedule shape:
  - removing synthetic downtime and earliness pressure lets the solver compact the schedule to `3555 min`
  - average utilization rises to `0.9592`
  - the version still finishes with `0` tardy tasks
- the current solver still reports `FEASIBLE`, not `OPTIMAL`, so the sample is valid for high-utilization precedence-path UAT but not proof of solver optimality.

## Demo Notes

- use this package when the walkthrough must explicitly prove that `Recipe -> predecessorTaskIds -> solver precedence` is active under a compact, high-utilization schedule.
- use the base `snow_beer_packaging_v1` package when the walkthrough should stay closer to the single-stage packaging story.
- use `snow_beer_packaging_v1_precedence` when the walkthrough needs the original precedence baseline with synthetic downtime retained.
