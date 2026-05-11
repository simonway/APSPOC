package com.apspoc.backend.api.dto;

import java.util.Map;

public record GeneratedScenarioFromImportBatchesResponse(
        String dataVersion,
        Map<String, String> sourceImportBatchIds,
        GeneratedScenarioResponse scenario
) {
}
