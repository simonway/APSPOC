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


if __name__ == "__main__":
    unittest.main()
