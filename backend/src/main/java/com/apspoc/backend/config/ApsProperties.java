package com.apspoc.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aps")
public record ApsProperties(Solver solver) {

    public record Solver(String baseUrl) {
    }
}

