package com.apspoc.backend.service;

import java.util.List;

public record SolverResponse(
        String jobId,
        String status,
        long solveTimeMs,
        List<ScheduledTask> scheduledTasks,
        Kpis kpis
) {

    public record ScheduledTask(
            String taskId,
            String resourceId,
            int startMinutes,
            int endMinutes,
            boolean late,
            int tardinessMinutes
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

