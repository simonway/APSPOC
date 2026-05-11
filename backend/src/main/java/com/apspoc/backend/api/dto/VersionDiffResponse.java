package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.VersionDiff;

import java.time.Instant;
import java.util.List;

public record VersionDiffResponse(
        VersionReferenceResponse baseVersion,
        VersionReferenceResponse targetVersion,
        KpiDeltaResponse kpis,
        SummaryResponse summary,
        List<TaskChangeResponse> changedTasks
) {

    public static VersionDiffResponse from(VersionDiff diff) {
        return new VersionDiffResponse(
                VersionReferenceResponse.from(diff.baseVersion()),
                VersionReferenceResponse.from(diff.targetVersion()),
                KpiDeltaResponse.from(diff.kpis()),
                SummaryResponse.from(diff.summary()),
                diff.changedTasks().stream().map(TaskChangeResponse::from).toList()
        );
    }

    public record VersionReferenceResponse(
            String versionId,
            String versionName,
            String status,
            Instant createdAt,
            Instant publishedAt
    ) {
        public static VersionReferenceResponse from(VersionDiff.VersionReference reference) {
            return new VersionReferenceResponse(
                    reference.versionId(),
                    reference.versionName(),
                    reference.status().name(),
                    reference.createdAt(),
                    reference.publishedAt()
            );
        }
    }

    public record KpiDeltaResponse(
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
        public static KpiDeltaResponse from(VersionDiff.KpiDelta kpis) {
            return new KpiDeltaResponse(
                    kpis.baseTotalWeightedTardiness(),
                    kpis.targetTotalWeightedTardiness(),
                    kpis.totalWeightedTardinessDelta(),
                    kpis.baseTotalMakespan(),
                    kpis.targetTotalMakespan(),
                    kpis.totalMakespanDelta(),
                    kpis.baseLateTaskCount(),
                    kpis.targetLateTaskCount(),
                    kpis.lateTaskCountDelta(),
                    kpis.baseAverageUtilization(),
                    kpis.targetAverageUtilization(),
                    kpis.averageUtilizationDelta()
            );
        }
    }

    public record SummaryResponse(
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
        public static SummaryResponse from(VersionDiff.Summary summary) {
            return new SummaryResponse(
                    summary.addedTaskCount(),
                    summary.removedTaskCount(),
                    summary.changedTaskCount(),
                    summary.reassignedTaskCount(),
                    summary.movedTaskCount(),
                    summary.resizedTaskCount(),
                    summary.lateStateChangedCount(),
                    summary.unchangedTaskCount(),
                    summary.addedDowntimeCount(),
                    summary.removedDowntimeCount(),
                    summary.totalStartShiftMinutes(),
                    summary.maxStartShiftMinutes()
            );
        }
    }

    public record TaskChangeResponse(
            String taskId,
            String label,
            String changeType,
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
        public static TaskChangeResponse from(VersionDiff.TaskChange change) {
            return new TaskChangeResponse(
                    change.taskId(),
                    change.label(),
                    change.changeType().name(),
                    change.baseRowId(),
                    change.targetRowId(),
                    change.baseStartMs(),
                    change.targetStartMs(),
                    change.baseEndMs(),
                    change.targetEndMs(),
                    change.startShiftMinutes(),
                    change.endShiftMinutes(),
                    change.durationDeltaMinutes(),
                    change.tardinessDeltaMinutes(),
                    change.lateChanged(),
                    change.pinnedChanged(),
                    change.basePinned(),
                    change.targetPinned()
            );
        }
    }
}
