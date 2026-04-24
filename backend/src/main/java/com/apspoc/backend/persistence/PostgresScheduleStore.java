package com.apspoc.backend.persistence;

import com.apspoc.backend.domain.VersionStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import com.apspoc.backend.persistence.entity.ScheduleVersionEntity;
import com.apspoc.backend.persistence.repository.ScheduleJobRepository;
import com.apspoc.backend.persistence.repository.ScheduleVersionRepository;
import com.apspoc.backend.service.ScheduleStore;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
public class PostgresScheduleStore implements ScheduleStore {

    private final ScheduleJobRepository jobRepository;
    private final ScheduleVersionRepository versionRepository;
    private final SchedulePersistenceMapper mapper;

    public PostgresScheduleStore(
            ScheduleJobRepository jobRepository,
            ScheduleVersionRepository versionRepository,
            SchedulePersistenceMapper mapper
    ) {
        this.jobRepository = jobRepository;
        this.versionRepository = versionRepository;
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
    @Transactional
    public ScheduleVersion publish(String versionId) {
        versionRepository.archivePublishedVersionsExcept(VersionStatus.ARCHIVED, VersionStatus.PUBLISHED, versionId);
        ScheduleVersionEntity target = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown version: " + versionId));
        target.setStatus(VersionStatus.PUBLISHED);
        target.setPublishedAt(Instant.now());
        return mapper.toDomain(target);
    }

    @Override
    @Transactional
    public ScheduleVersion rollback(String versionId) {
        return publish(versionId);
    }
}
