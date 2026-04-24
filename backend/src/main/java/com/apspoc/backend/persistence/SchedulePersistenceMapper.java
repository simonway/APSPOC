package com.apspoc.backend.persistence;

import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.persistence.entity.GanttBarEntity;
import com.apspoc.backend.persistence.entity.GanttDowntimeEntity;
import com.apspoc.backend.persistence.entity.GanttRowEntity;
import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import com.apspoc.backend.persistence.entity.ScheduleVersionEntity;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class SchedulePersistenceMapper {

    public void updateJobEntity(ScheduleJobEntity target, ScheduleJob job) {
        target.setScenarioName(job.scenarioName());
        target.setStatus(job.status());
        target.setSolverStatus(job.solverStatus());
        target.setVersionId(job.versionId());
        target.setErrorMessage(job.errorMessage());
        target.setCreatedAt(job.createdAt());
        target.setCompletedAt(job.completedAt());
    }

    public ScheduleJob toDomain(ScheduleJobEntity entity) {
        return new ScheduleJob(
                entity.getId(),
                entity.getScenarioName(),
                entity.getCreatedAt(),
                entity.getStatus(),
                entity.getSolverStatus(),
                entity.getVersionId(),
                entity.getErrorMessage(),
                entity.getCompletedAt()
        );
    }

    public void updateVersionEntity(ScheduleVersionEntity target, ScheduleVersion version) {
        target.setVersionName(version.versionName());
        target.setStatus(version.status());
        target.setTriggerType(version.triggerType());
        target.setScenarioDescription(version.scenarioDescription());
        target.setCreatedAt(version.createdAt());
        target.setPublishedAt(version.publishedAt());
        target.setSourceRequestJson(version.sourceRequestJson());
        target.setTotalWeightedTardiness(version.ganttData().kpis().totalWeightedTardiness());
        target.setTotalMakespan(version.ganttData().kpis().totalMakespan());
        target.setLateTaskCount(version.ganttData().kpis().lateTaskCount());
        target.setAverageUtilization(version.ganttData().kpis().averageUtilization());

        target.getRows().clear();
        for (GanttData.Row row : version.ganttData().rows()) {
            GanttRowEntity rowEntity = new GanttRowEntity();
            rowEntity.setVersion(target);
            rowEntity.setRowCode(row.id());
            rowEntity.setLabel(row.label());
            rowEntity.setResourceType(row.resourceType());
            rowEntity.setSortOrder(row.sortOrder());
            target.getRows().add(rowEntity);
        }

        target.getBars().clear();
        for (GanttData.Bar bar : version.ganttData().bars()) {
            GanttBarEntity barEntity = new GanttBarEntity();
            barEntity.setVersion(target);
            barEntity.setBarCode(bar.id());
            barEntity.setRowCode(bar.rowId());
            barEntity.setStartMs(bar.startMs());
            barEntity.setEndMs(bar.endMs());
            barEntity.setLabel(bar.label());
            barEntity.setProductCode(bar.productCode());
            barEntity.setPriority(bar.priority());
            barEntity.setDueDateMs(bar.dueDateMs());
            barEntity.setLate(bar.late());
            barEntity.setTardinessMinutes(bar.tardinessMinutes());
            barEntity.setPinned(bar.pinned());
            target.getBars().add(barEntity);
        }

        target.getDowntimes().clear();
        for (GanttData.Downtime downtime : version.ganttData().downtimes()) {
            GanttDowntimeEntity downtimeEntity = new GanttDowntimeEntity();
            downtimeEntity.setVersion(target);
            downtimeEntity.setDowntimeCode(downtime.id());
            downtimeEntity.setRowCode(downtime.rowId());
            downtimeEntity.setStartMs(downtime.startMs());
            downtimeEntity.setEndMs(downtime.endMs());
            downtimeEntity.setDowntimeType(downtime.downtimeType());
            downtimeEntity.setSource(downtime.source());
            downtimeEntity.setDescription(downtime.description());
            target.getDowntimes().add(downtimeEntity);
        }
    }

    public ScheduleVersion toSummaryDomain(ScheduleVersionEntity entity) {
        List<GanttData.Row> rows = entity.getRows().stream()
                .map(row -> new GanttData.Row(
                        row.getRowCode(),
                        row.getLabel(),
                        row.getResourceType(),
                        row.getSortOrder()
                ))
                .toList();
        List<GanttData.Bar> bars = entity.getBars().stream()
                .map(bar -> new GanttData.Bar(
                        bar.getBarCode(),
                        bar.getRowCode(),
                        bar.getStartMs(),
                        bar.getEndMs(),
                        bar.getLabel(),
                        bar.getProductCode(),
                        bar.getPriority(),
                        bar.getDueDateMs(),
                        bar.isLate(),
                        bar.getTardinessMinutes(),
                        bar.isPinned()
                ))
                .toList();

        return new ScheduleVersion(
                entity.getId(),
                entity.getVersionName(),
                entity.getStatus(),
                entity.getTriggerType(),
                entity.getScenarioDescription(),
                entity.getCreatedAt(),
                entity.getPublishedAt(),
                entity.getSourceRequestJson(),
                new GanttData(
                        rows,
                        bars,
                        List.of(),
                        List.of(),
                        new GanttData.KpiSnapshot(
                                entity.getTotalWeightedTardiness(),
                                entity.getTotalMakespan(),
                                entity.getLateTaskCount(),
                                recalculateScheduleEfficiency(rows, bars, entity.getTotalMakespan(), entity.getAverageUtilization())
                        )
                )
        );
    }

    public ScheduleVersion toDomain(ScheduleVersionEntity entity) {
        List<GanttData.Row> rows = entity.getRows().stream()
                .map(row -> new GanttData.Row(
                        row.getRowCode(),
                        row.getLabel(),
                        row.getResourceType(),
                        row.getSortOrder()
                ))
                .toList();
        List<GanttData.Bar> bars = entity.getBars().stream()
                .map(bar -> new GanttData.Bar(
                        bar.getBarCode(),
                        bar.getRowCode(),
                        bar.getStartMs(),
                        bar.getEndMs(),
                        bar.getLabel(),
                        bar.getProductCode(),
                        bar.getPriority(),
                        bar.getDueDateMs(),
                        bar.isLate(),
                        bar.getTardinessMinutes(),
                        bar.isPinned()
                ))
                .toList();
        List<GanttData.Downtime> downtimes = entity.getDowntimes().stream()
                .map(downtime -> new GanttData.Downtime(
                        downtime.getDowntimeCode(),
                        downtime.getRowCode(),
                        downtime.getStartMs(),
                        downtime.getEndMs(),
                        downtime.getDowntimeType(),
                        downtime.getSource(),
                        downtime.getDescription()
                ))
                .toList();

        return new ScheduleVersion(
                entity.getId(),
                entity.getVersionName(),
                entity.getStatus(),
                entity.getTriggerType(),
                entity.getScenarioDescription(),
                entity.getCreatedAt(),
                entity.getPublishedAt(),
                entity.getSourceRequestJson(),
                new GanttData(
                        rows,
                        bars,
                        downtimes,
                        List.of(),
                        new GanttData.KpiSnapshot(
                                entity.getTotalWeightedTardiness(),
                                entity.getTotalMakespan(),
                                entity.getLateTaskCount(),
                                recalculateScheduleEfficiency(rows, bars, entity.getTotalMakespan(), entity.getAverageUtilization())
                        )
                )
        );
    }

    private double recalculateScheduleEfficiency(
            List<GanttData.Row> rows,
            List<GanttData.Bar> bars,
            int totalMakespan,
            double fallbackValue
    ) {
        if (totalMakespan <= 0 || rows.isEmpty() || bars.isEmpty()) {
            return fallbackValue;
        }

        Map<String, Long> busyMinutesByRow = new LinkedHashMap<>();
        for (GanttData.Row row : rows) {
            busyMinutesByRow.put(row.id(), 0L);
        }

        for (GanttData.Bar bar : bars) {
            long durationMinutes = Math.max(0L, (bar.endMs() - bar.startMs()) / 60_000L);
            busyMinutesByRow.merge(bar.rowId(), durationMinutes, Long::sum);
        }

        List<Long> usedBusyMinutes = busyMinutesByRow.values().stream()
                .filter(minutes -> minutes > 0)
                .toList();
        if (usedBusyMinutes.isEmpty()) {
            return 0.0;
        }

        double efficiency = usedBusyMinutes.stream()
                .mapToDouble(minutes -> minutes / (double) totalMakespan)
                .average()
                .orElse(0.0);
        return Math.round(efficiency * 10_000d) / 10_000d;
    }
}
