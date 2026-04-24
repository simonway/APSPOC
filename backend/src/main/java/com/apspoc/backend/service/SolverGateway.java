package com.apspoc.backend.service;

import com.apspoc.backend.config.ApsProperties;
import org.springframework.stereotype.Component;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class SolverGateway {

    private final RestClient restClient;

    public SolverGateway(RestClient.Builder builder, ApsProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .version(HttpClient.Version.HTTP_1_1)
                .build();

        this.restClient = builder
                .requestFactory(new JdkClientHttpRequestFactory(httpClient))
                .baseUrl(properties.solver().baseUrl())
                .build();
    }

    public SolverResponse solve(SolverRequest request) {
        return restClient.post()
                .uri("/api/v1/solve")
                .body(request)
                .retrieve()
                .body(SolverResponse.class);
    }
}
