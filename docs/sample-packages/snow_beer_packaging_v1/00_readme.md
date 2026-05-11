# Snow Beer Packaging V1 Sample Package

This package freezes the recommended `A` scenario from `雪花啤酒APS需求调研.docx`: packaging-line replanning with finished-goods inventory coverage, packaging-material readiness, temporary-order insertion, setup/changeover, and baseline downtime smoke.

It stays inside the current APSPOC capability boundary:

- packaging only; no mash / fermentation / filtration end-to-end chain
- one packaging operation per pre-aggregated packaging lot
- `Demand.quantity` means lot count, not raw `KL`
- finished-goods inventory is converted into opening lot counts for demand coverage
- bright beer and packaging materials are modeled as lot-level proxy items
- line-speed differences are compressed into one conservative `durationMinutes` per SKU
- procurement lead times are compressed into `availableFromMinutes` checkpoints inside the horizon

## Lot Mapping

| SKU | Name | Lot Size | Candidate Lines | Duration |
| --- | --- | --- | --- | --- |
| `31015630002000000` | 8度A成品瓶装500ml1*12 | `50 KL / lot` | `1/2/3线` | `180 min` |
| `31015630006000000` | 8度A成品瓶装330ml1*24 | `43 KL / lot` | `1线` | `220 min` |
| `31015630003000000` | 10度A成品瓶装500ml1*12 | `41 KL / lot` | `1/2/3线` | `150 min` |
| `31015630004000000` | 8度B成品瓶装600ml1*12 | `100 KL / lot` | `2/3线` | `270 min` |
| `31015630005000000` | 9度C成品瓶装600ml1*12 | `100 KL / lot` | `2/3线` | `270 min` |

## Files

- `01_request_context.csv`: scenario, horizon, objective, solver config
- `02_resources.csv`: packaging lines only
- `03_recipes.csv`: one packaging operation template per SKU
- `04_demands.csv`: demand slices plus the temporary A500 order
- `05_downtimes.csv`: synthetic service windows added for downtime smoke
- `06_setup_rules.csv`: `330/500/600ml` cross-volume changeovers
- `07_data_issue_log.csv`: current modeling compromises and gaps
- `14_inventory_balances.csv`: finished goods, bright beer proxies, and packaging material proxy stock
- `08/09/10/11/12/13`: generated artifacts built from the canonical CSVs

## Build

