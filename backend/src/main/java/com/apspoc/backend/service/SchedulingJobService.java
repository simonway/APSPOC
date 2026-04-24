package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;

@Service
public class SchedulingJobService {

    private static final DateTimeFormatter VERSION_SUFFIX = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);

    private final ScheduleStore store;
    private final SolverGateway solverGateway;
    private final TaskExecutor taskExecutor;
    private final ObjectMapper objectMapper;

    public SchedulingJobService(
            ScheduleStore store,
            SolverGateway solverGateway,
            @Qualifier("apsTaskExecutor") TaskExecutor taskExecutor,
            ObjectMapper objectMapper
    ) {
        this.store = store;
        this.solverGateway = solverGateway;
        this.taskExecutor = taskExecutor;
        this.objectMapper = objectMapper;
    }

    public ScheduleJob submit(CreateScheduleJobRequest request) {
        validateScenario(request);

        ScheduleJob job = new ScheduleJob(
                "job-" + UUID.randomUUID(),
                request.scenarioName(),
                Instant.now()
        );
        store.saveJob(job);
        taskExecutor.execute(() -> runSolve(job, request));
        return job;
    }

    public ScheduleJob getJob(String jobId) {
        return store.findJob(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown job: " + jobId));
    }

    private void runSolve(ScheduleJob job, CreateScheduleJobRequest request) {
        job.markRunning();
        store.saveJob(job);
        try {
            SolverResponse solverResponse = solverGateway.solve(toSolverRequest(job.id(), request));
            if (!"OPTIMAL".equals(solverResponse.status()) && !"FEASIBLE".equals(solverResponse.status())) {
                job.markFailed("Solver finished without a feasible schedule: " + solverResponse.status());
                store.saveJob(job);
                return;
            }
            ScheduleVersion version = createVersion(request, solverResponse);
            store.saveVersion(version);
            job.markDone(solverResponse.status(), version.id());
            store.saveJob(job);
        } catch (Exception ex) {
            job.markFailed(ex.getMessage());
            store.saveJob(job);
        }
    }

    private ScheduleVersion createVersion(CreateScheduleJobRequest request, SolverResponse solverResponse) {
        Instant createdAt = Instant.now();
        String versionId = "ver-" + UUID.randomUUID();
        String versionName = request.scenarioName() + "-" + VERSION_SUFFIX.format(createdAt);

        Map<String, CreateScheduleJobRequest.TaskInput> taskById = request.tasks().stream()
                .collect(java.util.stream.Collectors.toMap(CreateScheduleJobRequest.TaskInput::id, Function.identity()));

        long baseMs = request.scheduleStartAt().toEpochMilli();

        List<GanttData.Row> rows = request.resources().stream()
                .map(resource -> new GanttData.Row(
                        resource.id(),
                        resource.label(),
                        resource.resourceType(),
                        resource.sortOrder()
                ))
                .sorted(java.util.Comparator.comparingInt(GanttData.Row::sortOrder))
                .toList();

        List<GanttData.Bar> bars = solverResponse.scheduledTasks().stream()
                .map(task -> {
                    CreateScheduleJobRequest.TaskInput taskInput = taskById.get(task.taskId());
                    return new GanttData.Bar(
                            task.taskId(),
                            task.resourceId(),
                            baseMs + task.startMinutes() * 60_000L,
                            baseMs + task.endMinutes() * 60_000L,
                            taskInput.label(),
                            taskInput.productCode(),
                            taskInput.priority(),
                            baseMs + taskInput.dueMinutes() * 60_000L,
                            task.late(),
                            task.tardinessMinutes(),
                            taskInput.pinnedStartMinutes() != null || taskInput.pinnedResourceId() != null
                    );
                })
                .sorted(java.util.Comparator.comparingLong(GanttData.Bar::startMs))
                .toList();

        List<GanttData.Downtime> downtimes = request.downtimes().stream()
                .map(downtime -> new GanttData.Downtime(
                        downtime.id(),
                        downtime.resourceId(),
                        baseMs + downtime.startMinutes() * 60_000L,
                        baseMs + downtime.endMinutes() * 60_000L,
                        downtime.downtimeType(),
                        downtime.source(),
                        downtime.description()
                ))
                .sorted(java.util.Comparator.comparingLong(GanttData.Downtime::startMs))
                .toList();

        GanttData ganttData = new GanttData(
                rows,
                bars,
                downtimes,
                List.of(),
                new GanttData.KpiSnapshot(
                        solverResponse.kpis().totalWeightedTardiness(),
                        solverResponse.kpis().totalMakespan(),
                        solverResponse.kpis().lateTaskCount(),
                        solverResponse.kpis().averageUtilization()
                )
        );

        return new ScheduleVersion(
                versionId,
                versionName,
                VersionStatus.DRAFT,
                TriggerType.MANUAL,
                request.scenarioName(),
                createdAt,
                serializeRequestSnapshot(request),
                ganttData
        );
    }

    private String serializeRequestSnapshot(CreateScheduleJobRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize schedule request snapshot");
        }
    }

    private SolverRequest toSolverRequest(String jobId, CreateScheduleJobRequest request) {
        return new SolverRequest(
                jobId,
                request.scheduleStartAt(),
                request.horizonMinutes(),
                request.resources().stream()
                        .map(resource -> new SolverRequest.Resource(
                                resource.id(),
                                resource.label(),
                                resource.resourceType().name(),
                                resource.sortOrder()
                        ))
                        .toList(),
                request.tasks().stream()
                        .map(task -> new SolverRequest.Task(
                                task.id(),
                                task.label(),
                                task.productCode(),
                                task.durationMinutes(),
                                task.dueMinutes(),
                                task.priority(),
                                task.candidateResourceIds(),
                                task.pinnedResourceId(),
                                task.pinnedStartMinutes()
                        ))
                        .toList(),
                request.downtimes().stream()
                        .map(downtime -> new SolverRequest.Downtime(
                                downtime.id(),
                                downtime.resourceId(),
                                downtime.startMinutes(),
                                downtime.endMinutes(),
                                downtime.downtimeType(),
                                downtime.source(),
                                downtime.description()
                        ))
                        .toList(),
                new SolverRequest.ObjectiveWeights(
                        request.objectiveWeights().tardiness(),
                        request.objectiveWeights().makespan()
                ),
                new SolverRequest.SolverConfig(
                        request.solverConfig().timeLimitSeconds(),
                        request.solverConfig().numSearchWorkers()
                )
        );
    }

    private void validateScenario(CreateScheduleJobRequest request) {
        Set<String> resourceIds = request.resources().stream()
                .map(CreateScheduleJobRequest.ResourceInput::id)
                .collect(java.util.stream.Collectors.toSet());

        boolean invalidCandidate = request.tasks().stream()
                .flatMap(task -> task.candidateResourceIds().stream())
                .anyMatch(candidate -> !resourceIds.contains(candidate));

        if (invalidCandidate) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task candidateResourceIds contains an unknown resource id");
        }

        boolean invalidDowntimeResource = request.downtimes().stream()
                .map(CreateScheduleJobRequest.DowntimeInput::resourceId)
                .anyMatch(resourceId -> !resourceIds.contains(resourceId));

        if (invalidDowntimeResource) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Downtime resourceId contains an unknown resource id");
        }

        boolean invalidDowntimeWindow = request.downtimes().stream()
                .anyMatch(downtime -> downtime.startMinutes() >= downtime.endMinutes()
                        || downtime.endMinutes() > request.horizonMinutes());

        if (invalidDowntimeWindow) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Downtime windows must satisfy 0 <= startMinutes < endMinutes <= horizonMinutes"
            );
        }
    }
}
