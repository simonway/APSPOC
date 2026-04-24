package com.apspoc.backend.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AuthCredentialsUpdateRequest(
        @NotBlank
        @Size(max = 64)
        String username,

        @NotBlank
        String currentPassword,

        String newPassword
) {
}
