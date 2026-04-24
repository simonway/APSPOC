package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.ScheduleJobResponse;
import com.apspoc.backend.service.SampleScenarioFactory;
import com.apspoc.backend.service.SchedulingJobService;
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

    private final SchedulingJobService schedulingJobService;
    private final SampleScenarioFactory sampleScenarioFactory;

    public ScheduleJobController(
            SchedulingJobService schedulingJobService,
            SampleScenarioFactory sampleScenarioFactory
    ) {
        this.schedulingJobService = schedulingJobService;
        this.sampleScenarioFactory = sampleScenarioFactory;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ScheduleJobResponse submit(@Valid @RequestBody CreateScheduleJobRequest request) {
        return ScheduleJobResponse.from(schedulingJobService.submit(request));
    }

    @PostMapping("/sample")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ScheduleJobResponse submitSample() {
        return ScheduleJobResponse.from(schedulingJobService.submit(sampleScenarioFactory.create()));
    }

    @GetMapping("/{jobId}")
    public ScheduleJobResponse getJob(@PathVariable String jobId) {
        return ScheduleJobResponse.from(schedulingJobService.getJob(jobId));
    }
}

