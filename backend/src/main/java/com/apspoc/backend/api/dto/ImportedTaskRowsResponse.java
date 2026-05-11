package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public record ImportedTaskRowsResponse(
        String importId,
        String dataVersion,
        String status,
        int successCount,
        int failureCount,
        List<CreateScheduleJobRequest.TaskInput> tasks
) {

    public ImportedTaskRowsResponse {
        tasks = List.copyOf(tasks);
    }

    public static ImportedTaskRowsResponse from(ImportBatch batch, List<CreateScheduleJobRequest.TaskInput> tasks) {
        return new ImportedTaskRowsResponse(
                batch.importId(),
                batch.dataVersion(),
                batch.status().name(),
                batch.successCount(),
                batch.failureCount(),
                tasks
        );
    }
}
