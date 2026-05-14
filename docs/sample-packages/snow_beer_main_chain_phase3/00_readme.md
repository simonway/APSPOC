# Snow Beer Main Chain Phase 3 Sample Package

This package validates the Phase 3 Snow Beer main-chain demo path with the current APS POC model.

## Scope

- covers demand, finished-goods inventory coverage, raw material and packaging material kitting, sugarization, fermentation, filtration, packaging, downtime, packaging setup, and an inserted order
- models each beer lot as a fixed-duration discrete chain: `SUGARIZATION -> FERMENTATION -> FILTRATION -> PACKAGING`
- uses current `ResourceType` values: `REACTOR`, `TANK`, `FILTER`, `OTHER`
- treats all quantities as pre-aggregated demo lot units

## Explicitly Out of Scope

- fermentation maturity windows
- bright beer tank transfer and stilling/freshness windows
- tank capacity, occupation, non-mixing, and multi-brew tank-fill rules
- continuous flow, concentration/yield formulas, and procurement-plan reverse calculation
- release-grade performance, approval governance, and UI polish

## Files

Source inputs:

- `01_request_context.csv`: scenario, horizon, objective, solver config
- `02_resources.csv`: sugarization, fermentation, filtration, packaging resources
- `03_recipes.csv`: four-step main-chain recipe per SKU
- `04_demands.csv`: committed demand plus high-priority inserted order
- `05_downtimes.csv`: explicit service windows
- `06_setup_rules.csv`: packaging family changeovers
- `07_data_issue_log.csv`: current modeling compromises and phase boundaries
- `14_inventory_balances.csv`: finished goods, raw materials, and packaging material proxy stock

Generated and verification artifacts:

- `08_generated_schedule_request.json`: generated schedule request, directly submittable to the scheduling endpoint
- `09_uat_expected_checks.md`: expected counts and semantic checks for this package
- `10_generated_operation_metadata.json`: semantic source of truth for demand coverage, operation graph, material flow, and bridge adjustments
- `11_import_ready_resources.csv`: legacy flat resource import export
- `12_import_ready_tasks.csv`: legacy flat task import export
- `13_import_ready_downtimes.csv`: legacy flat downtime import export

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_main_chain_phase3 --check
```

Generate derived artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_main_chain_phase3
```

Use `10_generated_operation_metadata.json` as the semantic source of truth during verification. It is the authoritative artifact for demand coverage, operation expansion, precedence links, material flow, and any bridge adjustments.

Optional backend smoke:

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_main_chain_phase3
```

## Intended UAT Focus

- prove that Snow Beer demand can expand into a four-stage main-chain operation graph
- prove material proxy items flow from sugarization to final packaging
- prove the inserted order keeps highest priority across generated operations
- prove downtime and packaging setup can be demonstrated without adding Phase 4 industry-specific constraints

## Demo Script

### 1. Opening Message

Use this positioning:

> This Phase 3 demo shows the Snow Beer main scheduling chain from demand to packaging. It proves that the current APS POC can import main-chain master data, generate discrete sugarization, fermentation, filtration, and packaging tasks, solve the schedule, and show the result in Gantt. Complex brewery rules such as fermentation maturity windows, tank non-mixing, bright beer tank transfer, and freshness windows remain Phase 4 scope.

### 2. Prerequisites

- Local services are running through `./startup.sh`.
- Login with a user that can import and schedule, such as `admin` or `planner`.
- Use this package directory: `docs/sample-packages/snow_beer_main_chain_phase3/`.

Optional command-line proof before the UI demo:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_main_chain_phase3 --check
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_main_chain_phase3
```

Expected smoke evidence:

- resources: `8`
- demands: `3`
- inventory balances: `11`
- generated tasks: `12`
- precedence pairs: `9`
- job status: `SUCCEEDED`
- solverStatus: `OPTIMAL`
- Gantt bars: `12`

### 3. UI Walkthrough

1. Log in to the APS workspace.
2. Open the model import area.
3. Import these files with the same `dataVersion` from `01_request_context.csv`:
   - `02_resources.csv`
   - `03_recipes.csv`
   - `04_demands.csv`
   - `05_downtimes.csv`
   - `06_setup_rules.csv`
   - `14_inventory_balances.csv`
4. Generate a scenario from the import batches.
5. Submit the generated schedule request.
6. Wait for the job to finish.
7. Open the generated version and inspect Gantt.
8. Open version history or diff only if the audience asks about governance; do not make approval/release quality the focus of Phase 3.

### 4. What To Point Out In The Result

Use `10_generated_operation_metadata.json` as the semantic audit source.

- `demandCoverages` shows 4 requested lots, 1 finished-goods inventory-covered lot, and 3 planned lots.
- `operations` shows each planned lot expanded into `SUGARIZATION -> FERMENTATION -> FILTRATION -> PACKAGING`.
- `precedencePairs` contains 9 edges, which means every 4-stage planned lot has 3 predecessor links.
- The inserted demand `dem_a500_spot_1224` keeps priority `5` across all four operations.
- Raw material and packaging material proxy items flow through `materialInputs / materialOutputs`.
- Downtime and packaging setup are included as current APS constraints, not as Phase 4 brewery-specific rules.

### 5. Talk Track For Scope Boundaries

Say explicitly:

- Current support is a discrete, fixed-duration POC model.
- Fermentation is represented as a schedulable task on a `TANK` resource, not as a maturity-window or tank-residency model.
- Bright beer and intermediate products are proxy inventory items for traceability and material-flow validation.
- Tank capacity, occupation, non-mixing, multi-brew tank-fill, bright beer tank transfer, stilling/freshness windows, and continuous-flow rules are Phase 4.
- Performance baseline, approval governance, UI polish, release checklist, and formal release readiness are Phase 5.

### 6. Completion Criteria For The Demo

The demo is complete when the audience has seen:

- source CSVs imported successfully
- scenario generated from import batches
- solver job completed successfully
- Gantt contains 12 bars across 8 resources
- operation metadata proves the 4-stage chain and material flow
- Phase 4 and Phase 5 boundaries stated without over-promising
