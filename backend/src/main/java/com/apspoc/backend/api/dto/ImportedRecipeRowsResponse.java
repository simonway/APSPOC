package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public record ImportedRecipeRowsResponse(
        String importId,
        String dataVersion,
        String status,
        int successCount,
        int failureCount,
        List<ImportedRecipeRow> recipes
) {

    public ImportedRecipeRowsResponse {
        recipes = List.copyOf(recipes);
    }

    public static ImportedRecipeRowsResponse from(ImportBatch batch, List<ImportedRecipeRow> recipes) {
        return new ImportedRecipeRowsResponse(
                batch.importId(),
                batch.dataVersion(),
                batch.status().name(),
                batch.successCount(),
                batch.failureCount(),
                recipes
        );
    }
}
