package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ResourceType;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record GeneratedScenarioResponse(
        String scenarioId,
        String scenarioName,
        String dataVersion,
        Instant createdAt,
        Instant scheduleStartAt,
        int horizonMinutes,
        int resourceCount,
        int demandCount,
        int requestedDemandQuantity,
        int plannedDemandQuantity,
        int inventoryBalanceCount,
        int inventoryCoveredQuantity,
        int operationCount,
        int downtimeCount,
        int setupRuleCount,
        int precedencePairCount,
        int bridgeAdjustmentCount,
        List<DemandCoverageResponse> demandCoverages,
        List<OperationResponse> operations,
        List<PrecedencePairResponse> precedencePairs,
        List<SetupRuleResponse> setupRules,
        List<BridgeAdjustmentResponse> bridgeAdjustments,
        CreateScheduleJobRequest scheduleRequest,
        Map<String, String> sourceImportBatchIds
) {
    public GeneratedScenarioResponse {
        demandCoverages = List.copyOf(demandCoverages);
        operations = List.copyOf(operations);
        precedencePairs = List.copyOf(precedencePairs);
        setupRules = List.copyOf(setupRules);
        bridgeAdjustments = List.copyOf(bridgeAdjustments);
        sourceImportBatchIds = sourceImportBatchIds == null ? Map.of() : Map.copyOf(sourceImportBatchIds);
    }

    public static GeneratedScenarioResponse persisted(
            String scenarioId,
            Instant createdAt,
            Map<String, String> sourceImportBatchIds,
            GeneratedScenarioResponse scenario
    ) {
        return new GeneratedScenarioResponse(
                scenarioId,
                scenario.scenarioName(),
                scenario.dataVersion(),
                createdAt,
                scenario.scheduleStartAt(),
                scenario.horizonMinutes(),
                scenario.resourceCount(),
                scenario.demandCount(),
                scenario.requestedDemandQuantity(),
                scenario.plannedDemandQuantity(),
                scenario.inventoryBalanceCount(),
                scenario.inventoryCoveredQuantity(),
                scenario.operationCount(),
                scenario.downtimeCount(),
                scenario.setupRuleCount(),
                scenario.precedencePairCount(),
                scenario.bridgeAdjustmentCount(),
                scenario.demandCoverages(),
                scenario.operations(),
                scenario.precedencePairs(),
                scenario.setupRules(),
                scenario.bridgeAdjustments(),
                scenario.scheduleRequest(),
                sourceImportBatchIds
        );
    }

    public record DemandCoverageResponse(
            String demandId,
            String productCode,
            int requestedQuantity,
            int inventoryCoveredQuantity,
            int plannedQuantity,
            int dueMinutes,
            int priority
    ) {
    }

    public record OperationResponse(
            String operationId,
            String demandId,
            int demandUnitIndex,
            String productCode,
            String recipeId,
            String operationCode,
            String operationName,
            int sequence,
            int durationMinutes,
            List<String> candidateResourceIds,
            List<String> predecessorOperationIds,
            String setupGroup,
            List<CreateScheduleJobRequest.MaterialQuantityInput> materialInputs,
            List<CreateScheduleJobRequest.MaterialQuantityInput> materialOutputs,
            int dueMinutes,
            int priority,
            String quantity,
            String fixedResourceId,
            Integer fixedStartMinutes,
            String baselinePinnedResourceId,
            Integer baselinePinnedStartMinutes
    ) {
        public OperationResponse {
            candidateResourceIds = List.copyOf(candidateResourceIds);
            predecessorOperationIds = List.copyOf(predecessorOperationIds);
            materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
            materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
        }
    }

    public record PrecedencePairResponse(
            String from,
            String to
    ) {
    }

    public record SetupRuleResponse(
            String fromSetupGroup,
            String toSetupGroup,
            ResourceType resourceType,
            String resourceId,
            int setupMinutes
    ) {
    }

    public record BridgeAdjustmentResponse(
            String operationId,
            String demandId,
            String adjustmentType,
            String message,
            String originalFixedResourceId,
            Integer originalFixedStartMinutes,
            String baselinePinnedResourceId,
            Integer baselinePinnedStartMinutes
    ) {
    }
}
