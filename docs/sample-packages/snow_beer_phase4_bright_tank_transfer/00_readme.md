# Snow Beer Phase 4 Bright Tank Transfer Sample Package

This package freezes the first bright tank transfer contract sample for Phase 4.

## Scope

- models filtration output as bright beer intermediate material
- adds an explicit bright tank transfer operation between filtration and packaging
- uses `15_bright_tank_transfer_rules.csv` to describe bright tank occupation and transfer windows
- keeps transfer rules as contract-only metadata for future backend and solver work

## Explicitly Out of Scope

- exact solver enforcement of bright tank residency
- continuous flow, concentration, yield, and freshness decay
- hard coupling between bright tank occupation and packaging line timing
- procurement reverse planning

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_bright_tank_transfer --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_bright_tank_transfer
```

## Intended UAT Focus

- prove the sample can express filtered beer becoming bright beer before packaging
- prove bright tank transfer contracts are parsed and preserved in operation metadata
- keep bright tank transfer checks separate from current solver enforcement

## Bright Tank Contract Evidence

- `bright_transfer_a500`: A500 transfer uses `bright_t1`, occupation `[360,540)`, allowed window `[300,720)`, expected PASS.
- `bright_transfer_b600_late`: B600 transfer uses `bright_t2`, occupation `[780,960)`, allowed window `[420,900)`, expected FAIL with `OCCUPATION_WINDOW`.

## Talk Track

This sample shows the Phase 4 handoff from filtration to bright beer storage. The current solver receives a runnable five-step discrete chain, while `15_bright_tank_transfer_rules.csv` preserves the future product contract for bright tank residency and window explanation.
