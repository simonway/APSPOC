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
@Table(name = "schedule_downtime")
public class GanttDowntimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id", nullable = false)
    private ScheduleVersionEntity version;

    @Column(name = "downtime_code", nullable = false)
    private String downtimeCode;

    @Column(name = "row_code", nullable = false)
    private String rowCode;

    @Column(name = "start_ms", nullable = false)
    private long startMs;

    @Column(name = "end_ms", nullable = false)
    private long endMs;

    @Column(name = "downtime_type", nullable = false)
    private String downtimeType;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String description;

    public GanttDowntimeEntity() {
    }

    public ScheduleVersionEntity getVersion() {
        return version;
    }

    public void setVersion(ScheduleVersionEntity version) {
        this.version = version;
    }

    public String getDowntimeCode() {
        return downtimeCode;
    }

    public void setDowntimeCode(String downtimeCode) {
        this.downtimeCode = downtimeCode;
    }

    public String getRowCode() {
        return rowCode;
    }

    public void setRowCode(String rowCode) {
        this.rowCode = rowCode;
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

    public String getDowntimeType() {
        return downtimeType;
    }

    public void setDowntimeType(String downtimeType) {
        this.downtimeType = downtimeType;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
