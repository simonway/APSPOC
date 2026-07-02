#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_PACKAGE_DIR = ROOT_DIR / "docs" / "sample-packages" / "UAT_v1_sample_package"
RESOURCE_EXPORT_FIELDS = ["id", "label", "resourceType", "sortOrder"]
TASK_EXPORT_FIELDS = [
    "id",
    "label",
    "productCode",
    "durationMinutes",
    "dueMinutes",
    "priority",
    "candidateResourceIds",
    "pinnedResourceId",
    "pinnedStartMinutes",
    "predecessorTaskIds",
    "setupGroup",
]
DOWNTIME_EXPORT_FIELDS = ["id", "resourceId", "startMinutes", "endMinutes", "downtimeType", "source", "description"]


@dataclass(frozen=True)
class ResourceRow:
    id: str
    label: str
    resource_type: str
    sort_order: int
    capacity: str
    remarks: str


@dataclass(frozen=True)
class MaterialQuantity:
    item_code: str
    quantity: int


@dataclass(frozen=True)
class RecipeRow:
    recipe_id: str
    product_code: str
    operation_code: str
    operation_name: str
    sequence: int
    duration_minutes: int
    candidate_resource_ids: list[str]
    material_inputs: list[MaterialQuantity]
    material_outputs: list[MaterialQuantity]
    setup_group: str
    remarks: str


@dataclass(frozen=True)
class DemandRow:
    demand_id: str
    product_code: str
    quantity: str
    due_minutes: int
    priority: int
    fixed_resource_id: str
    fixed_start_minutes: int | None
    remarks: str


@dataclass(frozen=True)
class DowntimeRow:
    id: str
    resource_id: str
    start_minutes: int
    end_minutes: int
    downtime_type: str
    source: str
    description: str


@dataclass(frozen=True)
class SetupRuleRow:
    from_setup_group: str
    to_setup_group: str
    resource_type: str
    resource_id: str
    setup_minutes: int
    remarks: str


@dataclass(frozen=True)
class InventoryBalanceRow:
    item_code: str
    available_quantity: int
    available_from_minutes: int
    safety_stock_quantity: int


@dataclass(frozen=True)
class FermentationTankRuleRow:
    case_id: str
    expected_outcome: str
    expected_failure_type: str
    tank_id: str
    tank_capacity_units: int
    batch_id: str
    demand_id: str
    product_code: str
    batch_volume_units: int
    mixing_family: str
    occupation_start_minutes: int
    occupation_end_minutes: int
    remarks: str


@dataclass(frozen=True)
class DemandCoveragePlan:
    requested_quantity: int
    inventory_covered_quantity: int
    planned_quantity: int


@dataclass(frozen=True)
class BridgeAdjustment:
    operation_id: str
    demand_id: str
    adjustment_type: str
    message: str
    original_fixed_resource_id: str | None
    original_fixed_start_minutes: int | None
    baseline_pinned_resource_id: str | None
    baseline_pinned_start_minutes: int | None


TANK_RULE_PASS = "PASS"
TANK_RULE_FAIL = "FAIL"
TANK_RULE_NONE = "NONE"
TANK_RULE_FAILURE_TYPES = {TANK_RULE_NONE, "CAPACITY", "NON_MIXING", "OCCUPATION_WINDOW"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a canonical sample package into a current-baseline schedule request and import-ready CSVs."
    )
    parser.add_argument(
        "package_dir",
        nargs="?",
        default=str(DEFAULT_PACKAGE_DIR),
        help="Path to the sample package directory",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate the source CSV files without writing generated outputs",
    )
    return parser.parse_args()


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for row in reader:
            normalized = {key.strip(): (value or "").strip() for key, value in row.items() if key is not None}
            if any(value for value in normalized.values()):
                rows.append(normalized)
        return rows


def split_ids(value: str) -> list[str]:
    if not value:
        return []
    raw_parts = value.replace(",", "|").split("|")
    return [part.strip() for part in raw_parts if part.strip()]


def split_material_tokens(value: str) -> list[str]:
    if not value:
        return []
    normalized = value.replace("，", "|").replace(",", "|").replace(";", "|")
    return [part.strip() for part in normalized.split("|") if part.strip()]


def require_text(row: dict[str, str], field: str, source: str, errors: list[str]) -> str:
    value = row.get(field, "").strip()
    if not value:
        errors.append(f"{source}: missing required field `{field}`")
    return value


def parse_int(value: str, source: str, field: str, errors: list[str], *, minimum: int | None = None) -> int:
    try:
        parsed = int(value)
    except ValueError:
        errors.append(f"{source}: `{field}` must be an integer, got `{value}`")
        return 0
    if minimum is not None and parsed < minimum:
        errors.append(f"{source}: `{field}` must be >= {minimum}, got {parsed}")
    return parsed


def parse_optional_int(value: str, source: str, field: str, errors: list[str], *, minimum: int | None = None) -> int | None:
    if not value:
        return None
    return parse_int(value, source, field, errors, minimum=minimum)


def parse_demand_quantity(value: str, source: str, errors: list[str]) -> int:
    if not value:
        return 1
    return parse_int(value, source, "quantity", errors, minimum=1)


def parse_material_quantity_token(token: str, source: str, field: str, errors: list[str]) -> MaterialQuantity | None:
    parts = token.replace("：", ":").split(":", 1)
    if len(parts) != 2:
        errors.append(f"{source}: `{field}` must use itemCode:quantity pairs, got `{token}`")
        return None
    item_code = parts[0].strip()
    quantity_text = parts[1].strip()
    if not item_code or not quantity_text:
        errors.append(f"{source}: `{field}` must use itemCode:quantity pairs, got `{token}`")
        return None
    quantity = parse_int(quantity_text, source, field, errors, minimum=1)
    return MaterialQuantity(item_code=item_code, quantity=quantity)


def parse_material_quantities(value: str, source: str, field: str, errors: list[str]) -> list[MaterialQuantity]:
    if not value:
        return []
    parsed: list[MaterialQuantity] = []
    trimmed = value.strip()
    if trimmed.startswith("["):
        try:
            payload = json.loads(trimmed)
        except json.JSONDecodeError:
            payload = None
        if isinstance(payload, list):
            for item in payload:
                if isinstance(item, str):
                    material = parse_material_quantity_token(item, source, field, errors)
                elif isinstance(item, dict):
                    item_code = str(item.get("itemCode", "")).strip()
                    quantity_value = str(item.get("quantity", "")).strip()
                    if not item_code or not quantity_value:
                        errors.append(f"{source}: `{field}` must use itemCode:quantity pairs")
                        continue
                    quantity = parse_int(quantity_value, source, field, errors, minimum=1)
                    material = MaterialQuantity(item_code=item_code, quantity=quantity)
                else:
                    errors.append(f"{source}: `{field}` must use itemCode:quantity pairs")
                    continue
                if material is not None:
                    parsed.append(material)
            return parsed
    for token in split_material_tokens(value):
        material = parse_material_quantity_token(token, source, field, errors)
        if material is not None:
            parsed.append(material)
    return parsed


def material_quantities_to_dicts(materials: list[MaterialQuantity]) -> list[dict[str, Any]]:
    return [
        {
            "itemCode": material.item_code,
            "quantity": material.quantity,
        }
        for material in materials
    ]


def material_quantities_to_csv_value(materials: list[MaterialQuantity]) -> str:
    return "|".join(f"{material.item_code}:{material.quantity}" for material in materials)


