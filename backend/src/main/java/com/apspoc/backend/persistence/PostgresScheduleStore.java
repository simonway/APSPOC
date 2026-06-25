package com.apspoc.backend.persistence;

import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.VersionStatus;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.VersionAuditEvent;
import com.apspoc.backend.domain.VersionAuditEventType;
import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import com.apspoc.backend.persistence.entity.ScheduleVersionEntity;
import com.apspoc.backend.persistence.entity.VersionAuditEventEntity;
import com.apspoc.backend.persistence.repository.ScheduleJobRepository;
import com.apspoc.backend.persistence.repository.ScheduleVersionRepository;
import com.apspoc.backend.persistence.repository.VersionAuditEventRepository;
import com.apspoc.backend.service.ScheduleStore;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public class PostgresScheduleStore implements ScheduleStore {

    private final ScheduleJobRepository jobRepository;
    private final ScheduleVersionRepository versionRepository;
    private final VersionAuditEventRepository versionAuditEventRepository;
    private final SchedulePersistenceMapper mapper;

    public PostgresScheduleStore(
            ScheduleJobRepository jobRepository,
            ScheduleVersionRepository versionRepository,
            VersionAuditEventRepository versionAuditEventRepository,
            SchedulePersistenceMapper mapper
    ) {
        this.jobRepository = jobRepository;
        this.versionRepository = versionRepository;
        this.versionAuditEventRepository = versionAuditEventRepository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public ScheduleJob saveJob(ScheduleJob job) {
        ScheduleJobEntity entity = jobRepository.findById(job.id())
                .orElseGet(() -> new ScheduleJobEntity(job.id()));
        mapper.updateJobEntity(entity, job);
        return mapper.toDomain(jobRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ScheduleJob> findJob(String jobId) {
        return jobRepository.findById(jobId).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleJob> listJobsByStatuses(List<JobStatus> statuses) {
        return jobRepository.findAllByStatusIn(statuses).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleJob> listRecentJobs(int limit) {
        return jobRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public ScheduleVersion saveVersion(ScheduleVersion version) {
        ScheduleVersionEntity entity = versionRepository.findById(version.id())
                .orElseGet(() -> new ScheduleVersionEntity(version.id()));
        mapper.updateVersionEntity(entity, version);
        return mapper.toDomain(versionRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ScheduleVersion> findVersion(String versionId) {
        return versionRepository.findById(versionId).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleVersion> listVersions() {
        return versionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(mapper::toSummaryDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VersionAuditEvent> listVersionHistory() {
        return versionAuditEventRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VersionAuditEvent> listVersionHistory(String versionId) {
        return versionAuditEventRepository.findAllByTargetVersionIdOrderByCreatedAtDesc(versionId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public ScheduleVersion updateReleaseNote(String versionId, String releaseNote) {
        ScheduleVersionEntity version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId));
        version.setReleaseNote(releaseNote);
        return mapper.toDomain(version);
    }

    @Override
    @Transactional
    public void deleteVersion(String versionId) {
        ScheduleVersionEntity version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId));
        versionRepository.delete(version);
    }

    @Override
    @Transactional
    public void deleteVersions(List<String> versionIds) {
        List<ScheduleVersionEntity> versions = versionIds.stream()
                .map(versionId -> versionRepository.findById(versionId)
                        .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId)))
                .toList();
        versionRepository.deleteAll(versions);
    }

    @Override
    @Transactional
    public ScheduleVersion markReadyForRelease(String versionId, String actorUsername, String comment, String releaseNote) {
        ScheduleVersionEntity target = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId));
        target.setStatus(VersionStatus.READY_FOR_RELEASE);
        target.setReleaseNote(releaseNote);
        versionAuditEventRepository.save(buildAuditEvent(
                versionId,
                VersionAuditEventType.READY_FOR_RELEASE,
                currentReleasedVersionId(),
                actorUsername,
                comment,
                Instant.now()
        ));
        return mapper.toDomain(target);
    }

    @Override
    @Transactional
    public ScheduleVersion publish(String versionId, String actorUsername, String comment, String releaseNote) {
        return activateVersion(
                versionId,
                VersionAuditEventType.PUBLISH,
                actorUsername,
                comment,
                releaseNote,
                VersionStatus.ARCHIVED
        );
    }

    @Override
    @Transactional
    public ScheduleVersion approve(String versionId, String actorUsername, String comment) {
        ScheduleVersionEntity target = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId));
        target.setStatus(VersionStatus.APPROVED);
        versionAuditEventRepository.save(buildAuditEvent(
                versionId,
                VersionAuditEventType.APPROVE,
                currentReleasedVersionId(),
                actorUsername,
                comment,
                Instant.now()
        ));
        return mapper.toDomain(target);
    }

    @Override
    @Transactional
    public ScheduleVersion reject(String versionId, String actorUsername, String comment) {
        ScheduleVersionEntity target = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId));
        target.setStatus(VersionStatus.REJECTED);
        versionAuditEventRepository.save(buildAuditEvent(
                versionId,
                VersionAuditEventType.REJECT,
                currentReleasedVersionId(),
                actorUsername,
                comment,
                Instant.now()
        ));
        return mapper.toDomain(target);
    }

    @Override
    @Transactional
    public ScheduleVersion rollback(String versionId, String actorUsername, String comment) {
        return activateVersion(
                versionId,
                VersionAuditEventType.ROLLBACK,
                actorUsername,
                comment,
                null,
                VersionStatus.ROLLED_BACK
        );
    }

    private ScheduleVersion activateVersion(
            String versionId,
            VersionAuditEventType eventType,
            String actorUsername,
            String comment,
            String releaseNote,
            VersionStatus previousLiveStatus
    ) {
        Instant activatedAt = Instant.now();
        ScheduleVersionEntity currentReleased = versionRepository
                .findFirstByStatusOrderByPublishedAtDescCreatedAtDesc(VersionStatus.RELEASED)
                .orElse(null);

        if (currentReleased != null && currentReleased.getId().equals(versionId)) {
            return mapper.toDomain(currentReleased);
        }

        if (currentReleased != null) {
            currentReleased.setStatus(previousLiveStatus);
        }

        ScheduleVersionEntity target = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId));
        target.setStatus(VersionStatus.RELEASED);
        target.setPublishedAt(activatedAt);
        if (eventType == VersionAuditEventType.PUBLISH) {
            target.setReleaseNote(releaseNote);
        }

        versionAuditEventRepository.save(buildAuditEvent(
                target.getId(),
                eventType,
                currentReleased == null ? null : currentReleased.getId(),
                actorUsername,
                comment,
                activatedAt
        ));

        return mapper.toDomain(target);
    }

    private String currentReleasedVersionId() {
        return versionRepository.findFirstByStatusOrderByPublishedAtDescCreatedAtDesc(VersionStatus.RELEASED)
                .map(ScheduleVersionEntity::getId)
                .orElse(null);
    }

    private VersionAuditEventEntity buildAuditEvent(
            String targetVersionId,
            VersionAuditEventType eventType,
            String previousPublishedVersionId,
            String actorUsername,
            String comment,
            Instant createdAt
    ) {
        VersionAuditEventEntity auditEvent = new VersionAuditEventEntity();
        auditEvent.setTargetVersionId(targetVersionId);
        auditEvent.setEventType(eventType);
        auditEvent.setPreviousPublishedVersionId(previousPublishedVersionId);
        auditEvent.setActorUsername(actorUsername);
        auditEvent.setComment(comment);
        auditEvent.setCreatedAt(createdAt);
        return auditEvent;
    }
}
