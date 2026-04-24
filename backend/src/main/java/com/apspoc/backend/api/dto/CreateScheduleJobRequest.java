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
        @Valid SolverConfig solverConfig
) {

    public CreateScheduleJobRequest {
        resources = List.copyOf(resources);
        tasks = List.copyOf(tasks);
        downtimes = downtimes == null ? List.of() : List.copyOf(downtimes);
        objectiveWeights = objectiveWeights == null ? new ObjectiveWeights(100, 1) : objectiveWeights;
        solverConfig = solverConfig == null ? new SolverConfig(10, 4) : solverConfig;
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
            @PositiveOrZero Integer pinnedStartMinutes
    ) {
        public TaskInput {
            candidateResourceIds = List.copyOf(candidateResourceIds);
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
            @PositiveOrZero Integer makespan
    ) {
    }

    public record SolverConfig(
            @Positive Integer timeLimitSeconds,
            @Positive Integer numSearchWorkers
    ) {
    }
}
