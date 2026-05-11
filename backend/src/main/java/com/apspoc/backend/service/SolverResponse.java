package com.apspoc.backend.service;

import java.util.List;

public record SolverResponse(
        String jobId,
        String status,
        long solveTimeMs,
        List<ScheduledTask> scheduledTasks,
        List<Changeover> changeovers,
        Kpis kpis
) {
    public SolverResponse {
        scheduledTasks = scheduledTasks == null ? List.of() : List.copyOf(scheduledTasks);
        changeovers = changeovers == null ? List.of() : List.copyOf(changeovers);
    }

    public record ScheduledTask(
            String taskId,
            String resourceId,
            int startMinutes,
            int endMinutes,
            boolean late,
            int tardinessMinutes
    ) {
    }

    public record Changeover(
            String id,
            String resourceId,
            String fromTaskId,
            String toTaskId,
            int startMinutes,
            int endMinutes,
            int durationMinutes
    ) {
    }

    public record Kpis(
            int totalWeightedTardiness,
            int totalMakespan,
            int lateTaskCount,
            double averageUtilization
    ) {
    }
}
