package com.apspoc.backend.domain;

import java.time.Instant;

public record VersionAuditEvent(
        long eventId,
        String targetVersionId,
        VersionAuditEventType eventType,
        String previousPublishedVersionId,
        String actorUsername,
        String comment,
        Instant createdAt
) {
}
