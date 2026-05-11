package com.apspoc.backend.api.dto;

public record AuthSessionResponse(
        boolean authenticated,
        String username,
        String role
) {
}
