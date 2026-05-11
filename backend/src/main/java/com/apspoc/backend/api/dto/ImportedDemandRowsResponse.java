package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public record ImportedDemandRowsResponse(
        String importId,
        String dataVersion,
        String status,
        int successCount,
        int failureCount,
        List<ImportedDemandRow> demands
) {

    public ImportedDemandRowsResponse {
        demands = List.copyOf(demands);
    }

    public static ImportedDemandRowsResponse from(ImportBatch batch, List<ImportedDemandRow> demands) {
        return new ImportedDemandRowsResponse(
                batch.importId(),
                batch.dataVersion(),
                batch.status().name(),
                batch.successCount(),
                batch.failureCount(),
                demands
        );
    }
}
