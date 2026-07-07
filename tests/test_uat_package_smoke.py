import unittest
from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR / "scripts"))

from uat_package_smoke import load_package_contract_summary


class UatPackageSmokeSummaryTest(unittest.TestCase):
    def test_loads_fermentation_tank_success_contract_summary_from_package_metadata(self) -> None:
        summary = load_package_contract_summary(
            ROOT_DIR / "docs" / "sample-packages" / "snow_beer_phase4_fermentation_tank_success"
        )

        tank_summary = summary["fermentationTankRuleSummary"]
        self.assertTrue(tank_summary["contractOnly"])
        self.assertEqual(tank_summary["caseCount"], 2)
        self.assertEqual(tank_summary["expectedPassCount"], 2)
        self.assertEqual(tank_summary["observedPassCount"], 2)
        self.assertEqual(tank_summary["failureTypes"], [])

    def test_loads_fermentation_tank_contract_summary_from_package_metadata(self) -> None:
        summary = load_package_contract_summary(
            ROOT_DIR / "docs" / "sample-packages" / "snow_beer_phase4_fermentation_tank_failure"
        )

        tank_summary = summary["fermentationTankRuleSummary"]
        self.assertTrue(tank_summary["contractOnly"])
        self.assertEqual(tank_summary["caseCount"], 2)
        self.assertEqual(tank_summary["expectedFailCount"], 2)
        self.assertEqual(tank_summary["observedFailCount"], 2)
        self.assertEqual(tank_summary["failureTypes"], ["NON_MIXING"])

    def test_loads_bright_tank_transfer_contract_summary_from_package_metadata(self) -> None:
        summary = load_package_contract_summary(
            ROOT_DIR / "docs" / "sample-packages" / "snow_beer_phase4_bright_tank_transfer"
        )

        transfer_summary = summary["brightTankTransferRuleSummary"]
        self.assertTrue(transfer_summary["contractOnly"])
        self.assertEqual(transfer_summary["caseCount"], 2)
        self.assertEqual(transfer_summary["expectedPassCount"], 1)
        self.assertEqual(transfer_summary["expectedFailCount"], 1)
        self.assertEqual(transfer_summary["observedPassCount"], 1)
        self.assertEqual(transfer_summary["observedFailCount"], 1)
        self.assertEqual(transfer_summary["failureTypes"], ["OCCUPATION_WINDOW"])

    def test_loads_multi_brew_fill_contract_summary_from_package_metadata(self) -> None:
        summary = load_package_contract_summary(
            ROOT_DIR / "docs" / "sample-packages" / "snow_beer_phase4_multi_brew_fill"
        )

        fill_summary = summary["multiBrewFillRuleSummary"]
        self.assertTrue(fill_summary["contractOnly"])
        self.assertEqual(fill_summary["caseCount"], 1)
        self.assertEqual(fill_summary["expectedPassCount"], 1)
        self.assertEqual(fill_summary["observedPassCount"], 1)
        self.assertEqual(fill_summary["failureTypes"], [])

    def test_loads_phase4_full_suite_contract_summaries_from_package_metadata(self) -> None:
        summary = load_package_contract_summary(
            ROOT_DIR / "docs" / "sample-packages" / "snow_beer_phase4_full_suite"
        )

        tank_summary = summary["fermentationTankRuleSummary"]
        transfer_summary = summary["brightTankTransferRuleSummary"]
        fill_summary = summary["multiBrewFillRuleSummary"]
        self.assertEqual(tank_summary["caseCount"], 2)
        self.assertEqual(tank_summary["observedPassCount"], 2)
        self.assertEqual(transfer_summary["caseCount"], 1)
        self.assertEqual(transfer_summary["observedPassCount"], 1)
        self.assertEqual(fill_summary["caseCount"], 1)
        self.assertEqual(fill_summary["observedPassCount"], 1)


if __name__ == "__main__":
    unittest.main()
