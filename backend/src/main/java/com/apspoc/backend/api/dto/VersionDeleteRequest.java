package com.apspoc.backend.api.dto;

import java.util.List;

public record VersionDeleteRequest(
        List<String> versionIds
) {
}
