package com.apspoc.backend.service;

import com.apspoc.backend.config.ApsProperties;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.ResourceAccessException;

import java.net.http.HttpTimeoutException;
import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class SolverGateway {

    private final RestClient.Builder builder;
    private final String baseUrl;
    private final HttpClient httpClient;

    public SolverGateway(RestClient.Builder builder, ApsProperties properties) {
        this.builder = builder;
        this.baseUrl = properties.solver().baseUrl();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .version(HttpClient.Version.HTTP_1_1)
                .build();
    }

    public SolverResponse solve(SolverRequest request) {
        return solve(request, Duration.ofSeconds(60));
    }

    public SolverResponse solve(SolverRequest request, Duration timeout) {
        Duration effectiveTimeout = timeout == null || timeout.isZero() || timeout.isNegative()
                ? Duration.ofSeconds(60)
                : timeout;
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(effectiveTimeout);
        RestClient restClient = builder
                .requestFactory(requestFactory)
                .baseUrl(baseUrl)
                .build();
        try {
            return restClient.post()
                    .uri("/api/v1/solve")
                    .body(request)
                    .retrieve()
                    .body(SolverResponse.class);
        } catch (ResourceAccessException ex) {
            if (isTimeout(ex)) {
                throw new SolverTimeoutException(
                        "Solver request timed out at %s after %d seconds."
                                .formatted(resolveSolveEndpoint(), effectiveTimeout.toSeconds()),
                        ex
                );
            }
            throw new SolverUnavailableException(
                    "Solver service is unreachable at %s. Start the solver or update `aps.solver.base-url`."
                            .formatted(resolveSolveEndpoint()),
                    ex
            );
        } catch (RestClientException ex) {
            throw new SolverUnavailableException(
                    "Solver request failed at %s: %s"
                            .formatted(resolveSolveEndpoint(), ex.getMessage()),
                    ex
            );
        }
    }

    private boolean isTimeout(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof HttpTimeoutException) {
                return true;
            }
            current = current.getCause();
        }
        String message = throwable.getMessage();
        return message != null && message.toLowerCase().contains("timed out");
    }

    private String resolveSolveEndpoint() {
        return baseUrl.replaceAll("/+$", "") + "/api/v1/solve";
    }

    public static class SolverTimeoutException extends RuntimeException {

        public SolverTimeoutException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class SolverUnavailableException extends RuntimeException {

        public SolverUnavailableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
