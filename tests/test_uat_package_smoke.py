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


if __name__ == "__main__":
    unittest.main()