def load_context(package_dir: Path, errors: list[str]) -> dict[str, Any]:
    context_rows = read_csv_rows(package_dir / "01_request_context.csv")
    context: dict[str, str] = {}
    for index, row in enumerate(context_rows, start=2):
        source = f"01_request_context.csv:{index}"
        field = require_text(row, "field", source, errors)
        value = require_text(row, "value", source, errors)
        if field in context:
            errors.append(f"{source}: duplicate context field `{field}`")
        context[field] = value

    required_fields = [
        "scenarioName",
        "scheduleStartAt",
        "horizonMinutes",
        "objectiveWeights.tardiness",
        "objectiveWeights.makespan",
        "solverConfig.timeLimitSeconds",
        "solverConfig.numSearchWorkers",
        "dataVersion",
    ]
    for field in required_fields:
        if field not in context:
            errors.append(f"01_request_context.csv: missing required field `{field}`")

    return {
        "scenarioName": context.get("scenarioName", ""),
        "dataVersion": context.get("dataVersion", ""),
        "scheduleStartAt": context.get("scheduleStartAt", ""),
        "horizonMinutes": parse_int(context.get("horizonMinutes", "0"), "01_request_context.csv", "horizonMinutes", errors, minimum=1),
        "objectiveWeights": {
            "tardiness": parse_int(
                context.get("objectiveWeights.tardiness", "0"),
                "01_request_context.csv",
                "objectiveWeights.tardiness",
                errors,
                minimum=1,
            ),
            "earliness": parse_int(
                context.get("objectiveWeights.earliness", "0"),
                "01_request_context.csv",
                "objectiveWeights.earliness",
                errors,
                minimum=0,
            ),
            "makespan": parse_int(
                context.get("objectiveWeights.makespan", "0"),
                "01_request_context.csv",
                "objectiveWeights.makespan",
                errors,
                minimum=0,
            ),
        },
        "solverConfig": {
            "timeLimitSeconds": parse_int(
                context.get("solverConfig.timeLimitSeconds", "0"),
                "01_request_context.csv",
                "solverConfig.timeLimitSeconds",
                errors,
                minimum=1,
            ),
            "numSearchWorkers": parse_int(
                context.get("solverConfig.numSearchWorkers", "0"),
                "01_request_context.csv",
                "solverConfig.numSearchWorkers",
                errors,
                minimum=1,
            ),
        },
    }


def load_resources(package_dir: Path, errors: list[str]) -> list[ResourceRow]:
    rows = read_csv_rows(package_dir / "02_resources.csv")
    seen_ids: set[str] = set()
    resources: list[ResourceRow] = []
    for index, row in enumerate(rows, start=2):
        source = f"02_resources.csv:{index}"
        resource_id = require_text(row, "id", source, errors)
        if resource_id in seen_ids:
            errors.append(f"{source}: duplicate resource id `{resource_id}`")
        seen_ids.add(resource_id)
        resources.append(
            ResourceRow(
                id=resource_id,
                label=require_text(row, "label", source, errors),
                resource_type=require_text(row, "resourceType", source, errors),
                sort_order=parse_int(row.get("sortOrder", ""), source, "sortOrder", errors, minimum=0),
                capacity=row.get("capacity", "").strip(),
                remarks=row.get("remarks", "").strip(),
            )
        )
    if not resources:
        errors.append("02_resources.csv: no data rows found")
    return resources


def load_recipes(package_dir: Path, resource_ids: set[str], errors: list[str]) -> list[RecipeRow]:
    rows = read_csv_rows(package_dir / "03_recipes.csv")
    recipes: list[RecipeRow] = []
    seen_keys: set[tuple[str, str, str]] = set()
    for index, row in enumerate(rows, start=2):
        source = f"03_recipes.csv:{index}"
        recipe_id = require_text(row, "recipeId", source, errors)
        product_code = require_text(row, "productCode", source, errors)
        operation_code = require_text(row, "operationCode", source, errors)
        key = (recipe_id, product_code, operation_code)
        if key in seen_keys:
            errors.append(f"{source}: duplicate recipe operation `{recipe_id}/{product_code}/{operation_code}`")
        seen_keys.add(key)
        candidate_resource_ids = split_ids(row.get("candidateResourceIds", ""))
        if not candidate_resource_ids:
            errors.append(f"{source}: `candidateResourceIds` must not be empty")
        for candidate_resource_id in candidate_resource_ids:
            if candidate_resource_id not in resource_ids:
                errors.append(f"{source}: unknown candidate resource `{candidate_resource_id}`")
        recipes.append(
            RecipeRow(
                recipe_id=recipe_id,
                product_code=product_code,
                operation_code=operation_code,
                operation_name=require_text(row, "operationName", source, errors),
                sequence=parse_int(row.get("sequence", ""), source, "sequence", errors, minimum=1),
                duration_minutes=parse_int(row.get("durationMinutes", ""), source, "durationMinutes", errors, minimum=1),
                candidate_resource_ids=candidate_resource_ids,
                material_inputs=parse_material_quantities(row.get("materialInputs", "").strip(), source, "materialInputs", errors),
                material_outputs=parse_material_quantities(row.get("materialOutputs", "").strip(), source, "materialOutputs", errors),
                setup_group=row.get("setupGroup", "").strip(),
                remarks=row.get("remarks", "").strip(),
            )
        )
    if not recipes:
        errors.append("03_recipes.csv: no data rows found")
    return recipes


def load_demands(package_dir: Path, errors: list[str], *, horizon_minutes: int) -> list[DemandRow]:
    rows = read_csv_rows(package_dir / "04_demands.csv")
    demands: list[DemandRow] = []
    seen_ids: set[str] = set()
    for index, row in enumerate(rows, start=2):
        source = f"04_demands.csv:{index}"
        demand_id = require_text(row, "demandId", source, errors)
        if demand_id in seen_ids:
            errors.append(f"{source}: duplicate demand id `{demand_id}`")
        seen_ids.add(demand_id)
        due_minutes = parse_int(row.get("dueMinutes", ""), source, "dueMinutes", errors, minimum=0)
        if due_minutes > horizon_minutes:
            errors.append(f"{source}: `dueMinutes` {due_minutes} exceeds horizon {horizon_minutes}")
        fixed_start_minutes = parse_optional_int(row.get("fixedStartMinutes", ""), source, "fixedStartMinutes", errors, minimum=0)
        if fixed_start_minutes is not None and fixed_start_minutes > horizon_minutes:
            errors.append(f"{source}: `fixedStartMinutes` {fixed_start_minutes} exceeds horizon {horizon_minutes}")
        demands.append(
            DemandRow(
                demand_id=demand_id,
                product_code=require_text(row, "productCode", source, errors),
                quantity=row.get("quantity", "").strip(),
                due_minutes=due_minutes,
                priority=parse_int(row.get("priority", ""), source, "priority", errors, minimum=1),
                fixed_resource_id=row.get("fixedResourceId", "").strip(),
                fixed_start_minutes=fixed_start_minutes,
                remarks=row.get("remarks", "").strip(),
            )
        )
    if not demands:
        errors.append("04_demands.csv: no data rows found")
    return demands