Validation only:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_packaging_v1 --check
```

Generate derived artifacts:

```bash
rtk python3 scripts/build_uat_sample_package.py docs/sample-packages/snow_beer_packaging_v1
```

Optional backend smoke:

```bash
rtk python3 scripts/uat_package_smoke.py docs/sample-packages/snow_beer_packaging_v1
```

Notes:

- the smoke script now auto-detects `utf-8-sig / utf-8 / gb18030 / gbk` for package CSV files, so the canonical sample does not need manual transcoding before import.
- the intended business demo points are:
  - the temporary `12月17日` order is fulfilled from opening finished-goods inventory and should appear as an inventory coverage marker
  - later-due `12/29` lots should be kept close to their due date instead of being fully pulled to the beginning of the horizon

## Modeling Notes

- Opening finished-goods inventory is rounded into lot counts: `4 / 7 / 5 / 6 / 4`.
- The `12月17日` temporary order is represented as `2` additional `A500` lots with the earliest due date and highest priority.
- Source material lead times are longer than the six-day packaging horizon. To make the current product behavior observable, this package compresses some arrivals into in-horizon `availableFromMinutes` checkpoints instead of replaying the raw `5/7/10/15` day calendar exactly.
- The source document gives shift rules but not explicit maintenance dates. `05_downtimes.csv` therefore contains two explicit assumed service windows so the current downtime path can be validated in the same sample.

## Demand Priority Mapping

`04_demands.csv` uses a manual business-priority scale. The current sample keeps the rule simple:

- larger `priority` means the demand is more urgent
- `priority` is not auto-derived by the system; it is frozen as part of the sample design
- the current product uses it in two places:
  - inventory coverage tie-break: earlier `dueMinutes` first, then higher `priority`
  - solver tardiness penalty: later completion of higher-priority tasks is penalized more heavily

Current Snow Beer priority table:

| Priority | Demand Slice Pattern | Current Rows | Business Meaning |
| --- | --- | --- | --- |
| `5` | temporary inserted order | `dem_a500_spot_1224` | Highest urgency. This is the `12月17日` inserted A500 order and should be consumed by inventory or protected first. |
| `4` | earlier committed delivery wave | `dem_a500_1225`, `dem_a500_1227`, `dem_a330_1225`, `dem_10a500_1225`, `dem_b600_1225`, `dem_c600_1225` | High priority. These rows represent either the earliest delivery slice or an intentionally protected mid-wave slice for the main A500 product. |
| `3` | later delivery wave | `dem_a500_1229`, `dem_a330_1227`, `dem_a330_1229`, `dem_10a500_1227`, `dem_10a500_1229`, `dem_b600_1227`, `dem_b600_1229`, `dem_c600_1227`, `dem_c600_1229` | Normal priority. These rows are still due within horizon, but they are less urgent than the inserted order and first-wave deliveries. |

Interpretation notes:

- `priority` is a sample-package business assumption, not a raw field copied from the source Snow Beer document.
- The original source document gives total demand and horizon, but does not define an explicit numeric priority scale per slice.
- If the sample demand slicing changes, the `priority` mapping should be reviewed together with `04_demands.csv`, not treated as a fixed master-data truth.

## Demand Coverage Field Mapping

In `10_generated_operation_metadata.json`, each demand row under `demandCoverages` uses the following field meanings:

| Field | Meaning | Source / Derivation | Current Snow Beer Example |
| --- | --- | --- | --- |
| `demandId` | Demand slice id | Directly from `04_demands.csv` | `dem_a500_1225` |
| `productCode` | Finished-goods SKU code | Directly from `04_demands.csv` | `31015630002000000` |
| `requestedQuantity` | Total requested lots for that demand slice | Directly from `04_demands.csv.quantity` after parsing lot count | `6` |
| `inventoryCoveredQuantity` | Lots fulfilled directly by opening inventory before production is created | Derived by the package generator from `14_inventory_balances.csv`, ordered by earlier `dueMinutes` and then higher `priority` | `2` |
| `plannedQuantity` | Lots that still need actual production tasks | `requestedQuantity - inventoryCoveredQuantity` | `4` |
| `dueMinutes` | Due time offset inside the horizon | Directly from `04_demands.csv.dueMinutes` | `2160` |
| `priority` | Manual business urgency level | Directly from `04_demands.csv.priority` | `4` |

Relationship rule:

- `requestedQuantity = inventoryCoveredQuantity + plannedQuantity`

Example:

- for `dem_a500_1225`, the metadata shows:
  - `requestedQuantity = 6`
  - `inventoryCoveredQuantity = 2`
  - `plannedQuantity = 4`
  - `priority = 4`
- business interpretation:
  - this demand slice asks for `6` A500 lots in total
  - `2` lots are consumed from opening finished-goods inventory
  - the remaining `4` lots are expanded into production operations/tasks

Important note:

- `requestedQuantity` is not solver output; it is the demand input quantity from `04_demands.csv`
- `plannedQuantity` is also not an optimization target by itself; it is the remaining quantity after inventory pre-allocation at scenario-build time

## Operation Field Mapping

In `10_generated_operation_metadata.json`, each row under `operations` represents one generated executable operation node.

| Field | Meaning | Source / Derivation | Example |
| --- | --- | --- | --- |
| `operationId` | Unique operation id | Generated by the sample builder from `demandId + unitIndex + recipe sequence + operationCode` | `dem_a500_1225__u01__01_pack` |
| `demandId` | Parent demand slice id | From `04_demands.csv` | `dem_a500_1225` |
| `demandUnitIndex` | Which lot unit of the demand this operation belongs to | Generated during per-lot expansion | `1` |
| `productCode` | Finished-goods SKU for the demand | From `04_demands.csv.productCode` | `31015630002000000` |
| `recipeId` | Recipe template used to expand this operation | From `03_recipes.csv.recipeId` | `rcp_8a500_pkg_v1` |
| `operationCode` | Short operation stage code | From `03_recipes.csv.operationCode` | `PACK` |
| `operationName` | Human-readable stage name | From `03_recipes.csv.operationName` | `包装` |
| `sequence` | Stage order inside the recipe chain | From `03_recipes.csv.sequence` | `1` |
| `durationMinutes` | Planned processing duration for the operation | From `03_recipes.csv.durationMinutes` | `180` |
| `candidateResourceIds` | Resources that may execute the operation | From `03_recipes.csv.candidateResourceIds` | `pack_l1`, `pack_l2`, `pack_l3` |
| `predecessorOperationIds` | Immediate upstream operation ids | Derived from recipe sequence expansion | `[]` or a predecessor id list |
| `setupGroup` | Changeover family used by setup rules | From `03_recipes.csv.setupGroup` | `PKG_500` |
| `materialInputs` | Materials consumed by this operation | From `03_recipes.csv.materialInputs` after normalization | `BB_A500_LOT`, `CAP_A_LOT`, `CTN_A1_LOT`, `LBL_A1_LOT` |
| `materialOutputs` | Materials produced by this operation | From `03_recipes.csv.materialOutputs` after normalization | `31015630002000000` |
| `dueMinutes` | Due time inherited from the parent demand | From `04_demands.csv.dueMinutes` | `2160` |
| `priority` | Priority inherited from the parent demand | From `04_demands.csv.priority` | `4` |
| `quantity` | Original demand quantity string for the parent slice | From `04_demands.csv.quantity` | `"6"` |
| `fixedResourceId` / `fixedStartMinutes` | Hard first-operation constraints actually applied to this operation | Derived from demand-level pinning and bridge logic | `null` in the current Snow Beer sample |
| `baselinePinnedResourceId` / `baselinePinnedStartMinutes` | Baseline pinned values before bridge adjustment | Derived metadata for auditability | `null` in the current Snow Beer sample |

Reading rule:

- one demand slice may expand into multiple operations
- one lot unit may expand into one or more recipe stages
- therefore `operations` is the executable graph, while `demandCoverages` is the business summary

Base-package interpretation:

- this sample uses one packaging stage per lot, so each planned lot expands into one operation
- therefore for `dem_a500_1225`, `plannedQuantity = 4` becomes `4` generated operations

## Graph Metadata Mapping

The remaining top-level graph fields in `10_generated_operation_metadata.json` are used to describe dependency edges, changeover semantics, and bridge-layer corrections.

| Field | Meaning | Source / Derivation | Current Snow Beer State |
| --- | --- | --- | --- |
| `precedencePairs` | Explicit operation-to-operation dependency edges | Generated from recipe stage order during operation expansion | `[]` in the base package because each lot has only one packaging stage |
| `setupRules` | Changeover-rule snapshot included in the generated scenario | Directly derived from `06_setup_rules.csv` | `6` rules, all `330/500/600ml` cross-volume switches with `60 min` changeover |
| `bridgeAdjustments` | Audit list of compatibility corrections applied while generating the executable request | Generated only when fixed resource / fixed start constraints need relaxation or remapping | `[]` in the current Snow Beer sample |

How to read them:

- `precedencePairs` answers: which operation must finish before another operation can start
- `setupRules` answers: when setup family changes, what extra setup penalty should the solver enforce
- `bridgeAdjustments` answers: did the sample builder have to change an originally requested pinning constraint to keep the scenario executable

Base-package interpretation:

- because every planned lot expands into exactly one operation, there is no intra-lot stage dependency, so `precedencePairs` is empty
- `setupRules` is still active because setup penalties apply across neighboring packaged SKUs on the same line
- `bridgeAdjustments` being empty means the current sample did not require any hidden repair at scenario-build time
