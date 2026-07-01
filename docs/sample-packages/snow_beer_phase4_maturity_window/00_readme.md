# Snow Beer Phase 4 Maturity Window POC Sample Package

This package validates a POC approximation for fermentation maturity windows.

## Scope

- represents the maturity window as an explicit `MATURATION_WAIT` proxy operation
- keeps operation precedence auditable in generated metadata
- proves filtration cannot be reached until the maturity proxy completes
- uses current sample builder and solver contracts

## Explicitly Out of Scope

- precise tank residency modeling
- fermentation tank non-mixing
- multi-brew fill
- bright beer tank transfer
- stilling/freshness max window enforcement
- continuous-flow or concentration/yield rules

## Modeling Boundary

`MATURATION_WAIT` is a POC proxy. It is not exact fermentation tank occupation support. It makes the earliest-filtering business concept visible in the generated operation graph by adding a fixed-duration operation between fermentation and filtration.

`10_generated_operation_metadata.json` is the authoritative artifact for the `operationCode` value. The generated `08_generated_schedule_request.json` follows the current schedule request contract and does not carry an `operationCode` field; audit it through the task id `dem_a500_maturity_1224__03_maturation_wait`, the `成熟等待` label, `MATURED_A500_LOT` material flow, and predecessor links.

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_maturity_window --check
```

Generate artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_phase4_maturity_window
```

Optional smoke:

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_phase4_maturity_window
```

## Intended UAT Focus

- prove the generated operation graph can include an explicit maturity proxy
- prove precedence links fermentation to maturity and maturity to filtration
- explain why this is an approximation and not complete tank-residency support

## Talk Track

This sample shows the first Phase 4 maturity-window approximation. Instead of allowing filtration immediately after fermentation, it inserts a visible maturity proxy operation. This makes the "not ready to filter yet" business concept inspectable in operation metadata and Gantt, while keeping exact tank occupation and non-mixing for a later rule-modeling slice.
