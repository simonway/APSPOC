package com.apspoc.backend.domain;

import java.time.Instant;

public final class ScheduleJob {

    private final String id;
    private final String scenarioName;
    private final Instant createdAt;
    private volatile JobStatus status;
    private volatile String solverStatus;
    private volatile String versionId;
    private volatile String errorMessage;
    private volatile Instant completedAt;

    public ScheduleJob(String id, String scenarioName, Instant createdAt) {
        this(
                id,
                scenarioName,
                createdAt,
                JobStatus.PENDING,
                "PENDING",
                null,
                null,
                null
        );
    }

    public ScheduleJob(
            String id,
            String scenarioName,
            Instant createdAt,
            JobStatus status,
            String solverStatus,
            String versionId,
            String errorMessage,
            Instant completedAt
    ) {
        this.id = id;
        this.scenarioName = scenarioName;
        this.createdAt = createdAt;
        this.status = status;
        this.solverStatus = solverStatus;
        this.versionId = versionId;
        this.errorMessage = errorMessage;
        this.completedAt = completedAt;
    }

    public String id() {
        return id;
    }

    public String scenarioName() {
        return scenarioName;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public JobStatus status() {
        return status;
    }

    public String solverStatus() {
        return solverStatus;
    }

    public String versionId() {
        return versionId;
    }

    public String errorMessage() {
        return errorMessage;
    }

    public Instant completedAt() {
        return completedAt;
    }

    public void markRunning() {
        this.status = JobStatus.RUNNING;
        this.solverStatus = "RUNNING";
        this.errorMessage = null;
    }

    public void markDone(String solverStatus, String versionId) {
        this.status = JobStatus.DONE;
        this.solverStatus = solverStatus;
        this.versionId = versionId;
        this.completedAt = Instant.now();
        this.errorMessage = null;
    }

    public void markFailed(String errorMessage) {
        this.status = JobStatus.FAILED;
        this.solverStatus = "FAILED";
        this.errorMessage = errorMessage;
        this.completedAt = Instant.now();
    }
}
