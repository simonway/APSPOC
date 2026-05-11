package com.apspoc.backend.api.dto;

import java.util.List;

public record ImportBatchValidationErrorResponse(
        String code,
        String message,
        ImportBatchResponse importBatch,
        List<ImportBatchErrorDetail> details,
        String errorsDownloadPath
) {
    public ImportBatchValidationErrorResponse {
        details = details == null ? List.of() : List.copyOf(details);
    }
}
