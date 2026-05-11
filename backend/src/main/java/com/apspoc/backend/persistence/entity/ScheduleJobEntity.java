package com.apspoc.backend.persistence.entity;

import com.apspoc.backend.domain.JobFailureReason;
import com.apspoc.backend.domain.JobStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "schedule_job")
public class ScheduleJobEntity {

    @Id
    private String id;

    @Column(name = "scenario_name", nullable = false)
    private String scenarioName;

    @Column(name = "actor_username", nullable = false)
    private String actorUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;

    @Column(name = "solver_status", nullable = false)
    private String solverStatus;

    @Column(name = "version_id")
    private String versionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "failure_reason")
    private JobFailureReason failureReason;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "source_request_json", columnDefinition = "text")
    private String sourceRequestJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected ScheduleJobEntity() {
    }

    public ScheduleJobEntity(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public String getScenarioName() {
        return scenarioName;
    }

    public void setScenarioName(String scenarioName) {
        this.scenarioName = scenarioName;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = actorUsername;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public String getSolverStatus() {
        return solverStatus;
    }

    public void setSolverStatus(String solverStatus) {
        this.solverStatus = solverStatus;
    }

    public String getVersionId() {
        return versionId;
    }

    public void setVersionId(String versionId) {
        this.versionId = versionId;
    }

    public JobFailureReason getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(JobFailureReason failureReason) {
        this.failureReason = failureReason;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getSourceRequestJson() {
        return sourceRequestJson;
    }

    public void setSourceRequestJson(String sourceRequestJson) {
        this.sourceRequestJson = sourceRequestJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
