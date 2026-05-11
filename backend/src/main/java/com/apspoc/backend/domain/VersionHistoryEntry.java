package com.apspoc.backend.domain;

import java.time.Instant;

public record VersionHistoryEntry(
        long eventId,
        VersionAuditEventType eventType,
        String targetVersionId,
        String targetVersionName,
        String previousPublishedVersionId,
        String previousPublishedVersionName,
        String actorUsername,
        String comment,
        Instant createdAt
) {
}
