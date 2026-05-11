package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.VersionActionRequest;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.VersionAuditEvent;
import com.apspoc.backend.domain.VersionDiff;
import com.apspoc.backend.domain.VersionHistoryEntry;
import com.apspoc.backend.domain.VersionStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class VersionService {

    private final ScheduleStore store;
    private final VersionDiffService versionDiffService;

    public VersionService(ScheduleStore store, VersionDiffService versionDiffService) {
        this.store = store;
        this.versionDiffService = versionDiffService;
    }

    public List<ScheduleVersion> listVersions() {
        return store.listVersions();
    }

    public ScheduleVersion getVersion(String versionId) {
        return store.findVersion(versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown version: " + versionId));
    }

    public List<VersionHistoryEntry> listVersionHistory() {
        return store.listVersionHistory().stream()
                .map(this::toHistoryEntry)
                .toList();
    }

    public List<VersionHistoryEntry> listVersionHistory(String versionId) {
        ScheduleVersion targetVersion = getVersion(versionId);
        return store.listVersionHistory(versionId).stream()
                .map(event -> toHistoryEntry(targetVersion, event))
                .toList();
    }

    public VersionDiff getVersionDiff(String versionId, String baseVersionId) {
        if (Objects.equals(versionId, baseVersionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The base version must be different from the target version.");
        }
        ScheduleVersion targetVersion = getVersion(versionId);
        ScheduleVersion baseVersion = getVersion(baseVersionId);
        return versionDiffService.diff(baseVersion, targetVersion);
    }

    public ScheduleVersion updateReleaseNote(String versionId, String releaseNote) {
        getVersion(versionId);
        return store.updateReleaseNote(versionId, normalizeReleaseNote(releaseNote));
    }

    public void deleteDraftVersion(String versionId) {
        ScheduleVersion version = getVersion(versionId);
        ensureStatus(version, VersionStatus.DRAFT, "Only draft versions can be deleted.");
        store.deleteVersion(versionId);
    }

    public void deleteDraftVersions(List<String> versionIds) {
        List<String> normalizedVersionIds = normalizeVersionIds(versionIds);
        if (normalizedVersionIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one draft version must be selected.");
        }

        for (String versionId : normalizedVersionIds) {
            ScheduleVersion version = getVersion(versionId);
            ensureStatus(version, VersionStatus.DRAFT, "Only draft versions can be deleted.");
        }
        store.deleteVersions(normalizedVersionIds);
    }

    public ScheduleVersion submitForRelease(String versionId, String actorUsername, VersionActionRequest request) {
        ScheduleVersion version = getVersion(versionId);
        ensureOneOfStatuses(
                version,
                List.of(VersionStatus.DRAFT, VersionStatus.REJECTED),
                "Only draft or rejected versions can be submitted for release."
        );
        return store.markReadyForRelease(
                versionId,
                normalizeActor(actorUsername),
                normalizeRequiredComment(request == null ? null : request.comment(), "A release submission comment is required."),
                normalizeReleaseNote(request == null ? null : request.releaseNote())
        );
    }

    public ScheduleVersion approve(String versionId, String actorUsername, VersionActionRequest request) {
        ScheduleVersion version = getVersion(versionId);
        ensureStatus(version, VersionStatus.READY_FOR_RELEASE, "Only submitted versions can be approved.");
        return store.approve(
                versionId,
                normalizeActor(actorUsername),
                normalizeRequiredComment(request == null ? null : request.comment(), "An approval comment is required.")
        );
    }

    public ScheduleVersion reject(String versionId, String actorUsername, VersionActionRequest request) {
        ScheduleVersion version = getVersion(versionId);
        ensureStatus(version, VersionStatus.READY_FOR_RELEASE, "Only submitted versions can be rejected.");
        return store.reject(
                versionId,
                normalizeActor(actorUsername),
                normalizeRequiredComment(request == null ? null : request.comment(), "A rejection comment is required.")
        );
    }

    public ScheduleVersion publish(String versionId, String actorUsername, VersionActionRequest request) {
        ScheduleVersion version = getVersion(versionId);
        ensureStatus(version, VersionStatus.APPROVED, "Only approved versions can be published.");
        return store.publish(
                versionId,
                normalizeActor(actorUsername),
                normalizeRequiredComment(request == null ? null : request.comment(), "A publish comment is required."),
                normalizeReleaseNote(request == null ? null : request.releaseNote())
        );
    }

    public ScheduleVersion rollback(String versionId, String actorUsername, VersionActionRequest request) {
        ScheduleVersion version = getVersion(versionId);
        ensureOneOfStatuses(
                version,
                List.of(VersionStatus.ARCHIVED, VersionStatus.ROLLED_BACK),
                "Only archived or rolled-back versions can be activated through rollback."
        );
        return store.rollback(
                versionId,
                normalizeActor(actorUsername),
                normalizeRequiredComment(request == null ? null : request.comment(), "A rollback comment is required.")
        );
    }

    private VersionHistoryEntry toHistoryEntry(VersionAuditEvent event) {
        ScheduleVersion targetVersion = store.findVersion(event.targetVersionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown version: " + event.targetVersionId()));
        return toHistoryEntry(targetVersion, event);
    }

    private VersionHistoryEntry toHistoryEntry(ScheduleVersion targetVersion, VersionAuditEvent event) {
        ScheduleVersion previousPublishedVersion = event.previousPublishedVersionId() == null
                ? null
                : store.findVersion(event.previousPublishedVersionId()).orElse(null);
        return new VersionHistoryEntry(
                event.eventId(),
                event.eventType(),
                targetVersion.id(),
                targetVersion.versionName(),
                event.previousPublishedVersionId(),
                previousPublishedVersion == null ? null : previousPublishedVersion.versionName(),
                event.actorUsername(),
                event.comment(),
                event.createdAt()
        );
    }

    private String normalizeActor(String actorUsername) {
        return actorUsername == null || actorUsername.isBlank() ? "unknown" : actorUsername.trim();
    }

    private String normalizeReleaseNote(String releaseNote) {
        if (releaseNote == null) {
            return null;
        }
        String normalized = releaseNote.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        return normalized;
    }

    private void ensureStatus(ScheduleVersion version, VersionStatus expectedStatus, String message) {
        if (version.status() != expectedStatus) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void ensureOneOfStatuses(ScheduleVersion version, List<VersionStatus> allowedStatuses, String message) {
        if (!allowedStatuses.contains(version.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String normalizeRequiredComment(String comment, String message) {
        if (comment == null || comment.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return comment.trim();
    }

    private List<String> normalizeVersionIds(List<String> versionIds) {
        if (versionIds == null) {
            return List.of();
        }
        return versionIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }
}
