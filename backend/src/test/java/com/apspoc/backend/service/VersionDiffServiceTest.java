package com.apspoc.backend.service;

import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ResourceType;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionDiff;
import com.apspoc.backend.domain.VersionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VersionDiffServiceTest {

    private final VersionDiffService versionDiffService = new VersionDiffService(new ObjectMapper());

    @Test
    void diffReportsAuditReadySummaryAndTaskLevelChanges() {
        ScheduleVersion baseVersion = version(
                "ver-base",
                "Baseline Plan",
                VersionStatus.RELEASED,
                List.of(
                        bar("task-A", "row-1", 0, 60, "Task A", 0, false, false),
                        bar("task-B", "row-1", 90, 150, "Task B", 15, true, false)
                ),
                List.of(downtime("dt-1", "row-1", 180, 240)),
                new GanttData.KpiSnapshot(15, 150, 1, 0.65)
        );
        ScheduleVersion targetVersion = version(
                "ver-target",
                "What-If Plan",
                VersionStatus.DRAFT,
                List.of(
                        bar("task-A", "row-2", 30, 120, "Task A", 10, true, true),
                        bar("task-C", "row-1", 150, 210, "Task C", 0, false, false)
                ),
                List.of(downtime("dt-2", "row-2", 210, 270)),
                new GanttData.KpiSnapshot(10, 210, 1, 0.72)
        );

        VersionDiff diff = versionDiffService.diff(baseVersion, targetVersion);

        assertThat(diff.baseVersion().versionId()).isEqualTo("ver-base");
        assertThat(diff.targetVersion().versionId()).isEqualTo("ver-target");
        assertThat(diff.kpis().totalWeightedTardinessDelta()).isEqualTo(-5);
        assertThat(diff.kpis().totalMakespanDelta()).isEqualTo(60);
        assertThat(diff.kpis().lateTaskCountDelta()).isZero();
        assertThat(diff.kpis().averageUtilizationDelta()).isEqualTo(0.07);

        assertThat(diff.summary().addedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().removedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().changedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().reassignedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().movedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().resizedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().lateStateChangedCount()).isEqualTo(1);
        assertThat(diff.summary().unchangedTaskCount()).isZero();
        assertThat(diff.summary().addedDowntimeCount()).isEqualTo(1);
        assertThat(diff.summary().removedDowntimeCount()).isEqualTo(1);
        assertThat(diff.summary().totalStartShiftMinutes()).isEqualTo(30);
        assertThat(diff.summary().maxStartShiftMinutes()).isEqualTo(30);

        assertThat(diff.changedTasks()).hasSize(3);

        VersionDiff.TaskChange modified = diff.changedTasks().getFirst();
        assertThat(modified.taskId()).isEqualTo("task-A");
        assertThat(modified.changeType()).isEqualTo(VersionDiff.TaskChangeType.MODIFIED);
        assertThat(modified.baseRowId()).isEqualTo("row-1");
        assertThat(modified.targetRowId()).isEqualTo("row-2");
        assertThat(modified.startShiftMinutes()).isEqualTo(30);
        assertThat(modified.endShiftMinutes()).isEqualTo(60);
        assertThat(modified.durationDeltaMinutes()).isEqualTo(30);
        assertThat(modified.tardinessDeltaMinutes()).isEqualTo(10);
        assertThat(modified.lateChanged()).isTrue();
        assertThat(modified.pinnedChanged()).isTrue();
        assertThat(modified.basePinned()).isFalse();
        assertThat(modified.targetPinned()).isTrue();

        assertThat(diff.changedTasks())
                .extracting(VersionDiff.TaskChange::changeType)
                .containsExactly(
                        VersionDiff.TaskChangeType.MODIFIED,
                        VersionDiff.TaskChangeType.REMOVED,
                        VersionDiff.TaskChangeType.ADDED
                );
    }

    @Test
    void diffMatchesGeneratedOperationTasksWhenSingleUnitIdsUseDifferentFormats() {
        String baseTaskId = "ord_pa101_001__01_react";
        String targetTaskId = "ord_pa101_001__u01__01_react";

        ScheduleVersion baseVersion = version(
                "ver-base-generated",
                "Generated Baseline",
                VersionStatus.RELEASED,
                List.of(
                        bar(baseTaskId, "row-1", 0, 60, "ord_pa101_001 / Reaction Stage", 0, false, false)
                ),
                List.of(),
                new GanttData.KpiSnapshot(0, 60, 0, 0.50),
                requestSnapshotJson(baseTaskId, "ord_pa101_001 / Reaction Stage", "PA-101", "REACT_A", "RM-A", "INT-A")
        );
        ScheduleVersion targetVersion = version(
                "ver-target-generated",
                "Generated What-If",
                VersionStatus.DRAFT,
                List.of(
                        bar(targetTaskId, "row-2", 20, 90, "ord_pa101_001 / Reactor Stage", 5, true, true)
                ),
                List.of(),
                new GanttData.KpiSnapshot(5, 90, 1, 0.55),
                requestSnapshotJson(targetTaskId, "ord_pa101_001 / Reactor Stage", "PA-101", "REACT_A", "RM-A", "INT-A")
        );

        VersionDiff diff = versionDiffService.diff(baseVersion, targetVersion);

        assertThat(diff.summary().changedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().addedTaskCount()).isZero();
        assertThat(diff.summary().removedTaskCount()).isZero();
        assertThat(diff.changedTasks()).singleElement().satisfies(change -> {
            assertThat(change.taskId()).isEqualTo(targetTaskId);
            assertThat(change.changeType()).isEqualTo(VersionDiff.TaskChangeType.MODIFIED);
            assertThat(change.baseRowId()).isEqualTo("row-1");
            assertThat(change.targetRowId()).isEqualTo("row-2");
            assertThat(change.startShiftMinutes()).isEqualTo(20);
            assertThat(change.tardinessDeltaMinutes()).isEqualTo(5);
        });
    }

    @Test
    void diffMatchesTasksByRequestSignatureWhenTaskIdsChangeCompletely() {
        String baseTaskId = "legacy-task-a";
        String targetTaskId = "regenerated-task-a";

        ScheduleVersion baseVersion = version(
                "ver-base-signature",
                "Signature Baseline",
                VersionStatus.RELEASED,
                List.of(
                        bar(baseTaskId, "row-1", 0, 60, "Order-001 / Blend", 0, false, false)
                ),
                List.of(),
                new GanttData.KpiSnapshot(0, 60, 0, 0.50),
                requestSnapshotJson(baseTaskId, "Order-001 / Blend", "RS-301", "BLEND_RS", "RM-BASE", "INT-BULK")
        );
        ScheduleVersion targetVersion = version(
                "ver-target-signature",
                "Signature What-If",
                VersionStatus.DRAFT,
                List.of(
                        bar(targetTaskId, "row-2", 15, 75, "Order-001 / Blend", 0, false, false)
                ),
                List.of(),
                new GanttData.KpiSnapshot(0, 75, 0, 0.55),
                requestSnapshotJson(targetTaskId, "Order-001 / Blend", "RS-301", "BLEND_RS", "RM-BASE", "INT-BULK")
        );

        VersionDiff diff = versionDiffService.diff(baseVersion, targetVersion);

        assertThat(diff.summary().changedTaskCount()).isEqualTo(1);
        assertThat(diff.summary().addedTaskCount()).isZero();
        assertThat(diff.summary().removedTaskCount()).isZero();
        assertThat(diff.changedTasks()).singleElement().satisfies(change -> {
            assertThat(change.taskId()).isEqualTo(targetTaskId);
            assertThat(change.changeType()).isEqualTo(VersionDiff.TaskChangeType.MODIFIED);
            assertThat(change.startShiftMinutes()).isEqualTo(15);
        });
    }

    private ScheduleVersion version(
            String id,
            String name,
            VersionStatus status,
            List<GanttData.Bar> bars,
            List<GanttData.Downtime> downtimes,
            GanttData.KpiSnapshot kpis
    ) {
        return version(id, name, status, bars, downtimes, kpis, null);
    }

    private ScheduleVersion version(
            String id,
            String name,
            VersionStatus status,
            List<GanttData.Bar> bars,
            List<GanttData.Downtime> downtimes,
            GanttData.KpiSnapshot kpis,
            String sourceRequestJson
    ) {
        return new ScheduleVersion(
                id,
                name,
                status,
                TriggerType.MANUAL,
                name,
                Instant.parse("2026-04-26T08:00:00Z"),
                status == VersionStatus.RELEASED ? Instant.parse("2026-04-26T09:00:00Z") : null,
                sourceRequestJson,
                null,
                new GanttData(
                        List.of(
                                new GanttData.Row("row-1", "Reactor-01", ResourceType.REACTOR, 1),
                                new GanttData.Row("row-2", "Reactor-02", ResourceType.REACTOR, 2)
                        ),
                        bars,
                        downtimes,
                        List.of(),
                        kpis
                )
        );
    }

    private String requestSnapshotJson(
            String taskId,
            String label,
            String productCode,
            String setupGroup,
            String materialInputCode,
            String materialOutputCode
    ) {
        return """
                {
                  "tasks": [
                    {
                      "id": "%s",
                      "label": "%s",
                      "productCode": "%s",
                      "setupGroup": "%s",
                      "materialInputs": [
                        {
                          "itemCode": "%s",
                          "quantity": 1
                        }
                      ],
                      "materialOutputs": [
                        {
                          "itemCode": "%s",
                          "quantity": 1
                        }
                      ]
                    }
                  ]
                }
                """.formatted(taskId, label, productCode, setupGroup, materialInputCode, materialOutputCode);
    }

    private GanttData.Bar bar(
            String id,
            String rowId,
            int startMinutes,
            int endMinutes,
            String label,
            int tardinessMinutes,
            boolean late,
            boolean pinned
    ) {
        return new GanttData.Bar(
                id,
                rowId,
                startMinutes * 60_000L,
                endMinutes * 60_000L,
                label,
                "P-" + id,
                1,
                endMinutes * 60_000L,
                late,
                tardinessMinutes,
                pinned
        );
    }

    private GanttData.Downtime downtime(String id, String rowId, int startMinutes, int endMinutes) {
        return new GanttData.Downtime(
                id,
                rowId,
                startMinutes * 60_000L,
                endMinutes * 60_000L,
                "MAINTENANCE",
                "CALENDAR",
                "Window"
        );
    }
}
