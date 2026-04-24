package com.apspoc.backend.service;

import java.time.Instant;
import java.util.List;

public record SolverRequest(
        String jobId,
        Instant scheduleStartAt,
        int horizonMinutes,
        List<Resource> resources,
        List<Task> tasks,
        List<Downtime> downtimes,
        ObjectiveWeights objectiveWeights,
        SolverConfig solverConfig
) {

    public record Resource(
            String id,
            String label,
            String resourceType,
            int sortOrder
    ) {
    }

    public record Task(
            String id,
            String label,
            String productCode,
            int durationMinutes,
            int dueMinutes,
            int priority,
            List<String> candidateResourceIds,
            String pinnedResourceId,
            Integer pinnedStartMinutes
    ) {
    }

    public record Downtime(
            String id,
            String resourceId,
            int startMinutes,
            int endMinutes,
            String downtimeType,
            String source,
            String description
    ) {
    }

    public record ObjectiveWeights(
            int tardiness,
            int makespan
    ) {
    }

    public record SolverConfig(
            int timeLimitSeconds,
            int numSearchWorkers
    ) {
    }
}
