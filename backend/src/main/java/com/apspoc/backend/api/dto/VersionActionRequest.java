package com.apspoc.backend.api.dto;

public record VersionActionRequest(
        String comment,
        String releaseNote
) {
}
