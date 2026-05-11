package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public record ImportedDowntimeRowsResponse(
        String importId,
        String dataVersion,
        String status,
        int successCount,
        int failureCount,
        List<CreateScheduleJobRequest.DowntimeInput> downtimes
) {

    public ImportedDowntimeRowsResponse {
        downtimes = List.copyOf(downtimes);
    }

    public static ImportedDowntimeRowsResponse from(ImportBatch batch, List<CreateScheduleJobRequest.DowntimeInput> downtimes) {
        return new ImportedDowntimeRowsResponse(
                batch.importId(),
                batch.dataVersion(),
                batch.status().name(),
                batch.successCount(),
                batch.failureCount(),
                downtimes
        );
    }
}
