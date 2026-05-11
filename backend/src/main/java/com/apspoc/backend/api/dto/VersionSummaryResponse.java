package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ScheduleVersion;

import java.time.Instant;

public record VersionSummaryResponse(
        String versionId,
        String versionName,
        String status,
        String triggerType,
        String scenarioDescription,
        Instant createdAt,
        String createdBy,
        Instant publishedAt,
        String releaseNote,
        int totalWeightedTardiness,
        int totalMakespan,
        int lateTaskCount,
        double averageUtilization
) {

    public static VersionSummaryResponse from(ScheduleVersion version) {
        GanttData.KpiSnapshot kpi = version.ganttData().kpis();
        return new VersionSummaryResponse(
                version.id(),
                version.versionName(),
                version.status().name(),
                version.triggerType().name(),
                version.scenarioDescription(),
                version.createdAt(),
                version.createdBy(),
                version.publishedAt(),
                version.releaseNote(),
                kpi.totalWeightedTardiness(),
                kpi.totalMakespan(),
                kpi.lateTaskCount(),
                kpi.averageUtilization()
        );
    }
}
