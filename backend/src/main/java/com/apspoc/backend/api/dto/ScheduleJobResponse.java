package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ScheduleJob;

import java.time.Instant;

public record ScheduleJobResponse(
        String jobId,
        String scenarioName,
        String status,
        String solverStatus,
        String versionId,
        String errorMessage,
        Instant createdAt,
        Instant completedAt
) {

    public static ScheduleJobResponse from(ScheduleJob job) {
        return new ScheduleJobResponse(
                job.id(),
                job.scenarioName(),
                job.status().name(),
                job.solverStatus(),
                job.versionId(),
                job.errorMessage(),
                job.createdAt(),
                job.completedAt()
        );
    }
}

