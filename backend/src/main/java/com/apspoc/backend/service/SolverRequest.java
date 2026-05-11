package com.apspoc.backend.service;

import java.time.Instant;
import java.util.List;

public record SolverRequest(
        String jobId,
        Instant scheduleStartAt,
        int horizonMinutes,
        String dataVersion,
        List<Resource> resources,
        List<Task> tasks,
        List<Downtime> downtimes,
        List<SetupRule> setupRules,
        List<InventoryBalance> inventoryBalances,
        List<InventoryDemand> inventoryDemands,
        ObjectiveWeights objectiveWeights,
        SolverConfig solverConfig
) {
    public SolverRequest {
        dataVersion = dataVersion == null || dataVersion.isBlank() ? null : dataVersion.trim();
        resources = resources == null ? List.of() : List.copyOf(resources);
        tasks = tasks == null ? List.of() : List.copyOf(tasks);
        downtimes = downtimes == null ? List.of() : List.copyOf(downtimes);
        setupRules = setupRules == null ? List.of() : List.copyOf(setupRules);
        inventoryBalances = inventoryBalances == null ? List.of() : List.copyOf(inventoryBalances);
        inventoryDemands = inventoryDemands == null ? List.of() : List.copyOf(inventoryDemands);
    }

    public record Resource(
            String id,
            String label,
            String resourceType,
            int sortOrder
    ) {
    }

    public record Task(
            String id,
            String label,
            String productCode,
            int durationMinutes,
            int dueMinutes,
            int priority,
            List<String> candidateResourceIds,
            String pinnedResourceId,
            Integer pinnedStartMinutes,
            List<String> predecessorTaskIds,
            String setupGroup,
            List<MaterialQuantity> materialInputs,
            List<MaterialQuantity> materialOutputs
    ) {
        public Task {
            candidateResourceIds = List.copyOf(candidateResourceIds);
            predecessorTaskIds = predecessorTaskIds == null ? List.of() : List.copyOf(predecessorTaskIds);
            setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
            materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
            materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
        }
    }

    public record MaterialQuantity(
            String itemCode,
            int quantity
    ) {
        public MaterialQuantity {
            itemCode = itemCode == null ? "" : itemCode.trim();
        }
    }

    public record Downtime(
            String id,
            String resourceId,
            int startMinutes,
            int endMinutes,
            String downtimeType,
            String source,
            String description
    ) {
    }

    public record SetupRule(
            String fromSetupGroup,
            String toSetupGroup,
            String resourceType,
            String resourceId,
            int setupMinutes
    ) {
        public SetupRule {
            resourceType = resourceType == null || resourceType.isBlank() ? null : resourceType.trim();
            resourceId = resourceId == null || resourceId.isBlank() ? null : resourceId.trim();
        }
    }

    public record InventoryBalance(
            String itemCode,
            int availableQuantity,
            Integer availableFromMinutes,
            Integer safetyStockQuantity
    ) {
        public InventoryBalance {
            itemCode = itemCode == null ? "" : itemCode.trim();
            availableFromMinutes = availableFromMinutes == null ? 0 : availableFromMinutes;
            safetyStockQuantity = safetyStockQuantity == null ? 0 : safetyStockQuantity;
        }
    }

    public record InventoryDemand(
            String demandId,
            String itemCode,
            int quantity,
            int dueMinutes,
            Integer priority
    ) {
        public InventoryDemand {
            demandId = demandId == null ? "" : demandId.trim();
            itemCode = itemCode == null ? "" : itemCode.trim();
            priority = priority == null ? 0 : priority;
        }
    }

    public record ObjectiveWeights(
            int tardiness,
            int earliness,
            int makespan
    ) {
    }

    public record SolverConfig(
            int timeLimitSeconds,
            int numSearchWorkers
    ) {
    }
}
