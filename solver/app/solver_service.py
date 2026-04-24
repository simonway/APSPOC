from __future__ import annotations

from collections import defaultdict

from ortools.sat.python import cp_model

from app.models import SolveKpis, SolveRequest, SolveResponse, ScheduledTask


class SolverService:
    def solve(self, request: SolveRequest) -> SolveResponse:
        self._validate(request)

        model = cp_model.CpModel()
        horizon = request.horizonMinutes

        resource_ids = [resource.id for resource in request.resources]
        intervals_by_resource: dict[str, list[cp_model.IntervalVar]] = defaultdict(list)
        presences: dict[tuple[str, str], cp_model.IntVar] = {}
        global_starts: dict[str, cp_model.IntVar] = {}
        global_ends: dict[str, cp_model.IntVar] = {}
        tardiness_vars: dict[str, cp_model.IntVar] = {}

        for task in request.tasks:
            task_start = model.NewIntVar(0, horizon, f"start_{task.id}")
            task_end = model.NewIntVar(0, horizon, f"end_{task.id}")
            global_starts[task.id] = task_start
            global_ends[task.id] = task_end

            presence_vars: list[cp_model.IntVar] = []
            for resource_id in task.candidateResourceIds:
                presence = model.NewBoolVar(f"present_{task.id}_{resource_id}")
                start = model.NewIntVar(0, horizon, f"start_{task.id}_{resource_id}")
                end = model.NewIntVar(0, horizon, f"end_{task.id}_{resource_id}")
                interval = model.NewOptionalIntervalVar(
                    start,
                    task.durationMinutes,
                    end,
                    presence,
                    f"interval_{task.id}_{resource_id}",
                )

                model.Add(task_start == start).OnlyEnforceIf(presence)
                model.Add(task_end == end).OnlyEnforceIf(presence)

                presences[(task.id, resource_id)] = presence
                intervals_by_resource[resource_id].append(interval)
                presence_vars.append(presence)

            model.AddExactlyOne(presence_vars)

            if task.pinnedResourceId is not None:
                for resource_id in task.candidateResourceIds:
                    target_value = 1 if resource_id == task.pinnedResourceId else 0
                    model.Add(presences[(task.id, resource_id)] == target_value)

            if task.pinnedStartMinutes is not None:
                model.Add(task_start == task.pinnedStartMinutes)

        for downtime in request.downtimes:
            interval = model.NewIntervalVar(
                downtime.startMinutes,
                downtime.endMinutes - downtime.startMinutes,
                downtime.endMinutes,
                f"downtime_{downtime.id}_{downtime.resourceId}",
            )
            intervals_by_resource[downtime.resourceId].append(interval)

        for resource_id in resource_ids:
            model.AddNoOverlap(intervals_by_resource[resource_id])

        makespan = model.NewIntVar(0, horizon, "makespan")
        model.AddMaxEquality(makespan, list(global_ends.values()))

        weighted_terms = []
        for task in request.tasks:
            tardiness = model.NewIntVar(0, horizon, f"tardiness_{task.id}")
            model.Add(tardiness >= global_ends[task.id] - task.dueMinutes)
            model.Add(tardiness >= 0)
            tardiness_vars[task.id] = tardiness
            weighted_terms.append(tardiness * (task.priority * request.objectiveWeights.tardiness))

        model.Minimize(sum(weighted_terms) + makespan * request.objectiveWeights.makespan)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = request.solverConfig.timeLimitSeconds
        solver.parameters.num_search_workers = request.solverConfig.numSearchWorkers
        status = solver.Solve(model)
        status_name = solver.StatusName(status)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return SolveResponse(
                jobId=request.jobId,
                status=status_name,
                solveTimeMs=int(solver.WallTime() * 1000),
                scheduledTasks=[],
                kpis=SolveKpis(
                    totalWeightedTardiness=0,
                    totalMakespan=0,
                    lateTaskCount=0,
                    averageUtilization=0.0,
                ),
            )

        scheduled_tasks: list[ScheduledTask] = []
        busy_minutes_by_resource: dict[str, int] = defaultdict(int)

        for task in request.tasks:
            chosen_resource_id = next(
                resource_id
                for resource_id in task.candidateResourceIds
                if solver.Value(presences[(task.id, resource_id)]) == 1
            )

            start_minutes = solver.Value(global_starts[task.id])
            end_minutes = solver.Value(global_ends[task.id])
            tardiness_minutes = solver.Value(tardiness_vars[task.id])
            busy_minutes_by_resource[chosen_resource_id] += task.durationMinutes

            scheduled_tasks.append(
                ScheduledTask(
                    taskId=task.id,
                    resourceId=chosen_resource_id,
                    startMinutes=start_minutes,
                    endMinutes=end_minutes,
                    late=tardiness_minutes > 0,
                    tardinessMinutes=tardiness_minutes,
                )
            )

        scheduled_tasks.sort(key=lambda item: (item.resourceId, item.startMinutes, item.taskId))

        late_task_count = sum(1 for task in scheduled_tasks if task.late)
        total_weighted_tardiness = sum(
            task.priority * solver.Value(tardiness_vars[task.id]) for task in request.tasks
        )
        total_makespan = solver.Value(makespan)
        schedule_efficiency = 0.0
        used_resource_ids = [
            resource.id
            for resource in request.resources
            if busy_minutes_by_resource.get(resource.id, 0) > 0
        ]
        if total_makespan > 0 and used_resource_ids:
            schedule_efficiency = sum(
                busy_minutes_by_resource[resource_id] / total_makespan
                for resource_id in used_resource_ids
            ) / len(used_resource_ids)

        return SolveResponse(
            jobId=request.jobId,
            status=status_name,
            solveTimeMs=int(solver.WallTime() * 1000),
            scheduledTasks=scheduled_tasks,
            kpis=SolveKpis(
                totalWeightedTardiness=int(total_weighted_tardiness),
                totalMakespan=total_makespan,
                lateTaskCount=late_task_count,
                averageUtilization=round(schedule_efficiency, 4),
            ),
        )

    @staticmethod
    def _validate(request: SolveRequest) -> None:
        resource_ids = {resource.id for resource in request.resources}
        if not resource_ids:
            raise ValueError("Solve request must contain at least one resource")

        for task in request.tasks:
            if not task.candidateResourceIds:
                raise ValueError(f"Task {task.id} has no candidate resources")
            unknown_resource_ids = set(task.candidateResourceIds) - resource_ids
            if unknown_resource_ids:
                raise ValueError(
                    f"Task {task.id} contains unknown candidate resources: {sorted(unknown_resource_ids)}"
                )
            if task.pinnedResourceId is not None and task.pinnedResourceId not in task.candidateResourceIds:
                raise ValueError(
                    f"Task {task.id} pins to resource {task.pinnedResourceId}, but it is not in candidateResourceIds"
                )

        for downtime in request.downtimes:
            if downtime.resourceId not in resource_ids:
                raise ValueError(
                    f"Downtime {downtime.id} references unknown resource {downtime.resourceId}"
                )
            if downtime.startMinutes >= downtime.endMinutes:
                raise ValueError(
                    f"Downtime {downtime.id} must satisfy startMinutes < endMinutes"
                )
            if downtime.endMinutes > request.horizonMinutes:
                raise ValueError(
                    f"Downtime {downtime.id} ends outside horizonMinutes"
                )
