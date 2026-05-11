package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.GanttDataResponse;
import com.apspoc.backend.api.dto.ScheduleJobResponse;
import com.apspoc.backend.api.dto.TrialSolveRequest;
import com.apspoc.backend.api.dto.VersionActionRequest;
import com.apspoc.backend.api.dto.VersionAuditEventResponse;
import com.apspoc.backend.api.dto.VersionDeleteRequest;
import com.apspoc.backend.api.dto.VersionDiffResponse;
import com.apspoc.backend.api.dto.VersionReleaseNoteRequest;
import com.apspoc.backend.api.dto.VersionSummaryResponse;
import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.service.AuthService;
import com.apspoc.backend.service.VersionService;
import com.apspoc.backend.service.VersionGanttViewService;
import com.apspoc.backend.service.VersionTrialSolveService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/versions")
public class VersionController {

    private final AuthService authService;
    private final VersionService versionService;
    private final VersionGanttViewService versionGanttViewService;
    private final VersionTrialSolveService versionTrialSolveService;

    public VersionController(
            AuthService authService,
            VersionService versionService,
            VersionGanttViewService versionGanttViewService,
            VersionTrialSolveService versionTrialSolveService
    ) {
        this.authService = authService;
        this.versionService = versionService;
        this.versionGanttViewService = versionGanttViewService;
        this.versionTrialSolveService = versionTrialSolveService;
    }

    @GetMapping
    public List<VersionSummaryResponse> listVersions(HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return versionService.listVersions().stream()
                .map(VersionSummaryResponse::from)
                .toList();
    }

    @GetMapping("/audit-history")
    public List<VersionAuditEventResponse> listAuditHistory(HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return versionService.listVersionHistory().stream()
                .map(VersionAuditEventResponse::from)
                .toList();
    }

    @GetMapping("/{versionId}")
    public VersionSummaryResponse getVersion(@PathVariable String versionId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return VersionSummaryResponse.from(versionService.getVersion(versionId));
    }

    @GetMapping("/{versionId}/gantt-data")
    public GanttDataResponse getGanttData(@PathVariable String versionId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return versionGanttViewService.toResponse(versionService.getVersion(versionId));
    }

    @GetMapping("/{versionId}/history")
    public List<VersionAuditEventResponse> getHistory(@PathVariable String versionId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return versionService.listVersionHistory(versionId).stream()
                .map(VersionAuditEventResponse::from)
                .toList();
    }

    @GetMapping("/{versionId}/diff")
    public VersionDiffResponse getDiff(
            @PathVariable String versionId,
            @RequestParam String baseVersionId,
            HttpSession session
    ) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return VersionDiffResponse.from(versionService.getVersionDiff(versionId, baseVersionId));
    }

    @PutMapping("/{versionId}/release-note")
    public GanttDataResponse updateReleaseNote(
            @PathVariable String versionId,
            @RequestBody(required = false) VersionReleaseNoteRequest request,
            HttpSession session
    ) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER);
        return versionGanttViewService.toResponse(
                versionService.updateReleaseNote(versionId, request == null ? null : request.releaseNote())
        );
    }

    @DeleteMapping("/{versionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDraftVersion(@PathVariable String versionId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        versionService.deleteDraftVersion(versionId);
    }

    @PostMapping("/delete-drafts")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDraftVersions(@RequestBody(required = false) VersionDeleteRequest request, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        versionService.deleteDraftVersions(request == null ? null : request.versionIds());
    }

    @PostMapping("/{versionId}/ready-for-release")
    public VersionSummaryResponse submitForRelease(
            @PathVariable String versionId,
            @RequestBody(required = false) VersionActionRequest request,
            HttpSession session
    ) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return VersionSummaryResponse.from(versionService.submitForRelease(
                versionId,
                authenticatedUser.username(),
                request
        ));
    }

    @PostMapping("/{versionId}/approve")
    public VersionSummaryResponse approve(
            @PathVariable String versionId,
            @RequestBody(required = false) VersionActionRequest request,
            HttpSession session
    ) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.APPROVER);
        return VersionSummaryResponse.from(versionService.approve(
                versionId,
                authenticatedUser.username(),
                request
        ));
    }

    @PostMapping("/{versionId}/reject")
    public VersionSummaryResponse reject(
            @PathVariable String versionId,
            @RequestBody(required = false) VersionActionRequest request,
            HttpSession session
    ) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.APPROVER);
        return VersionSummaryResponse.from(versionService.reject(
                versionId,
                authenticatedUser.username(),
                request
        ));
    }

    @PostMapping("/{versionId}/publish")
    public VersionSummaryResponse publish(
            @PathVariable String versionId,
            @RequestBody(required = false) VersionActionRequest request,
            HttpSession session
    ) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.APPROVER);
        return VersionSummaryResponse.from(versionService.publish(
                versionId,
                authenticatedUser.username(),
                request
        ));
    }

    @PostMapping("/{versionId}/rollback")
    public VersionSummaryResponse rollback(
            @PathVariable String versionId,
            @RequestBody(required = false) VersionActionRequest request,
            HttpSession session
    ) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.APPROVER);
        return VersionSummaryResponse.from(versionService.rollback(
                versionId,
                authenticatedUser.username(),
                request
        ));
    }

    @PostMapping("/{versionId}/trial-solve")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ScheduleJobResponse trialSolve(
            @PathVariable String versionId,
            @Valid @RequestBody TrialSolveRequest request,
            HttpSession session
    ) {
        AuthService.AuthenticatedUser authenticatedUser = authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER);
        return ScheduleJobResponse.from(versionTrialSolveService.submitTrialSolve(versionId, request, authenticatedUser.username()));
    }
}