def load_downtimes(package_dir: Path, resource_ids: set[str], errors: list[str], *, horizon_minutes: int) -> list[DowntimeRow]:
    rows = read_csv_rows(package_dir / "05_downtimes.csv")
    downtimes: list[DowntimeRow] = []
    seen_ids: set[str] = set()
    for index, row in enumerate(rows, start=2):
        source = f"05_downtimes.csv:{index}"
        downtime_id = require_text(row, "id", source, errors)
        if downtime_id in seen_ids:
            errors.append(f"{source}: duplicate downtime id `{downtime_id}`")
        seen_ids.add(downtime_id)
        resource_id = require_text(row, "resourceId", source, errors)
        if resource_id not in resource_ids:
            errors.append(f"{source}: unknown resource `{resource_id}`")
        start_minutes = parse_int(row.get("startMinutes", ""), source, "startMinutes", errors, minimum=0)
        end_minutes = parse_int(row.get("endMinutes", ""), source, "endMinutes", errors, minimum=1)
        if end_minutes <= start_minutes:
            errors.append(f"{source}: `endMinutes` must be greater than `startMinutes`")
        if end_minutes > horizon_minutes:
            errors.append(f"{source}: `endMinutes` {end_minutes} exceeds horizon {horizon_minutes}")
        downtimes.append(
            DowntimeRow(
                id=downtime_id,
                resource_id=resource_id,
                start_minutes=start_minutes,
                end_minutes=end_minutes,
                downtime_type=require_text(row, "downtimeType", source, errors),
                source=row.get("source", "").strip() or "MANUAL",
                description=row.get("description", "").strip(),
            )
        )
    return downtimes


def load_setup_rules(package_dir: Path, resource_ids: set[str], resource_types: set[str], known_setup_groups: set[str], errors: list[str]) -> list[SetupRuleRow]:
    rows = read_csv_rows(package_dir / "06_setup_rules.csv")
    setup_rules: list[SetupRuleRow] = []
    for index, row in enumerate(rows, start=2):
        source = f"06_setup_rules.csv:{index}"
        from_setup_group = require_text(row, "fromSetupGroup", source, errors)
        to_setup_group = require_text(row, "toSetupGroup", source, errors)
        resource_type = row.get("resourceType", "").strip()
        resource_id = row.get("resourceId", "").strip()
        if from_setup_group not in known_setup_groups:
            errors.append(f"{source}: unknown `fromSetupGroup` `{from_setup_group}`")
        if to_setup_group not in known_setup_groups:
            errors.append(f"{source}: unknown `toSetupGroup` `{to_setup_group}`")
        if resource_type and resource_type not in resource_types:
            errors.append(f"{source}: unknown `resourceType` `{resource_type}`")
        if resource_id and resource_id not in resource_ids:
            errors.append(f"{source}: unknown `resourceId` `{resource_id}`")
        setup_rules.append(
            SetupRuleRow(
                from_setup_group=from_setup_group,
                to_setup_group=to_setup_group,
                resource_type=resource_type,
                resource_id=resource_id,
                setup_minutes=parse_int(row.get("setupMinutes", ""), source, "setupMinutes", errors, minimum=0),
                remarks=row.get("remarks", "").strip(),
            )
        )
    return setup_rules


def load_inventory_balances(package_dir: Path, errors: list[str], *, horizon_minutes: int) -> list[InventoryBalanceRow]:
    path = package_dir / "14_inventory_balances.csv"
    if not path.exists():
        return []

    rows = read_csv_rows(path)
    inventory_balances: list[InventoryBalanceRow] = []
    seen_item_codes: set[str] = set()
    for index, row in enumerate(rows, start=2):
        source = f"14_inventory_balances.csv:{index}"
        item_code = require_text(row, "itemCode", source, errors)
        if item_code in seen_item_codes:
            errors.append(f"{source}: duplicate inventory itemCode `{item_code}`")
        seen_item_codes.add(item_code)
        available_from_minutes = parse_optional_int(
            row.get("availableFromMinutes", ""),
            source,
            "availableFromMinutes",
            errors,
            minimum=0,
        )
        if available_from_minutes is not None and available_from_minutes > horizon_minutes:
            errors.append(
                f"{source}: `availableFromMinutes` {available_from_minutes} exceeds horizon {horizon_minutes}"
            )
        inventory_balances.append(
            InventoryBalanceRow(
                item_code=item_code,
                available_quantity=parse_int(row.get("availableQuantity", ""), source, "availableQuantity", errors, minimum=0),
                available_from_minutes=available_from_minutes or 0,
                safety_stock_quantity=parse_optional_int(
                    row.get("safetyStockQuantity", ""),
                    source,
                    "safetyStockQuantity",
                    errors,
                    minimum=0,
                )
                or 0,
            )
        )
    if not inventory_balances:
        errors.append("14_inventory_balances.csv: no data rows found")
    return inventory_balances


def load_fermentation_tank_rules(
    package_dir: Path,
    resources_by_id: dict[str, ResourceRow],
    demands_by_id: dict[str, DemandRow],
    errors: list[str],
    *,
    horizon_minutes: int,
) -> list[FermentationTankRuleRow]:
    path = package_dir / "15_fermentation_tank_rules.csv"
    if not path.exists():
        return []

    rows = read_csv_rows(path)
    tank_rules: list[FermentationTankRuleRow] = []
    seen_case_ids: set[str] = set()
    for index, row in enumerate(rows, start=2):
        source = f"15_fermentation_tank_rules.csv:{index}"
        case_id = require_text(row, "caseId", source, errors)
        if case_id in seen_case_ids:
            errors.append(f"{source}: duplicate caseId `{case_id}`")
        seen_case_ids.add(case_id)

        expected_outcome = require_text(row, "expectedOutcome", source, errors).upper()
        expected_failure_type = (row.get("expectedFailureType", "").strip() or TANK_RULE_NONE).upper()
        if expected_outcome not in {TANK_RULE_PASS, TANK_RULE_FAIL}:
            errors.append(f"{source}: expectedOutcome must be PASS or FAIL, got `{expected_outcome}`")
        if expected_failure_type not in TANK_RULE_FAILURE_TYPES:
            errors.append(
                f"{source}: expectedFailureType must be one of {', '.join(sorted(TANK_RULE_FAILURE_TYPES))}, "
                f"got `{expected_failure_type}`"
            )
        if expected_outcome == TANK_RULE_PASS and expected_failure_type != TANK_RULE_NONE:
            errors.append(f"{source}: PASS cases must use expectedFailureType NONE")
        if expected_outcome == TANK_RULE_FAIL and expected_failure_type == TANK_RULE_NONE:
            errors.append(f"{source}: FAIL cases must provide a concrete expectedFailureType")

        tank_id = require_text(row, "tankId", source, errors)
        tank = resources_by_id.get(tank_id)
        if tank is None:
            errors.append(f"{source}: unknown tankId `{tank_id}`")
        elif tank.resource_type != "TANK":
            errors.append(f"{source}: tankId `{tank_id}` references resourceType `{tank.resource_type}`, expected TANK")

        demand_id = require_text(row, "demandId", source, errors)
        demand = demands_by_id.get(demand_id)
        product_code = require_text(row, "productCode", source, errors)
        if demand is None:
            errors.append(f"{source}: unknown demandId `{demand_id}`")
        elif demand.product_code != product_code:
            errors.append(
                f"{source}: productCode `{product_code}` does not match demand `{demand_id}` product `{demand.product_code}`"
            )

        occupation_start_minutes = parse_int(
            row.get("occupationStartMinutes", ""),
            source,
            "occupationStartMinutes",
            errors,
            minimum=0,
        )
        occupation_end_minutes = parse_int(
            row.get("occupationEndMinutes", ""),
            source,
            "occupationEndMinutes",
            errors,
            minimum=1,
        )
        if occupation_end_minutes <= occupation_start_minutes:
            errors.append(f"{source}: occupationEndMinutes must be greater than occupationStartMinutes")
        if occupation_end_minutes > horizon_minutes:
            errors.append(f"{source}: occupationEndMinutes {occupation_end_minutes} exceeds horizon {horizon_minutes}")

        tank_rules.append(
            FermentationTankRuleRow(
                case_id=case_id,
                expected_outcome=expected_outcome,
                expected_failure_type=expected_failure_type,
                tank_id=tank_id,
                tank_capacity_units=parse_int(
                    row.get("tankCapacityUnits", ""),
                    source,
                    "tankCapacityUnits",
                    errors,
                    minimum=1,
                ),
                batch_id=require_text(row, "batchId", source, errors),
                demand_id=demand_id,
                product_code=product_code,
                batch_volume_units=parse_int(
                    row.get("batchVolumeUnits", ""),
                    source,
                    "batchVolumeUnits",
                    errors,
                    minimum=1,
                ),
                mixing_family=require_text(row, "mixingFamily", source, errors),
                occupation_start_minutes=occupation_start_minutes,
                occupation_end_minutes=occupation_end_minutes,
                remarks=row.get("remarks", "").strip(),
            )
        )
    if not tank_rules:
        errors.append("15_fermentation_tank_rules.csv: no data rows found")
    return tank_rules


