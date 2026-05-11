package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ScheduleVersion;

import java.util.List;

public record GanttDataResponse(
        String versionId,
        String versionName,
        String status,
        String createdBy,
        String releaseNote,
        KpiResponse kpis,
        List<RowResponse> rows,
        List<BarResponse> bars,
        List<DowntimeResponse> downtimes,
        List<ChangeoverResponse> changeovers,
        List<InventoryCoverageResponse> inventoryCoverages
) {

    public static GanttDataResponse from(ScheduleVersion version) {
        return from(version, List.of());
    }

    public static GanttDataResponse from(
            ScheduleVersion version,
            List<InventoryCoverageResponse> inventoryCoverages
    ) {
        GanttData ganttData = version.ganttData();
        return new GanttDataResponse(
                version.id(),
                version.versionName(),
                version.status().name(),
                version.createdBy(),
                version.releaseNote(),
                KpiResponse.from(ganttData.kpis()),
                ganttData.rows().stream().map(RowResponse::from).toList(),
                ganttData.bars().stream().map(BarResponse::from).toList(),
                ganttData.downtimes().stream().map(DowntimeResponse::from).toList(),
                ganttData.changeovers().stream().map(ChangeoverResponse::from).toList(),
                inventoryCoverages == null ? List.of() : List.copyOf(inventoryCoverages)
        );
    }

    public record KpiResponse(
            int totalWeightedTardiness,
            int totalMakespan,
            int lateTaskCount,
            double averageUtilization
    ) {
        public static KpiResponse from(GanttData.KpiSnapshot kpi) {
            return new KpiResponse(
                    kpi.totalWeightedTardiness(),
                    kpi.totalMakespan(),
                    kpi.lateTaskCount(),
                    kpi.averageUtilization()
            );
        }
    }

    public record RowResponse(
            String id,
            String label,
            String resourceType,
            int sortOrder
    ) {
        public static RowResponse from(GanttData.Row row) {
            return new RowResponse(row.id(), row.label(), row.resourceType().name(), row.sortOrder());
        }
    }

    public record BarResponse(
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
        public static BarResponse from(GanttData.Bar bar) {
            return new BarResponse(
                    bar.id(),
                    bar.rowId(),
                    bar.startMs(),
                    bar.endMs(),
                    bar.label(),
                    bar.productCode(),
                    bar.priority(),
                    bar.dueDateMs(),
                    bar.late(),
                    bar.tardinessMinutes(),
                    bar.pinned()
            );
        }
    }

    public record DowntimeResponse(
            String id,
            String rowId,
            long startMs,
            long endMs,
            String downtimeType,
            String source,
            String description
    ) {
        public static DowntimeResponse from(GanttData.Downtime downtime) {
            return new DowntimeResponse(
                    downtime.id(),
                    downtime.rowId(),
                    downtime.startMs(),
                    downtime.endMs(),
                    downtime.downtimeType(),
                    downtime.source(),
                    downtime.description()
            );
        }
    }

    public record ChangeoverResponse(
            String id,
            String rowId,
            String fromTaskId,
            String toTaskId,
            long startMs,
            long endMs,
            int durationMinutes
    ) {
        public static ChangeoverResponse from(GanttData.Changeover changeover) {
            return new ChangeoverResponse(
                    changeover.id(),
                    changeover.rowId(),
                    changeover.fromTaskId(),
                    changeover.toTaskId(),
                    changeover.startMs(),
                    changeover.endMs(),
                    changeover.durationMinutes()
            );
        }
    }

    public record InventoryCoverageResponse(
            String id,
            String demandId,
            String itemCode,
            int requestedQuantity,
            int coveredQuantity,
            int priority,
            long dueDateMs,
            boolean fullyCovered
    ) {
    }
}
