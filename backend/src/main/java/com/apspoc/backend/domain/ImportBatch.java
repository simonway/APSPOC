package com.apspoc.backend.domain;

import java.time.Instant;

public record ImportBatch(
        String importId,
        String dataVersion,
        ImportBatchKind importType,
        String sourceFileName,
        String importedBy,
        Instant createdAt,
        ImportBatchStatus status,
        int successCount,
        int failureCount,
        String payloadJson,
        String errorReportJson
) {
}
