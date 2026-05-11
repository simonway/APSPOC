package com.apspoc.backend.persistence.entity;

import com.apspoc.backend.domain.VersionAuditEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "version_audit_event")
public class VersionAuditEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_version_id", nullable = false)
    private String targetVersionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private VersionAuditEventType eventType;

    @Column(name = "previous_published_version_id")
    private String previousPublishedVersionId;

    @Column(name = "actor_username", nullable = false)
    private String actorUsername;

    @Column(name = "comment_text", nullable = false)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public String getTargetVersionId() {
        return targetVersionId;
    }

    public void setTargetVersionId(String targetVersionId) {
        this.targetVersionId = targetVersionId;
    }

    public VersionAuditEventType getEventType() {
        return eventType;
    }

    public void setEventType(VersionAuditEventType eventType) {
        this.eventType = eventType;
    }

    public String getPreviousPublishedVersionId() {
        return previousPublishedVersionId;
    }

    public void setPreviousPublishedVersionId(String previousPublishedVersionId) {
        this.previousPublishedVersionId = previousPublishedVersionId;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = actorUsername;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
