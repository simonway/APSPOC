# Snow Beer Phase 4 Full Suite Sample Package

This package is the first Phase 4 combined regression entry. It keeps the current solver request runnable while preserving contract-only metadata for the brewery rules that are not yet enforced as hard solver constraints.

## Scope

- combines a maturity-window and bright-tank-transfer chain
- combines a two-tank fermentation contract chain
- combines a multi-brew fill POC approximation chain
- validates material availability timing through delayed raw and packaging materials
- keeps all advanced tank rules as metadata contracts

## Explicitly Out of Scope

- exact fermentation tank hard constraints
- exact parallel brew-to-tank flow
- exact bright tank residency enforcement
- continuous flow, concentration, yield, loss, freshness decay, and procurement reverse planning

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_full_suite --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_full_suite
```

## Intended UAT Focus

- prove Phase 4 P0 samples can coexist in one generated request
- prove solver regression still preserves the main predecessor chain
- prove contract summaries for fermentation tanks, bright tank transfer, and multi-brew fill are all available from `10_generated_operation_metadata.json`

## Talk Track

This package is a regression umbrella, not a new rule claim. It demonstrates that the current APS POC can carry Phase 4 semantics in one suite while staying honest about approximation boundaries.