def validate_recipe_sequences(recipes: list[RecipeRow], errors: list[str]) -> None:
    recipes_by_product: dict[str, list[RecipeRow]] = defaultdict(list)
    for recipe in recipes:
        recipes_by_product[recipe.product_code].append(recipe)

    for product_code, product_recipes in recipes_by_product.items():
        sorted_recipes = sorted(product_recipes, key=lambda item: item.sequence)
        expected_sequence = 1
        for recipe in sorted_recipes:
            if recipe.sequence != expected_sequence:
                errors.append(
                    f"03_recipes.csv: product `{product_code}` has non-contiguous sequence. Expected {expected_sequence}, got {recipe.sequence}"
                )
                expected_sequence = recipe.sequence
            expected_sequence += 1


def validate_inventory_balances(
    recipes: list[RecipeRow],
    demands: list[DemandRow],
    inventory_balances: list[InventoryBalanceRow],
    errors: list[str],
) -> None:
    known_item_codes = {recipe.product_code for recipe in recipes}
    known_item_codes.update(demand.product_code for demand in demands)
    for recipe in recipes:
        known_item_codes.update(material.item_code for material in recipe.material_inputs)
        known_item_codes.update(material.item_code for material in recipe.material_outputs)

    for inventory_balance in inventory_balances:
        if inventory_balance.item_code not in known_item_codes:
            errors.append(
                "14_inventory_balances.csv: inventory itemCode "
                f"`{inventory_balance.item_code}` is not referenced by recipes or demands"
            )


def build_inventory_balances_by_item_code(
    inventory_balances: list[InventoryBalanceRow],
) -> dict[str, InventoryBalanceRow]:
    return {inventory_balance.item_code: inventory_balance for inventory_balance in inventory_balances}


def plan_demand_coverage(
    demands: list[DemandRow],
    inventory_balances_by_item_code: dict[str, InventoryBalanceRow],
    errors: list[str],
) -> dict[str, DemandCoveragePlan]:
    remaining_inventory_by_item_code = {
        item_code: max(0, inventory_balance.available_quantity - inventory_balance.safety_stock_quantity)
        for item_code, inventory_balance in inventory_balances_by_item_code.items()
    }

    indexed_demands = list(enumerate(demands))
    indexed_demands.sort(key=lambda item: (item[1].due_minutes, -item[1].priority, item[0]))

    demand_coverage_by_demand_id: dict[str, DemandCoveragePlan] = {}
    for original_index, demand in indexed_demands:
        source = f"04_demands.csv:{original_index + 2}"
        requested_quantity = parse_demand_quantity(demand.quantity, source, errors)
        inventory_covered_quantity = 0
        inventory_balance = inventory_balances_by_item_code.get(demand.product_code)
        if inventory_balance and inventory_balance.available_from_minutes <= demand.due_minutes:
            remaining_inventory = remaining_inventory_by_item_code.get(inventory_balance.item_code, 0)
            inventory_covered_quantity = min(requested_quantity, remaining_inventory)
            remaining_inventory_by_item_code[inventory_balance.item_code] = remaining_inventory - inventory_covered_quantity
        demand_coverage_by_demand_id[demand.demand_id] = DemandCoveragePlan(
            requested_quantity=requested_quantity,
            inventory_covered_quantity=inventory_covered_quantity,
            planned_quantity=requested_quantity - inventory_covered_quantity,
        )
    return demand_coverage_by_demand_id


def resolve_operation_material_outputs(product_recipes: list[RecipeRow], recipe: RecipeRow) -> list[MaterialQuantity]:
    if recipe.material_outputs:
        return list(recipe.material_outputs)
    if product_recipes and recipe.sequence == product_recipes[-1].sequence:
        return [MaterialQuantity(item_code=recipe.product_code, quantity=1)]
    return []


def build_operation_id(
    demand_id: str,
    unit_index: int,
    requested_quantity: int,
    planned_quantity: int,
    sequence: int,
    operation_code: str,
) -> str:
    if requested_quantity == 1 and planned_quantity == 1:
        return f"{demand_id}__{sequence:02d}_{operation_code.lower()}"
    return f"{demand_id}__u{unit_index:02d}__{sequence:02d}_{operation_code.lower()}"


def build_operation_label(
    demand_id: str,
    operation_name: str,
    unit_index: int,
    requested_quantity: int,
    planned_quantity: int,
) -> str:
    if requested_quantity == 1 and planned_quantity == 1:
        return f"{demand_id} / {operation_name}"
    return f"{demand_id} / U{unit_index:02d} / {operation_name}"


def overlaps(start_minutes: int, end_minutes: int, other_start_minutes: int, other_end_minutes: int) -> bool:
    return start_minutes < other_end_minutes and other_start_minutes < end_minutes


