# Snow Beer Phase 4 Multi-Brew Fill Sample Package

This package freezes the first multi-brew fill POC approximation for Phase 4.

## Scope

- models two sugarization batches feeding one fermentation fill proxy
- uses `15_multi_brew_fill_rules.csv` to describe the fill relationship and volume check
- keeps the current solver request runnable as a linear chain
- documents that multi-brew aggregation is contract-only metadata in this slice

## Explicitly Out of Scope

- exact parallel brew-to-tank flow
- partial tank fill timing
- continuous fermentation tank residency
- hard solver enforcement of tank fill ratios
- KL conversion, concentration, yield, and loss accounting

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_multi_brew_fill --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_multi_brew_fill
```

## Intended UAT Focus

- prove two brew batches can be represented as a stable POC approximation
- prove the fill contract checks brew volume sum against the target fill volume
- keep the current solver behavior honest: it schedules a discrete linear proxy, not exact tank filling physics

## Multi-Brew Fill Contract Evidence

- `multi_brew_a500_fill`: `brew_a500_01` and `brew_a500_02` each contribute 1 proxy unit.
- Target fill volume is 2 proxy units and tank capacity is 2 proxy units.
- `10_generated_operation_metadata.json` should report one multi-brew fill case, expected PASS and observed PASS.

## Talk Track

This sample answers how Phase 4 will discuss multiple brews filling one tank before exact tank-residency optimization exists. The runnable request remains a discrete POC chain. The contract metadata records the business meaning: two brew batches aggregate into one fermentation fill proxy.
