package com.apspoc.backend.domain;

import java.time.Instant;

public final class ScheduleJob {

    private final String id;
    private final String scenarioName;
    private final String actorUsername;
    private final String sourceRequestJson;
    private final Instant createdAt;
    private volatile JobStatus status;
    private volatile String solverStatus;
    private volatile String versionId;
    private volatile JobFailureReason failureReason;
    private volatile String errorMessage;
    private volatile Instant completedAt;

    public ScheduleJob(String id, String scenarioName, String actorUsername, String sourceRequestJson, Instant createdAt) {
        this(
                id,
                scenarioName,
                actorUsername,
                sourceRequestJson,
                createdAt,
                JobStatus.CREATED,
                "CREATED",
                null,
                null,
                null,
                null
        );
    }

    public ScheduleJob(
            String id,
            String scenarioName,
            String actorUsername,
            String sourceRequestJson,
            Instant createdAt,
            JobStatus status,
            String solverStatus,
            String versionId,
            JobFailureReason failureReason,
            String errorMessage,
            Instant completedAt
    ) {
        this.id = id;
        this.scenarioName = scenarioName;
        this.actorUsername = actorUsername;
        this.sourceRequestJson = sourceRequestJson;
        this.createdAt = createdAt;
        this.status = status;
        this.solverStatus = solverStatus;
        this.versionId = versionId;
        this.failureReason = failureReason;
        this.errorMessage = errorMessage;
        this.completedAt = completedAt;
    }

    public String id() {
        return id;
    }

    public String scenarioName() {
        return scenarioName;
    }

    public String actorUsername() {
        return actorUsername;
    }

    public String sourceRequestJson() {
        return sourceRequestJson;
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

    public JobFailureReason failureReason() {
        return failureReason;
    }

    public String errorMessage() {
        return errorMessage;
    }

    public Instant completedAt() {
        return completedAt;
    }

    public void markQueued() {
        this.status = JobStatus.QUEUED;
        this.solverStatus = "QUEUED";
        this.failureReason = null;
        this.errorMessage = null;
        this.completedAt = null;
    }

    public void markRunning() {
        this.status = JobStatus.RUNNING;
        this.solverStatus = "RUNNING";
        this.failureReason = null;
        this.errorMessage = null;
        this.completedAt = null;
    }

    public void markSucceeded(String solverStatus, String versionId) {
        this.status = JobStatus.SUCCEEDED;
        this.solverStatus = solverStatus;
        this.versionId = versionId;
        this.failureReason = null;
        this.completedAt = Instant.now();
        this.errorMessage = null;
    }

    public void markFailed(JobFailureReason failureReason, String solverStatus, String errorMessage) {
        this.status = JobStatus.FAILED;
        this.solverStatus = solverStatus == null || solverStatus.isBlank() ? "FAILED" : solverStatus;
        this.failureReason = failureReason;
        this.errorMessage = errorMessage;
        this.completedAt = Instant.now();
    }

    public void markTimedOut(String errorMessage) {
        this.status = JobStatus.TIMEOUT;
        this.solverStatus = "TIMEOUT";
        this.failureReason = JobFailureReason.SOLVER_TIMEOUT;
        this.errorMessage = errorMessage;
        this.completedAt = Instant.now();
    }

    public void markCancelled(String errorMessage) {
        this.status = JobStatus.CANCELLED;
        this.solverStatus = "CANCELLED";
        this.failureReason = JobFailureReason.JOB_CANCELLED;
        this.errorMessage = errorMessage;
        this.completedAt = Instant.now();
    }
}
