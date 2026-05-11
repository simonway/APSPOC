package com.apspoc.backend.api.dto;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest.MaterialQuantityInput;
import com.apspoc.backend.domain.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Instant;
import java.util.List;

public record GenerateScenarioRequest(
        @NotBlank String scenarioName,
        String dataVersion,
        @NotNull Instant scheduleStartAt,
        @NotNull @Positive Integer horizonMinutes,
        @NotEmpty @Valid List<CreateScheduleJobRequest.ResourceInput> resources,
        List<@Valid RecipeInput> recipes,
        @NotEmpty List<@Valid DemandInput> demands,
        @Valid List<CreateScheduleJobRequest.DowntimeInput> downtimes,
        List<@Valid SetupRuleInput> setupRules,
        @Valid CreateScheduleJobRequest.ObjectiveWeights objectiveWeights,
        @Valid CreateScheduleJobRequest.SolverConfig solverConfig,
        @Valid List<CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalances
) {

    public GenerateScenarioRequest {
        resources = List.copyOf(resources);
        recipes = List.copyOf(recipes);
        demands = List.copyOf(demands);
        downtimes = downtimes == null ? List.of() : List.copyOf(downtimes);
        setupRules = setupRules == null ? List.of() : List.copyOf(setupRules);
        objectiveWeights = objectiveWeights == null ? new CreateScheduleJobRequest.ObjectiveWeights(100, 0, 1) : objectiveWeights;
        solverConfig = solverConfig == null ? new CreateScheduleJobRequest.SolverConfig(10, 4) : solverConfig;
        dataVersion = dataVersion == null || dataVersion.isBlank() ? null : dataVersion.trim();
        inventoryBalances = inventoryBalances == null ? List.of() : List.copyOf(inventoryBalances);
    }

    public GenerateScenarioRequest(
            String scenarioName,
            String dataVersion,
            Instant scheduleStartAt,
            Integer horizonMinutes,
            List<CreateScheduleJobRequest.ResourceInput> resources,
            List<RecipeInput> recipes,
            List<DemandInput> demands,
            List<CreateScheduleJobRequest.DowntimeInput> downtimes,
            List<SetupRuleInput> setupRules,
            CreateScheduleJobRequest.ObjectiveWeights objectiveWeights,
            CreateScheduleJobRequest.SolverConfig solverConfig
    ) {
        this(
                scenarioName,
                dataVersion,
                scheduleStartAt,
                horizonMinutes,
                resources,
                recipes,
                demands,
                downtimes,
                setupRules,
                objectiveWeights,
                solverConfig,
                List.of()
        );
    }

    public record RecipeInput(
            @NotBlank String recipeId,
            @NotBlank String productCode,
            @NotBlank String operationCode,
            @NotBlank String operationName,
            @NotNull @Positive Integer sequence,
            @NotNull @Positive Integer durationMinutes,
            @NotEmpty List<@NotBlank String> candidateResourceIds,
            List<@Valid MaterialQuantityInput> materialInputs,
            List<@Valid MaterialQuantityInput> materialOutputs,
            String setupGroup
    ) {
        public RecipeInput {
            candidateResourceIds = List.copyOf(candidateResourceIds);
            materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
            materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
            setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
        }

        public RecipeInput(
                String recipeId,
                String productCode,
                String operationCode,
                String operationName,
                Integer sequence,
                Integer durationMinutes,
                List<String> candidateResourceIds,
                String setupGroup
        ) {
            this(
                    recipeId,
                    productCode,
                    operationCode,
                    operationName,
                    sequence,
                    durationMinutes,
                    candidateResourceIds,
                    List.of(),
                    List.of(),
                    setupGroup
            );
        }
    }

    public record DemandInput(
            @NotBlank String demandId,
            @NotBlank String productCode,
            String quantity,
            @NotNull @Positive Integer dueMinutes,
            @NotNull @Positive Integer priority,
            String fixedResourceId,
            @PositiveOrZero Integer fixedStartMinutes
    ) {
        public DemandInput {
            quantity = quantity == null || quantity.isBlank() ? null : quantity.trim();
            fixedResourceId = fixedResourceId == null || fixedResourceId.isBlank() ? null : fixedResourceId.trim();
        }
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
}
