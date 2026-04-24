from __future__ import annotations

import unittest
from datetime import datetime, timezone

from app.models import ObjectiveWeights, SolveRequest, SolverConfig, SolverDowntime, SolverResource, SolverTask
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


if __name__ == "__main__":
    unittest.main()
