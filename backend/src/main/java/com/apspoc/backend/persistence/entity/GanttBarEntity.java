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
@Table(name = "schedule_bar")
public class GanttBarEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id", nullable = false)
    private ScheduleVersionEntity version;

    @Column(name = "bar_code", nullable = false)
    private String barCode;

    @Column(name = "row_code", nullable = false)
    private String rowCode;

    @Column(name = "start_ms", nullable = false)
    private long startMs;

    @Column(name = "end_ms", nullable = false)
    private long endMs;

    @Column(nullable = false)
    private String label;

    @Column(name = "product_code", nullable = false)
    private String productCode;

    @Column(nullable = false)
    private int priority;

    @Column(name = "due_date_ms", nullable = false)
    private long dueDateMs;

    @Column(nullable = false)
    private boolean late;

    @Column(name = "tardiness_minutes", nullable = false)
    private int tardinessMinutes;

    @Column(nullable = false)
    private boolean pinned;

    public GanttBarEntity() {
    }

    public ScheduleVersionEntity getVersion() {
        return version;
    }

    public void setVersion(ScheduleVersionEntity version) {
        this.version = version;
    }

    public String getBarCode() {
        return barCode;
    }

    public void setBarCode(String barCode) {
        this.barCode = barCode;
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

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public int getPriority() {
        return priority;
    }

    public void setPriority(int priority) {
        this.priority = priority;
    }

    public long getDueDateMs() {
        return dueDateMs;
    }

    public void setDueDateMs(long dueDateMs) {
        this.dueDateMs = dueDateMs;
    }

    public boolean isLate() {
        return late;
    }

    public void setLate(boolean late) {
        this.late = late;
    }

    public int getTardinessMinutes() {
        return tardinessMinutes;
    }

    public void setTardinessMinutes(int tardinessMinutes) {
        this.tardinessMinutes = tardinessMinutes;
    }

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }
}
