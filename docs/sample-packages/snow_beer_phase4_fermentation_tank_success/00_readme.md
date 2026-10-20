# Snow Beer Phase 4 Fermentation Tank Success Sample Package

This package is the positive acceptance fixture for the Phase 4A fermentation-tank non-mixing rule.

## Scope

- models two brewery batches that pass the non-mixing rule: A500 ferments on `ferm_t1`, B600 on `ferm_t2` (distinct tanks, different families)
- uses `15_fermentation_tank_rules.csv` to describe tank capacity, occupation windows, and mixing family
- the solver now **enforces** non-mixing, and this request stays FEASIBLE
- pairs with `snow_beer_phase4_fermentation_tank_failure`

## Explicitly Out of Scope

- exact solver enforcement of fermentation tank capacity
- cross-operation resource occupation in the current schedule request
- multi-brew fill and KL conversion

## How the happy path is expressed

The recipe CSV (`03_recipes.csv`) carries `tankId` / `mixingFamily` for each fermentation operation; the two batches use different tanks, so no non-mixing conflict arises and no pin is used.

| column | A500 | B600 |
|---|---|---|
| `tankId` | `ferm_t1` | `ferm_t2` |
| `mixingFamily` | `A500` | `B600` |

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_success --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_success
```

## Acceptance

Real end-to-end solver verification (requires the backend + solver running):

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_phase4_fermentation_tank_success
```

Expected: the job ends `solverStatus` `OPTIMAL`/`FEASIBLE` with both fermentation operations scheduled on distinct tanks.

## Tank Rule Contract Evidence

- `tank_success_a500`: A500 batch uses `ferm_t1`, capacity `1`, volume `1`, occupation `[120,720)`, mixing family `A500`.
- `tank_success_b600`: B600 batch uses `ferm_t2`, capacity `1`, volume `1`, occupation `[140,860)`, mixing family `B600`.
- No overlapping occupation occurs on the same tank.
- `10_generated_operation_metadata.json` reports two tank-rule cases, both expected PASS and observed PASS.

## Talk Track

This sample is the positive half of the Phase 4A non-mixing acceptance: two batches, two distinct tanks, different mixing families, no capacity overrun. The failure package demonstrates the infeasible NON_MIXING counterpart.