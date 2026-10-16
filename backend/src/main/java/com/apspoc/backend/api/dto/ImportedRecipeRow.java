package com.apspoc.backend.api.dto;

import java.util.List;

public record ImportedRecipeRow(
        String recipeId,
        String productCode,
        String operationCode,
        String operationName,
        int sequence,
        int durationMinutes,
        List<String> candidateResourceIds,
        List<CreateScheduleJobRequest.MaterialQuantityInput> materialInputs,
        List<CreateScheduleJobRequest.MaterialQuantityInput> materialOutputs,
        String setupGroup,
        String tankId,
        String mixingFamily
) {
    public ImportedRecipeRow {
        candidateResourceIds = List.copyOf(candidateResourceIds);
        materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
        materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
        setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
        tankId = tankId == null || tankId.isBlank() ? null : tankId.trim();
        mixingFamily = mixingFamily == null || mixingFamily.isBlank() ? null : mixingFamily.trim();
    }

    public ImportedRecipeRow(
            String recipeId,
            String productCode,
            String operationCode,
            String operationName,
            int sequence,
            int durationMinutes,
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
                setupGroup,
                null,
                null
        );
    }
}
