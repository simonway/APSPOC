package com.apspoc.backend.domain;

import java.time.Instant;

public final class ScheduleVersion {

    private final String id;
    private final String versionName;
    private volatile VersionStatus status;
    private final TriggerType triggerType;
    private final String scenarioDescription;
    private final Instant createdAt;
    private volatile Instant publishedAt;
    private final String sourceRequestJson;
    private volatile String releaseNote;
    private final String createdBy;
    private final GanttData ganttData;

    public ScheduleVersion(
            String id,
            String versionName,
            VersionStatus status,
            TriggerType triggerType,
            String scenarioDescription,
            Instant createdAt,
            GanttData ganttData
    ) {
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, null, null, null, "system", ganttData);
    }

    public ScheduleVersion(
            String id,
            String versionName,
            VersionStatus status,
            TriggerType triggerType,
            String scenarioDescription,
            Instant createdAt,
            String sourceRequestJson,
            GanttData ganttData
    ) {
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, null, sourceRequestJson, null, "system", ganttData);
    }

    public ScheduleVersion(
            String id,
            String versionName,
            VersionStatus status,
            TriggerType triggerType,
            String scenarioDescription,
            Instant createdAt,
            String sourceRequestJson,
            String createdBy,
            GanttData ganttData
    ) {
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, null, sourceRequestJson, null, createdBy, ganttData);
    }

    public ScheduleVersion(
            String id,
            String versionName,
            VersionStatus status,
            TriggerType triggerType,
            String scenarioDescription,
            Instant createdAt,
            Instant publishedAt,
            GanttData ganttData
    ) {
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, publishedAt, null, null, "system", ganttData);
    }

    public ScheduleVersion(
            String id,
            String versionName,
            VersionStatus status,
            TriggerType triggerType,
            String scenarioDescription,
            Instant createdAt,
            Instant publishedAt,
            String sourceRequestJson,
            String releaseNote,
            GanttData ganttData
    ) {
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, publishedAt, sourceRequestJson, releaseNote, "system", ganttData);
    }

    public ScheduleVersion(
            String id,
            String versionName,
            VersionStatus status,
            TriggerType triggerType,
            String scenarioDescription,
            Instant createdAt,
            Instant publishedAt,
            String sourceRequestJson,
            String releaseNote,
            String createdBy,
            GanttData ganttData
    ) {
        this.id = id;
        this.versionName = versionName;
        this.status = status;
        this.triggerType = triggerType;
        this.scenarioDescription = scenarioDescription;
        this.createdAt = createdAt;
        this.publishedAt = publishedAt;
        this.sourceRequestJson = sourceRequestJson;
        this.releaseNote = releaseNote;
        this.createdBy = createdBy;
        this.ganttData = ganttData;
    }

    public String id() {
        return id;
    }

    public String versionName() {
        return versionName;
    }

    public VersionStatus status() {
        return status;
    }

    public TriggerType triggerType() {
        return triggerType;
    }

    public String scenarioDescription() {
        return scenarioDescription;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant publishedAt() {
        return publishedAt;
    }

    public String sourceRequestJson() {
        return sourceRequestJson;
    }

    public String releaseNote() {
        return releaseNote;
    }

    public String createdBy() {
        return createdBy;
    }

    public GanttData ganttData() {
        return ganttData;
    }

    public void setReleaseNote(String releaseNote) {
        this.releaseNote = releaseNote;
    }

    public void markReadyForRelease() {
        this.status = VersionStatus.READY_FOR_RELEASE;
    }

    public void publish() {
        this.status = VersionStatus.RELEASED;
        this.publishedAt = Instant.now();
    }

    public void archive() {
        this.status = VersionStatus.ARCHIVED;
    }

    public void markRolledBack() {
        this.status = VersionStatus.ROLLED_BACK;
    }
}