def analyze_fermentation_tank_rules(
    tank_rules: list[FermentationTankRuleRow],
    errors: list[str],
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    if not tank_rules:
        return [], None

    failures_by_case_id: dict[str, set[str]] = {rule.case_id: set() for rule in tank_rules}
    conflicts_by_case_id: dict[str, set[str]] = {rule.case_id: set() for rule in tank_rules}
    rules_by_case_id = {rule.case_id: rule for rule in tank_rules}

    for rule in tank_rules:
        if rule.batch_volume_units > rule.tank_capacity_units:
            failures_by_case_id[rule.case_id].add("CAPACITY")

    for index, rule in enumerate(tank_rules):
        for other_rule in tank_rules[index + 1 :]:
            if rule.tank_id != other_rule.tank_id:
                continue
            if not overlaps(
                rule.occupation_start_minutes,
                rule.occupation_end_minutes,
                other_rule.occupation_start_minutes,
                other_rule.occupation_end_minutes,
            ):
                continue
            if rule.batch_volume_units + other_rule.batch_volume_units > min(
                rule.tank_capacity_units,
                other_rule.tank_capacity_units,
            ):
                failures_by_case_id[rule.case_id].add("CAPACITY")
                failures_by_case_id[other_rule.case_id].add("CAPACITY")
                conflicts_by_case_id[rule.case_id].add(other_rule.case_id)
                conflicts_by_case_id[other_rule.case_id].add(rule.case_id)
            if rule.mixing_family != other_rule.mixing_family:
                failures_by_case_id[rule.case_id].add("NON_MIXING")
                failures_by_case_id[other_rule.case_id].add("NON_MIXING")
                conflicts_by_case_id[rule.case_id].add(other_rule.case_id)
                conflicts_by_case_id[other_rule.case_id].add(rule.case_id)

    cases: list[dict[str, Any]] = []
    mismatches: list[str] = []
    for rule in tank_rules:
        observed_failure_types = sorted(failures_by_case_id[rule.case_id])
        observed_outcome = TANK_RULE_FAIL if observed_failure_types else TANK_RULE_PASS
        expected_matches = observed_outcome == rule.expected_outcome
        if rule.expected_outcome == TANK_RULE_FAIL:
            expected_matches = expected_matches and rule.expected_failure_type in observed_failure_types
        elif rule.expected_failure_type != TANK_RULE_NONE:
            expected_matches = False
        if not expected_matches:
            mismatches.append(
                f"{rule.case_id}: expected {rule.expected_outcome}/{rule.expected_failure_type}, "
                f"observed {observed_outcome}/{','.join(observed_failure_types) or TANK_RULE_NONE}"
            )

        cases.append(
            {
                "caseId": rule.case_id,
                "expectedOutcome": rule.expected_outcome,
                "expectedFailureType": rule.expected_failure_type,
                "observedOutcome": observed_outcome,
                "observedFailureTypes": observed_failure_types,
                "expectedMatchesObserved": expected_matches,
                "tankId": rule.tank_id,
                "tankCapacityUnits": rule.tank_capacity_units,
                "batchId": rule.batch_id,
                "demandId": rule.demand_id,
                "productCode": rule.product_code,
                "batchVolumeUnits": rule.batch_volume_units,
                "mixingFamily": rule.mixing_family,
                "occupationStartMinutes": rule.occupation_start_minutes,
                "occupationEndMinutes": rule.occupation_end_minutes,
                "conflictsWithCaseIds": sorted(conflicts_by_case_id[rule.case_id]),
                "remarks": rule.remarks,
            }
        )

    if mismatches:
        errors.append("15_fermentation_tank_rules.csv: expectation mismatch: " + "; ".join(mismatches))

    summary = {
        "caseCount": len(tank_rules),
        "expectedPassCount": sum(1 for rule in tank_rules if rule.expected_outcome == TANK_RULE_PASS),
        "expectedFailCount": sum(1 for rule in tank_rules if rule.expected_outcome == TANK_RULE_FAIL),
        "observedPassCount": sum(1 for case in cases if case["observedOutcome"] == TANK_RULE_PASS),
        "observedFailCount": sum(1 for case in cases if case["observedOutcome"] == TANK_RULE_FAIL),
        "expectationMismatchCount": len(mismatches),
        "failureTypes": sorted({failure_type for case in cases for failure_type in case["observedFailureTypes"]}),
        "contractOnly": True,
        "contractNote": (
            "Fermentation tank rule rows are static contract checks for future solver/backend work; "
            "they do not change the current schedule request."
        ),
    }
    return cases, summary


def interval_conflicts_with_downtime(
    resource_id: str,
    start_minutes: int,
    duration_minutes: int,
    downtimes_by_resource: dict[str, list[DowntimeRow]],
    *,
    horizon_minutes: int,
) -> tuple[bool, str | None]:
    end_minutes = start_minutes + duration_minutes
    if end_minutes > horizon_minutes:
        return True, f"fixed interval [{start_minutes}, {end_minutes}) exceeds horizon {horizon_minutes}"

    overlapping_downtimes = [
        downtime
        for downtime in downtimes_by_resource.get(resource_id, [])
        if overlaps(start_minutes, end_minutes, downtime.start_minutes, downtime.end_minutes)
    ]
    if not overlapping_downtimes:
        return False, None

    downtime_ranges = ", ".join(
        f"{downtime.id}[{downtime.start_minutes},{downtime.end_minutes})"
        for downtime in overlapping_downtimes
    )
    return True, f"fixed interval [{start_minutes}, {end_minutes}) overlaps downtime {downtime_ranges}"


def material_item_codes(materials: Any) -> list[str]:
    if not isinstance(materials, list):
        return []
    codes: list[str] = []
    for material in materials:
        if isinstance(material, dict):
            item_code = str(material.get("itemCode", "")).strip()
            if item_code:
                codes.append(item_code)
    return codes


def format_item_codes(item_codes: list[str]) -> str:
    unique_codes = list(dict.fromkeys(item_codes))
    return ", ".join(f"`{item_code}`" for item_code in unique_codes)


def build_maturity_wait_checks(operations: list[dict[str, Any]]) -> list[str]:
    operations_by_id = {
        str(operation.get("operationId", "")): operation
        for operation in operations
        if operation.get("operationId")
    }
    maturity_operations = [
        operation
        for operation in operations
        if operation.get("operationCode") == "MATURATION_WAIT"
    ]
    if not maturity_operations:
        return []

    checks = ["- Generated operation metadata includes the `MATURATION_WAIT` maturity proxy operation."]
    for maturity_operation in maturity_operations:
        maturity_operation_id = str(maturity_operation.get("operationId", ""))
        predecessor_operations = [
            operations_by_id[predecessor_id]
            for predecessor_id in maturity_operation.get("predecessorOperationIds", [])
            if predecessor_id in operations_by_id
        ]
        successor_operations = [
            operation
            for operation in operations
            if maturity_operation_id in operation.get("predecessorOperationIds", [])
        ]
        predecessor_codes = {operation.get("operationCode") for operation in predecessor_operations}
        successor_codes = {operation.get("operationCode") for operation in successor_operations}
        if "FERMENTATION" in predecessor_codes and "FILTRATION" in successor_codes:
            checks.append("- The maturity proxy sits between fermentation and filtration in the operation chain.")

        input_codes = material_item_codes(maturity_operation.get("materialInputs"))
        output_codes = material_item_codes(maturity_operation.get("materialOutputs"))
        if input_codes and output_codes:
            checks.append(
                f"- `MATURATION_WAIT` consumes {format_item_codes(input_codes)} and outputs {format_item_codes(output_codes)}."
            )

        filtration_input_codes: list[str] = []
        for successor_operation in successor_operations:
            if successor_operation.get("operationCode") == "FILTRATION":
                filtration_input_codes.extend(material_item_codes(successor_operation.get("materialInputs")))
        matured_codes = [item_code for item_code in output_codes if item_code in filtration_input_codes]
        if matured_codes:
            checks.append(
                f"- Filtration consumes {format_item_codes(matured_codes)}, proving filtration cannot bypass the maturity proxy."
            )

    checks.append("- This is a POC maturity-window approximation, not exact fermentation tank residency support.")
    return checks


def build_expected_checks(
    context: dict[str, Any],
    resources: list[ResourceRow],
    demands: list[DemandRow],
    inventory_balances: list[InventoryBalanceRow],
    downtimes: list[DowntimeRow],
    setup_rules: list[SetupRuleRow],
    operations: list[dict[str, Any]],
    precedence_pairs: list[dict[str, str]],
    bridge_adjustments: list[BridgeAdjustment],
    tank_rule_cases: list[dict[str, Any]],
    tank_rule_summary: dict[str, Any] | None,
    requested_demand_quantity: int,
    planned_demand_quantity: int,
    inventory_covered_quantity: int,
) -> str:
    fixed_operation_count = sum(1 for demand in demands if demand.fixed_resource_id or demand.fixed_start_minutes is not None)
    products = sorted({operation["productCode"] for operation in operations})

    semantic_checks = [
        "- Each demand expands into a linear operation chain in `10_generated_operation_metadata.json`.",
        "- Every non-first operation must list exactly one predecessor operation id.",
    ]
    if setup_rules:
        semantic_checks.append("- Setup rules cover cross-family switches used by the sample setup groups.")
    semantic_checks.extend(build_maturity_wait_checks(operations))
    if tank_rule_summary is not None:
        semantic_checks.extend(
            [
                "- `15_fermentation_tank_rules.csv` is parsed as a static contract check for future tank-rule work.",
                f"- Fermentation tank rule cases: `{tank_rule_summary['caseCount']}` "
                f"(`{tank_rule_summary['expectedPassCount']}` expected PASS, "
                f"`{tank_rule_summary['expectedFailCount']}` expected FAIL).",
                "- Tank-rule PASS/FAIL expectations must match static capacity and non-mixing analysis.",
                "- Tank-rule contract checks do not change the current schedule request or claim solver enforcement.",
            ]
        )
        for case in tank_rule_cases:
            if case["observedOutcome"] == TANK_RULE_FAIL:
                semantic_checks.append(
                    f"- Tank-rule case `{case['caseId']}` is expected to fail with "
                    f"`{case['expectedFailureType']}` and conflicts with "
                    f"`{', '.join(case['conflictsWithCaseIds']) or 'no peer case'}`."
                )
    semantic_checks.extend(
        [
            "- Every operation should preserve the recipe-level material inputs and resolved material outputs.",
            "- Demand-level fixed resource and fixed start are intentionally mapped onto the first operation only.",
        ]
    )

    return "\n".join(
        [
            "# Sample Package Expected Checks",
            "",
            "## Sample Summary",
            "",
            f"- dataVersion: `{context['dataVersion']}`",
            f"- scheduleStartAt: `{context['scheduleStartAt']}`",
            f"- horizonMinutes: `{context['horizonMinutes']}`",
            f"- resources: `{len(resources)}`",
            f"- demands: `{len(demands)}`",
            f"- requested demand quantity: `{requested_demand_quantity}`",
            f"- planned demand quantity: `{planned_demand_quantity}`",
            f"- inventory-covered demand quantity: `{inventory_covered_quantity}`",
            f"- inventory balances: `{len(inventory_balances)}`",
            f"- inventory demands: `{len(demands)}`",
            f"- generated operations/tasks: `{len(operations)}`",
            f"- downtimes: `{len(downtimes)}`",
            f"- setup rules: `{len(setup_rules)}`",
            f"- fermentation tank rule cases: `{tank_rule_summary['caseCount'] if tank_rule_summary else 0}`",
            f"- precedence pairs: `{len(precedence_pairs)}`",
            f"- fixed first-operation constraints: `{fixed_operation_count}`",
            f"- baseline bridge adjustments: `{len(bridge_adjustments)}`",
            f"- product codes: `{', '.join(products)}`",
            "",
            "## Baseline Checks",
            "",
            "- Canonical `03/04/05/06/14` CSV files should pass the current import-batch endpoints without manual edits.",
            "- Legacy `11/12/13` CSV exports should still pass the current flat `resources/tasks/downtimes` import endpoints.",
            "- `08_generated_schedule_request.json` should be directly submittable to `POST /api/v1/schedule/jobs`.",
            "- All generated task candidate resources must exist in `02_resources.csv`.",
            "- All generated predecessor ids must point to other generated task ids.",
            "- All generated task `materialInputs/materialOutputs` must use positive integer quantities.",
            "- All generated downtimes must stay within the request horizon.",
            "- Any baseline bridge adjustments should be reviewable in `10_generated_operation_metadata.json` under `bridgeAdjustments`.",
            "",
            "## Semantic Checks",
            "",
            *semantic_checks,
            "",
            "## Known Bridge Limits",
            "",
            "- `12_import_ready_tasks.csv` is a legacy flat-task compatibility export and does not carry material IO because the current task import endpoint does not support those columns.",
            "- If a fixed first-operation interval conflicts with a hard downtime window, the baseline request may relax `pinnedStartMinutes` while retaining the original constraint in metadata.",
            "- Finished-goods inventory coverage is supported by the generator; interpret the exact inventory emphasis from the package README because some samples focus on raw materials while others also use opening finished-goods stock.",
            "- Use `10_generated_operation_metadata.json` as the semantic source of truth for future V2/V3 solver and import work.",
        ]
    )


def build_outputs(
    context: dict[str, Any],
    resources: list[ResourceRow],
    recipes: list[RecipeRow],
    demands: list[DemandRow],
    downtimes: list[DowntimeRow],
    setup_rules: list[SetupRuleRow],
    inventory_balances: list[InventoryBalanceRow],
    tank_rules: list[FermentationTankRuleRow],
    errors: list[str],
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, str]], list[dict[str, str]], list[dict[str, str]], str]:
    recipes_by_product: dict[str, list[RecipeRow]] = defaultdict(list)
    for recipe in recipes:
        recipes_by_product[recipe.product_code].append(recipe)
    for product_code in recipes_by_product:
        recipes_by_product[product_code].sort(key=lambda item: item.sequence)
    downtimes_by_resource: dict[str, list[DowntimeRow]] = defaultdict(list)
    for downtime in downtimes:
        downtimes_by_resource[downtime.resource_id].append(downtime)
    inventory_balances_by_item_code = build_inventory_balances_by_item_code(inventory_balances)
    demand_coverage_by_demand_id = plan_demand_coverage(demands, inventory_balances_by_item_code, errors)
    tank_rule_cases, tank_rule_summary = analyze_fermentation_tank_rules(tank_rules, errors)

    tasks: list[dict[str, Any]] = []
    operations: list[dict[str, Any]] = []
    precedence_pairs: list[dict[str, str]] = []
    demand_coverages: list[dict[str, Any]] = []
    bridge_adjustments: list[BridgeAdjustment] = []
    requested_demand_quantity = 0
    planned_demand_quantity = 0
    inventory_covered_quantity = 0

    for demand in demands:
        demand_coverage = demand_coverage_by_demand_id.get(demand.demand_id)
        if demand_coverage is None:
            errors.append(f"04_demands.csv: missing demand coverage for `{demand.demand_id}`")
            continue

        requested_demand_quantity += demand_coverage.requested_quantity
        planned_demand_quantity += demand_coverage.planned_quantity
        inventory_covered_quantity += demand_coverage.inventory_covered_quantity
        demand_coverages.append(
            {
                "demandId": demand.demand_id,
                "productCode": demand.product_code,
                "requestedQuantity": demand_coverage.requested_quantity,
                "inventoryCoveredQuantity": demand_coverage.inventory_covered_quantity,
                "plannedQuantity": demand_coverage.planned_quantity,
                "dueMinutes": demand.due_minutes,
                "priority": demand.priority,
            }
        )

        if demand_coverage.planned_quantity == 0:
            continue

        product_recipes = recipes_by_product.get(demand.product_code)
        if not product_recipes:
            errors.append(f"04_demands.csv: demand `{demand.demand_id}` references unknown productCode `{demand.product_code}`")
            continue
        if demand.fixed_resource_id and demand.fixed_resource_id not in product_recipes[0].candidate_resource_ids:
            errors.append(
                f"04_demands.csv: demand `{demand.demand_id}` fixedResourceId `{demand.fixed_resource_id}` is not in the first operation candidate resources"
            )
        if (demand.fixed_resource_id or demand.fixed_start_minutes is not None) and demand_coverage.planned_quantity > 1:
            errors.append(
                f"04_demands.csv: demand `{demand.demand_id}` uses fixedResourceId/fixedStartMinutes but requires "
                f"{demand_coverage.planned_quantity} planned units after inventory coverage"
            )

        for unit_index in range(1, demand_coverage.planned_quantity + 1):
            previous_operation_id: str | None = None
            for recipe in product_recipes:
                operation_id = build_operation_id(
                    demand.demand_id,
                    unit_index,
                    demand_coverage.requested_quantity,
                    demand_coverage.planned_quantity,
                    recipe.sequence,
                    recipe.operation_code,
                )
                operation_fixed_resource_id = demand.fixed_resource_id if recipe.sequence == 1 and demand.fixed_resource_id else None
                operation_fixed_start_minutes = demand.fixed_start_minutes if recipe.sequence == 1 else None
                pinned_resource_id = operation_fixed_resource_id
                pinned_start_minutes = operation_fixed_start_minutes
                material_inputs = list(recipe.material_inputs)
                material_outputs = resolve_operation_material_outputs(product_recipes, recipe)

                if pinned_start_minutes is not None:
                    if pinned_resource_id:
                        has_conflict, reason = interval_conflicts_with_downtime(
                            pinned_resource_id,
                            pinned_start_minutes,
                            recipe.duration_minutes,
                            downtimes_by_resource,
                            horizon_minutes=context["horizonMinutes"],
                        )
                        if has_conflict:
                            pinned_start_minutes = None
                            bridge_adjustments.append(
                                BridgeAdjustment(
                                    operation_id=operation_id,
                                    demand_id=demand.demand_id,
                                    adjustment_type="RELAX_PINNED_START",
                                    message=(
                                        "Baseline request removed pinnedStartMinutes because the fixed start conflicts with "
                                        f"the fixed resource availability: {reason}"
                                    ),
                                    original_fixed_resource_id=operation_fixed_resource_id,
                                    original_fixed_start_minutes=operation_fixed_start_minutes,
                                    baseline_pinned_resource_id=pinned_resource_id,
                                    baseline_pinned_start_minutes=pinned_start_minutes,
                                )
                            )
                    else:
                        feasible_resource_ids = [
                            candidate_resource_id
                            for candidate_resource_id in recipe.candidate_resource_ids
                            if not interval_conflicts_with_downtime(
                                candidate_resource_id,
                                pinned_start_minutes,
                                recipe.duration_minutes,
                                downtimes_by_resource,
                                horizon_minutes=context["horizonMinutes"],
                            )[0]
                        ]
                        if not feasible_resource_ids:
                            pinned_start_minutes = None
                            bridge_adjustments.append(
                                BridgeAdjustment(
                                    operation_id=operation_id,
                                    demand_id=demand.demand_id,
                                    adjustment_type="RELAX_PINNED_START",
                                    message=(
                                        "Baseline request removed pinnedStartMinutes because no candidate resource is "
                                        f"available for the fixed interval [{operation_fixed_start_minutes}, "
                                        f"{operation_fixed_start_minutes + recipe.duration_minutes})"
                                    ),
                                    original_fixed_resource_id=operation_fixed_resource_id,
                                    original_fixed_start_minutes=operation_fixed_start_minutes,
                                    baseline_pinned_resource_id=pinned_resource_id,
                                    baseline_pinned_start_minutes=pinned_start_minutes,
                                )
                            )
                predecessor_ids = [previous_operation_id] if previous_operation_id else []
                task_payload: dict[str, Any] = {
                    "id": operation_id,
                    "label": build_operation_label(
                        demand.demand_id,
                        recipe.operation_name,
                        unit_index,
                        demand_coverage.requested_quantity,
                        demand_coverage.planned_quantity,
                    ),
                    "productCode": demand.product_code,
                    "durationMinutes": recipe.duration_minutes,
                    "dueMinutes": demand.due_minutes,
                    "priority": demand.priority,
                    "candidateResourceIds": list(recipe.candidate_resource_ids),
                    "predecessorTaskIds": predecessor_ids,
                    "materialInputs": material_quantities_to_dicts(material_inputs),
                    "materialOutputs": material_quantities_to_dicts(material_outputs),
                }
                if recipe.setup_group:
                    task_payload["setupGroup"] = recipe.setup_group
                if pinned_resource_id:
                    task_payload["pinnedResourceId"] = pinned_resource_id
                if pinned_start_minutes is not None:
                    task_payload["pinnedStartMinutes"] = pinned_start_minutes
                tasks.append(task_payload)

                if previous_operation_id:
                    precedence_pairs.append({"from": previous_operation_id, "to": operation_id})
                operations.append(
                    {
                        "operationId": operation_id,
                        "demandId": demand.demand_id,
                        "demandUnitIndex": unit_index,
                        "productCode": demand.product_code,
                        "recipeId": recipe.recipe_id,
                        "operationCode": recipe.operation_code,
                        "operationName": recipe.operation_name,
                        "sequence": recipe.sequence,
                        "durationMinutes": recipe.duration_minutes,
                        "candidateResourceIds": list(recipe.candidate_resource_ids),
                        "predecessorOperationIds": predecessor_ids,
                        "setupGroup": recipe.setup_group or None,
                        "materialInputs": material_quantities_to_dicts(material_inputs),
                        "materialOutputs": material_quantities_to_dicts(material_outputs),
                        "dueMinutes": demand.due_minutes,
                        "priority": demand.priority,
                        "quantity": demand.quantity,
                        "fixedResourceId": operation_fixed_resource_id,
                        "fixedStartMinutes": operation_fixed_start_minutes,
                        "baselinePinnedResourceId": pinned_resource_id,
                        "baselinePinnedStartMinutes": pinned_start_minutes,
                    }
                )
                previous_operation_id = operation_id

    schedule_request = {
        "scenarioName": context["scenarioName"],
        "dataVersion": context["dataVersion"],
        "scheduleStartAt": context["scheduleStartAt"],
        "horizonMinutes": context["horizonMinutes"],
        "resources": [
            {
                "id": resource.id,
                "label": resource.label,
                "resourceType": resource.resource_type,
                "sortOrder": resource.sort_order,
            }
            for resource in resources
        ],
        "tasks": tasks,
        "downtimes": [
            {
                "id": downtime.id,
                "resourceId": downtime.resource_id,
                "startMinutes": downtime.start_minutes,
                "endMinutes": downtime.end_minutes,
                "downtimeType": downtime.downtime_type,
                "source": downtime.source,
                "description": downtime.description,
            }
            for downtime in downtimes
        ],
        "setupRules": [
            {
                "fromSetupGroup": rule.from_setup_group,
                "toSetupGroup": rule.to_setup_group,
                "resourceType": rule.resource_type or None,
                "resourceId": rule.resource_id or None,
                "setupMinutes": rule.setup_minutes,
            }
            for rule in setup_rules
        ],
        "inventoryBalances": [
            {
                "itemCode": inventory_balance.item_code,
                "availableQuantity": inventory_balance.available_quantity,
                "availableFromMinutes": inventory_balance.available_from_minutes,
                "safetyStockQuantity": inventory_balance.safety_stock_quantity,
            }
            for inventory_balance in inventory_balances
        ],
        "inventoryDemands": [
            {
                "demandId": demand.demand_id,
                "itemCode": demand.product_code,
                "quantity": demand_coverage_by_demand_id[demand.demand_id].requested_quantity,
                "dueMinutes": demand.due_minutes,
            }
            for demand in demands
        ],
        "objectiveWeights": context["objectiveWeights"],
        "solverConfig": context["solverConfig"],
    }

    operation_metadata = {
        "scenarioName": context["scenarioName"],
        "dataVersion": context["dataVersion"],
        "scheduleStartAt": context["scheduleStartAt"],
        "horizonMinutes": context["horizonMinutes"],
        "requestedDemandQuantity": requested_demand_quantity,
        "plannedDemandQuantity": planned_demand_quantity,
        "inventoryBalanceCount": len(inventory_balances),
        "inventoryDemandCount": len(demands),
        "inventoryCoveredQuantity": inventory_covered_quantity,
        "operationCount": len(operations),
        "demandCount": len(demands),
        "resourceCount": len(resources),
        "downtimeCount": len(downtimes),
        "setupRuleCount": len(setup_rules),
        "fermentationTankRuleCaseCount": tank_rule_summary["caseCount"] if tank_rule_summary else 0,
        "precedencePairCount": len(precedence_pairs),
        "bridgeAdjustmentCount": len(bridge_adjustments),
        "demandCoverages": demand_coverages,
        "inventoryBalances": schedule_request["inventoryBalances"],
        "inventoryDemands": schedule_request["inventoryDemands"],
        "operations": operations,
        "precedencePairs": precedence_pairs,
        "setupRules": [
            {
                "fromSetupGroup": rule.from_setup_group,
                "toSetupGroup": rule.to_setup_group,
                "resourceType": rule.resource_type or None,
                "resourceId": rule.resource_id or None,
                "setupMinutes": rule.setup_minutes,
            }
            for rule in setup_rules
        ],
        "fermentationTankRuleSummary": tank_rule_summary,
        "fermentationTankRuleCases": tank_rule_cases,
        "bridgeAdjustments": [
            {
                "operationId": adjustment.operation_id,
                "demandId": adjustment.demand_id,
                "adjustmentType": adjustment.adjustment_type,
                "message": adjustment.message,
                "originalFixedResourceId": adjustment.original_fixed_resource_id,
                "originalFixedStartMinutes": adjustment.original_fixed_start_minutes,
                "baselinePinnedResourceId": adjustment.baseline_pinned_resource_id,
                "baselinePinnedStartMinutes": adjustment.baseline_pinned_start_minutes,
            }
            for adjustment in bridge_adjustments
        ],
    }

    resources_csv = [
        {
            "id": resource.id,
            "label": resource.label,
            "resourceType": resource.resource_type,
            "sortOrder": str(resource.sort_order),
        }
        for resource in resources
    ]
    tasks_csv = [
        {
            "id": task["id"],
            "label": task["label"],
            "productCode": task["productCode"],
            "durationMinutes": str(task["durationMinutes"]),
            "dueMinutes": str(task["dueMinutes"]),
            "priority": str(task["priority"]),
            "candidateResourceIds": ",".join(task["candidateResourceIds"]),
            "pinnedResourceId": str(task.get("pinnedResourceId", "")),
            "pinnedStartMinutes": "" if task.get("pinnedStartMinutes") is None else str(task["pinnedStartMinutes"]),
            "predecessorTaskIds": "|".join(task.get("predecessorTaskIds", [])),
            "setupGroup": str(task.get("setupGroup", "") or ""),
        }
        for task in tasks
    ]
    downtimes_csv = [
        {
            "id": downtime.id,
            "resourceId": downtime.resource_id,
            "startMinutes": str(downtime.start_minutes),
            "endMinutes": str(downtime.end_minutes),
            "downtimeType": downtime.downtime_type,
            "source": downtime.source,
            "description": downtime.description,
        }
        for downtime in downtimes
    ]

    expected_checks = build_expected_checks(
        context,
        resources,
        demands,
        inventory_balances,
        downtimes,
        setup_rules,
        operations,
        precedence_pairs,
        bridge_adjustments,
        tank_rule_cases,
        tank_rule_summary,
        requested_demand_quantity,
        planned_demand_quantity,
        inventory_covered_quantity,
    )

    return schedule_request, operation_metadata, resources_csv, tasks_csv, downtimes_csv, expected_checks


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, str]], *, fieldnames: list[str] | None = None) -> None:
    if rows:
        resolved_fieldnames = fieldnames or list(rows[0].keys())
    elif fieldnames:
        resolved_fieldnames = fieldnames
    else:
        raise ValueError(f"Cannot write empty CSV `{path}` without fieldnames")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=resolved_fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    args = parse_args()
    package_dir = Path(args.package_dir).resolve()
    errors: list[str] = []

    context = load_context(package_dir, errors)
    resources = load_resources(package_dir, errors)
    resource_ids = {resource.id for resource in resources}
    resources_by_id = {resource.id: resource for resource in resources}
    resource_types = {resource.resource_type for resource in resources}
    recipes = load_recipes(package_dir, resource_ids, errors)
    validate_recipe_sequences(recipes, errors)
    demands = load_demands(package_dir, errors, horizon_minutes=context["horizonMinutes"])
    demands_by_id = {demand.demand_id: demand for demand in demands}
    inventory_balances = load_inventory_balances(package_dir, errors, horizon_minutes=context["horizonMinutes"])
    validate_inventory_balances(recipes, demands, inventory_balances, errors)
    downtimes = load_downtimes(package_dir, resource_ids, errors, horizon_minutes=context["horizonMinutes"])
    known_setup_groups = {recipe.setup_group for recipe in recipes if recipe.setup_group}
    setup_rules = load_setup_rules(package_dir, resource_ids, resource_types, known_setup_groups, errors)
    tank_rules = load_fermentation_tank_rules(
        package_dir,
        resources_by_id,
        demands_by_id,
        errors,
        horizon_minutes=context["horizonMinutes"],
    )

    schedule_request, operation_metadata, resources_csv, tasks_csv, downtimes_csv, expected_checks = build_outputs(
        context,
        resources,
        recipes,
        demands,
        downtimes,
        setup_rules,
        inventory_balances,
        tank_rules,
        errors,
    )

    if errors:
        raise SystemExit("Sample package validation failed:\n- " + "\n- ".join(errors))

    if args.check:
        print(
            json.dumps(
                {
                    "packageDir": str(package_dir),
                    "scenarioName": context["scenarioName"],
                    "dataVersion": context["dataVersion"],
                    "resources": len(resources),
                    "demands": len(demands),
                    "inventoryBalances": len(inventory_balances),
                    "inventoryDemands": len(schedule_request["inventoryDemands"]),
                    "requestedDemandQuantity": operation_metadata["requestedDemandQuantity"],
                    "plannedDemandQuantity": operation_metadata["plannedDemandQuantity"],
                    "generatedTasks": len(schedule_request["tasks"]),
                    "downtimes": len(downtimes),
                    "setupRules": len(setup_rules),
                    "fermentationTankRuleCases": operation_metadata["fermentationTankRuleCaseCount"],
                    "bridgeAdjustments": len(operation_metadata["bridgeAdjustments"]),
                },
                indent=2,
            )
        )
        return 0

    write_json(package_dir / "08_generated_schedule_request.json", schedule_request)
    (package_dir / "09_uat_expected_checks.md").write_text(expected_checks + "\n", encoding="utf-8")
    write_json(package_dir / "10_generated_operation_metadata.json", operation_metadata)
    write_csv(package_dir / "11_import_ready_resources.csv", resources_csv, fieldnames=RESOURCE_EXPORT_FIELDS)
    write_csv(package_dir / "12_import_ready_tasks.csv", tasks_csv, fieldnames=TASK_EXPORT_FIELDS)
    write_csv(package_dir / "13_import_ready_downtimes.csv", downtimes_csv, fieldnames=DOWNTIME_EXPORT_FIELDS)

    print(
        json.dumps(
            {
                "packageDir": str(package_dir),
                "generatedFiles": [
                    "08_generated_schedule_request.json",
                    "09_uat_expected_checks.md",
                    "10_generated_operation_metadata.json",
                    "11_import_ready_resources.csv",
                    "12_import_ready_tasks.csv",
                    "13_import_ready_downtimes.csv",
                ],
                "inventoryBalances": len(schedule_request["inventoryBalances"]),
                "inventoryDemands": len(schedule_request["inventoryDemands"]),
                "generatedTasks": len(schedule_request["tasks"]),
                "fermentationTankRuleCases": operation_metadata["fermentationTankRuleCaseCount"],
                "bridgeAdjustments": len(operation_metadata["bridgeAdjustments"]),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
