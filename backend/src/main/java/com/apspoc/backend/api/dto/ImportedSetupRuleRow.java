package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ResourceType;

public record ImportedSetupRuleRow(
        String fromSetupGroup,
        String toSetupGroup,
        ResourceType resourceType,
        String resourceId,
        int setupMinutes
) {
}
