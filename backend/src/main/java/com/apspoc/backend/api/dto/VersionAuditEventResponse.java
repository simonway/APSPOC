package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.VersionHistoryEntry;

import java.time.Instant;

public record VersionAuditEventResponse(
        long eventId,
        String eventType,
        String targetVersionId,
        String targetVersionName,
        String previousPublishedVersionId,
        String previousPublishedVersionName,
        String actorUsername,
        String comment,
        Instant createdAt
) {

    public static VersionAuditEventResponse from(VersionHistoryEntry entry) {
        return new VersionAuditEventResponse(
                entry.eventId(),
                entry.eventType().name(),
                entry.targetVersionId(),
                entry.targetVersionName(),
                entry.previousPublishedVersionId(),
                entry.previousPublishedVersionName(),
                entry.actorUsername(),
                entry.comment(),
                entry.createdAt()
        );
    }
}
