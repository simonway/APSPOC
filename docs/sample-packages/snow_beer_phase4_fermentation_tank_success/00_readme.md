# Snow Beer Phase 4 Fermentation Tank Success Sample Package

This package freezes the first successful fermentation tank rule-contract sample for future backend and solver work.

## Scope

- models two brewery batches that can pass the first tank-rule contract
- uses `15_fermentation_tank_rules.csv` to describe tank capacity, occupation windows, and mixing family
- keeps current schedule generation runnable while marking tank rules as contract-only metadata
- pairs with `snow_beer_phase4_fermentation_tank_failure`

## Explicitly Out of Scope

- exact solver enforcement of fermentation tank capacity
- cross-operation resource occupation in the current schedule request
- same-tank non-mixing enforcement by the current solver
- multi-brew fill and KL conversion

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_success --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_success
```

Optional smoke:

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_phase4_fermentation_tank_success
```

## Intended UAT Focus

- prove the new tank-rule contract file is parsed and preserved in operation metadata
- prove two batches on different tanks are classified as expected PASS
- keep tank-rule checks separate from current solver enforcement

## Tank Rule Contract Evidence

- `tank_success_a500`: A500 batch uses `ferm_t1`, capacity `1`, volume `1`, occupation `[120,720)`, mixing family `A500`.
- `tank_success_b600`: B600 batch uses `ferm_t2`, capacity `1`, volume `1`, occupation `[140,860)`, mixing family `B600`.
- No overlapping occupation occurs on the same tank.
- `10_generated_operation_metadata.json` should report two tank-rule cases, both expected PASS and observed PASS.

## Talk Track

This sample shows the future happy path for fermentation tank rules. It does not claim the current solver enforces tank residency. It gives backend and solver work a stable contract fixture: two batches, two tanks, no capacity overrun, and no incompatible same-tank mixing.
