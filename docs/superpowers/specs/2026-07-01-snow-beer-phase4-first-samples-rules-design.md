# Snow Beer Phase 4 First Samples and Rules Design

## 1. Context

React import, scenario generation, and schedule submission are now available in the native workbench. Snow Beer Phase 3 already has a frozen main-chain sample at `docs/sample-packages/snow_beer_main_chain_phase3/` that proves the discrete `SUGARIZATION -> FERMENTATION -> FILTRATION -> PACKAGING` flow can be imported, generated, solved, and reviewed.

Phase 4 should not start by attempting every brewery-specific rule at once. The first slice must produce useful evidence quickly while keeping the boundary between current model support, POC approximation, and future solver/backend work explicit.

## 2. Goal

Build the first Snow Beer Phase 4 sample and rule modeling slice:

- one runnable material availability sample;
- one runnable fermentation maturity-window POC sample;
- one fermentation tank rule modeling draft for capacity, occupation, and non-mixing;
- documentation that explains which behavior is supported exactly, approximated, or still deferred.

## 3. Non-Goals

This slice will not implement the complete Snow Beer Phase 4 rule set.

It will not claim precise support for fermentation tank residency, tank non-mixing, multi-brew fill, bright beer tank transfer, stilling/freshness windows, continuous flow, concentration/yield formulas, procurement reverse calculation, or release-grade performance.

It will not replace the Phase 3 baseline sample. `snow_beer_main_chain_phase3` remains the main-chain regression baseline.

## 4. Recommended Scope

### 4.1 Material Availability Sample

Create `docs/sample-packages/snow_beer_phase4_material_availability/`.

This package uses the existing `14_inventory_balances.csv.availableFromMinutes` contract. It should show how raw material or packaging material availability can delay or make a schedule infeasible. This is the lowest-risk Phase 4 entry point because the backend, solver, and import model already carry `availableFromMinutes`.

Expected evidence:

- source CSVs pass package build validation;
- generated request preserves inventory availability timing;
- smoke or solver evidence demonstrates that material availability affects feasibility or timing;
- README explains the business meaning: material exists, but is not usable before its available minute.

### 4.2 Maturity Window POC Sample

Create `docs/sample-packages/snow_beer_phase4_maturity_window/`.

This package should demonstrate fermentation maturity as a POC approximation, not as precise tank residency. The first implementation should use explicit operation structure and precedence to express waiting/maturity semantics. Acceptable first forms include:

- an extra `MATURATION_WAIT` proxy operation between fermentation and filtration; or
- a clearly named proxy resource / fixed-duration operation that makes the earliest-filtering point visible in generated operations.

The README must state that this is a POC approximation. It is valid as a Phase 4 first sample only if the operation metadata and expected checks make the approximation auditable.

Expected evidence:

- source CSVs pass package build validation;
- generated operation metadata contains the maturity proxy;
- precedence proves filtration cannot be reached before the maturity proxy;
- README explains what this does and does not model.

### 4.3 Fermentation Tank Rule Draft

Create a product/design document for fermentation tank capacity, occupation, and non-mixing. Recommended path:

`docs/product/08_delivery_plan/第四期发酵罐规则建模草案.md`

This document should not pretend the rule is implemented. It should freeze the first modeling vocabulary and identify what must change later in backend/solver/sample contracts.

The draft should cover:

- tank capacity unit: proxy lot units for first implementation, with volume as a later refinement;
- tank occupation window: fermentation start through maturity completion or release point;
- non-mixing rule: a tank cannot overlap incompatible product families or batches in the same occupation window;
- failure explanation: no available tank, insufficient capacity, incompatible mix, or occupation-window conflict;
- candidate future sample shape: one success sample and one failure sample.

## 5. File Contracts

Runnable sample packages should follow the existing package shape:

- `00_readme.md`: business scenario, scope boundary, build/smoke commands, demo talk track;
- `01_request_context.csv`: scenario name, data version, horizon, objective weights, solver config;
- `02_resources.csv`: Snow Beer resources;
- `03_recipes.csv`: operations, durations, candidate resources, material IO;
- `04_demands.csv`: demand slices and priorities;
- `05_downtimes.csv`: optional downtime/windows;
- `06_setup_rules.csv`: optional setup rules;
- `07_data_issue_log.csv`: assumptions and known approximations;
- `09_uat_expected_checks.md`: expected counts and semantic checks;
- `14_inventory_balances.csv`: inventory quantities and availability timing;
- generated artifacts from `scripts/build_uat_sample_package.py` when not in `--check` mode.

The existing builder reads `14_inventory_balances.csv`, not `07_inventory.csv`. Phase 4 package docs should use the current builder contract unless a later task intentionally changes the builder.

## 6. Data Flow

For runnable samples:

1. Source CSVs are validated by `scripts/build_uat_sample_package.py <package> --check`.
2. The builder generates `08_generated_schedule_request.json`, `10_generated_operation_metadata.json`, and legacy import-ready CSVs.
3. Formal import batches can be uploaded through the React workflow with a shared `dataVersion`.
4. The backend generates a scenario from import batches.
5. The generated `scheduleRequest` can be submitted as a schedule job.
6. Expected checks and metadata explain the business behavior.

For the tank rule draft:

1. The document defines the future rule vocabulary.
2. It maps each rule to likely data fields and validation needs.
3. It identifies which backend/solver areas must change.
4. It defines sample success/failure cases before implementation begins.

## 7. Validation Strategy

Material availability:

- run `rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_material_availability --check`;
- generate artifacts with the same script without `--check`;
- run an existing or new smoke path if the generated schedule request is intended to solve;
- add backend/solver tests only when the sample exposes behavior not already covered.

Maturity window:

- run package build validation;
- verify generated metadata contains the maturity proxy operation;
- verify precedence includes fermentation to maturity and maturity to filtration;
- add backend scenario generation coverage if the new operation pattern reveals a gap.

Fermentation tank rule draft:

- review for explicit support status: exact / POC approximation / deferred;
- verify every proposed field has a business meaning and a future validation owner;
- avoid implementation commitments that are not backed by sample or solver evidence.

## 8. Risks and Mitigations

Risk: POC maturity window is mistaken for exact tank residency.

Mitigation: name the operation and README language explicitly as a proxy. Expected checks must say it is a maturity approximation.

Risk: material availability sample looks too trivial for Phase 4.

Mitigation: pair it with maturity-window sample and tank-rule draft so the first slice contains both runnable evidence and rule design.

Risk: fermentation tank rules become too broad.

Mitigation: keep the first draft limited to capacity, occupation window, and non-mixing. Multi-brew fill remains a separate later scope unless explicitly promoted.

Risk: sample contracts drift from the current builder.

Mitigation: use `14_inventory_balances.csv` and the current `build_uat_sample_package.py` contract in the first slice.

## 9. Acceptance Criteria

- The design is captured in this spec and approved before implementation planning.
- `snow_beer_phase4_material_availability` and `snow_beer_phase4_maturity_window` are the only runnable sample directories in the first implementation plan.
- Fermentation tank work is limited to a rule-modeling draft in the first implementation plan.
- Every runnable sample has README, source CSVs, expected checks, and build validation.
- The tank draft identifies exact support, POC approximation, and deferred items without claiming implemented behavior.

## 10. Open Follow-Ups

- Decide after the first runnable samples whether `bright_tank_transfer` should be the next sample package or wait until tank occupation modeling is clearer.
- Decide whether multi-brew fill should remain a separate Phase 4 sub-slice.
- Decide whether the builder should gain a new Phase 4 rules file after the tank rule draft is reviewed.
