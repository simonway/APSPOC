package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.ScheduleJobResponse;
import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.service.AuthService;
import com.apspoc.backend.service.SampleScenarioFactory;
import com.apspoc.backend.service.SchedulingJobService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/schedule/jobs")
public class ScheduleJobController {

    private final AuthService authService;
    private final SchedulingJobService schedulingJobService;
    private final SampleScenarioFactory sampleScenarioFactory;

    public ScheduleJobController(
            AuthService authService,
            SchedulingJobService schedulingJobService,
            SampleScenarioFactory sampleScenarioFactory
    ) {
        this.authService = authService;
        this.schedulingJobService = schedulingJobService;
        this.sampleScenarioFactory = sampleScenarioFactory;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ScheduleJobResponse submit(@Valid @RequestBody CreateScheduleJobRequest request, HttpSession session) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return ScheduleJobResponse.from(schedulingJobService.submit(request, authenticatedUser.username()));
    }

    @PostMapping("/sample")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ScheduleJobResponse submitSample(HttpSession session) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return ScheduleJobResponse.from(schedulingJobService.submit(sampleScenarioFactory.create(), authenticatedUser.username()));
    }

    @GetMapping("/{jobId}")
    public ScheduleJobResponse getJob(@PathVariable String jobId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return ScheduleJobResponse.from(schedulingJobService.getJob(jobId));
    }

    @PostMapping("/{jobId}/cancel")
    public ScheduleJobResponse cancelJob(@PathVariable String jobId, HttpSession session) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return ScheduleJobResponse.from(schedulingJobService.cancel(jobId, authenticatedUser.username()));
    }

    @PostMapping("/{jobId}/retry")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ScheduleJobResponse retryJob(@PathVariable String jobId, HttpSession session) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return ScheduleJobResponse.from(schedulingJobService.retry(jobId, authenticatedUser.username()));
    }
}
