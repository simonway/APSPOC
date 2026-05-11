package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Instant;
import java.util.List;

public record CreateScheduleJobRequest(
        @NotBlank String scenarioName,
        @NotNull Instant scheduleStartAt,
        @NotNull @Positive Integer horizonMinutes,
        @NotEmpty List<@Valid ResourceInput> resources,
        @NotEmpty List<@Valid TaskInput> tasks,
        List<@Valid DowntimeInput> downtimes,
        @Valid ObjectiveWeights objectiveWeights,
        @Valid SolverConfig solverConfig,
        String dataVersion,
        List<@Valid SetupRuleInput> setupRules,
        @Valid List<InventoryBalanceInput> inventoryBalances,
        @Valid List<InventoryDemandInput> inventoryDemands
) {

    public CreateScheduleJobRequest {
        resources = List.copyOf(resources);
        tasks = List.copyOf(tasks);
        downtimes = downtimes == null ? List.of() : List.copyOf(downtimes);
        objectiveWeights = objectiveWeights == null ? new ObjectiveWeights(100, 0, 1) : objectiveWeights;
        solverConfig = solverConfig == null ? new SolverConfig(10, 4) : solverConfig;
        dataVersion = dataVersion == null || dataVersion.isBlank() ? null : dataVersion.trim();
        setupRules = setupRules == null ? List.of() : List.copyOf(setupRules);
        inventoryBalances = inventoryBalances == null ? List.of() : List.copyOf(inventoryBalances);
        inventoryDemands = inventoryDemands == null ? List.of() : List.copyOf(inventoryDemands);
    }

    public CreateScheduleJobRequest(
            String scenarioName,
            Instant scheduleStartAt,
            Integer horizonMinutes,
            List<ResourceInput> resources,
            List<TaskInput> tasks,
            List<DowntimeInput> downtimes,
            ObjectiveWeights objectiveWeights,
            SolverConfig solverConfig
    ) {
        this(
                scenarioName,
                scheduleStartAt,
                horizonMinutes,
                resources,
                tasks,
                downtimes,
                objectiveWeights,
                solverConfig,
                null,
                List.of(),
                List.of(),
                List.of()
        );
    }

    public CreateScheduleJobRequest(
            String scenarioName,
            Instant scheduleStartAt,
            Integer horizonMinutes,
            List<ResourceInput> resources,
            List<TaskInput> tasks,
            List<DowntimeInput> downtimes,
            ObjectiveWeights objectiveWeights,
            SolverConfig solverConfig,
            String dataVersion,
            List<SetupRuleInput> setupRules,
            List<InventoryBalanceInput> inventoryBalances
    ) {
        this(
                scenarioName,
                scheduleStartAt,
                horizonMinutes,
                resources,
                tasks,
                downtimes,
                objectiveWeights,
                solverConfig,
                dataVersion,
                setupRules,
                inventoryBalances,
                List.of()
        );
    }

    public CreateScheduleJobRequest(
            String scenarioName,
            Instant scheduleStartAt,
            Integer horizonMinutes,
            List<ResourceInput> resources,
            List<TaskInput> tasks,
            List<DowntimeInput> downtimes,
            ObjectiveWeights objectiveWeights,
            SolverConfig solverConfig,
            String dataVersion,
            List<SetupRuleInput> setupRules
    ) {
        this(
                scenarioName,
                scheduleStartAt,
                horizonMinutes,
                resources,
                tasks,
                downtimes,
                objectiveWeights,
                solverConfig,
                dataVersion,
                setupRules,
                List.of(),
                List.of()
        );
    }

    public record ResourceInput(
            @NotBlank String id,
            @NotBlank String label,
            @NotNull ResourceType resourceType,
            @NotNull @PositiveOrZero Integer sortOrder
    ) {
    }

    public record TaskInput(
            @NotBlank String id,
            @NotBlank String label,
            @NotBlank String productCode,
            @NotNull @Positive Integer durationMinutes,
            @NotNull @Positive Integer dueMinutes,
            @NotNull @Positive Integer priority,
            @NotEmpty List<@NotBlank String> candidateResourceIds,
            String pinnedResourceId,
            @PositiveOrZero Integer pinnedStartMinutes,
            List<@NotBlank String> predecessorTaskIds,
            String setupGroup,
            List<@Valid MaterialQuantityInput> materialInputs,
            List<@Valid MaterialQuantityInput> materialOutputs
    ) {
        public TaskInput {
            candidateResourceIds = List.copyOf(candidateResourceIds);
            predecessorTaskIds = predecessorTaskIds == null ? List.of() : List.copyOf(predecessorTaskIds);
            setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
            materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
            materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
        }

        public TaskInput(
                String id,
                String label,
                String productCode,
                Integer durationMinutes,
                Integer dueMinutes,
                Integer priority,
                List<String> candidateResourceIds,
                String pinnedResourceId,
                Integer pinnedStartMinutes,
                List<String> predecessorTaskIds,
                String setupGroup
        ) {
            this(
                    id,
                    label,
                    productCode,
                    durationMinutes,
                    dueMinutes,
                    priority,
                    candidateResourceIds,
                    pinnedResourceId,
                    pinnedStartMinutes,
                    predecessorTaskIds,
                    setupGroup,
                    List.of(),
                    List.of()
            );
        }

        public TaskInput(
                String id,
                String label,
                String productCode,
                Integer durationMinutes,
                Integer dueMinutes,
                Integer priority,
                List<String> candidateResourceIds,
                String pinnedResourceId,
                Integer pinnedStartMinutes
        ) {
            this(
                    id,
                    label,
                    productCode,
                    durationMinutes,
                    dueMinutes,
                    priority,
                    candidateResourceIds,
                    pinnedResourceId,
                    pinnedStartMinutes,
                    List.of(),
                    null,
                    List.of(),
                    List.of()
            );
        }
    }

    public record MaterialQuantityInput(
            @NotBlank String itemCode,
            @NotNull @Positive Integer quantity
    ) {
        public MaterialQuantityInput {
            itemCode = itemCode == null ? "" : itemCode.trim();
        }
    }

    public record DowntimeInput(
            @NotBlank String id,
            @NotBlank String resourceId,
            @NotNull @PositiveOrZero Integer startMinutes,
            @NotNull @Positive Integer endMinutes,
            @NotBlank String downtimeType,
            String source,
            String description
    ) {
        public DowntimeInput {
            source = source == null || source.isBlank() ? "MANUAL" : source;
            description = description == null ? "" : description;
        }
    }

    public record ObjectiveWeights(
            @Positive Integer tardiness,
            @PositiveOrZero Integer earliness,
            @PositiveOrZero Integer makespan
    ) {
        public ObjectiveWeights {
            tardiness = tardiness == null ? 100 : tardiness;
            earliness = earliness == null ? 0 : earliness;
            makespan = makespan == null ? 1 : makespan;
        }

        public ObjectiveWeights(
                Integer tardiness,
                Integer makespan
        ) {
            this(tardiness, 0, makespan);
        }
    }

    public record SolverConfig(
            @Positive Integer timeLimitSeconds,
            @Positive Integer numSearchWorkers
    ) {
    }

    public record SetupRuleInput(
            @NotBlank String fromSetupGroup,
            @NotBlank String toSetupGroup,
            ResourceType resourceType,
            String resourceId,
            @NotNull @PositiveOrZero Integer setupMinutes
    ) {
        public SetupRuleInput {
            resourceId = resourceId == null || resourceId.isBlank() ? null : resourceId.trim();
        }
    }

    public record InventoryBalanceInput(
            @NotBlank String itemCode,
            @NotNull @PositiveOrZero Integer availableQuantity,
            @PositiveOrZero Integer availableFromMinutes,
            @PositiveOrZero Integer safetyStockQuantity
    ) {
        public InventoryBalanceInput {
            itemCode = itemCode == null ? "" : itemCode.trim();
            availableFromMinutes = availableFromMinutes == null ? 0 : availableFromMinutes;
            safetyStockQuantity = safetyStockQuantity == null ? 0 : safetyStockQuantity;
        }
    }

    public record InventoryDemandInput(
            @NotBlank String demandId,
            @NotBlank String itemCode,
            @NotNull @Positive Integer quantity,
            @NotNull @Positive Integer dueMinutes,
            @PositiveOrZero Integer priority
    ) {
        public InventoryDemandInput {
            demandId = demandId == null ? "" : demandId.trim();
            itemCode = itemCode == null ? "" : itemCode.trim();
            priority = priority == null ? 0 : priority;
        }

        public InventoryDemandInput(
                String demandId,
                String itemCode,
                Integer quantity,
                Integer dueMinutes
        ) {
            this(demandId, itemCode, quantity, dueMinutes, 0);
        }
    }
}
