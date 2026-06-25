package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.ScheduleJobResponse;
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
        ScheduleJob job = new ScheduleJob(
                "job-1",
                "snow-beer-sample",
                "planner-admin",
                "{}",
                Instant.parse("2026-06-18T10:00:00Z"),
                JobStatus.SUCCEEDED,
                "OPTIMAL",
                "ver-1",
                null,
                null,
                Instant.parse("2026-06-18T10:01:00Z")
        );
        when(schedulingJobService.listRecentJobs(20)).thenReturn(List.of(job));

        List<ScheduleJobResponse> result = controller.listJobs(20, session);

        verify(authService).requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().jobId()).isEqualTo("job-1");
        assertThat(result.getFirst().scenarioName()).isEqualTo("snow-beer-sample");
        assertThat(result.getFirst().status()).isEqualTo("SUCCEEDED");
        assertThat(result.getFirst().solverStatus()).isEqualTo("OPTIMAL");
        assertThat(result.getFirst().versionId()).isEqualTo("ver-1");
    }
}
