package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ResourceType;
import com.apspoc.backend.domain.ScheduleJob;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SchedulingJobServiceTest {

    @Mock
    private ScheduleStore store;

    @Mock
    private SolverGateway solverGateway;

    @Mock
    private ThreadPoolTaskExecutor taskExecutor;

    private SchedulingJobService service;

    @BeforeEach
    void setUp() {
        service = new SchedulingJobService(store, solverGateway, taskExecutor, new ObjectMapper().findAndRegisterModules());
    }

    @Test
    void listRecentJobsClampsRequestedLimitToSupportedRange() {
        ScheduleJob job = job("job-1");
        when(store.listRecentJobs(20)).thenReturn(List.of(job));
        when(store.listRecentJobs(50)).thenReturn(List.of(job));
        when(store.listRecentJobs(1)).thenReturn(List.of(job));

        assertThat(service.listRecentJobs(0)).containsExactly(job);
        assertThat(service.listRecentJobs(100)).containsExactly(job);
        assertThat(service.listRecentJobs(1)).containsExactly(job);
    }

    @Test
    void listRecentJobsUsesDefaultLimitForZero() {
        when(store.listRecentJobs(20)).thenReturn(List.of(job("job-1")));

        service.listRecentJobs(0);

        verify(store).listRecentJobs(20);
    }

    @Test
    void listRecentJobsCapsLimitAtFifty() {
        when(store.listRecentJobs(50)).thenReturn(List.of(job("job-1")));

        service.listRecentJobs(51);

        verify(store).listRecentJobs(50);
    }

    @Test
    void listRecentJobsPreservesPositiveLimitWithinSupportedRange() {
        when(store.listRecentJobs(17)).thenReturn(List.of(job("job-1")));

        service.listRecentJobs(17);

        verify(store).listRecentJobs(17);
    }

    @Test
    void failedSolverJobPersistsBusinessFailureReasonMessage() {
        AtomicReference<ScheduleJob> savedJob = new AtomicReference<>();
        when(store.saveJob(any())).thenAnswer(invocation -> {
            ScheduleJob job = invocation.getArgument(0);
            savedJob.set(job);
            return job;
        });
        when(store.findJob(any())).thenAnswer(invocation -> {
            ScheduleJob job = savedJob.get();
            return job == null ? java.util.Optional.empty() : java.util.Optional.of(job);
        });
        when(taskExecutor.submit(any(Runnable.class))).thenAnswer(invocation -> {
            Runnable task = invocation.getArgument(0);
            task.run();
            return CompletableFuture.completedFuture(null);
        });
        when(solverGateway.solve(any(), any(Duration.class))).thenReturn(new SolverResponse(
                "job-1",
                "INFEASIBLE",
                12,
                List.of(),
                List.of(),
                new SolverResponse.Kpis(0, 0, 0, 0.0),
                List.of(new SolverResponse.FailureReason(
                        "MATERIAL_SHORTAGE",
                        "Item RM-100 requires 1 units but only 0 units are available or produced.",
                        "RM-100",
                        null
                ))
        ));

        ScheduleJob submitted = service.submit(scheduleRequest(), "planner-admin");
        ScheduleJob finalJob = service.getJob(submitted.id());

        assertThat(finalJob.status()).isEqualTo(JobStatus.FAILED);
        assertThat(finalJob.errorMessage())
                .contains("Solver finished without a feasible schedule: INFEASIBLE")
                .contains("MATERIAL_SHORTAGE")
                .contains("RM-100")
                .contains("Item RM-100 requires 1 units");
    }

    private ScheduleJob job(String id) {
        return new ScheduleJob(
                id,
                "sample",
                "planner-admin",
                "{}",
                Instant.parse("2026-06-18T10:00:00Z"),
                JobStatus.QUEUED,
                "QUEUED",
                null,
                null,
                null,
                null
        );
    }

    private CreateScheduleJobRequest scheduleRequest() {
        return new CreateScheduleJobRequest(
                "sample",
                Instant.parse("2026-06-18T10:00:00Z"),
                480,
                List.of(new CreateScheduleJobRequest.ResourceInput("reactor-1", "Reactor 1", ResourceType.REACTOR, 1)),
                List.of(new CreateScheduleJobRequest.TaskInput(
                        "task-1",
                        "Task 1",
                        "FG-100",
                        60,
                        240,
                        1,
                        List.of("reactor-1"),
                        null,
                        null,
                        List.of(),
                        null,
                        List.of(new CreateScheduleJobRequest.MaterialQuantityInput("RM-100", 1)),
                        List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FG-100", 1))
                )),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 1),
                null,
                List.of(),
                List.of(),
                List.of(new CreateScheduleJobRequest.InventoryDemandInput("dmd-1", "FG-100", 1, 240))
        );
    }
}
