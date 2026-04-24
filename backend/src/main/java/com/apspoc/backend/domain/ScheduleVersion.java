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
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, null, null, ganttData);
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
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, null, sourceRequestJson, ganttData);
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
        this(id, versionName, status, triggerType, scenarioDescription, createdAt, publishedAt, null, ganttData);
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

    public GanttData ganttData() {
        return ganttData;
    }

    public void publish() {
        this.status = VersionStatus.PUBLISHED;
        this.publishedAt = Instant.now();
    }

    public void archive() {
        this.status = VersionStatus.ARCHIVED;
    }
}
