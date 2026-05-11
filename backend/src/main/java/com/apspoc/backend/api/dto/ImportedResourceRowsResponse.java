package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public record ImportedResourceRowsResponse(
        String importId,
        String dataVersion,
        String status,
        int successCount,
        int failureCount,
        List<CreateScheduleJobRequest.ResourceInput> resources
) {

    public ImportedResourceRowsResponse {
        resources = List.copyOf(resources);
    }

    public static ImportedResourceRowsResponse from(ImportBatch batch, List<CreateScheduleJobRequest.ResourceInput> resources) {
        return new ImportedResourceRowsResponse(
                batch.importId(),
                batch.dataVersion(),
                batch.status().name(),
                batch.successCount(),
                batch.failureCount(),
                resources
        );
    }
}
