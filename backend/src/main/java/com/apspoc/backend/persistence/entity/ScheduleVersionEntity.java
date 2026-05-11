package com.apspoc.backend.persistence.entity;

import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule_version")
public class ScheduleVersionEntity {

    @Id
    private String id;

    @Column(name = "version_name", nullable = false)
    private String versionName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VersionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    private TriggerType triggerType;

    @Column(name = "scenario_description", nullable = false)
    private String scenarioDescription;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "source_request_json")
    private String sourceRequestJson;

    @Column(name = "release_note")
    private String releaseNote;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "total_weighted_tardiness", nullable = false)
    private int totalWeightedTardiness;

    @Column(name = "total_makespan", nullable = false)
    private int totalMakespan;

    @Column(name = "late_task_count", nullable = false)
    private int lateTaskCount;

    @Column(name = "average_utilization", nullable = false)
    private double averageUtilization;

    @OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private final List<GanttRowEntity> rows = new ArrayList<>();

    @OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("startMs ASC")
    private final List<GanttBarEntity> bars = new ArrayList<>();

    @OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("startMs ASC")
    private final List<GanttDowntimeEntity> downtimes = new ArrayList<>();

    @OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("startMs ASC")
    private final List<GanttChangeoverEntity> changeovers = new ArrayList<>();

    protected ScheduleVersionEntity() {
    }

    public ScheduleVersionEntity(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public String getVersionName() {
        return versionName;
    }

    public void setVersionName(String versionName) {
        this.versionName = versionName;
    }

    public VersionStatus getStatus() {
        return status;
    }

    public void setStatus(VersionStatus status) {
        this.status = status;
    }

    public TriggerType getTriggerType() {
        return triggerType;
    }

    public void setTriggerType(TriggerType triggerType) {
        this.triggerType = triggerType;
    }

    public String getScenarioDescription() {
        return scenarioDescription;
    }

    public void setScenarioDescription(String scenarioDescription) {
        this.scenarioDescription = scenarioDescription;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getSourceRequestJson() {
        return sourceRequestJson;
    }

    public void setSourceRequestJson(String sourceRequestJson) {
        this.sourceRequestJson = sourceRequestJson;
    }

    public String getReleaseNote() {
        return releaseNote;
    }

    public void setReleaseNote(String releaseNote) {
        this.releaseNote = releaseNote;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public int getTotalWeightedTardiness() {
        return totalWeightedTardiness;
    }

    public void setTotalWeightedTardiness(int totalWeightedTardiness) {
        this.totalWeightedTardiness = totalWeightedTardiness;
    }

    public int getTotalMakespan() {
        return totalMakespan;
    }

    public void setTotalMakespan(int totalMakespan) {
        this.totalMakespan = totalMakespan;
    }

    public int getLateTaskCount() {
        return lateTaskCount;
    }

    public void setLateTaskCount(int lateTaskCount) {
        this.lateTaskCount = lateTaskCount;
    }

    public double getAverageUtilization() {
        return averageUtilization;
    }

    public void setAverageUtilization(double averageUtilization) {
        this.averageUtilization = averageUtilization;
    }

    public List<GanttRowEntity> getRows() {
        return rows;
    }

    public List<GanttBarEntity> getBars() {
        return bars;
    }

    public List<GanttDowntimeEntity> getDowntimes() {
        return downtimes;
    }

    public List<GanttChangeoverEntity> getChangeovers() {
        return changeovers;
    }
}
