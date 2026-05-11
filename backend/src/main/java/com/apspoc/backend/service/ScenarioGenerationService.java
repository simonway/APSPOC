package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.GenerateScenarioRequest;
import com.apspoc.backend.api.dto.GeneratedScenarioResponse;
import com.apspoc.backend.domain.ResourceType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ScenarioGenerationService {

    public GeneratedScenarioResponse generate(GenerateScenarioRequest request) {
        validate(request);

        Map<String, List<GenerateScenarioRequest.RecipeInput>> recipesByProduct = buildRecipesByProduct(request.recipes());
        Map<String, List<CreateScheduleJobRequest.DowntimeInput>> downtimesByResource = buildDowntimesByResource(request.downtimes());
        Map<String, CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalancesByItemCode = buildInventoryBalancesByItemCode(request.inventoryBalances());
        Map<String, DemandCoveragePlan> demandCoveragePlans = planDemandCoverage(request.demands(), inventoryBalancesByItemCode);
        List<CreateScheduleJobRequest.InventoryDemandInput> inventoryDemands = buildInventoryDemands(request.demands());

        List<CreateScheduleJobRequest.TaskInput> tasks = new ArrayList<>();
        List<GeneratedScenarioResponse.DemandCoverageResponse> demandCoverages = new ArrayList<>();
        List<GeneratedScenarioResponse.OperationResponse> operations = new ArrayList<>();
        List<GeneratedScenarioResponse.PrecedencePairResponse> precedencePairs = new ArrayList<>();
        List<GeneratedScenarioResponse.BridgeAdjustmentResponse> bridgeAdjustments = new ArrayList<>();
        int requestedDemandQuantity = 0;
        int plannedDemandQuantity = 0;
        int inventoryCoveredQuantity = 0;

        for (GenerateScenarioRequest.DemandInput demand : request.demands()) {
            DemandCoveragePlan demandCoveragePlan = demandCoveragePlans.get(demand.demandId());
            if (demandCoveragePlan == null) {
                throw badRequest("Missing coverage plan for demand `%s`".formatted(demand.demandId()));
            }

            requestedDemandQuantity += demandCoveragePlan.requestedQuantity();
            plannedDemandQuantity += demandCoveragePlan.plannedQuantity();
            inventoryCoveredQuantity += demandCoveragePlan.inventoryCoveredQuantity();
            demandCoverages.add(new GeneratedScenarioResponse.DemandCoverageResponse(
                    demand.demandId(),
                    demand.productCode(),
                    demandCoveragePlan.requestedQuantity(),
                    demandCoveragePlan.inventoryCoveredQuantity(),
                    demandCoveragePlan.plannedQuantity(),
                    demand.dueMinutes(),
                    demand.priority()
            ));

            if (demandCoveragePlan.plannedQuantity() == 0) {
                continue;
            }

            List<GenerateScenarioRequest.RecipeInput> productRecipes = recipesByProduct.get(demand.productCode());
            if (productRecipes == null || productRecipes.isEmpty()) {
                throw badRequest("Demand `%s` references unknown productCode `%s`".formatted(demand.demandId(), demand.productCode()));
            }

            String fixedResourceId = demand.fixedResourceId();
            Integer fixedStartMinutes = demand.fixedStartMinutes();
            if (fixedResourceId != null && !productRecipes.getFirst().candidateResourceIds().contains(fixedResourceId)) {
                throw badRequest(
                        "Demand `%s` fixedResourceId `%s` is not in the first operation candidate resources"
                                .formatted(demand.demandId(), fixedResourceId)
                );
            }

            if ((fixedResourceId != null || fixedStartMinutes != null) && demandCoveragePlan.plannedQuantity() > 1) {
                throw badRequest(
                        "Demand `%s` uses fixedResourceId/fixedStartMinutes but requires %d planned units after inventory coverage. "
                                .formatted(demand.demandId(), demandCoveragePlan.plannedQuantity())
                                + "Multi-quantity fixed demands are not supported in this inventory MVP."
                );
            }

            for (int unitIndex = 1; unitIndex <= demandCoveragePlan.plannedQuantity(); unitIndex++) {
                String previousOperationId = null;
                for (GenerateScenarioRequest.RecipeInput recipe : productRecipes) {
                    String operationId = buildOperationId(
                            demand.demandId(),
                            unitIndex,
                            demandCoveragePlan.requestedQuantity(),
                            demandCoveragePlan.plannedQuantity(),
                            recipe.sequence(),
                            recipe.operationCode()
                    );
                    String operationFixedResourceId = recipe.sequence() == 1 ? fixedResourceId : null;
                    Integer operationFixedStartMinutes = recipe.sequence() == 1 ? fixedStartMinutes : null;
                    String baselinePinnedResourceId = operationFixedResourceId;
                    Integer baselinePinnedStartMinutes = operationFixedStartMinutes;
                    List<String> predecessorOperationIds = previousOperationId == null ? List.of() : List.of(previousOperationId);
                    List<CreateScheduleJobRequest.MaterialQuantityInput> materialInputs = recipe.materialInputs();
                    List<CreateScheduleJobRequest.MaterialQuantityInput> materialOutputs = resolveOperationMaterialOutputs(productRecipes, recipe);

                    if (baselinePinnedStartMinutes != null) {
                        if (baselinePinnedResourceId != null) {
                            String conflictReason = findConflictReason(
                                    baselinePinnedResourceId,
                                    baselinePinnedStartMinutes,
                                    recipe.durationMinutes(),
                                    downtimesByResource,
                                    request.horizonMinutes()
                            );
                            if (conflictReason != null) {
                                baselinePinnedStartMinutes = null;
                                bridgeAdjustments.add(new GeneratedScenarioResponse.BridgeAdjustmentResponse(
                                        operationId,
                                        demand.demandId(),
                                        "RELAX_PINNED_START",
                                        "Baseline request removed pinnedStartMinutes because the fixed start conflicts with the fixed resource availability: "
                                                + conflictReason,
                                        operationFixedResourceId,
                                        operationFixedStartMinutes,
                                        baselinePinnedResourceId,
                                        null
                                ));
                            }
                        } else if (noCandidateResourceAvailableAtFixedStart(
                                recipe.candidateResourceIds(),
                                baselinePinnedStartMinutes,
                                recipe.durationMinutes(),
                                downtimesByResource,
                                request.horizonMinutes()
                        )) {
                            int requestedEndMinutes = baselinePinnedStartMinutes + recipe.durationMinutes();
                            baselinePinnedStartMinutes = null;
                            bridgeAdjustments.add(new GeneratedScenarioResponse.BridgeAdjustmentResponse(
                                    operationId,
                                    demand.demandId(),
                                    "RELAX_PINNED_START",
                                    "Baseline request removed pinnedStartMinutes because no candidate resource is available for the fixed interval [%d, %d)"
                                            .formatted(operationFixedStartMinutes, requestedEndMinutes),
                                    operationFixedResourceId,
                                    operationFixedStartMinutes,
                                    baselinePinnedResourceId,
                                    null
                            ));
                        }
                    }

                    tasks.add(new CreateScheduleJobRequest.TaskInput(
                            operationId,
                            buildOperationLabel(demand.demandId(), recipe.operationName(), unitIndex, demandCoveragePlan.requestedQuantity(), demandCoveragePlan.plannedQuantity()),
                            demand.productCode(),
                            recipe.durationMinutes(),
                            demand.dueMinutes(),
                            demand.priority(),
                            recipe.candidateResourceIds(),
                            baselinePinnedResourceId,
                            baselinePinnedStartMinutes,
                            predecessorOperationIds,
                            recipe.setupGroup(),
                            materialInputs,
                            materialOutputs
                    ));

                    if (previousOperationId != null) {
                        precedencePairs.add(new GeneratedScenarioResponse.PrecedencePairResponse(previousOperationId, operationId));
                    }

                    operations.add(new GeneratedScenarioResponse.OperationResponse(
                            operationId,
                            demand.demandId(),
                            unitIndex,
                            demand.productCode(),
                            recipe.recipeId(),
                            recipe.operationCode(),
                            recipe.operationName(),
                            recipe.sequence(),
                            recipe.durationMinutes(),
                            recipe.candidateResourceIds(),
                            predecessorOperationIds,
                            recipe.setupGroup(),
                            materialInputs,
                            materialOutputs,
                            demand.dueMinutes(),
                            demand.priority(),
                            demand.quantity(),
                            operationFixedResourceId,
                            operationFixedStartMinutes,
                            baselinePinnedResourceId,
                            baselinePinnedStartMinutes
                    ));
                    previousOperationId = operationId;
                }
            }
        }

        CreateScheduleJobRequest scheduleRequest = tasks.isEmpty()
                ? null
                : new CreateScheduleJobRequest(
                        request.scenarioName(),
                        request.scheduleStartAt(),
                        request.horizonMinutes(),
                        request.resources(),
                        tasks,
                        request.downtimes(),
                        request.objectiveWeights(),
                        request.solverConfig(),
                        request.dataVersion(),
                        request.setupRules().stream()
                                .map(rule -> new CreateScheduleJobRequest.SetupRuleInput(
                                        rule.fromSetupGroup(),
                                        rule.toSetupGroup(),
                                        rule.resourceType(),
                                        rule.resourceId(),
                                        rule.setupMinutes()
                                ))
                                .toList(),
                        request.inventoryBalances(),
                        inventoryDemands
                );

        List<GeneratedScenarioResponse.SetupRuleResponse> setupRules = request.setupRules().stream()
                .map(rule -> new GeneratedScenarioResponse.SetupRuleResponse(
                        rule.fromSetupGroup(),
                        rule.toSetupGroup(),
                        rule.resourceType(),
                        rule.resourceId(),
                        rule.setupMinutes()
                ))
                .toList();

        return new GeneratedScenarioResponse(
                null,
                request.scenarioName(),
                request.dataVersion(),
                null,
                request.scheduleStartAt(),
                request.horizonMinutes(),
                request.resources().size(),
                request.demands().size(),
                requestedDemandQuantity,
                plannedDemandQuantity,
                request.inventoryBalances().size(),
                inventoryCoveredQuantity,
                operations.size(),
                request.downtimes().size(),
                request.setupRules().size(),
                precedencePairs.size(),
                bridgeAdjustments.size(),
                demandCoverages,
                operations,
                precedencePairs,
                setupRules,
                bridgeAdjustments,
                scheduleRequest,
                Map.of()
        );
    }

    private void validate(GenerateScenarioRequest request) {
        Set<String> resourceIds = new LinkedHashSet<>();
        Set<ResourceType> resourceTypes = new LinkedHashSet<>();
        for (CreateScheduleJobRequest.ResourceInput resource : request.resources()) {
            if (!resourceIds.add(resource.id())) {
                throw badRequest("Duplicate resource id `%s`".formatted(resource.id()));
            }
            resourceTypes.add(resource.resourceType());
        }

        Set<String> recipeKeys = new LinkedHashSet<>();
        for (GenerateScenarioRequest.RecipeInput recipe : request.recipes()) {
            String key = recipe.recipeId() + "|" + recipe.productCode() + "|" + recipe.operationCode();
            if (!recipeKeys.add(key)) {
                throw badRequest(
                        "Duplicate recipe operation `%s/%s/%s`".formatted(recipe.recipeId(), recipe.productCode(), recipe.operationCode())
                );
            }
            for (String candidateResourceId : recipe.candidateResourceIds()) {
                if (!resourceIds.contains(candidateResourceId)) {
                    throw badRequest(
                            "Recipe `%s/%s/%s` contains unknown candidate resource `%s`"
                                    .formatted(recipe.recipeId(), recipe.productCode(), recipe.operationCode(), candidateResourceId)
                    );
                }
            }
        }

        validateRecipeSequences(request.recipes());

        Set<String> demandIds = new LinkedHashSet<>();
        for (GenerateScenarioRequest.DemandInput demand : request.demands()) {
            if (!demandIds.add(demand.demandId())) {
                throw badRequest("Duplicate demand id `%s`".formatted(demand.demandId()));
            }
            parseDemandQuantity(demand.quantity(), demand.demandId());
            if (demand.dueMinutes() > request.horizonMinutes()) {
                throw badRequest("Demand `%s` dueMinutes `%d` exceeds horizon `%d`"
                        .formatted(demand.demandId(), demand.dueMinutes(), request.horizonMinutes()));
            }
            if (demand.fixedStartMinutes() != null && demand.fixedStartMinutes() > request.horizonMinutes()) {
                throw badRequest("Demand `%s` fixedStartMinutes `%d` exceeds horizon `%d`"
                        .formatted(demand.demandId(), demand.fixedStartMinutes(), request.horizonMinutes()));
            }
        }

        Set<String> knownItemCodes = request.recipes().stream()
                .map(GenerateScenarioRequest.RecipeInput::productCode)
                .collect(LinkedHashSet::new, Set::add, Set::addAll);
        knownItemCodes.addAll(request.demands().stream().map(GenerateScenarioRequest.DemandInput::productCode).toList());
        for (GenerateScenarioRequest.RecipeInput recipe : request.recipes()) {
            knownItemCodes.addAll(recipe.materialInputs().stream().map(CreateScheduleJobRequest.MaterialQuantityInput::itemCode).toList());
            knownItemCodes.addAll(recipe.materialOutputs().stream().map(CreateScheduleJobRequest.MaterialQuantityInput::itemCode).toList());
        }

        Set<String> inventoryItemCodes = new LinkedHashSet<>();
        for (CreateScheduleJobRequest.InventoryBalanceInput inventoryBalance : request.inventoryBalances()) {
            if (!inventoryItemCodes.add(inventoryBalance.itemCode())) {
                throw badRequest("Duplicate inventory balance itemCode `%s`".formatted(inventoryBalance.itemCode()));
            }
            if (inventoryBalance.availableFromMinutes() > request.horizonMinutes()) {
                throw badRequest("Inventory balance `%s` availableFromMinutes `%d` exceeds horizon `%d`"
                        .formatted(inventoryBalance.itemCode(), inventoryBalance.availableFromMinutes(), request.horizonMinutes()));
            }
            if (!knownItemCodes.contains(inventoryBalance.itemCode())) {
                throw badRequest("Inventory balance references unknown itemCode `%s`".formatted(inventoryBalance.itemCode()));
            }
        }

        Set<String> downtimeIds = new LinkedHashSet<>();
        for (CreateScheduleJobRequest.DowntimeInput downtime : request.downtimes()) {
            if (!downtimeIds.add(downtime.id())) {
                throw badRequest("Duplicate downtime id `%s`".formatted(downtime.id()));
            }
            if (!resourceIds.contains(downtime.resourceId())) {
                throw badRequest("Downtime `%s` references unknown resource `%s`".formatted(downtime.id(), downtime.resourceId()));
            }
            if (downtime.startMinutes() >= downtime.endMinutes()) {
                throw badRequest("Downtime `%s` must satisfy startMinutes < endMinutes".formatted(downtime.id()));
            }
            if (downtime.endMinutes() > request.horizonMinutes()) {
                throw badRequest("Downtime `%s` ends outside horizonMinutes".formatted(downtime.id()));
            }
        }

        Set<String> knownSetupGroups = request.recipes().stream()
                .map(GenerateScenarioRequest.RecipeInput::setupGroup)
                .filter(value -> value != null && !value.isBlank())
                .collect(LinkedHashSet::new, Set::add, Set::addAll);
        for (GenerateScenarioRequest.SetupRuleInput setupRule : request.setupRules()) {
            if (!knownSetupGroups.contains(setupRule.fromSetupGroup())) {
                throw badRequest("Setup rule references unknown fromSetupGroup `%s`".formatted(setupRule.fromSetupGroup()));
            }
            if (!knownSetupGroups.contains(setupRule.toSetupGroup())) {
                throw badRequest("Setup rule references unknown toSetupGroup `%s`".formatted(setupRule.toSetupGroup()));
            }
            if (setupRule.resourceType() != null && !resourceTypes.contains(setupRule.resourceType())) {
                throw badRequest("Setup rule references unknown resourceType `%s`".formatted(setupRule.resourceType()));
            }
            if (setupRule.resourceId() != null && !resourceIds.contains(setupRule.resourceId())) {
                throw badRequest("Setup rule references unknown resourceId `%s`".formatted(setupRule.resourceId()));
            }
        }
    }

    private Map<String, List<GenerateScenarioRequest.RecipeInput>> buildRecipesByProduct(List<GenerateScenarioRequest.RecipeInput> recipes) {
        Map<String, List<GenerateScenarioRequest.RecipeInput>> recipesByProduct = new LinkedHashMap<>();
        for (GenerateScenarioRequest.RecipeInput recipe : recipes) {
            recipesByProduct.computeIfAbsent(recipe.productCode(), ignored -> new ArrayList<>()).add(recipe);
        }
        for (List<GenerateScenarioRequest.RecipeInput> productRecipes : recipesByProduct.values()) {
            productRecipes.sort(Comparator.comparingInt(GenerateScenarioRequest.RecipeInput::sequence));
        }
        return recipesByProduct;
    }

    private Map<String, List<CreateScheduleJobRequest.DowntimeInput>> buildDowntimesByResource(List<CreateScheduleJobRequest.DowntimeInput> downtimes) {
        Map<String, List<CreateScheduleJobRequest.DowntimeInput>> downtimesByResource = new LinkedHashMap<>();
        for (CreateScheduleJobRequest.DowntimeInput downtime : downtimes) {
            downtimesByResource.computeIfAbsent(downtime.resourceId(), ignored -> new ArrayList<>()).add(downtime);
        }
        return downtimesByResource;
    }

    private void validateRecipeSequences(List<GenerateScenarioRequest.RecipeInput> recipes) {
        Map<String, List<GenerateScenarioRequest.RecipeInput>> recipesByProduct = buildRecipesByProduct(recipes);
        for (Map.Entry<String, List<GenerateScenarioRequest.RecipeInput>> entry : recipesByProduct.entrySet()) {
            int expectedSequence = 1;
            for (GenerateScenarioRequest.RecipeInput recipe : entry.getValue()) {
                if (recipe.sequence() != expectedSequence) {
                    throw badRequest(
                            "Product `%s` has non-contiguous recipe sequence. Expected %d, got %d"
                                    .formatted(entry.getKey(), expectedSequence, recipe.sequence())
                    );
                }
                expectedSequence++;
            }
        }
    }

    private Map<String, CreateScheduleJobRequest.InventoryBalanceInput> buildInventoryBalancesByItemCode(
            List<CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalances
    ) {
        Map<String, CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalancesByItemCode = new LinkedHashMap<>();
        for (CreateScheduleJobRequest.InventoryBalanceInput inventoryBalance : inventoryBalances) {
            inventoryBalancesByItemCode.put(inventoryBalance.itemCode(), inventoryBalance);
        }
        return Map.copyOf(inventoryBalancesByItemCode);
    }

    private List<CreateScheduleJobRequest.InventoryDemandInput> buildInventoryDemands(
            List<GenerateScenarioRequest.DemandInput> demands
    ) {
        return demands.stream()
                .map(demand -> new CreateScheduleJobRequest.InventoryDemandInput(
                        demand.demandId(),
                        demand.productCode(),
                        parseDemandQuantity(demand.quantity(), demand.demandId()),
                        demand.dueMinutes(),
                        demand.priority()
                ))
                .toList();
    }

    private List<CreateScheduleJobRequest.MaterialQuantityInput> resolveOperationMaterialOutputs(
            List<GenerateScenarioRequest.RecipeInput> productRecipes,
            GenerateScenarioRequest.RecipeInput recipe
    ) {
        if (!recipe.materialOutputs().isEmpty()) {
            return recipe.materialOutputs();
        }
        if (isFinalRecipeOperation(productRecipes, recipe)) {
            return List.of(new CreateScheduleJobRequest.MaterialQuantityInput(recipe.productCode(), 1));
        }
        return List.of();
    }

    private boolean isFinalRecipeOperation(
            List<GenerateScenarioRequest.RecipeInput> productRecipes,
            GenerateScenarioRequest.RecipeInput recipe
    ) {
        if (productRecipes.isEmpty()) {
            return false;
        }
        return recipe.sequence() == productRecipes.get(productRecipes.size() - 1).sequence();
    }

    private Map<String, DemandCoveragePlan> planDemandCoverage(
            List<GenerateScenarioRequest.DemandInput> demands,
            Map<String, CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalancesByItemCode
    ) {
        Map<String, Integer> remainingInventoryByItemCode = new LinkedHashMap<>();
        for (CreateScheduleJobRequest.InventoryBalanceInput inventoryBalance : inventoryBalancesByItemCode.values()) {
            remainingInventoryByItemCode.put(
                    inventoryBalance.itemCode(),
                    Math.max(0, inventoryBalance.availableQuantity() - inventoryBalance.safetyStockQuantity())
            );
        }

        List<DemandCoverageCandidate> candidates = new ArrayList<>();
        for (int index = 0; index < demands.size(); index++) {
            GenerateScenarioRequest.DemandInput demand = demands.get(index);
            candidates.add(new DemandCoverageCandidate(index, demand, parseDemandQuantity(demand.quantity(), demand.demandId())));
        }
        candidates.sort(Comparator
                .comparingInt((DemandCoverageCandidate candidate) -> candidate.demand().dueMinutes())
                .thenComparing(Comparator.comparingInt((DemandCoverageCandidate candidate) -> candidate.demand().priority()).reversed())
                .thenComparingInt(DemandCoverageCandidate::requestIndex));

        Map<String, DemandCoveragePlan> plansByDemandId = new LinkedHashMap<>();
        for (DemandCoverageCandidate candidate : candidates) {
            GenerateScenarioRequest.DemandInput demand = candidate.demand();
            CreateScheduleJobRequest.InventoryBalanceInput inventoryBalance = inventoryBalancesByItemCode.get(demand.productCode());
            int inventoryCoveredQuantity = 0;
            if (inventoryBalance != null && inventoryBalance.availableFromMinutes() <= demand.dueMinutes()) {
                int remainingInventory = remainingInventoryByItemCode.getOrDefault(inventoryBalance.itemCode(), 0);
                inventoryCoveredQuantity = Math.min(candidate.requestedQuantity(), remainingInventory);
                remainingInventoryByItemCode.put(inventoryBalance.itemCode(), remainingInventory - inventoryCoveredQuantity);
            }
            plansByDemandId.put(
                    demand.demandId(),
                    new DemandCoveragePlan(
                            candidate.requestedQuantity(),
                            inventoryCoveredQuantity,
                            candidate.requestedQuantity() - inventoryCoveredQuantity
                    )
            );
        }
        return Map.copyOf(plansByDemandId);
    }

    private int parseDemandQuantity(String value, String demandId) {
        if (value == null || value.isBlank()) {
            return 1;
        }
        try {
            int parsed = Integer.parseInt(value.trim());
            if (parsed <= 0) {
                throw new NumberFormatException("range");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw badRequest("Demand `%s` quantity `%s` must be a positive integer in this inventory MVP"
                    .formatted(demandId, value));
        }
    }

    private String buildOperationId(
            String demandId,
            int unitIndex,
            int requestedQuantity,
            int plannedQuantity,
            int sequence,
            String operationCode
    ) {
        if (requestedQuantity == 1 && plannedQuantity == 1) {
            return demandId + "__" + "%02d".formatted(sequence) + "_" + operationCode.toLowerCase(Locale.ROOT);
        }
        return demandId + "__u" + "%02d".formatted(unitIndex) + "__" + "%02d".formatted(sequence) + "_" + operationCode.toLowerCase(Locale.ROOT);
    }

    private String buildOperationLabel(
            String demandId,
            String operationName,
            int unitIndex,
            int requestedQuantity,
            int plannedQuantity
    ) {
        if (requestedQuantity == 1 && plannedQuantity == 1) {
            return demandId + " / " + operationName;
        }
        return demandId + " / U" + "%02d".formatted(unitIndex) + " / " + operationName;
    }

    private String findConflictReason(
            String resourceId,
            int startMinutes,
            int durationMinutes,
            Map<String, List<CreateScheduleJobRequest.DowntimeInput>> downtimesByResource,
            int horizonMinutes
    ) {
        int endMinutes = startMinutes + durationMinutes;
        if (endMinutes > horizonMinutes) {
            return "fixed interval [%d, %d) exceeds horizon %d".formatted(startMinutes, endMinutes, horizonMinutes);
        }

        List<String> overlaps = downtimesByResource.getOrDefault(resourceId, List.of()).stream()
                .filter(downtime -> overlaps(startMinutes, endMinutes, downtime.startMinutes(), downtime.endMinutes()))
                .map(downtime -> "%s[%d,%d)".formatted(downtime.id(), downtime.startMinutes(), downtime.endMinutes()))
                .toList();
        if (overlaps.isEmpty()) {
            return null;
        }
        return "fixed interval [%d, %d) overlaps downtime %s"
                .formatted(startMinutes, endMinutes, String.join(", ", overlaps));
    }

    private boolean overlaps(int startMinutes, int endMinutes, int otherStartMinutes, int otherEndMinutes) {
        return startMinutes < otherEndMinutes && otherStartMinutes < endMinutes;
    }

    private boolean noCandidateResourceAvailableAtFixedStart(
            List<String> candidateResourceIds,
            int startMinutes,
            int durationMinutes,
            Map<String, List<CreateScheduleJobRequest.DowntimeInput>> downtimesByResource,
            int horizonMinutes
    ) {
        for (String candidateResourceId : candidateResourceIds) {
            if (findConflictReason(candidateResourceId, startMinutes, durationMinutes, downtimesByResource, horizonMinutes) == null) {
                return false;
            }
        }
        return true;
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private record DemandCoverageCandidate(
            int requestIndex,
            GenerateScenarioRequest.DemandInput demand,
            int requestedQuantity
    ) {
    }

    private record DemandCoveragePlan(
            int requestedQuantity,
            int inventoryCoveredQuantity,
            int plannedQuantity
    ) {
    }
}
