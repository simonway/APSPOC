package com.apspoc.backend.service;

import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.VersionDiff;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class VersionDiffService {

    private static final Pattern GENERATED_TASK_WITH_UNIT_PATTERN = Pattern.compile("^(.+)__u(\\d+)__(\\d+)_([A-Za-z0-9_-]+)$");
    private static final Pattern GENERATED_TASK_PATTERN = Pattern.compile("^(.+)__(\\d+)_([A-Za-z0-9_-]+)$");

    private final ObjectMapper objectMapper;

    public VersionDiffService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public VersionDiff diff(ScheduleVersion baseVersion, ScheduleVersion targetVersion) {
        Map<String, GanttData.Bar> baseBars = indexBars(baseVersion.ganttData().bars());
        Map<String, GanttData.Bar> targetBars = indexBars(targetVersion.ganttData().bars());
        Map<String, TaskMatchMetadata> baseTaskMetadata = indexTaskMetadata(baseVersion);
        Map<String, TaskMatchMetadata> targetTaskMetadata = indexTaskMetadata(targetVersion);
        Map<String, LinkedHashSet<String>> targetTaskIdsByBusinessKey = indexTargetTaskIdsByBusinessKey(targetBars, targetTaskMetadata);

        List<VersionDiff.TaskChange> changedTasks = new ArrayList<>();

        int addedTaskCount = 0;
        int removedTaskCount = 0;
        int changedTaskCount = 0;
        int reassignedTaskCount = 0;
        int movedTaskCount = 0;
        int resizedTaskCount = 0;
        int lateStateChangedCount = 0;
        int unchangedTaskCount = 0;
        long totalStartShiftMinutes = 0L;
        long maxStartShiftMinutes = 0L;

        for (Map.Entry<String, GanttData.Bar> entry : baseBars.entrySet()) {
            String taskId = entry.getKey();
            GanttData.Bar baseBar = entry.getValue();
            String resolvedTargetTaskId = taskId;
            GanttData.Bar targetBar = removeTargetBar(
                    taskId,
                    targetBars,
                    targetTaskIdsByBusinessKey,
                    targetTaskMetadata
            );

            if (targetBar == null) {
                MatchedTarget matchedTarget = matchTargetByBusinessKey(
                        taskId,
                        baseBar,
                        baseTaskMetadata,
                        targetBars,
                        targetTaskIdsByBusinessKey,
                        targetTaskMetadata
                );
                if (matchedTarget != null) {
                    resolvedTargetTaskId = matchedTarget.taskId();
                    targetBar = matchedTarget.bar();
                }
            }

            if (targetBar == null) {
                removedTaskCount++;
                changedTasks.add(new VersionDiff.TaskChange(
                        taskId,
                        baseBar.label(),
                        VersionDiff.TaskChangeType.REMOVED,
                        baseBar.rowId(),
                        null,
                        baseBar.startMs(),
                        null,
                        baseBar.endMs(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        false,
                        false,
                        baseBar.pinned(),
                        null
                ));
                continue;
            }

            long startShiftMinutes = (targetBar.startMs() - baseBar.startMs()) / 60_000L;
            long endShiftMinutes = (targetBar.endMs() - baseBar.endMs()) / 60_000L;
            long durationDeltaMinutes = ((targetBar.endMs() - targetBar.startMs()) - (baseBar.endMs() - baseBar.startMs())) / 60_000L;
            int tardinessDeltaMinutes = targetBar.tardinessMinutes() - baseBar.tardinessMinutes();
            boolean rowChanged = !baseBar.rowId().equals(targetBar.rowId());
            boolean moved = startShiftMinutes != 0L || endShiftMinutes != 0L;
            boolean resized = durationDeltaMinutes != 0L;
            boolean lateChanged = baseBar.late() != targetBar.late();
            boolean pinnedChanged = baseBar.pinned() != targetBar.pinned();
            boolean changed = rowChanged
                    || moved
                    || resized
                    || lateChanged
                    || pinnedChanged
                    || tardinessDeltaMinutes != 0
                    || baseBar.priority() != targetBar.priority()
                    || baseBar.dueDateMs() != targetBar.dueDateMs()
                    || !baseBar.productCode().equals(targetBar.productCode())
                    || !baseBar.label().equals(targetBar.label());

            if (!changed) {
                unchangedTaskCount++;
                continue;
            }

            changedTaskCount++;
            if (rowChanged) {
                reassignedTaskCount++;
            }
            if (moved) {
                movedTaskCount++;
            }
            if (resized) {
                resizedTaskCount++;
            }
            if (lateChanged) {
                lateStateChangedCount++;
            }
            totalStartShiftMinutes += Math.abs(startShiftMinutes);
            maxStartShiftMinutes = Math.max(maxStartShiftMinutes, Math.abs(startShiftMinutes));

            changedTasks.add(new VersionDiff.TaskChange(
                    resolvedTargetTaskId,
                    targetBar.label(),
                    VersionDiff.TaskChangeType.MODIFIED,
                    baseBar.rowId(),
                    targetBar.rowId(),
                    baseBar.startMs(),
                    targetBar.startMs(),
                    baseBar.endMs(),
                    targetBar.endMs(),
                    startShiftMinutes,
                    endShiftMinutes,
                    durationDeltaMinutes,
                    tardinessDeltaMinutes,
                    lateChanged,
                    pinnedChanged,
                    baseBar.pinned(),
                    targetBar.pinned()
            ));
        }

        for (GanttData.Bar targetBar : targetBars.values()) {
            addedTaskCount++;
            changedTasks.add(new VersionDiff.TaskChange(
                    targetBar.id(),
                    targetBar.label(),
                    VersionDiff.TaskChangeType.ADDED,
                    null,
                    targetBar.rowId(),
                    null,
                    targetBar.startMs(),
                    null,
                    targetBar.endMs(),
                    null,
                    null,
                    null,
                    null,
                    false,
                    false,
                    null,
                    targetBar.pinned()
            ));
        }

        changedTasks.sort(Comparator
                .comparing((VersionDiff.TaskChange change) -> change.changeType() == VersionDiff.TaskChangeType.MODIFIED ? 0 : 1)
                .thenComparing(change -> magnitude(change), Comparator.reverseOrder())
                .thenComparing(VersionDiff.TaskChange::taskId));

        return new VersionDiff(
                toReference(baseVersion),
                toReference(targetVersion),
                buildKpiDelta(baseVersion.ganttData().kpis(), targetVersion.ganttData().kpis()),
                new VersionDiff.Summary(
                        addedTaskCount,
                        removedTaskCount,
                        changedTaskCount,
                        reassignedTaskCount,
                        movedTaskCount,
                        resizedTaskCount,
                        lateStateChangedCount,
                        unchangedTaskCount,
                        countAddedDowntimes(baseVersion.ganttData().downtimes(), targetVersion.ganttData().downtimes()),
                        countRemovedDowntimes(baseVersion.ganttData().downtimes(), targetVersion.ganttData().downtimes()),
                        totalStartShiftMinutes,
                        maxStartShiftMinutes
                ),
                changedTasks
        );
    }

    private Map<String, TaskMatchMetadata> indexTaskMetadata(ScheduleVersion version) {
        if (version.sourceRequestJson() == null || version.sourceRequestJson().isBlank()) {
            return Map.of();
        }

        try {
            JsonNode root = objectMapper.readTree(version.sourceRequestJson());
            JsonNode tasksNode = root.path("tasks");
            if (!tasksNode.isArray()) {
                return Map.of();
            }

            Map<String, TaskMatchMetadata> taskMetadata = new LinkedHashMap<>();
            for (JsonNode taskNode : tasksNode) {
                String taskId = taskNode.path("id").asText("").trim();
                if (taskId.isBlank()) {
                    continue;
                }
                taskMetadata.put(taskId, new TaskMatchMetadata(buildHeuristicBusinessKey(taskNode)));
            }
            return Map.copyOf(taskMetadata);
        } catch (JsonProcessingException ignored) {
            return Map.of();
        }
    }

    private Map<String, LinkedHashSet<String>> indexTargetTaskIdsByBusinessKey(
            Map<String, GanttData.Bar> targetBars,
            Map<String, TaskMatchMetadata> targetTaskMetadata
    ) {
        Map<String, LinkedHashSet<String>> result = new LinkedHashMap<>();
        for (Map.Entry<String, GanttData.Bar> entry : targetBars.entrySet()) {
            String businessKey = resolveBusinessKey(entry.getKey(), targetTaskMetadata.get(entry.getKey()));
            if (businessKey == null) {
                continue;
            }
            result.computeIfAbsent(businessKey, ignored -> new LinkedHashSet<>()).add(entry.getKey());
        }
        return result;
    }

    private String buildHeuristicBusinessKey(JsonNode taskNode) {
        String label = normalizeText(taskNode.path("label").asText(""));
        String productCode = normalizeText(taskNode.path("productCode").asText(""));
        if (label == null || label.isBlank() || productCode == null || productCode.isBlank()) {
            return null;
        }

        String setupGroup = normalizeText(taskNode.path("setupGroup").asText(""));
        return "heuristic|"
                + label
                + "|"
                + productCode
                + "|"
                + (setupGroup == null ? "" : setupGroup)
                + "|"
                + canonicalMaterialList(taskNode.path("materialInputs"))
                + "|"
                + canonicalMaterialList(taskNode.path("materialOutputs"));
    }

    private String canonicalMaterialList(JsonNode materialsNode) {
        if (!materialsNode.isArray()) {
            return "";
        }

        List<String> materials = new ArrayList<>();
        for (JsonNode materialNode : materialsNode) {
            String itemCode = normalizeText(materialNode.path("itemCode").asText(""));
            if (itemCode == null || itemCode.isBlank()) {
                continue;
            }
            int quantity = materialNode.path("quantity").asInt(0);
            materials.add(itemCode + ":" + quantity);
        }
        materials.sort(String::compareTo);
        return String.join(",", materials);
    }

    private MatchedTarget matchTargetByBusinessKey(
            String baseTaskId,
            GanttData.Bar baseBar,
            Map<String, TaskMatchMetadata> baseTaskMetadata,
            Map<String, GanttData.Bar> targetBars,
            Map<String, LinkedHashSet<String>> targetTaskIdsByBusinessKey,
            Map<String, TaskMatchMetadata> targetTaskMetadata
    ) {
        String businessKey = resolveBusinessKey(baseTaskId, baseTaskMetadata.get(baseTaskId));
        if (businessKey == null) {
            return null;
        }

        LinkedHashSet<String> candidateTaskIds = targetTaskIdsByBusinessKey.get(businessKey);
        if (candidateTaskIds == null || candidateTaskIds.size() != 1) {
            return null;
        }

        String targetTaskId = candidateTaskIds.iterator().next();
        GanttData.Bar targetBar = removeTargetBar(targetTaskId, targetBars, targetTaskIdsByBusinessKey, targetTaskMetadata);
        if (targetBar == null) {
            return null;
        }
        return new MatchedTarget(targetTaskId, targetBar);
    }

    private GanttData.Bar removeTargetBar(
            String targetTaskId,
            Map<String, GanttData.Bar> targetBars,
            Map<String, LinkedHashSet<String>> targetTaskIdsByBusinessKey,
            Map<String, TaskMatchMetadata> targetTaskMetadata
    ) {
        GanttData.Bar targetBar = targetBars.remove(targetTaskId);
        if (targetBar == null) {
            return null;
        }

        String businessKey = resolveBusinessKey(targetTaskId, targetTaskMetadata.get(targetTaskId));
        if (businessKey == null) {
            return targetBar;
        }

        LinkedHashSet<String> taskIds = targetTaskIdsByBusinessKey.get(businessKey);
        if (taskIds == null) {
            return targetBar;
        }
        taskIds.remove(targetTaskId);
        if (taskIds.isEmpty()) {
            targetTaskIdsByBusinessKey.remove(businessKey);
        }
        return targetBar;
    }

    private String resolveBusinessKey(String taskId, TaskMatchMetadata metadata) {
        String generatedTaskKey = normalizeGeneratedTaskKey(taskId);
        if (generatedTaskKey != null) {
            return generatedTaskKey;
        }
        return metadata == null ? null : metadata.heuristicBusinessKey();
    }

    private String normalizeGeneratedTaskKey(String taskId) {
        Matcher withUnitMatcher = GENERATED_TASK_WITH_UNIT_PATTERN.matcher(taskId);
        if (withUnitMatcher.matches()) {
            return "generated|"
                    + normalizeText(withUnitMatcher.group(1))
                    + "|u"
                    + Integer.parseInt(withUnitMatcher.group(2))
                    + "|s"
                    + Integer.parseInt(withUnitMatcher.group(3))
                    + "|"
                    + withUnitMatcher.group(4).toLowerCase(Locale.ROOT);
        }

        Matcher matcher = GENERATED_TASK_PATTERN.matcher(taskId);
        if (!matcher.matches()) {
            return null;
        }
        return "generated|"
                + normalizeText(matcher.group(1))
                + "|u1|s"
                + Integer.parseInt(matcher.group(2))
                + "|"
                + matcher.group(3).toLowerCase(Locale.ROOT);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return normalized.isBlank() ? null : normalized;
    }

    private Map<String, GanttData.Bar> indexBars(List<GanttData.Bar> bars) {
        Map<String, GanttData.Bar> result = new LinkedHashMap<>();
        for (GanttData.Bar bar : bars) {
            result.put(bar.id(), bar);
        }
        return result;
    }

    private VersionDiff.VersionReference toReference(ScheduleVersion version) {
        return new VersionDiff.VersionReference(
                version.id(),
                version.versionName(),
                version.status(),
                version.createdAt(),
                version.publishedAt()
        );
    }

    private VersionDiff.KpiDelta buildKpiDelta(GanttData.KpiSnapshot base, GanttData.KpiSnapshot target) {
        return new VersionDiff.KpiDelta(
                base.totalWeightedTardiness(),
                target.totalWeightedTardiness(),
                target.totalWeightedTardiness() - base.totalWeightedTardiness(),
                base.totalMakespan(),
                target.totalMakespan(),
                target.totalMakespan() - base.totalMakespan(),
                base.lateTaskCount(),
                target.lateTaskCount(),
                target.lateTaskCount() - base.lateTaskCount(),
                base.averageUtilization(),
                target.averageUtilization(),
                round4(target.averageUtilization() - base.averageUtilization())
        );
    }

    private int countAddedDowntimes(List<GanttData.Downtime> base, List<GanttData.Downtime> target) {
        Map<String, GanttData.Downtime> baseIndex = indexDowntimes(base);
        int count = 0;
        for (GanttData.Downtime item : target) {
            if (!baseIndex.containsKey(item.id())) {
                count++;
            }
        }
        return count;
    }

    private int countRemovedDowntimes(List<GanttData.Downtime> base, List<GanttData.Downtime> target) {
        Map<String, GanttData.Downtime> targetIndex = indexDowntimes(target);
        int count = 0;
        for (GanttData.Downtime item : base) {
            if (!targetIndex.containsKey(item.id())) {
                count++;
            }
        }
        return count;
    }

    private Map<String, GanttData.Downtime> indexDowntimes(List<GanttData.Downtime> downtimes) {
        Map<String, GanttData.Downtime> result = new LinkedHashMap<>();
        for (GanttData.Downtime downtime : downtimes) {
            result.put(downtime.id(), downtime);
        }
        return result;
    }

    private Long magnitude(VersionDiff.TaskChange change) {
        if (change.changeType() != VersionDiff.TaskChangeType.MODIFIED) {
            return 0L;
        }
        long start = Math.abs(change.startShiftMinutes() == null ? 0L : change.startShiftMinutes());
        long duration = Math.abs(change.durationDeltaMinutes() == null ? 0L : change.durationDeltaMinutes());
        long tardiness = Math.abs(change.tardinessDeltaMinutes() == null ? 0L : change.tardinessDeltaMinutes());
        return start * 10_000L + duration * 100L + tardiness;
    }

    private double round4(double value) {
        return Math.round(value * 10_000d) / 10_000d;
    }

    private record TaskMatchMetadata(
            String heuristicBusinessKey
    ) {
    }

    private record MatchedTarget(
            String taskId,
            GanttData.Bar bar
    ) {
    }
}
