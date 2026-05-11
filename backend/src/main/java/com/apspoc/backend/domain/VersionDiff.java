package com.apspoc.backend.domain;

import java.time.Instant;
import java.util.List;

public record VersionDiff(
        VersionReference baseVersion,
        VersionReference targetVersion,
        KpiDelta kpis,
        Summary summary,
        List<TaskChange> changedTasks
) {

    public record VersionReference(
            String versionId,
            String versionName,
            VersionStatus status,
            Instant createdAt,
            Instant publishedAt
    ) {
    }

    public record KpiDelta(
            int baseTotalWeightedTardiness,
            int targetTotalWeightedTardiness,
            int totalWeightedTardinessDelta,
            int baseTotalMakespan,
            int targetTotalMakespan,
            int totalMakespanDelta,
            int baseLateTaskCount,
            int targetLateTaskCount,
            int lateTaskCountDelta,
            double baseAverageUtilization,
            double targetAverageUtilization,
            double averageUtilizationDelta
    ) {
    }

    public record Summary(
            int addedTaskCount,
            int removedTaskCount,
            int changedTaskCount,
            int reassignedTaskCount,
            int movedTaskCount,
            int resizedTaskCount,
            int lateStateChangedCount,
            int unchangedTaskCount,
            int addedDowntimeCount,
            int removedDowntimeCount,
            long totalStartShiftMinutes,
            long maxStartShiftMinutes
    ) {
    }

    public record TaskChange(
            String taskId,
            String label,
            TaskChangeType changeType,
            String baseRowId,
            String targetRowId,
            Long baseStartMs,
            Long targetStartMs,
            Long baseEndMs,
            Long targetEndMs,
            Long startShiftMinutes,
            Long endShiftMinutes,
            Long durationDeltaMinutes,
            Integer tardinessDeltaMinutes,
            boolean lateChanged,
            boolean pinnedChanged,
            Boolean basePinned,
            Boolean targetPinned
    ) {
    }

    public enum TaskChangeType {
        ADDED,
        REMOVED,
        MODIFIED
    }
}
