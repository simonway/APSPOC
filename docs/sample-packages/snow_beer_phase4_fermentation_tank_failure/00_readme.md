# Snow Beer Phase 4 Fermentation Tank Failure Sample Package

This package freezes the first fermentation tank rule-contract failure sample for future backend and solver work.

## Scope

- models a deliberate same-tank non-mixing conflict
- uses `15_fermentation_tank_rules.csv` to describe the expected failure reason
- keeps failure semantics in generated metadata without claiming current solver enforcement
- pairs with `snow_beer_phase4_fermentation_tank_success`

## Explicitly Out of Scope

- proving current solver infeasibility for fermentation tank non-mixing
- exact tank residency enforcement
- KL capacity conversion
- multi-brew fill and bright beer transfer

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_failure --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_fermentation_tank_failure
```

## Intended UAT Focus

- prove tank-rule contract analysis can classify an expected failure
- prove the main failure reason is `NON_MIXING`, not capacity shortage
- keep future failure explanation vocabulary visible before solver implementation

## Tank Rule Contract Evidence

- `tank_fail_a500` and `tank_fail_b600` both use `ferm_t1`.
- Both rows occupy `[120,860)`.
- `tankCapacityUnits` is `2`, and each batch volume is `1`, so capacity is not the primary failure.
- Mixing families are `A500` and `B600`, so the expected failure type is `NON_MIXING`.
- `10_generated_operation_metadata.json` should report two tank-rule cases, both expected FAIL and observed FAIL with `NON_MIXING`.

## Talk Track

This sample is a future-rule failure fixture. The current APS POC can still generate and solve the schedule request because same-tank non-mixing is not yet enforced by the solver. The value of this package is to freeze the data shape and expected explanation before implementing that enforcement.
