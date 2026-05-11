package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public record ImportedSetupRuleRowsResponse(
        String importId,
        String dataVersion,
        String status,
        int successCount,
        int failureCount,
        List<ImportedSetupRuleRow> setupRules
) {

    public ImportedSetupRuleRowsResponse {
        setupRules = List.copyOf(setupRules);
    }

    public static ImportedSetupRuleRowsResponse from(ImportBatch batch, List<ImportedSetupRuleRow> setupRules) {
        return new ImportedSetupRuleRowsResponse(
                batch.importId(),
                batch.dataVersion(),
                batch.status().name(),
                batch.successCount(),
                batch.failureCount(),
                setupRules
        );
    }
}
