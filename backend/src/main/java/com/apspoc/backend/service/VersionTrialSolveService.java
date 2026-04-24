package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.TrialSolveRequest;
import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class VersionTrialSolveService {

    private static final int DEFAULT_TARDINESS_WEIGHT = 100;
    private static final int DEFAULT_MAKESPAN_WEIGHT = 1;
    private static final int DEFAULT_SOLVER_TIME_LIMIT_SECONDS = 10;
    private static final int DEFAULT_SOLVER_WORKERS = 4;
    private static final int FALLBACK_HORIZON_BUFFER_MINUTES = 120;

    private final VersionService versionService;
    private final SchedulingJobService schedulingJobService;
    private final SampleScenarioFactory sampleScenarioFactory;
    private final ObjectMapper objectMapper;

    public VersionTrialSolveService(
            VersionService versionService,
            SchedulingJobService schedulingJobService,
            SampleScenarioFactory sampleScenarioFactory,
            ObjectMapper objectMapper
    ) {
        this.versionService = versionService;
        this.schedulingJobService = schedulingJobService;
        this.sampleScenarioFactory = sampleScenarioFactory;
        this.objectMapper = objectMapper;
    }

    public ScheduleJob submitTrialSolve(String versionId, TrialSolveRequest request) {
        ScheduleVersion version = versionService.getVersion(versionId);
        CreateScheduleJobRequest baseRequest = resolveBaseRequest(version);
        CreateScheduleJobRequest trialRequest = buildTrialRequest(version, baseRequest, request);
        return schedulingJobService.submit(trialRequest);
    }

    private CreateScheduleJobRequest resolveBaseRequest(ScheduleVersion version) {
        if (version.sourceRequestJson() != null && !version.sourceRequestJson().isBlank()) {
            try {
                return objectMapper.readValue(version.sourceRequestJson(), CreateScheduleJobRequest.class);
            } catch (Exception ignored) {
                // Fall through to compatibility reconstruction.
            }
        }

        CreateScheduleJobRequest sampleRequest = sampleScenarioFactory.create();
        if (matchesVersion(version, sampleRequest)) {
            return sampleRequest;
        }

        return deriveRequestFromVersion(version);
    }

    private boolean matchesVersion(ScheduleVersion version, CreateScheduleJobRequest request) {
        if (!Objects.equals(version.scenarioDescription(), request.scenarioName())) {
            return false;
        }

        Set<String> versionRowIds = version.ganttData().rows().stream()
                .map(GanttData.Row::id)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> requestRowIds = request.resources().stream()
                .map(CreateScheduleJobRequest.ResourceInput::id)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (!versionRowIds.equals(requestRowIds)) {
            return false;
        }

        Set<String> versionBarIds = version.ganttData().bars().stream()
                .map(GanttData.Bar::id)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Set<String> requestTaskIds = request.tasks().stream()
                .map(CreateScheduleJobRequest.TaskInput::id)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return versionBarIds.equals(requestTaskIds);
    }

    private CreateScheduleJobRequest deriveRequestFromVersion(ScheduleVersion version) {
        GanttData ganttData = version.ganttData();
        long baseMs = Stream.concat(
                        ganttData.bars().stream().map(GanttData.Bar::startMs),
                        ganttData.downtimes().stream().map(GanttData.Downtime::startMs)
                )
                .min(Comparator.naturalOrder())
                .orElseGet(() -> Instant.now().toEpochMilli());

        long maxMs = Stream.of(
                        ganttData.bars().stream().mapToLong(GanttData.Bar::endMs).max().orElse(baseMs),
                        ganttData.bars().stream().mapToLong(GanttData.Bar::dueDateMs).max().orElse(baseMs),
                        ganttData.downtimes().stream().mapToLong(GanttData.Downtime::endMs).max().orElse(baseMs)
                )
                .mapToLong(Long::longValue)
                .max()
                .orElse(baseMs);

        int horizonMinutes = Math.max(
                minutesBetween(baseMs, maxMs) + FALLBACK_HORIZON_BUFFER_MINUTES,
                FALLBACK_HORIZON_BUFFER_MINUTES
        );

        List<CreateScheduleJobRequest.ResourceInput> resources = ganttData.rows().stream()
                .sorted(Comparator.comparingInt(GanttData.Row::sortOrder))
                .map(row -> new CreateScheduleJobRequest.ResourceInput(
                        row.id(),
                        row.label(),
                        row.resourceType(),
                        row.sortOrder()
                ))
                .toList();

        List<CreateScheduleJobRequest.TaskInput> tasks = ganttData.bars().stream()
                .map(bar -> new CreateScheduleJobRequest.TaskInput(
                        bar.id(),
                        bar.label(),
                        bar.productCode(),
                        Math.max(1, minutesBetween(bar.startMs(), bar.endMs())),
                        Math.max(1, minutesBetween(baseMs, bar.dueDateMs())),
                        bar.priority(),
                        List.of(bar.rowId()),
                        null,
                        null
                ))
                .toList();

        List<CreateScheduleJobRequest.DowntimeInput> downtimes = ganttData.downtimes().stream()
                .map(downtime -> new CreateScheduleJobRequest.DowntimeInput(
                        downtime.id(),
                        downtime.rowId(),
                        Math.max(0, minutesBetween(baseMs, downtime.startMs())),
                        Math.max(1, minutesBetween(baseMs, downtime.endMs())),
                        downtime.downtimeType(),
                        downtime.source(),
                        downtime.description()
                ))
                .toList();

        String scenarioName = version.scenarioDescription() != null && !version.scenarioDescription().isBlank()
                ? version.scenarioDescription()
                : version.versionName();

        return new CreateScheduleJobRequest(
                scenarioName,
                Instant.ofEpochMilli(baseMs),
                horizonMinutes,
                resources,
                tasks,
                downtimes,
                new CreateScheduleJobRequest.ObjectiveWeights(DEFAULT_TARDINESS_WEIGHT, DEFAULT_MAKESPAN_WEIGHT),
                new CreateScheduleJobRequest.SolverConfig(DEFAULT_SOLVER_TIME_LIMIT_SECONDS, DEFAULT_SOLVER_WORKERS)
        );
    }

    private CreateScheduleJobRequest buildTrialRequest(
            ScheduleVersion version,
            CreateScheduleJobRequest baseRequest,
            TrialSolveRequest request
    ) {
        Map<String, GanttData.Row> rowsById = version.ganttData().rows().stream()
                .collect(Collectors.toMap(GanttData.Row::id, row -> row, (left, right) -> left, LinkedHashMap::new));
        Map<String, GanttData.Bar> versionBarsById = version.ganttData().bars().stream()
                .collect(Collectors.toMap(GanttData.Bar::id, bar -> bar, (left, right) -> left, LinkedHashMap::new));
        Map<String, TrialSolveRequest.DraftBarInput> draftByBarId = validateDraftBars(request.draftBars(), versionBarsById, rowsById);
        long baseMs = baseRequest.scheduleStartAt().toEpochMilli();

        List<CreateScheduleJobRequest.TaskInput> tasks = baseRequest.tasks().stream()
                .map(task -> toTrialTask(task, versionBarsById.get(task.id()), draftByBarId.get(task.id()), baseMs))
                .toList();

        int horizonMinutes = resolveTrialHorizonMinutes(baseRequest, versionBarsById, draftByBarId, baseMs);

        return new CreateScheduleJobRequest(
                normalizeTrialScenarioName(baseRequest.scenarioName()),
                baseRequest.scheduleStartAt(),
                horizonMinutes,
                baseRequest.resources(),
                tasks,
                baseRequest.downtimes(),
                baseRequest.objectiveWeights(),
                baseRequest.solverConfig()
        );
    }

    private Map<String, TrialSolveRequest.DraftBarInput> validateDraftBars(
            List<TrialSolveRequest.DraftBarInput> draftBars,
            Map<String, GanttData.Bar> versionBarsById,
            Map<String, GanttData.Row> rowsById
    ) {
        Map<String, TrialSolveRequest.DraftBarInput> draftByBarId = new LinkedHashMap<>();
        for (TrialSolveRequest.DraftBarInput draftBar : draftBars) {
            if (!versionBarsById.containsKey(draftBar.barId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown draft bar: " + draftBar.barId());
            }
            if (!rowsById.containsKey(draftBar.rowId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown draft row: " + draftBar.rowId());
            }
            if (draftBar.endMs() <= draftBar.startMs()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Draft bar endMs must be greater than startMs");
            }
            if (draftByBarId.putIfAbsent(draftBar.barId(), draftBar) != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate draft bar: " + draftBar.barId());
            }
        }
        return draftByBarId;
    }

    private CreateScheduleJobRequest.TaskInput toTrialTask(
            CreateScheduleJobRequest.TaskInput baseTask,
            GanttData.Bar versionBar,
            TrialSolveRequest.DraftBarInput draftBar,
            long baseMs
    ) {
        if (versionBar == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Version is missing bar data for task: " + baseTask.id());
        }

        long currentStartMs = draftBar != null ? draftBar.startMs() : versionBar.startMs();
        long currentEndMs = draftBar != null ? draftBar.endMs() : versionBar.endMs();
        String currentRowId = draftBar != null ? draftBar.rowId() : versionBar.rowId();

        List<String> candidateResourceIds = new ArrayList<>(baseTask.candidateResourceIds());
        if (!candidateResourceIds.contains(currentRowId)) {
            candidateResourceIds.add(currentRowId);
        }

        String pinnedResourceId = baseTask.pinnedResourceId();
        Integer pinnedStartMinutes = baseTask.pinnedStartMinutes();
        if (draftBar != null) {
            pinnedResourceId = currentRowId;
            pinnedStartMinutes = Math.max(0, minutesBetween(baseMs, currentStartMs));
        }

        return new CreateScheduleJobRequest.TaskInput(
                baseTask.id(),
                baseTask.label(),
                baseTask.productCode(),
                Math.max(1, minutesBetween(currentStartMs, currentEndMs)),
                baseTask.dueMinutes(),
                baseTask.priority(),
                candidateResourceIds,
                pinnedResourceId,
                pinnedStartMinutes
        );
    }

    private int resolveTrialHorizonMinutes(
            CreateScheduleJobRequest baseRequest,
            Map<String, GanttData.Bar> versionBarsById,
            Map<String, TrialSolveRequest.DraftBarInput> draftByBarId,
            long baseMs
    ) {
        int maxDraftEndMinutes = versionBarsById.values().stream()
                .mapToInt(bar -> {
                    TrialSolveRequest.DraftBarInput draftBar = draftByBarId.get(bar.id());
                    long endMs = draftBar != null ? draftBar.endMs() : bar.endMs();
                    return minutesBetween(baseMs, endMs);
                })
                .max()
                .orElse(0);

        int maxDueMinutes = versionBarsById.values().stream()
                .mapToInt(bar -> minutesBetween(baseMs, bar.dueDateMs()))
                .max()
                .orElse(0);

        return Math.max(baseRequest.horizonMinutes(), Math.max(maxDraftEndMinutes, maxDueMinutes) + FALLBACK_HORIZON_BUFFER_MINUTES);
    }

    private String normalizeTrialScenarioName(String scenarioName) {
        return scenarioName != null && scenarioName.endsWith("-trial")
                ? scenarioName
                : scenarioName + "-trial";
    }

    private int minutesBetween(long startMs, long endMs) {
        return Math.toIntExact(Math.max(0L, Math.round((endMs - startMs) / 60_000d)));
    }
}
