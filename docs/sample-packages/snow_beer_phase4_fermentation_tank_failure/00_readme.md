# Snow Beer Phase 4 Fermentation Tank Failure Sample Package

This package is the negative acceptance fixture for the Phase 4A fermentation-tank non-mixing rule.

## Scope

- models a deliberate same-tank non-mixing conflict: two batches (A500, B600) are both assigned to `ferm_t1` with **different mixing families** and **pinned to the same start time**
- uses `15_fermentation_tank_rules.csv` to describe the expected failure reason
- the solver now **enforces** this: the request is INFEASIBLE and returns a `NON_MIXING` failure reason
- pairs with `snow_beer_phase4_fermentation_tank_success`

## Explicitly Out of Scope

- exact tank residency / KL capacity conversion
- multi-brew fill and bright beer transfer

## How the conflict is forced

The recipe CSV (`03_recipes.csv`) carries the columns added in Phase 4A (recipe-level pin + tank non-mixing):

| column | A500 | B600 |
|---|---|---|
| `tankId` | `ferm_t1` | `ferm_t1` |
| `mixingFamily` | `A500` | `B600` |
| `pinnedResourceId` | `ferm_t1` | `ferm_t1` |
| `pinnedStartMinutes` | `300` | `300` |

Both fermentation operations are pinned to `ferm_t1` at minute 300, so they overlap on the same tank. The solver's tank `AddNoOverlap` makes the model infeasible, and the `NON_MIXING` failure-reason heuristic names the tank, the conflicting task ids, and the two mixing families.

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_failure --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_failure
```

## Acceptance

Real end-to-end solver verification (requires the backend + solver running):

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_phase4_fermentation_tank_failure --expect-infeasible-non-mixing
```

Expected: the job ends `solverStatus=INFEASIBLE`, `failureReason=SOLVER_NO_FEASIBLE_SCHEDULE`, and the error message contains `NON_MIXING` with `tankId=ferm_t1`.

## Tank Rule Contract Evidence

- `tank_fail_a500` and `tank_fail_b600` both use `ferm_t1`.
- Both rows occupy `[120,860)`.
- `tankCapacityUnits` is `2`, and each batch volume is `1`, so capacity is not the primary failure.
- Mixing families are `A500` and `B600`, so the expected failure type is `NON_MIXING`.
- `10_generated_operation_metadata.json` reports two tank-rule cases, both expected FAIL and observed FAIL with `NON_MIXING`.

## Talk Track

This sample is the negative half of the Phase 4A fermentation-tank non-mixing acceptance. The solver now enforces same-tank non-mixing by returning INFEASIBLE with a NON_MIXING explanation when two different mixing families are forced onto one tank; the success package shows the happy path on distinct tanks.