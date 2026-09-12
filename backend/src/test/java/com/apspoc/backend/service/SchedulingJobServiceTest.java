package com.apspoc.backend.service;

import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
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
        service = new SchedulingJobService(store, solverGateway, taskExecutor, new ObjectMapper());
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
}
