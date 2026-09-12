package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.ScheduleJobResponse;
import com.apspoc.backend.domain.JobFailureReason;
import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.service.AuthService;
import com.apspoc.backend.service.SampleScenarioFactory;
import com.apspoc.backend.service.SchedulingJobService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleJobControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private SchedulingJobService schedulingJobService;

    @Mock
    private SampleScenarioFactory sampleScenarioFactory;

    @Mock
    private HttpSession session;

    private ScheduleJobController controller;

    @BeforeEach
    void setUp() {
        controller = new ScheduleJobController(authService, schedulingJobService, sampleScenarioFactory);
    }

    @Test
    void listJobsAllowsReadRolesAndMapsResponses() {
        Instant createdAt = Instant.parse("2026-06-18T10:00:00Z");
        Instant completedAt = Instant.parse("2026-06-18T10:01:00Z");
        ScheduleJob job = new ScheduleJob(
                "job-1",
                "snow-beer-sample",
                "planner-admin",
                "{}",
                createdAt,
                JobStatus.FAILED,
                "FAILED",
                null,
                JobFailureReason.SOLVER_UNREACHABLE,
                "Solver connection refused",
                completedAt
        );
        ScheduleJob succeededJob = new ScheduleJob(
                "job-2",
                "snow-beer-success",
                "planner-admin",
                "{}",
                createdAt.plusSeconds(120),
                JobStatus.SUCCEEDED,
                "OPTIMAL",
                "ver-1",
                null,
                null,
                completedAt.plusSeconds(120)
        );
        when(schedulingJobService.listRecentJobs(20)).thenReturn(List.of(job, succeededJob));

        List<ScheduleJobResponse> result = controller.listJobs(20, session);

        verify(authService).requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        assertThat(result).hasSize(2);
        assertThat(result.getFirst().jobId()).isEqualTo("job-1");
        assertThat(result.getFirst().scenarioName()).isEqualTo("snow-beer-sample");
        assertThat(result.getFirst().actorUsername()).isEqualTo("planner-admin");
        assertThat(result.getFirst().status()).isEqualTo("FAILED");
        assertThat(result.getFirst().solverStatus()).isEqualTo("FAILED");
        assertThat(result.getFirst().failureReason()).isEqualTo("SOLVER_UNREACHABLE");
        assertThat(result.getFirst().errorMessage()).isEqualTo("Solver connection refused");
        assertThat(result.getFirst().createdAt()).isEqualTo(createdAt);
        assertThat(result.getFirst().completedAt()).isEqualTo(completedAt);
        assertThat(result.get(1).versionId()).isEqualTo("ver-1");
    }
}
