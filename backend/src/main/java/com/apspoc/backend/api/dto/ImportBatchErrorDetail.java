package com.apspoc.backend.api.dto;

public record ImportBatchErrorDetail(
        String sheetName,
        Integer rowNumber,
        String fieldName,
        String rawValue,
        String errorCode,
        String message,
        String suggestion
) {
}
