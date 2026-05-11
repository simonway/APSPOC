package com.apspoc.backend.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedule_changeover")
public class GanttChangeoverEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id", nullable = false)
    private ScheduleVersionEntity version;

    @Column(name = "changeover_code", nullable = false)
    private String changeoverCode;

    @Column(name = "row_code", nullable = false)
    private String rowCode;

    @Column(name = "from_task_code", nullable = false)
    private String fromTaskCode;

    @Column(name = "to_task_code", nullable = false)
    private String toTaskCode;

    @Column(name = "start_ms", nullable = false)
    private long startMs;

    @Column(name = "end_ms", nullable = false)
    private long endMs;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    public Long getId() {
        return id;
    }

    public ScheduleVersionEntity getVersion() {
        return version;
    }

    public void setVersion(ScheduleVersionEntity version) {
        this.version = version;
    }

    public String getChangeoverCode() {
        return changeoverCode;
    }

    public void setChangeoverCode(String changeoverCode) {
        this.changeoverCode = changeoverCode;
    }

    public String getRowCode() {
        return rowCode;
    }

    public void setRowCode(String rowCode) {
        this.rowCode = rowCode;
    }

    public String getFromTaskCode() {
        return fromTaskCode;
    }

    public void setFromTaskCode(String fromTaskCode) {
        this.fromTaskCode = fromTaskCode;
    }

    public String getToTaskCode() {
        return toTaskCode;
    }

    public void setToTaskCode(String toTaskCode) {
        this.toTaskCode = toTaskCode;
    }

    public long getStartMs() {
        return startMs;
    }

    public void setStartMs(long startMs) {
        this.startMs = startMs;
    }

    public long getEndMs() {
        return endMs;
    }

    public void setEndMs(long endMs) {
        this.endMs = endMs;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}
