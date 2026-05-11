package com.apspoc.backend.api.dto;

public record ImportedDemandRow(
        String demandId,
        String productCode,
        String quantity,
        int dueMinutes,
        int priority,
        String fixedResourceId,
        Integer fixedStartMinutes
) {
}
