package com.apspoc.backend.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "schedule_scenario")
public class ScheduleScenarioEntity {

    @Id
    private String id;

    @Column(name = "scenario_name", nullable = false)
    private String scenarioName;

    @Column(name = "data_version")
    private String dataVersion;

    @Column(name = "schedule_start_at", nullable = false)
    private Instant scheduleStartAt;

    @Column(name = "horizon_minutes", nullable = false)
    private int horizonMinutes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "payload_json", nullable = false, columnDefinition = "text")
    private String payloadJson;

    protected ScheduleScenarioEntity() {
    }

    public ScheduleScenarioEntity(String id) {
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

    public String getDataVersion() {
        return dataVersion;
    }

    public void setDataVersion(String dataVersion) {
        this.dataVersion = dataVersion;
    }

    public Instant getScheduleStartAt() {
        return scheduleStartAt;
    }

    public void setScheduleStartAt(Instant scheduleStartAt) {
        this.scheduleStartAt = scheduleStartAt;
    }

    public int getHorizonMinutes() {
        return horizonMinutes;
    }

    public void setHorizonMinutes(int horizonMinutes) {
        this.horizonMinutes = horizonMinutes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }
}
