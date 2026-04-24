package com.apspoc.backend.domain;

import java.util.List;

public record GanttData(
        List<Row> rows,
        List<Bar> bars,
        List<Downtime> downtimes,
        List<Changeover> changeovers,
        KpiSnapshot kpis
) {

    public record Row(
            String id,
            String label,
            ResourceType resourceType,
            int sortOrder
    ) {
    }

    public record Bar(
            String id,
            String rowId,
            long startMs,
            long endMs,
            String label,
            String productCode,
            int priority,
            long dueDateMs,
            boolean late,
            int tardinessMinutes,
            boolean pinned
    ) {
    }

    public record Downtime(
            String id,
            String rowId,
            long startMs,
            long endMs,
            String downtimeType,
            String source,
            String description
    ) {
    }

    public record Changeover(
            String id,
            String rowId,
            String fromTaskId,
            String toTaskId,
            long startMs,
            long endMs,
            int durationMinutes
    ) {
    }

    public record KpiSnapshot(
            int totalWeightedTardiness,
            int totalMakespan,
            int lateTaskCount,
            double averageUtilization
    ) {
    }
}

