package com.apspoc.backend.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

public record GenerateScenarioFromImportBatchesRequest(
        @NotBlank String scenarioName,
        @NotBlank String dataVersion,
        @NotNull Instant scheduleStartAt,
        @NotNull @Positive Integer horizonMinutes,
        @Valid CreateScheduleJobRequest.ObjectiveWeights objectiveWeights,
        @Valid CreateScheduleJobRequest.SolverConfig solverConfig
) {
}
