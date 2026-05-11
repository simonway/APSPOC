from __future__ import annotations

from collections import defaultdict

from ortools.sat.python import cp_model

from app.models import (
    Changeover,
    SolveKpis,
    SolveRequest,
    SolveResponse,
    ScheduledTask,
    SolverResource,
    SolverTask,
)


class SolverService:
    def solve(self, request: SolveRequest) -> SolveResponse:
        self._validate(request)

        model = cp_model.CpModel()
        horizon = request.horizonMinutes
        resource_by_id = {resource.id: resource for resource in request.resources}
        task_by_id = {task.id: task for task in request.tasks}
        successor_ids_by_task: dict[str, set[str]] = defaultdict(set)
        for task in request.tasks:
            for predecessor_task_id in task.predecessorTaskIds:
                successor_ids_by_task[predecessor_task_id].add(task.id)
        terminal_task_ids = {
            task.id for task in request.tasks if not successor_ids_by_task.get(task.id)
        }

        resource_ids = [resource.id for resource in request.resources]
        intervals_by_resource: dict[str, list[cp_model.IntervalVar]] = defaultdict(list)
        presences: dict[tuple[str, str], cp_model.IntVar] = {}
        global_starts: dict[str, cp_model.IntVar] = {}
        global_ends: dict[str, cp_model.IntVar] = {}
        tardiness_vars: dict[str, cp_model.IntVar] = {}
        earliness_vars: dict[str, cp_model.IntVar] = {}

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

        for task in request.tasks:
            for predecessor_task_id in task.predecessorTaskIds:
                model.Add(global_starts[task.id] >= global_ends[predecessor_task_id])

        self._add_material_balance_constraints(model, request, global_starts, global_ends)

        for resource in request.resources:
            resource_tasks = [
                task for task in request.tasks if resource.id in task.candidateResourceIds
            ]
            for first_index, first_task in enumerate(resource_tasks):
                for second_task in resource_tasks[first_index + 1 :]:
                    first_presence = presences[(first_task.id, resource.id)]
                    second_presence = presences[(second_task.id, resource.id)]
                    first_before_second = model.NewBoolVar(
                        f"order_{resource.id}_{first_task.id}_before_{second_task.id}"
                    )
                    second_before_first = model.NewBoolVar(
                        f"order_{resource.id}_{second_task.id}_before_{first_task.id}"
                    )

                    model.Add(first_before_second + second_before_first <= 1)
                    model.Add(first_before_second <= first_presence)
                    model.Add(first_before_second <= second_presence)
                    model.Add(second_before_first <= first_presence)
                    model.Add(second_before_first <= second_presence)
                    model.Add(first_before_second + second_before_first == 1).OnlyEnforceIf(
                        [first_presence, second_presence]
                    )
                    model.Add(first_before_second + second_before_first == 0).OnlyEnforceIf(
                        first_presence.Not()
                    )
                    model.Add(first_before_second + second_before_first == 0).OnlyEnforceIf(
                        second_presence.Not()
                    )

                    forward_setup = self._resolve_setup_minutes(
                        request, first_task, second_task, resource
                    )
                    reverse_setup = self._resolve_setup_minutes(
                        request, second_task, first_task, resource
                    )
                    model.Add(
                        global_starts[second_task.id]
                        >= global_ends[first_task.id] + forward_setup
                    ).OnlyEnforceIf(first_before_second)
                    model.Add(
                        global_starts[first_task.id]
                        >= global_ends[second_task.id] + reverse_setup
                    ).OnlyEnforceIf(second_before_first)

        makespan = model.NewIntVar(0, horizon, "makespan")
        model.AddMaxEquality(makespan, list(global_ends.values()))

        weighted_terms = []
        for task in request.tasks:
            tardiness = model.NewIntVar(0, horizon, f"tardiness_{task.id}")
            model.Add(tardiness >= global_ends[task.id] - task.dueMinutes)
            model.Add(tardiness >= 0)
            tardiness_vars[task.id] = tardiness
            weighted_terms.append(tardiness * (task.priority * request.objectiveWeights.tardiness))

            if request.objectiveWeights.earliness > 0 and task.id in terminal_task_ids:
                earliness = model.NewIntVar(0, horizon, f"earliness_{task.id}")
                model.Add(earliness >= task.dueMinutes - global_ends[task.id])
                model.Add(earliness >= 0)
                earliness_vars[task.id] = earliness
                weighted_terms.append(earliness * request.objectiveWeights.earliness)

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
                changeovers=[],
                kpis=SolveKpis(
                    totalWeightedTardiness=0,
                    totalMakespan=0,
                    lateTaskCount=0,
                    averageUtilization=0.0,
                ),
            )

        scheduled_tasks: list[ScheduledTask] = []
        scheduled_tasks_by_resource: dict[str, list[ScheduledTask]] = defaultdict(list)
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
            scheduled_tasks_by_resource[chosen_resource_id].append(scheduled_tasks[-1])

        scheduled_tasks.sort(key=lambda item: (item.resourceId, item.startMinutes, item.taskId))

        changeovers: list[Changeover] = []
        for resource_id, resource_tasks in scheduled_tasks_by_resource.items():
            resource_tasks.sort(key=lambda item: (item.startMinutes, item.endMinutes, item.taskId))
            resource = resource_by_id[resource_id]
            for index in range(1, len(resource_tasks)):
                previous_task = resource_tasks[index - 1]
                current_task = resource_tasks[index]
                required_setup = self._resolve_setup_minutes(
                    request,
                    task_by_id[previous_task.taskId],
                    task_by_id[current_task.taskId],
                    resource,
                )
                if required_setup <= 0:
                    continue
                changeovers.append(
                    Changeover(
                        id=f"chg_{resource_id}_{previous_task.taskId}_{current_task.taskId}",
                        resourceId=resource_id,
                        fromTaskId=previous_task.taskId,
                        toTaskId=current_task.taskId,
                        startMinutes=current_task.startMinutes - required_setup,
                        endMinutes=current_task.startMinutes,
                        durationMinutes=required_setup,
                    )
                )

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
            changeovers=changeovers,
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
        if len(resource_ids) != len(request.resources):
            raise ValueError("Solve request contains duplicate resource ids")

        task_ids = {task.id for task in request.tasks}
        if len(task_ids) != len(request.tasks):
            raise ValueError("Solve request contains duplicate task ids")

        resource_by_id = {resource.id: resource for resource in request.resources}
        resource_types = {resource.resourceType for resource in request.resources}
        setup_groups = {task.setupGroup for task in request.tasks if task.setupGroup}
        product_codes = {task.productCode for task in request.tasks}
        material_item_codes = {
            material.itemCode
            for task in request.tasks
            for material in [*task.materialInputs, *task.materialOutputs]
        }
        task_item_codes = product_codes | material_item_codes
        inventory_item_codes: set[str] = set()
        inventory_demand_ids: set[str] = set()
        inventory_demand_item_codes = {
            inventory_demand.itemCode for inventory_demand in request.inventoryDemands
        }

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
            for predecessor_task_id in task.predecessorTaskIds:
                if predecessor_task_id not in task_ids:
                    raise ValueError(
                        f"Task {task.id} references unknown predecessor {predecessor_task_id}"
                    )
                if predecessor_task_id == task.id:
                    raise ValueError(f"Task {task.id} cannot depend on itself")

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

        for setup_rule in request.setupRules:
            if setup_rule.fromSetupGroup not in setup_groups:
                raise ValueError(
                    f"Setup rule references unknown fromSetupGroup {setup_rule.fromSetupGroup}"
                )
            if setup_rule.toSetupGroup not in setup_groups:
                raise ValueError(
                    f"Setup rule references unknown toSetupGroup {setup_rule.toSetupGroup}"
                )
            if setup_rule.resourceId is not None:
                if setup_rule.resourceId not in resource_by_id:
                    raise ValueError(
                        f"Setup rule references unknown resourceId {setup_rule.resourceId}"
                    )
                if (
                    setup_rule.resourceType is not None
                    and resource_by_id[setup_rule.resourceId].resourceType
                    != setup_rule.resourceType
                ):
                    raise ValueError(
                        f"Setup rule resourceId {setup_rule.resourceId} does not match resourceType {setup_rule.resourceType}"
                    )
            elif setup_rule.resourceType is not None and setup_rule.resourceType not in resource_types:
                raise ValueError(
                    f"Setup rule references unknown resourceType {setup_rule.resourceType}"
                )

        for inventory_balance in request.inventoryBalances:
            if inventory_balance.itemCode in inventory_item_codes:
                raise ValueError(
                    f"Duplicate inventory balance itemCode {inventory_balance.itemCode}"
                )
            inventory_item_codes.add(inventory_balance.itemCode)
            if (
                inventory_balance.itemCode not in task_item_codes
                and inventory_balance.itemCode not in inventory_demand_item_codes
            ):
                raise ValueError(
                    f"Inventory balance references unknown itemCode {inventory_balance.itemCode}"
                )
            if inventory_balance.availableFromMinutes > request.horizonMinutes:
                raise ValueError(
                    f"Inventory balance {inventory_balance.itemCode} availableFromMinutes ends outside horizonMinutes"
                )

        supported_demand_item_codes = task_item_codes | inventory_item_codes
        for inventory_demand in request.inventoryDemands:
            if inventory_demand.demandId in inventory_demand_ids:
                raise ValueError(
                    f"Duplicate inventory demand id {inventory_demand.demandId}"
                )
            inventory_demand_ids.add(inventory_demand.demandId)
            if inventory_demand.itemCode not in supported_demand_item_codes:
                raise ValueError(
                    f"Inventory demand references unknown itemCode {inventory_demand.itemCode}"
                )
            if inventory_demand.dueMinutes > request.horizonMinutes:
                raise ValueError(
                    f"Inventory demand {inventory_demand.demandId} dueMinutes ends outside horizonMinutes"
                )

    @staticmethod
    def _resolve_setup_minutes(
        request: SolveRequest,
        from_task: SolverTask,
        to_task: SolverTask,
        resource: SolverResource,
    ) -> int:
        if not from_task.setupGroup or not to_task.setupGroup:
            return 0

        matching_rules = [
            rule
            for rule in request.setupRules
            if rule.fromSetupGroup == from_task.setupGroup
            and rule.toSetupGroup == to_task.setupGroup
        ]
        for rule in matching_rules:
            if rule.resourceId == resource.id:
                return rule.setupMinutes
        for rule in matching_rules:
            if rule.resourceId is None and rule.resourceType == resource.resourceType:
                return rule.setupMinutes
        for rule in matching_rules:
            if rule.resourceId is None and rule.resourceType is None:
                return rule.setupMinutes
        return 0

    @staticmethod
    def _collect_item_codes(request: SolveRequest) -> set[str]:
        item_codes = {task.productCode for task in request.tasks}
        for task in request.tasks:
            item_codes.update(material.itemCode for material in task.materialInputs)
            item_codes.update(material.itemCode for material in task.materialOutputs)
        item_codes.update(balance.itemCode for balance in request.inventoryBalances)
        item_codes.update(demand.itemCode for demand in request.inventoryDemands)
        return item_codes

    def _add_material_balance_constraints(
        self,
        model: cp_model.CpModel,
        request: SolveRequest,
        global_starts: dict[str, cp_model.IntVar],
        global_ends: dict[str, cp_model.IntVar],
    ) -> None:
        for item_code in self._collect_item_codes(request):
            event_times: list[int | cp_model.IntVar] = []
            level_changes: list[int] = []
            max_level = 0

            for inventory_balance in request.inventoryBalances:
                if inventory_balance.itemCode != item_code:
                    continue
                available_quantity = max(
                    0,
                    inventory_balance.availableQuantity
                    - inventory_balance.safetyStockQuantity,
                )
                if available_quantity <= 0:
                    continue
                event_times.append(inventory_balance.availableFromMinutes)
                level_changes.append(available_quantity)
                max_level += available_quantity

            for task in request.tasks:
                for material in task.materialInputs:
                    if material.itemCode != item_code:
                        continue
                    event_times.append(global_starts[task.id])
                    level_changes.append(-material.quantity)
                for material in task.materialOutputs:
                    if material.itemCode != item_code:
                        continue
                    event_times.append(global_ends[task.id])
                    level_changes.append(material.quantity)
                    max_level += material.quantity

            for inventory_demand in request.inventoryDemands:
                if inventory_demand.itemCode != item_code:
                    continue
                event_times.append(inventory_demand.dueMinutes)
                level_changes.append(-inventory_demand.quantity)

            if event_times:
                model.add_reservoir_constraint(
                    event_times,
                    level_changes,
                    0,
                    max_level,
                )
