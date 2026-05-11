package com.apspoc.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Validated
@ConfigurationProperties(prefix = "aps.auth")
public record AuthProperties(
        @Min(1) int sessionTimeoutMinutes,
        SeedUser admin,
        SeedUser planner,
        SeedUser approver,
        SeedUser viewer
) {
    public record SeedUser(
            @NotBlank String username,
            @NotBlank String password
    ) {
    }
}
