package com.apspoc.backend.api.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;

public record ImportBatchResponse(
        String importId,
        String dataVersion,
        String importType,
        String sourceFileName,
        String importedBy,
        Instant createdAt,
        String status,
        int successCount,
        int failureCount,
        JsonNode payload,
        JsonNode errors,
        String errorsDownloadPath
) {
}
