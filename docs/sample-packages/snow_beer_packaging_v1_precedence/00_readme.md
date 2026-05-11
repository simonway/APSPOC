# Snow Beer Packaging V1 Precedence Sample Package

This package stays close to `snow_beer_packaging_v1` but adds one explicit purpose: validate the current `precedence` path on a Snow Beer business-shaped sample.

It keeps the same demand mix, opening inventory, downtime windows, and setup rules as the base Snow Beer package. The only deliberate modeling change is that each packaging lot is split into a two-step recipe:

- `PREP`: line preparation and material feed
- `PACK`: final bottle packing

This creates an explicit `PREP -> PACK` predecessor chain for every non-inventory-covered demand while keeping the original total duration per lot unchanged.

## Scope

- packaging only; no mash / fermentation / filtration end-to-end chain
- one two-step packaging chain per pre-aggregated packaging lot
- `Demand.quantity` means lot count, not raw `KL`
- finished-goods inventory is converted into opening lot counts for demand coverage
- bright beer and packaging materials are modeled as lot-level proxy items
- line-speed differences are still compressed into one conservative total duration per SKU
- procurement lead times are still compressed into `availableFromMinutes` checkpoints inside the horizon

## Stage Split

| SKU | PREP | PACK | Total |
| --- | --- | --- | --- |
| `31015630002000000` | `30 min` | `150 min` | `180 min` |
| `31015630006000000` | `40 min` | `180 min` | `220 min` |
| `31015630003000000` | `30 min` | `120 min` | `150 min` |
| `31015630004000000` | `45 min` | `225 min` | `270 min` |
| `31015630005000000` | `45 min` | `225 min` | `270 min` |

The intermediate output item from `PREP` is an internal proxy item used only to validate precedence and material-flow propagation in the current backend and solver flow.

## Files

- `01_request_context.csv`: scenario, horizon, objective, solver config
- `02_resources.csv`: packaging lines only
- `03_recipes.csv`: two-step packaging recipe per SKU
- `04_demands.csv`: demand slices plus the temporary A500 order
- `05_downtimes.csv`: synthetic service windows added for downtime smoke
- `06_setup_rules.csv`: `330/500/600ml` cross-volume changeovers
- `07_data_issue_log.csv`: current modeling compromises and gaps
- `14_inventory_balances.csv`: finished goods, bright beer proxies, and packaging material proxy stock
- `08/09/10/11/12/13/15`: generated artifacts built from the canonical CSVs

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_packaging_v1_precedence --check
```

Generate derived artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_packaging_v1_precedence
```

