package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.GanttDataResponse;
import com.apspoc.backend.api.dto.ScheduleJobResponse;
import com.apspoc.backend.api.dto.TrialSolveRequest;
import com.apspoc.backend.api.dto.VersionSummaryResponse;
import com.apspoc.backend.service.VersionService;
import com.apspoc.backend.service.VersionTrialSolveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/versions")
public class VersionController {

    private final VersionService versionService;
    private final VersionTrialSolveService versionTrialSolveService;

    public VersionController(VersionService versionService, VersionTrialSolveService versionTrialSolveService) {
        this.versionService = versionService;
        this.versionTrialSolveService = versionTrialSolveService;
    }

    @GetMapping
    public List<VersionSummaryResponse> listVersions() {
        return versionService.listVersions().stream()
                .map(VersionSummaryResponse::from)
                .toList();
    }

    @GetMapping("/{versionId}")
    public VersionSummaryResponse getVersion(@PathVariable String versionId) {
        return VersionSummaryResponse.from(versionService.getVersion(versionId));
    }

    @GetMapping("/{versionId}/gantt-data")
    public GanttDataResponse getGanttData(@PathVariable String versionId) {
        return GanttDataResponse.from(versionService.getVersion(versionId));
    }

    @PostMapping("/{versionId}/publish")
    public VersionSummaryResponse publish(@PathVariable String versionId) {
        return VersionSummaryResponse.from(versionService.publish(versionId));
    }

    @PostMapping("/{versionId}/rollback")
    public VersionSummaryResponse rollback(@PathVariable String versionId) {
        return VersionSummaryResponse.from(versionService.rollback(versionId));
    }

    @PostMapping("/{versionId}/trial-solve")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ScheduleJobResponse trialSolve(
            @PathVariable String versionId,
            @Valid @RequestBody TrialSolveRequest request
    ) {
        return ScheduleJobResponse.from(versionTrialSolveService.submitTrialSolve(versionId, request));
    }
}
