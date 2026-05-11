# Snow Beer Packaging V1 Precedence Backend Smoke Notes

## Run Snapshot

- run time: `2026-05-09`
- package: `docs/sample-packages/snow_beer_packaging_v1_precedence`
- backend: `current code on :8081`
- dataVersion: `snow_beer_packaging_v1_precedence_2026_05_09_smoke_4dd969ab`
- scenarioId: `scn-a8176439-8d77-4ddc-803a-c3c1d688b55f`
- jobId: `job-0d050797-0d78-404f-9b33-08f0adfcad02`
- versionId: `ver-8239402e-906e-443e-b769-a0d9051942b1`
- result: `DONE / FEASIBLE`

## Full-Chain Result

- `resources / recipes / demands / downtimes / setup-rules / inventory-balances` all imported with `VALIDATED` status and `0` failures.
- scenario generation succeeded with:
  - `requestedDemandQuantity = 73`
  - `inventoryCoveredQuantity = 26`
  - `plannedDemandQuantity = 47`
  - `operationCount = 94`
  - `precedencePairCount = 47`
- schedule job completed successfully and persisted one draft version.

## KPI Snapshot

- `totalWeightedTardiness = 0`
- `lateTaskCount = 0`
- `totalMakespan = 7920 min`
- `averageUtilization = 0.4306`

## Interpretation

- this package closes the Snow Beer precedence coverage gap from the earlier UAT smoke:
  - the base Snow Beer package produced `precedencePairCount = 0`
  - this precedence variant produces `precedencePairCount = 47`
- the extra stage split does not change top-level business KPI on this sample:
  - the version still finishes with `0` tardy tasks
  - total makespan stays at `7920 min`
  - utilization stays at `0.4306`
- the current solver still reports `FEASIBLE`, not `OPTIMAL`, so the sample is valid for precedence-path UAT but not proof of solver optimality.

## Demo Notes

- use this package when the walkthrough must explicitly prove that `Recipe -> predecessorTaskIds -> solver precedence` is active.
- use the base `snow_beer_packaging_v1` package when the walkthrough should stay closer to the single-stage packaging story.
- if the audience asks whether a longer time limit improves this sample, reference the release supplement record in `docs/release/2026-05-09_UAT_smoke_补充验证.md`.
