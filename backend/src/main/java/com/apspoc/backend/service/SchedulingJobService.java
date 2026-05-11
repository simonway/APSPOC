package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.JobFailureReason;
import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Future;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class SchedulingJobService {

    private static final DateTimeFormatter VERSION_SUFFIX = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);
    private static final int SOLVER_TIMEOUT_BUFFER_SECONDS = 60;
    private static final List<JobStatus> RESUMABLE_JOB_STATUSES = List.of(
            JobStatus.CREATED,
            JobStatus.QUEUED,
            JobStatus.RUNNING
    );

    private final ScheduleStore store;
    private final SolverGateway solverGateway;
    private final ThreadPoolTaskExecutor taskExecutor;
    private final ObjectMapper objectMapper;
    private final ConcurrentMap<String, Future<?>> submittedJobs = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, ReentrantLock> jobLocks = new ConcurrentHashMap<>();

    public SchedulingJobService(
            ScheduleStore store,
            SolverGateway solverGateway,
            @Qualifier("apsTaskExecutor") ThreadPoolTaskExecutor taskExecutor,
            ObjectMapper objectMapper
    ) {
        this.store = store;
        this.solverGateway = solverGateway;
        this.taskExecutor = taskExecutor;
        this.objectMapper = objectMapper;
    }

    public ScheduleJob submit(CreateScheduleJobRequest request, String actorUsername) {
        validateScenario(request);

        ScheduleJob job = new ScheduleJob(
                "job-" + UUID.randomUUID(),
                request.scenarioName(),
                normalizeActor(actorUsername),
                serializeRequestSnapshot(request),
                Instant.now()
        );
        store.saveJob(job);
        return enqueue(job, request);
    }

    public ScheduleJob getJob(String jobId) {
        return store.findJob(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown job: " + jobId));
    }

    public ScheduleJob cancel(String jobId, String actorUsername) {
        ScheduleJob cancelled = withJobLock(jobId, () -> {
            ScheduleJob job = getJob(jobId);
            if (job.status().isTerminal()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only created, queued, or running jobs can be cancelled.");
            }

            job.markCancelled("Cancelled by %s".formatted(normalizeActor(actorUsername)));
            return store.saveJob(job);
        });
        Future<?> future = submittedJobs.remove(jobId);
        if (future != null) {
            future.cancel(true);
        }
        return cancelled;
    }

    public ScheduleJob retry(String jobId, String actorUsername) {
        ScheduleJob job = getJob(jobId);
        if (!List.of(JobStatus.FAILED, JobStatus.TIMEOUT, JobStatus.CANCELLED).contains(job.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only failed, timed-out, or cancelled jobs can be retried.");
        }
        if (job.sourceRequestJson() == null || job.sourceRequestJson().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The original schedule request is unavailable for retry.");
        }
        return submit(deserializeRequestSnapshot(job.sourceRequestJson()), actorUsername);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void resumePendingJobs() {
        for (ScheduleJob job : store.listJobsByStatuses(RESUMABLE_JOB_STATUSES)) {
            if (submittedJobs.containsKey(job.id())) {
                continue;
            }
            try {
                CreateScheduleJobRequest request = deserializeRequestSnapshot(job.sourceRequestJson());
                enqueue(job, request);
            } catch (ResponseStatusException ex) {
                markJobFailure(job.id(), scheduledJob -> scheduledJob.markFailed(
                        JobFailureReason.UNEXPECTED_ERROR,
                        "FAILED",
                        ex.getReason()
                ));
            } catch (Exception ex) {
                markJobFailure(job.id(), scheduledJob -> scheduledJob.markFailed(
                        JobFailureReason.UNEXPECTED_ERROR,
                        "FAILED",
                        "Failed to resume job `%s`: %s".formatted(job.id(), safeMessage(ex))
                ));
            }
        }
    }

    private ScheduleJob enqueue(ScheduleJob job, CreateScheduleJobRequest request) {
        job.markQueued();
        ScheduleJob queued = store.saveJob(job);
        Future<?> future = taskExecutor.submit(() -> runSolve(queued.id(), request));
        submittedJobs.put(queued.id(), future);
        return queued;
    }

    private void runSolve(String jobId, CreateScheduleJobRequest request) {
        ScheduleJob job = withJobLock(jobId, () -> {
            ScheduleJob latest = getJob(jobId);
            if (latest.status() == JobStatus.CANCELLED || latest.status().isTerminal()) {
                return null;
            }
            latest.markRunning();
            return store.saveJob(latest);
        });
        if (job == null) {
            submittedJobs.remove(jobId);
            return;
        }
        try {
            SolverResponse solverResponse = solverGateway.solve(
                    toSolverRequest(job.id(), request),
                    Duration.ofSeconds(request.solverConfig().timeLimitSeconds() + SOLVER_TIMEOUT_BUFFER_SECONDS)
            );
            if (isCancelled(jobId)) {
                return;
            }
            if (!"OPTIMAL".equals(solverResponse.status()) && !"FEASIBLE".equals(solverResponse.status())) {
                markJobFailure(jobId, scheduledJob -> scheduledJob.markFailed(
                        JobFailureReason.SOLVER_NO_FEASIBLE_SCHEDULE,
                        solverResponse.status(),
                        "Solver finished without a feasible schedule: " + solverResponse.status()
                ));
                return;
            }
            ScheduleVersion version = createVersion(request, solverResponse, job.actorUsername());
            if (isCancelled(jobId) || Thread.currentThread().isInterrupted()) {
                return;
            }
            withJobLock(jobId, () -> {
                ScheduleJob completedJob = getJob(jobId);
                if (completedJob.status() == JobStatus.CANCELLED) {
                    return null;
                }
                store.saveVersion(version);
                completedJob.markSucceeded(solverResponse.status(), version.id());
                store.saveJob(completedJob);
                return null;
            });
        } catch (SolverGateway.SolverTimeoutException ex) {
            if (!isCancelled(jobId)) {
                markJobFailure(jobId, scheduledJob -> scheduledJob.markTimedOut(ex.getMessage()));
            }
        } catch (SolverGateway.SolverUnavailableException ex) {
            if (!isCancelled(jobId)) {
                markJobFailure(jobId, scheduledJob -> scheduledJob.markFailed(
                        JobFailureReason.SOLVER_UNREACHABLE,
                        "FAILED",
                        ex.getMessage()
                ));
            }
        } catch (Exception ex) {
            if (!isCancelled(jobId)) {
                markJobFailure(jobId, scheduledJob -> scheduledJob.markFailed(
                        JobFailureReason.UNEXPECTED_ERROR,
                        "FAILED",
                        safeMessage(ex)
                ));
            }
        } finally {
            submittedJobs.remove(jobId);
        }
    }

    private ScheduleVersion createVersion(CreateScheduleJobRequest request, SolverResponse solverResponse, String actorUsername) {
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
                solverResponse.changeovers().stream()
                        .map(changeover -> new GanttData.Changeover(
                                changeover.id(),
                                changeover.resourceId(),
                                changeover.fromTaskId(),
                                changeover.toTaskId(),
                                baseMs + changeover.startMinutes() * 60_000L,
                                baseMs + changeover.endMinutes() * 60_000L,
                                changeover.durationMinutes()
                        ))
                        .sorted(java.util.Comparator.comparingLong(GanttData.Changeover::startMs))
                        .toList(),
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
                normalizeActor(actorUsername),
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

    private CreateScheduleJobRequest deserializeRequestSnapshot(String sourceRequestJson) {
        if (sourceRequestJson == null || sourceRequestJson.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The original schedule request snapshot is missing.");
        }
        try {
            return objectMapper.readValue(sourceRequestJson, CreateScheduleJobRequest.class);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to deserialize the original schedule request snapshot.");
        }
    }

    private void markJobFailure(String jobId, Consumer<ScheduleJob> mutator) {
        withJobLock(jobId, () -> {
            ScheduleJob job = getJob(jobId);
            if (job.status().isTerminal()) {
                return null;
            }
            mutator.accept(job);
            store.saveJob(job);
            return null;
        });
    }

    private boolean isCancelled(String jobId) {
        return getJob(jobId).status() == JobStatus.CANCELLED;
    }

    private String normalizeActor(String actorUsername) {
        return actorUsername == null || actorUsername.isBlank() ? "system" : actorUsername.trim();
    }

    private String safeMessage(Exception ex) {
        String message = ex.getMessage();
        return message == null || message.isBlank()
                ? "The scheduling job failed unexpectedly."
                : message;
    }

    private <T> T withJobLock(String jobId, Supplier<T> supplier) {
        ReentrantLock lock = jobLocks.computeIfAbsent(jobId, ignored -> new ReentrantLock());
        lock.lock();
        try {
            return supplier.get();
        } finally {
            lock.unlock();
        }
    }

    private SolverRequest toSolverRequest(String jobId, CreateScheduleJobRequest request) {
        return new SolverRequest(
                jobId,
                request.scheduleStartAt(),
                request.horizonMinutes(),
                request.dataVersion(),
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
                                task.pinnedStartMinutes(),
                                task.predecessorTaskIds(),
                                task.setupGroup(),
                                task.materialInputs().stream()
                                        .map(material -> new SolverRequest.MaterialQuantity(
                                                material.itemCode(),
                                                material.quantity()
                                        ))
                                        .toList(),
                                task.materialOutputs().stream()
                                        .map(material -> new SolverRequest.MaterialQuantity(
                                                material.itemCode(),
                                                material.quantity()
                                        ))
                                        .toList()
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
                request.setupRules().stream()
                        .map(rule -> new SolverRequest.SetupRule(
                                rule.fromSetupGroup(),
                                rule.toSetupGroup(),
                                rule.resourceType() == null ? null : rule.resourceType().name(),
                                rule.resourceId(),
                                rule.setupMinutes()
                        ))
                        .toList(),
                request.inventoryBalances().stream()
                        .map(balance -> new SolverRequest.InventoryBalance(
                                balance.itemCode(),
                                balance.availableQuantity(),
                                balance.availableFromMinutes(),
                                balance.safetyStockQuantity()
                        ))
                        .toList(),
                request.inventoryDemands().stream()
                        .map(demand -> new SolverRequest.InventoryDemand(
                                demand.demandId(),
                                demand.itemCode(),
                                demand.quantity(),
                                demand.dueMinutes(),
                                demand.priority()
                        ))
                        .toList(),
                new SolverRequest.ObjectiveWeights(
                        request.objectiveWeights().tardiness(),
                        request.objectiveWeights().earliness(),
                        request.objectiveWeights().makespan()
                ),
                new SolverRequest.SolverConfig(
                        request.solverConfig().timeLimitSeconds(),
                        request.solverConfig().numSearchWorkers()
                )
        );
    }

    private void validateScenario(CreateScheduleJobRequest request) {
        Map<String, CreateScheduleJobRequest.ResourceInput> resourcesById = new LinkedHashMap<>();
        for (CreateScheduleJobRequest.ResourceInput resource : request.resources()) {
            if (resourcesById.putIfAbsent(resource.id(), resource) != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate resource id: " + resource.id());
            }
        }

        Map<String, CreateScheduleJobRequest.TaskInput> tasksById = new LinkedHashMap<>();
        for (CreateScheduleJobRequest.TaskInput task : request.tasks()) {
            if (tasksById.putIfAbsent(task.id(), task) != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate task id: " + task.id());
            }
        }

        Set<String> setupGroups = request.tasks().stream()
                .map(CreateScheduleJobRequest.TaskInput::setupGroup)
                .filter(Objects::nonNull)
                .filter(value -> !value.isBlank())
                .collect(LinkedHashSet::new, Set::add, Set::addAll);
        Set<String> taskItemCodes = request.tasks().stream()
                .map(CreateScheduleJobRequest.TaskInput::productCode)
                .collect(LinkedHashSet::new, Set::add, Set::addAll);

        for (CreateScheduleJobRequest.TaskInput task : request.tasks()) {
            taskItemCodes.addAll(task.materialInputs().stream().map(CreateScheduleJobRequest.MaterialQuantityInput::itemCode).toList());
            taskItemCodes.addAll(task.materialOutputs().stream().map(CreateScheduleJobRequest.MaterialQuantityInput::itemCode).toList());
            for (String candidateResourceId : task.candidateResourceIds()) {
                if (!resourcesById.containsKey(candidateResourceId)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Task `%s` references unknown candidate resource `%s`".formatted(task.id(), candidateResourceId)
                    );
                }
            }
            if (task.pinnedResourceId() != null && !resourcesById.containsKey(task.pinnedResourceId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Task `%s` references unknown pinned resource `%s`".formatted(task.id(), task.pinnedResourceId())
                );
            }
            if (task.pinnedResourceId() != null && !task.candidateResourceIds().contains(task.pinnedResourceId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Task `%s` pinnedResourceId `%s` is not in candidateResourceIds"
                                .formatted(task.id(), task.pinnedResourceId())
                );
            }
            for (String predecessorTaskId : task.predecessorTaskIds()) {
                if (!tasksById.containsKey(predecessorTaskId)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Task `%s` references unknown predecessor `%s`".formatted(task.id(), predecessorTaskId)
                    );
                }
                if (task.id().equals(predecessorTaskId)) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Task `%s` cannot depend on itself".formatted(task.id())
                    );
                }
            }
        }

        Set<String> inventoryDemandIds = new LinkedHashSet<>();
        Set<String> inventoryDemandItemCodes = new LinkedHashSet<>();
        for (CreateScheduleJobRequest.InventoryDemandInput inventoryDemand : request.inventoryDemands()) {
            if (!inventoryDemandIds.add(inventoryDemand.demandId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate inventory demand id `%s`".formatted(inventoryDemand.demandId())
                );
            }
            if (inventoryDemand.dueMinutes() > request.horizonMinutes()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Inventory demand `%s` dueMinutes `%d` exceeds horizon `%d`"
                                .formatted(inventoryDemand.demandId(), inventoryDemand.dueMinutes(), request.horizonMinutes())
                );
            }
            inventoryDemandItemCodes.add(inventoryDemand.itemCode());
        }

        for (CreateScheduleJobRequest.DowntimeInput downtime : request.downtimes()) {
            if (!resourcesById.containsKey(downtime.resourceId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Downtime `%s` references unknown resource `%s`".formatted(downtime.id(), downtime.resourceId())
                );
            }
            if (downtime.startMinutes() >= downtime.endMinutes() || downtime.endMinutes() > request.horizonMinutes()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Downtime windows must satisfy 0 <= startMinutes < endMinutes <= horizonMinutes"
                );
            }
        }

        for (CreateScheduleJobRequest.SetupRuleInput setupRule : request.setupRules()) {
            if (!setupGroups.contains(setupRule.fromSetupGroup())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Setup rule references unknown fromSetupGroup `%s`".formatted(setupRule.fromSetupGroup())
                );
            }
            if (!setupGroups.contains(setupRule.toSetupGroup())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Setup rule references unknown toSetupGroup `%s`".formatted(setupRule.toSetupGroup())
                );
            }
            if (setupRule.resourceId() != null) {
                CreateScheduleJobRequest.ResourceInput resource = resourcesById.get(setupRule.resourceId());
                if (resource == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Setup rule references unknown resourceId `%s`".formatted(setupRule.resourceId())
                    );
                }
                if (setupRule.resourceType() != null && resource.resourceType() != setupRule.resourceType()) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Setup rule resourceId `%s` does not match resourceType `%s`"
                                    .formatted(setupRule.resourceId(), setupRule.resourceType().name())
                    );
                }
            } else if (setupRule.resourceType() != null) {
                boolean knownType = request.resources().stream()
                        .anyMatch(resource -> resource.resourceType() == setupRule.resourceType());
                if (!knownType) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Setup rule references unknown resourceType `%s`".formatted(setupRule.resourceType().name())
                    );
                }
            }
        }

        Set<String> inventoryItemCodes = new LinkedHashSet<>();
        for (CreateScheduleJobRequest.InventoryBalanceInput inventoryBalance : request.inventoryBalances()) {
            if (!inventoryItemCodes.add(inventoryBalance.itemCode())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Duplicate inventory balance itemCode `%s`".formatted(inventoryBalance.itemCode())
                );
            }
            if (!taskItemCodes.contains(inventoryBalance.itemCode()) && !inventoryDemandItemCodes.contains(inventoryBalance.itemCode())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Inventory balance references unknown itemCode `%s`".formatted(inventoryBalance.itemCode())
                );
            }
            if (inventoryBalance.availableFromMinutes() > request.horizonMinutes()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Inventory balance `%s` availableFromMinutes `%d` exceeds horizon `%d`"
                                .formatted(
                                        inventoryBalance.itemCode(),
                                        inventoryBalance.availableFromMinutes(),
                                        request.horizonMinutes()
                                )
                );
            }
        }

        Set<String> supportedDemandItemCodes = new LinkedHashSet<>(taskItemCodes);
        supportedDemandItemCodes.addAll(inventoryItemCodes);
        for (CreateScheduleJobRequest.InventoryDemandInput inventoryDemand : request.inventoryDemands()) {
            if (!supportedDemandItemCodes.contains(inventoryDemand.itemCode())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Inventory demand `%s` references unknown itemCode `%s`"
                                .formatted(inventoryDemand.demandId(), inventoryDemand.itemCode())
                );
            }
        }
    }
}