Optional backend smoke:

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_packaging_v1_precedence
```

## Intended UAT Focus

- validate that a Snow Beer-shaped package can now produce non-zero `precedencePairCount`
- validate that every generated non-first operation has exactly one predecessor
- validate that `materialInputs / materialOutputs` survive the extra stage split
- keep the existing inventory-coverage walkthrough available on the same demand and stock baseline

## Demand Priority Mapping

This precedence variant inherits the same demand slicing and business-priority definition as the base Snow Beer package. The `priority` values in `10_generated_operation_metadata.json` therefore follow the same manual mapping:

| Priority | Demand Slice Pattern | Current Rows | Business Meaning |
| --- | --- | --- | --- |
| `5` | temporary inserted order | `dem_a500_spot_1224` | Highest urgency. Protect the inserted order first. |
| `4` | earlier committed delivery wave | `dem_a500_1225`, `dem_a500_1227`, `dem_a330_1225`, `dem_10a500_1225`, `dem_b600_1225`, `dem_c600_1225` | High priority. Earlier delivery slices and the protected mid-wave A500 slice. |
| `3` | later delivery wave | `dem_a500_1229`, `dem_a330_1227`, `dem_a330_1229`, `dem_10a500_1227`, `dem_10a500_1229`, `dem_b600_1227`, `dem_b600_1229`, `dem_c600_1227`, `dem_c600_1229` | Normal priority within the current six-day horizon. |

Use the base package README for the fuller explanation of why this numeric scale is a sample-design assumption rather than raw source data:

- [snow_beer_packaging_v1/00_readme.md](/Users/simon/Documents/MyProgramming/APSPOC/docs/sample-packages/snow_beer_packaging_v1/00_readme.md:64)

## Demand Coverage Field Mapping

The precedence variant uses the same `demandCoverages` field semantics as the base package:

| Field | Meaning | Source / Derivation | Current Precedence Example |
| --- | --- | --- | --- |
| `requestedQuantity` | Total requested lots for one demand slice | From `04_demands.csv.quantity` | `6` |
| `inventoryCoveredQuantity` | Lots fulfilled by opening inventory before operation expansion | Derived from `14_inventory_balances.csv` using due-date and priority ordering | `2` |
| `plannedQuantity` | Lots still expanded into `PREP -> PACK` operations | `requestedQuantity - inventoryCoveredQuantity` | `4` |
| `dueMinutes` | Due time offset inside the horizon | From `04_demands.csv.dueMinutes` | `2160` |
| `priority` | Manual business urgency level | From `04_demands.csv.priority` | `4` |

Relationship rule:

- `requestedQuantity = inventoryCoveredQuantity + plannedQuantity`

Precedence-specific interpretation:

- when `plannedQuantity > 0`, each remaining lot is expanded into one `PREP` operation and one `PACK` operation
- therefore `plannedQuantity = 4` for `dem_a500_1225` becomes `8` generated operations in this variant

## Operation Field Mapping

The precedence variant keeps the same operation metadata fields as the base package, but the most important fields are easier to interpret because every planned lot expands into two stages:

| Field | Meaning | Current Precedence Example |
| --- | --- | --- |
| `operationId` | Generated operation node id | `dem_a500_1225__u01__01_prep` |
| `demandUnitIndex` | Which lot unit this node belongs to | `1` |
| `operationCode` | Stage code in the recipe chain | `PREP` or `PACK` |
| `sequence` | Stage order inside one lot chain | `1` for `PREP`, `2` for `PACK` |
| `predecessorOperationIds` | Explicit upstream dependency | `[]` for `PREP`, `[dem_a500_1225__u01__01_prep]` for `PACK` |
| `materialInputs` | Materials consumed at this stage | packaging materials for `PREP`, intermediate item for `PACK` |
| `materialOutputs` | Materials produced at this stage | intermediate item for `PREP`, finished SKU for `PACK` |
| `setupGroup` | Changeover family | `PKG_500` |
| `priority` | Parent-demand priority inherited by both stages | `4` |

Precedence-specific reading rule:

- for one planned lot, read `PREP` and `PACK` together as one business execution chain
- `precedencePairs` is the condensed edge list
- `operations[].predecessorOperationIds` is the per-node view of the same dependency

Example:

- `dem_a500_1225__u01__01_prep`
  - consumes `BB_A500_LOT / CAP_A_LOT / CTN_A1_LOT / LBL_A1_LOT`
  - outputs `INT_31015630002000000_READY`
- `dem_a500_1225__u01__02_pack`
  - consumes `INT_31015630002000000_READY`
  - outputs final SKU `31015630002000000`
- this is why the same lot appears as two operations but only one predecessor pair

## Graph Metadata Mapping

The precedence variant makes the remaining graph-level fields much easier to observe directly:

| Field | Meaning | Current Precedence State |
| --- | --- | --- |
| `precedencePairs` | Explicit dependency edges between generated operations | Non-empty. The current package produces `47` pairs such as `PREP -> PACK`. |
| `setupRules` | Changeover-rule snapshot passed into the generated scenario | `6` rules, matching the `330/500/600ml` cross-volume setup matrix. |
| `bridgeAdjustments` | Audit list of pinning or compatibility corrections made during scenario generation | Empty in the current package. |

Precedence-variant interpretation:

- `precedencePairs` is the compressed edge list view of the same dependency information stored per node in `operations[].predecessorOperationIds`
- `setupRules` is independent of precedence; it still controls line changeover cost when adjacent packaged lots switch setup family
- `bridgeAdjustments = []` means the scenario was generated without any hidden relaxation of fixed resource or fixed start assumptions

Quick reading guide:

- if you want to prove stage ordering, open `precedencePairs`
- if you want to prove changeover semantics, open `setupRules`
- if you want to prove the sample was not silently repaired, check that `bridgeAdjustments` stays empty
