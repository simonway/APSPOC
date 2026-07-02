import unittest

from scripts.build_uat_sample_package import (
    DemandRow,
    FermentationTankRuleRow,
    InventoryBalanceRow,
    ResourceRow,
    analyze_fermentation_tank_rules,
    build_expected_checks,
)


class BuildExpectedChecksTest(unittest.TestCase):
    def test_omits_setup_assertion_when_package_has_no_setup_rules(self) -> None:
        checks = build_expected_checks(
            _context(),
            [_resource()],
            [_demand()],
            [],
            [],
            [],
            [_operation("sugarization", "SUGARIZATION")],
            [],
            [],
            [],
            None,
            requested_demand_quantity=1,
            planned_demand_quantity=1,
            inventory_covered_quantity=0,
        )

        self.assertIn("- setup rules: `0`", checks)
        self.assertNotIn("Setup rules cover cross-family switches", checks)

    def test_adds_maturity_window_checks_when_operation_metadata_has_proxy(self) -> None:
        checks = build_expected_checks(
            _context(),
            [_resource()],
            [_demand()],
            [_inventory_balance("FERMENTED_A500_LOT"), _inventory_balance("MATURED_A500_LOT")],
            [],
            [],
            [
                _operation(
                    "fermentation",
                    "FERMENTATION",
                    material_outputs=["FERMENTED_A500_LOT"],
                ),
                _operation(
                    "maturation",
                    "MATURATION_WAIT",
                    predecessor_ids=["fermentation"],
                    material_inputs=["FERMENTED_A500_LOT"],
                    material_outputs=["MATURED_A500_LOT"],
                ),
                _operation(
                    "filtration",
                    "FILTRATION",
                    predecessor_ids=["maturation"],
                    material_inputs=["MATURED_A500_LOT"],
                ),
            ],
            [{"from": "fermentation", "to": "maturation"}, {"from": "maturation", "to": "filtration"}],
            [],
            [],
            None,
            requested_demand_quantity=1,
            planned_demand_quantity=1,
            inventory_covered_quantity=0,
        )

        self.assertIn("`MATURATION_WAIT` maturity proxy operation", checks)
        self.assertIn("between fermentation and filtration", checks)
        self.assertIn("consumes `FERMENTED_A500_LOT` and outputs `MATURED_A500_LOT`", checks)
        self.assertIn("Filtration consumes `MATURED_A500_LOT`", checks)
        self.assertIn("POC maturity-window approximation", checks)

    def test_analyzes_expected_non_mixing_tank_rule_failure(self) -> None:
        errors: list[str] = []
        cases, summary = analyze_fermentation_tank_rules(
            [
                _tank_rule("case_a", "A500", expected_failure_type="NON_MIXING"),
                _tank_rule("case_b", "B600", expected_failure_type="NON_MIXING"),
            ],
            errors,
        )

        self.assertEqual([], errors)
        self.assertIsNotNone(summary)
        self.assertEqual(2, summary["expectedFailCount"])
        self.assertEqual(2, summary["observedFailCount"])
        self.assertEqual(["NON_MIXING"], summary["failureTypes"])
        self.assertTrue(all(case["expectedMatchesObserved"] for case in cases))


def _context() -> dict[str, object]:
    return {
        "dataVersion": "test_version",
        "scheduleStartAt": "2026-12-24T00:00:00Z",
        "horizonMinutes": 1440,
    }


def _resource() -> ResourceRow:
    return ResourceRow(
        id="res_1",
        label="Resource 1",
        resource_type="TANK",
        sort_order=1,
        capacity="1",
        remarks="",
    )


def _demand() -> DemandRow:
    return DemandRow(
        demand_id="dem_1",
        product_code="31015630002000000",
        quantity="1",
        due_minutes=1440,
        priority=5,
        fixed_resource_id="",
        fixed_start_minutes=None,
        remarks="",
    )


def _inventory_balance(item_code: str) -> InventoryBalanceRow:
    return InventoryBalanceRow(
        item_code=item_code,
        available_quantity=1,
        available_from_minutes=0,
        safety_stock_quantity=0,
    )


def _operation(
    operation_id: str,
    operation_code: str,
    *,
    predecessor_ids: list[str] | None = None,
    material_inputs: list[str] | None = None,
    material_outputs: list[str] | None = None,
) -> dict[str, object]:
    return {
        "operationId": operation_id,
        "productCode": "31015630002000000",
        "operationCode": operation_code,
        "predecessorOperationIds": predecessor_ids or [],
        "materialInputs": [{"itemCode": item_code, "quantity": 1} for item_code in material_inputs or []],
        "materialOutputs": [{"itemCode": item_code, "quantity": 1} for item_code in material_outputs or []],
    }


def _tank_rule(case_id: str, mixing_family: str, *, expected_failure_type: str) -> FermentationTankRuleRow:
    return FermentationTankRuleRow(
        case_id=case_id,
        expected_outcome="FAIL",
        expected_failure_type=expected_failure_type,
        tank_id="ferm_t1",
        tank_capacity_units=2,
        batch_id=f"batch_{case_id}",
        demand_id=f"dem_{case_id}",
        product_code="31015630002000000",
        batch_volume_units=1,
        mixing_family=mixing_family,
        occupation_start_minutes=0,
        occupation_end_minutes=720,
        remarks="",
    )


if __name__ == "__main__":
    unittest.main()
