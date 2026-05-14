from __future__ import annotations

import unittest
from datetime import datetime, timezone

from app.models import (
    ObjectiveWeights,
    SolveRequest,
    SolverConfig,
    SolverDowntime,
    SolverInventoryBalance,
    SolverInventoryDemand,
    SolverMaterialQuantity,
    SolverResource,
    SolverSetupRule,
    SolverTask,
)
from app.solver_service import SolverService


class SolverServiceDowntimeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.service = SolverService()

    def test_task_is_scheduled_after_resource_downtime(self) -> None:
        request = SolveRequest(
            jobId="job-1",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="batch_A",
                    label="Batch A",
                    productCode="A",
                    durationMinutes=60,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                ),
            ],
            downtimes=[
                SolverDowntime(
                    id="maintenance_1",
                    resourceId="reactor_01",
                    startMinutes=0,
                    endMinutes=120,
                    downtimeType="MAINTENANCE",
                    source="CALENDAR",
                    description="Morning maintenance",
                ),
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 1)
        self.assertEqual(response.scheduledTasks[0].startMinutes, 120)
        self.assertEqual(response.scheduledTasks[0].endMinutes, 180)
        self.assertEqual(response.kpis.totalMakespan, 180)
        self.assertEqual(response.changeovers, [])

    def test_unknown_downtime_resource_is_rejected(self) -> None:
        request = SolveRequest(
            jobId="job-2",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="batch_A",
                    label="Batch A",
                    productCode="A",
                    durationMinutes=60,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                ),
            ],
            downtimes=[
                SolverDowntime(
                    id="maintenance_1",
                    resourceId="reactor_99",
                    startMinutes=0,
                    endMinutes=120,
                    downtimeType="MAINTENANCE",
                ),
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        with self.assertRaisesRegex(ValueError, "unknown resource"):
            self.service.solve(request)

    def test_schedule_efficiency_uses_only_busy_resources(self) -> None:
        request = SolveRequest(
            jobId="job-3",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
                SolverResource(id="reactor_02", label="Reactor-02", resourceType="REACTOR", sortOrder=2),
            ],
            tasks=[
                SolverTask(
                    id="batch_A",
                    label="Batch A",
                    productCode="A",
                    durationMinutes=60,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                ),
            ],
            downtimes=[],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(response.kpis.totalMakespan, 60)
        self.assertEqual(response.kpis.averageUtilization, 1.0)

    def test_earliness_weight_pulls_terminal_task_closer_to_due_time(self) -> None:
        request = SolveRequest(
            jobId="job-3b",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="batch_A",
                    label="Batch A",
                    productCode="A",
                    durationMinutes=60,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                ),
            ],
            downtimes=[],
            objectiveWeights=ObjectiveWeights(tardiness=100, earliness=2, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 1)
        self.assertEqual(response.scheduledTasks[0].startMinutes, 180)
        self.assertEqual(response.scheduledTasks[0].endMinutes, 240)
        self.assertEqual(response.kpis.totalMakespan, 240)

    def test_precedence_and_setup_rule_are_enforced_and_changeover_is_emitted(self) -> None:
        request = SolveRequest(
            jobId="job-4",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            dataVersion="dv-1",
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="batch_A",
                    label="Batch A",
                    productCode="A",
                    durationMinutes=60,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    setupGroup="REACT_A",
                ),
                SolverTask(
                    id="batch_B",
                    label="Batch B",
                    productCode="B",
                    durationMinutes=30,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    predecessorTaskIds=["batch_A"],
                    setupGroup="REACT_B",
                ),
            ],
            downtimes=[],
            setupRules=[
                SolverSetupRule(
                    fromSetupGroup="REACT_A",
                    toSetupGroup="REACT_B",
                    resourceType="REACTOR",
                    setupMinutes=30,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 2)
        self.assertEqual(response.scheduledTasks[0].taskId, "batch_A")
        self.assertEqual(response.scheduledTasks[0].startMinutes, 0)
        self.assertEqual(response.scheduledTasks[0].endMinutes, 60)
        self.assertEqual(response.scheduledTasks[1].taskId, "batch_B")
        self.assertEqual(response.scheduledTasks[1].startMinutes, 90)
        self.assertEqual(response.scheduledTasks[1].endMinutes, 120)
        self.assertEqual(len(response.changeovers), 1)
        self.assertEqual(response.changeovers[0].resourceId, "reactor_01")
        self.assertEqual(response.changeovers[0].fromTaskId, "batch_A")
        self.assertEqual(response.changeovers[0].toTaskId, "batch_B")
        self.assertEqual(response.changeovers[0].startMinutes, 60)
        self.assertEqual(response.changeovers[0].endMinutes, 90)
        self.assertEqual(response.changeovers[0].durationMinutes, 30)

    def test_unknown_setup_rule_resource_is_rejected(self) -> None:
        request = SolveRequest(
            jobId="job-5",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="batch_A",
                    label="Batch A",
                    productCode="A",
                    durationMinutes=60,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    setupGroup="REACT_A",
                ),
                SolverTask(
                    id="batch_B",
                    label="Batch B",
                    productCode="B",
                    durationMinutes=30,
                    dueMinutes=240,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    setupGroup="REACT_B",
                ),
            ],
            downtimes=[],
            setupRules=[
                SolverSetupRule(
                    fromSetupGroup="REACT_A",
                    toSetupGroup="REACT_B",
                    resourceId="reactor_99",
                    setupMinutes=30,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        with self.assertRaisesRegex(ValueError, "unknown resourceId"):
            self.service.solve(request)

    def test_inventory_balance_can_keep_two_due_units_feasible_with_one_initial_unit(self) -> None:
        request = SolveRequest(
            jobId="job-6",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="pa_early",
                    label="PA Early",
                    productCode="PA-101",
                    durationMinutes=60,
                    dueMinutes=60,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    materialOutputs=[
                        SolverMaterialQuantity(itemCode="PA-101", quantity=1)
                    ],
                ),
                SolverTask(
                    id="pa_late",
                    label="PA Late",
                    productCode="PA-101",
                    durationMinutes=60,
                    dueMinutes=60,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    materialOutputs=[
                        SolverMaterialQuantity(itemCode="PA-101", quantity=1)
                    ],
                ),
            ],
            inventoryBalances=[
                SolverInventoryBalance(
                    itemCode="PA-101",
                    availableQuantity=1,
                    availableFromMinutes=0,
                    safetyStockQuantity=0,
                )
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dmd-pa-101",
                    itemCode="PA-101",
                    quantity=2,
                    dueMinutes=60,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 2)
        completed_by_due = sum(1 for task in response.scheduledTasks if task.endMinutes <= 60)
        self.assertEqual(completed_by_due, 1)

    def test_inventory_balance_available_after_due_can_make_job_infeasible(self) -> None:
        request = SolveRequest(
            jobId="job-7",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="pa_early",
                    label="PA Early",
                    productCode="PA-101",
                    durationMinutes=60,
                    dueMinutes=60,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    materialOutputs=[
                        SolverMaterialQuantity(itemCode="PA-101", quantity=1)
                    ],
                ),
                SolverTask(
                    id="pa_late",
                    label="PA Late",
                    productCode="PA-101",
                    durationMinutes=60,
                    dueMinutes=60,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    materialOutputs=[
                        SolverMaterialQuantity(itemCode="PA-101", quantity=1)
                    ],
                ),
            ],
            inventoryBalances=[
                SolverInventoryBalance(
                    itemCode="PA-101",
                    availableQuantity=1,
                    availableFromMinutes=120,
                    safetyStockQuantity=0,
                )
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dmd-pa-101",
                    itemCode="PA-101",
                    quantity=2,
                    dueMinutes=60,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertEqual(response.status, "INFEASIBLE")
        self.assertEqual(response.scheduledTasks, [])

    def test_unknown_inventory_balance_item_is_rejected(self) -> None:
        request = SolveRequest(
            jobId="job-8",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="batch_A",
                    label="Batch A",
                    productCode="PA-101",
                    durationMinutes=60,
                    dueMinutes=120,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                ),
            ],
            inventoryBalances=[
                SolverInventoryBalance(
                    itemCode="PA-404",
                    availableQuantity=1,
                    availableFromMinutes=0,
                    safetyStockQuantity=0,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        with self.assertRaisesRegex(ValueError, "unknown itemCode"):
            self.service.solve(request)

    def test_raw_material_shortage_makes_request_infeasible(self) -> None:
        request = SolveRequest(
            jobId="job-9",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="fg_100_react",
                    label="FG-100 React",
                    productCode="FG-100",
                    durationMinutes=60,
                    dueMinutes=120,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="RM-100", quantity=1)
                    ],
                    materialOutputs=[
                        SolverMaterialQuantity(itemCode="FG-100", quantity=1)
                    ],
                ),
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dmd-fg-100",
                    itemCode="FG-100",
                    quantity=1,
                    dueMinutes=120,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertEqual(response.status, "INFEASIBLE")
        self.assertEqual(response.scheduledTasks, [])

    def test_intermediate_output_can_feed_downstream_operation(self) -> None:
        request = SolveRequest(
            jobId="job-10",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="reactor_01", label="Reactor-01", resourceType="REACTOR", sortOrder=1),
                SolverResource(id="pack_01", label="Pack-01", resourceType="OTHER", sortOrder=2),
            ],
            tasks=[
                SolverTask(
                    id="fg_200_react",
                    label="FG-200 React",
                    productCode="FG-200",
                    durationMinutes=60,
                    dueMinutes=180,
                    priority=1,
                    candidateResourceIds=["reactor_01"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="RM-200", quantity=1)
                    ],
                    materialOutputs=[
                        SolverMaterialQuantity(itemCode="INT-200", quantity=1)
                    ],
                ),
                SolverTask(
                    id="fg_200_pack",
                    label="FG-200 Pack",
                    productCode="FG-200",
                    durationMinutes=30,
                    dueMinutes=180,
                    priority=1,
                    candidateResourceIds=["pack_01"],
                    predecessorTaskIds=["fg_200_react"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="INT-200", quantity=1)
                    ],
                    materialOutputs=[
                        SolverMaterialQuantity(itemCode="FG-200", quantity=1)
                    ],
                ),
            ],
            inventoryBalances=[
                SolverInventoryBalance(
                    itemCode="RM-200",
                    availableQuantity=1,
                    availableFromMinutes=0,
                    safetyStockQuantity=0,
                )
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dmd-fg-200",
                    itemCode="FG-200",
                    quantity=1,
                    dueMinutes=180,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 2)
        by_id = {task.taskId: task for task in response.scheduledTasks}
        self.assertEqual(by_id["fg_200_react"].startMinutes, 0)
        self.assertEqual(by_id["fg_200_react"].endMinutes, 60)
        self.assertEqual(by_id["fg_200_pack"].startMinutes, 60)
        self.assertEqual(by_id["fg_200_pack"].endMinutes, 90)

    def test_snow_beer_main_chain_preserves_stage_order_and_material_flow(self) -> None:
        request = SolveRequest(
            jobId="job-snow-p3",
            scheduleStartAt=datetime(2026, 12, 24, 0, 0, tzinfo=timezone.utc),
            horizonMinutes=1440,
            resources=[
                SolverResource(id="mash_k1", label="糖化1锅", resourceType="REACTOR", sortOrder=1),
                SolverResource(id="ferm_t1", label="发酵1罐", resourceType="TANK", sortOrder=2),
                SolverResource(id="filt_f1", label="过滤1线", resourceType="FILTER", sortOrder=3),
                SolverResource(id="pack_l1", label="包装1线", resourceType="OTHER", sortOrder=4),
            ],
            tasks=[
                SolverTask(
                    id="dem_a500__01_sugarization",
                    label="A500 / 糖化",
                    productCode="31015630002000000",
                    durationMinutes=120,
                    dueMinutes=720,
                    priority=5,
                    candidateResourceIds=["mash_k1"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="MALT_A_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="HOPS_A_LOT", quantity=1),
                    ],
                    materialOutputs=[SolverMaterialQuantity(itemCode="WORT_A500_LOT", quantity=1)],
                ),
                SolverTask(
                    id="dem_a500__02_fermentation",
                    label="A500 / 发酵",
                    productCode="31015630002000000",
                    durationMinutes=240,
                    dueMinutes=720,
                    priority=5,
                    candidateResourceIds=["ferm_t1"],
                    predecessorTaskIds=["dem_a500__01_sugarization"],
                    materialInputs=[SolverMaterialQuantity(itemCode="WORT_A500_LOT", quantity=1)],
                    materialOutputs=[SolverMaterialQuantity(itemCode="FERMENTED_A500_LOT", quantity=1)],
                ),
                SolverTask(
                    id="dem_a500__03_filtration",
                    label="A500 / 过滤",
                    productCode="31015630002000000",
                    durationMinutes=90,
                    dueMinutes=720,
                    priority=5,
                    candidateResourceIds=["filt_f1"],
                    predecessorTaskIds=["dem_a500__02_fermentation"],
                    materialInputs=[SolverMaterialQuantity(itemCode="FERMENTED_A500_LOT", quantity=1)],
                    materialOutputs=[SolverMaterialQuantity(itemCode="BRIGHT_A500_LOT", quantity=1)],
                ),
                SolverTask(
                    id="dem_a500__04_packaging",
                    label="A500 / 包装",
                    productCode="31015630002000000",
                    durationMinutes=150,
                    dueMinutes=720,
                    priority=5,
                    candidateResourceIds=["pack_l1"],
                    predecessorTaskIds=["dem_a500__03_filtration"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="BRIGHT_A500_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="CAP_A_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="CTN_A_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="LBL_A_LOT", quantity=1),
                    ],
                    materialOutputs=[SolverMaterialQuantity(itemCode="31015630002000000", quantity=1)],
                ),
            ],
            downtimes=[
                SolverDowntime(
                    id="service_ferm_t1",
                    resourceId="ferm_t1",
                    startMinutes=120,
                    endMinutes=240,
                    downtimeType="SERVICE",
                )
            ],
            inventoryBalances=[
                SolverInventoryBalance(itemCode="MALT_A_LOT", availableQuantity=1),
                SolverInventoryBalance(itemCode="HOPS_A_LOT", availableQuantity=1),
                SolverInventoryBalance(itemCode="CAP_A_LOT", availableQuantity=1),
                SolverInventoryBalance(itemCode="CTN_A_LOT", availableQuantity=1),
                SolverInventoryBalance(itemCode="LBL_A_LOT", availableQuantity=1),
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dem_a500_spot_1224",
                    itemCode="31015630002000000",
                    quantity=1,
                    dueMinutes=720,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, earliness=2, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 4)
        by_id = {task.taskId: task for task in response.scheduledTasks}
        self.assertGreaterEqual(
            by_id["dem_a500__02_fermentation"].startMinutes,
            by_id["dem_a500__01_sugarization"].endMinutes,
        )
        self.assertGreaterEqual(
            by_id["dem_a500__03_filtration"].startMinutes,
            by_id["dem_a500__02_fermentation"].endMinutes,
        )
        self.assertGreaterEqual(
            by_id["dem_a500__04_packaging"].startMinutes,
            by_id["dem_a500__03_filtration"].endMinutes,
        )
        self.assertGreaterEqual(by_id["dem_a500__02_fermentation"].startMinutes, 240)

    def test_snow_beer_packaging_material_shortage_is_infeasible(self) -> None:
        request = SolveRequest(
            jobId="job-snow-p3-shortage",
            scheduleStartAt=datetime(2026, 12, 24, 0, 0, tzinfo=timezone.utc),
            horizonMinutes=720,
            resources=[
                SolverResource(id="pack_l1", label="包装1线", resourceType="OTHER", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="dem_a500_packaging",
                    label="A500 / 包装",
                    productCode="31015630002000000",
                    durationMinutes=150,
                    dueMinutes=360,
                    priority=5,
                    candidateResourceIds=["pack_l1"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="BRIGHT_A500_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="CAP_A_LOT", quantity=1),
                    ],
                    materialOutputs=[SolverMaterialQuantity(itemCode="31015630002000000", quantity=1)],
                ),
            ],
            inventoryBalances=[
                SolverInventoryBalance(itemCode="BRIGHT_A500_LOT", availableQuantity=1),
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dem_a500_spot_1224",
                    itemCode="31015630002000000",
                    quantity=1,
                    dueMinutes=360,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertEqual(response.status, "INFEASIBLE")
        self.assertEqual(response.scheduledTasks, [])

    def test_snow_beer_packaging_capacity_shortage_is_infeasible(self) -> None:
        request = SolveRequest(
            jobId="job-snow-p3-capacity-shortage",
            scheduleStartAt=datetime(2026, 12, 24, 0, 0, tzinfo=timezone.utc),
            horizonMinutes=720,
            resources=[
                SolverResource(id="pack_l1", label="包装1线", resourceType="OTHER", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="dem_a500_packaging_01",
                    label="A500 / 包装 / 批次1",
                    productCode="31015630002000000",
                    durationMinutes=150,
                    dueMinutes=240,
                    priority=5,
                    candidateResourceIds=["pack_l1"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="BRIGHT_A500_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="CAP_A_LOT", quantity=1),
                    ],
                    materialOutputs=[SolverMaterialQuantity(itemCode="31015630002000000", quantity=1)],
                ),
                SolverTask(
                    id="dem_a500_packaging_02",
                    label="A500 / 包装 / 批次2",
                    productCode="31015630002000000",
                    durationMinutes=150,
                    dueMinutes=240,
                    priority=5,
                    candidateResourceIds=["pack_l1"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="BRIGHT_A500_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="CAP_A_LOT", quantity=1),
                    ],
                    materialOutputs=[SolverMaterialQuantity(itemCode="31015630002000000", quantity=1)],
                ),
            ],
            inventoryBalances=[
                SolverInventoryBalance(itemCode="BRIGHT_A500_LOT", availableQuantity=2),
                SolverInventoryBalance(itemCode="CAP_A_LOT", availableQuantity=2),
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dem_a500_spot_1224",
                    itemCode="31015630002000000",
                    quantity=2,
                    dueMinutes=240,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertEqual(response.status, "INFEASIBLE")
        self.assertEqual(response.scheduledTasks, [])

    def test_snow_beer_packaging_downtime_window_conflict_is_infeasible(self) -> None:
        request = SolveRequest(
            jobId="job-snow-p3-window-conflict",
            scheduleStartAt=datetime(2026, 12, 24, 0, 0, tzinfo=timezone.utc),
            horizonMinutes=720,
            resources=[
                SolverResource(id="pack_l1", label="包装1线", resourceType="OTHER", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="dem_a500_packaging",
                    label="A500 / 包装",
                    productCode="31015630002000000",
                    durationMinutes=150,
                    dueMinutes=240,
                    priority=5,
                    candidateResourceIds=["pack_l1"],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="BRIGHT_A500_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="CAP_A_LOT", quantity=1),
                    ],
                    materialOutputs=[SolverMaterialQuantity(itemCode="31015630002000000", quantity=1)],
                ),
            ],
            downtimes=[
                SolverDowntime(
                    id="pack_l1_service",
                    resourceId="pack_l1",
                    startMinutes=0,
                    endMinutes=300,
                    downtimeType="SERVICE",
                )
            ],
            inventoryBalances=[
                SolverInventoryBalance(itemCode="BRIGHT_A500_LOT", availableQuantity=1),
                SolverInventoryBalance(itemCode="CAP_A_LOT", availableQuantity=1),
            ],
            inventoryDemands=[
                SolverInventoryDemand(
                    demandId="dem_a500_spot_1224",
                    itemCode="31015630002000000",
                    quantity=1,
                    dueMinutes=240,
                )
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        response = self.service.solve(request)

        self.assertEqual(response.status, "INFEASIBLE")
        self.assertEqual(response.scheduledTasks, [])

    def test_snow_beer_packaging_without_candidate_resource_is_rejected(self) -> None:
        request = SolveRequest(
            jobId="job-snow-p3-no-resource",
            scheduleStartAt=datetime(2026, 12, 24, 0, 0, tzinfo=timezone.utc),
            horizonMinutes=720,
            resources=[
                SolverResource(id="pack_l1", label="包装1线", resourceType="OTHER", sortOrder=1),
            ],
            tasks=[
                SolverTask(
                    id="dem_a500_packaging",
                    label="A500 / 包装",
                    productCode="31015630002000000",
                    durationMinutes=150,
                    dueMinutes=240,
                    priority=5,
                    candidateResourceIds=[],
                    materialInputs=[
                        SolverMaterialQuantity(itemCode="BRIGHT_A500_LOT", quantity=1),
                        SolverMaterialQuantity(itemCode="CAP_A_LOT", quantity=1),
                    ],
                    materialOutputs=[SolverMaterialQuantity(itemCode="31015630002000000", quantity=1)],
                ),
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

        with self.assertRaisesRegex(ValueError, "has no candidate resources"):
            self.service.solve(request)


if __name__ == "__main__":
    unittest.main()
