package com.apspoc.backend.persistence;

import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ResourceType;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionAuditEventType;
import com.apspoc.backend.domain.VersionStatus;
import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import com.apspoc.backend.persistence.entity.ScheduleVersionEntity;
import com.apspoc.backend.persistence.entity.VersionAuditEventEntity;
import com.apspoc.backend.persistence.repository.ScheduleJobRepository;
import com.apspoc.backend.persistence.repository.ScheduleVersionRepository;
import com.apspoc.backend.persistence.repository.VersionAuditEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostgresScheduleStoreTest {

    @Mock
    private ScheduleJobRepository jobRepository;

    @Mock
    private ScheduleVersionRepository versionRepository;

    @Mock
    private VersionAuditEventRepository versionAuditEventRepository;

    @Mock
    private SchedulePersistenceMapper mapper;

    private PostgresScheduleStore store;

    @BeforeEach
    void setUp() {
        store = new PostgresScheduleStore(jobRepository, versionRepository, versionAuditEventRepository, mapper);
    }

    @Test
    void publishCreatesPublishAuditEventAndMarksTargetAsPublished() {
        ScheduleVersionEntity currentPublished = versionEntity("ver-live", VersionStatus.RELEASED);
        ScheduleVersionEntity target = versionEntity("ver-draft", VersionStatus.APPROVED);
        ScheduleVersion expected = domainVersion("ver-draft", VersionStatus.RELEASED);

        when(versionRepository.findFirstByStatusOrderByPublishedAtDescCreatedAtDesc(VersionStatus.RELEASED))
                .thenReturn(Optional.of(currentPublished));
        when(versionRepository.findById("ver-draft")).thenReturn(Optional.of(target));
        when(mapper.toDomain(target)).thenReturn(expected);

        ScheduleVersion result = store.publish("ver-draft", "planner-admin", "Go live after QA sign-off", "Release note");

        assertThat(result).isSameAs(expected);
        assertThat(target.getStatus()).isEqualTo(VersionStatus.RELEASED);
        assertThat(target.getPublishedAt()).isNotNull();
        assertThat(target.getReleaseNote()).isEqualTo("Release note");
        assertThat(currentPublished.getStatus()).isEqualTo(VersionStatus.ARCHIVED);

        ArgumentCaptor<VersionAuditEventEntity> captor = ArgumentCaptor.forClass(VersionAuditEventEntity.class);
        verify(versionAuditEventRepository).save(captor.capture());
        VersionAuditEventEntity saved = captor.getValue();
        assertThat(saved.getTargetVersionId()).isEqualTo("ver-draft");
        assertThat(saved.getPreviousPublishedVersionId()).isEqualTo("ver-live");
        assertThat(saved.getEventType()).isEqualTo(VersionAuditEventType.PUBLISH);
        assertThat(saved.getActorUsername()).isEqualTo("planner-admin");
        assertThat(saved.getComment()).isEqualTo("Go live after QA sign-off");
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    void rollbackCreatesRollbackAuditEvent() {
        ScheduleVersionEntity currentPublished = versionEntity("ver-live", VersionStatus.RELEASED);
        ScheduleVersionEntity target = versionEntity("ver-old", VersionStatus.ARCHIVED);
        ScheduleVersion expected = domainVersion("ver-old", VersionStatus.RELEASED);

        when(versionRepository.findFirstByStatusOrderByPublishedAtDescCreatedAtDesc(VersionStatus.RELEASED))
                .thenReturn(Optional.of(currentPublished));
        when(versionRepository.findById("ver-old")).thenReturn(Optional.of(target));
        when(mapper.toDomain(target)).thenReturn(expected);

        ScheduleVersion result = store.rollback("ver-old", "planner-admin", "Restore last stable plan");

        assertThat(result).isSameAs(expected);
        assertThat(currentPublished.getStatus()).isEqualTo(VersionStatus.ROLLED_BACK);
        assertThat(target.getStatus()).isEqualTo(VersionStatus.RELEASED);

        ArgumentCaptor<VersionAuditEventEntity> captor = ArgumentCaptor.forClass(VersionAuditEventEntity.class);
        verify(versionAuditEventRepository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo(VersionAuditEventType.ROLLBACK);
        assertThat(captor.getValue().getPreviousPublishedVersionId()).isEqualTo("ver-live");
        assertThat(captor.getValue().getActorUsername()).isEqualTo("planner-admin");
        assertThat(captor.getValue().getComment()).isEqualTo("Restore last stable plan");
    }

    @Test
    void publishSkipsAuditWhenTargetIsAlreadyPublished() {
        ScheduleVersionEntity currentPublished = versionEntity("ver-live", VersionStatus.RELEASED);
        ScheduleVersion expected = domainVersion("ver-live", VersionStatus.RELEASED);

        when(versionRepository.findFirstByStatusOrderByPublishedAtDescCreatedAtDesc(VersionStatus.RELEASED))
                .thenReturn(Optional.of(currentPublished));
        when(mapper.toDomain(currentPublished)).thenReturn(expected);

        ScheduleVersion result = store.publish("ver-live", "planner-admin", "No-op", "Release note");

        assertThat(result).isSameAs(expected);
        verify(versionAuditEventRepository, never()).save(any());
    }

    @Test
    void readyForReleaseCreatesAuditEventAndUpdatesTargetStatus() {
        ScheduleVersionEntity currentPublished = versionEntity("ver-live", VersionStatus.RELEASED);
        ScheduleVersionEntity target = versionEntity("ver-draft", VersionStatus.DRAFT);
        ScheduleVersion expected = domainVersion("ver-draft", VersionStatus.READY_FOR_RELEASE);

        when(versionRepository.findById("ver-draft")).thenReturn(Optional.of(target));
        when(versionRepository.findFirstByStatusOrderByPublishedAtDescCreatedAtDesc(VersionStatus.RELEASED))
                .thenReturn(Optional.of(currentPublished));
        when(mapper.toDomain(target)).thenReturn(expected);

        ScheduleVersion result = store.markReadyForRelease("ver-draft", "planner-admin", "Ready for release review", "Review note");

        assertThat(result).isSameAs(expected);
        assertThat(target.getStatus()).isEqualTo(VersionStatus.READY_FOR_RELEASE);
        assertThat(target.getReleaseNote()).isEqualTo("Review note");

        ArgumentCaptor<VersionAuditEventEntity> captor = ArgumentCaptor.forClass(VersionAuditEventEntity.class);
        verify(versionAuditEventRepository).save(captor.capture());
        assertThat(captor.getValue().getEventType()).isEqualTo(VersionAuditEventType.READY_FOR_RELEASE);
        assertThat(captor.getValue().getPreviousPublishedVersionId()).isEqualTo("ver-live");
        assertThat(captor.getValue().getComment()).isEqualTo("Ready for release review");
    }

    @Test
    void updateReleaseNotePersistsVersionNote() {
        ScheduleVersionEntity target = versionEntity("ver-draft", VersionStatus.DRAFT);
        ScheduleVersion expected = domainVersion("ver-draft", VersionStatus.DRAFT);
        when(versionRepository.findById("ver-draft")).thenReturn(Optional.of(target));
        when(mapper.toDomain(target)).thenReturn(expected);

        ScheduleVersion result = store.updateReleaseNote("ver-draft", "Draft review notes");

        assertThat(result).isSameAs(expected);
        assertThat(target.getReleaseNote()).isEqualTo("Draft review notes");
    }

    @Test
    void deleteVersionRemovesEntity() {
        ScheduleVersionEntity target = versionEntity("ver-draft", VersionStatus.DRAFT);
        when(versionRepository.findById("ver-draft")).thenReturn(Optional.of(target));

        store.deleteVersion("ver-draft");

        verify(versionRepository).delete(target);
    }

    @Test
    void deleteVersionsRemovesAllEntities() {
        ScheduleVersionEntity first = versionEntity("ver-draft-1", VersionStatus.DRAFT);
        ScheduleVersionEntity second = versionEntity("ver-draft-2", VersionStatus.DRAFT);
        when(versionRepository.findById("ver-draft-1")).thenReturn(Optional.of(first));
        when(versionRepository.findById("ver-draft-2")).thenReturn(Optional.of(second));

        store.deleteVersions(List.of("ver-draft-1", "ver-draft-2"));

        verify(versionRepository).deleteAll(List.of(first, second));
    }

    @Test
    void listRecentJobsReturnsJobsByCreatedAtDescending() {
        ScheduleJobEntity newest = jobEntity("job-new", "scenario-new", JobStatus.SUCCEEDED, "OPTIMAL", "ver-new", "2026-06-18T10:00:00Z");
        ScheduleJobEntity older = jobEntity("job-old", "scenario-old", JobStatus.FAILED, "FAILED", null, "2026-06-18T09:00:00Z");
        ScheduleJob newestDomain = domainJob("job-new", "scenario-new", JobStatus.SUCCEEDED, "OPTIMAL", "ver-new", "2026-06-18T10:00:00Z");
        ScheduleJob olderDomain = domainJob("job-old", "scenario-old", JobStatus.FAILED, "FAILED", null, "2026-06-18T09:00:00Z");

        when(jobRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 2))).thenReturn(List.of(newest, older));
        when(mapper.toDomain(newest)).thenReturn(newestDomain);
        when(mapper.toDomain(older)).thenReturn(olderDomain);

        List<ScheduleJob> result = store.listRecentJobs(2);

        assertThat(result).extracting(ScheduleJob::id).containsExactly("job-new", "job-old");
    }

    private ScheduleJobEntity jobEntity(String id, String scenarioName, JobStatus status, String solverStatus, String versionId, String createdAt) {
        ScheduleJobEntity entity = new ScheduleJobEntity(id);
        entity.setScenarioName(scenarioName);
        entity.setActorUsername("planner-admin");
        entity.setStatus(status);
        entity.setSolverStatus(solverStatus);
        entity.setVersionId(versionId);
        entity.setFailureReason(null);
        entity.setErrorMessage(null);
        entity.setSourceRequestJson("{}");
        entity.setCreatedAt(Instant.parse(createdAt));
        entity.setCompletedAt(status.isTerminal() ? Instant.parse(createdAt).plusSeconds(60) : null);
        return entity;
    }

    private ScheduleJob domainJob(String id, String scenarioName, JobStatus status, String solverStatus, String versionId, String createdAt) {
        return new ScheduleJob(
                id,
                scenarioName,
                "planner-admin",
                "{}",
                Instant.parse(createdAt),
                status,
                solverStatus,
                versionId,
                null,
                null,
                status.isTerminal() ? Instant.parse(createdAt).plusSeconds(60) : null
        );
    }

    private ScheduleVersionEntity versionEntity(String id, VersionStatus status) {
        ScheduleVersionEntity entity = new ScheduleVersionEntity(id);
        entity.setVersionName(id);
        entity.setStatus(status);
        entity.setTriggerType(TriggerType.MANUAL);
        entity.setScenarioDescription(id);
        entity.setCreatedAt(Instant.parse("2026-04-26T08:00:00Z"));
        entity.setCreatedBy("planner-admin");
        entity.setPublishedAt(status == VersionStatus.RELEASED ? Instant.parse("2026-04-26T09:00:00Z") : null);
        entity.setReleaseNote(null);
        return entity;
    }

    private ScheduleVersion domainVersion(String id, VersionStatus status) {
        return new ScheduleVersion(
                id,
                id,
                status,
                TriggerType.MANUAL,
                id,
                Instant.parse("2026-04-26T08:00:00Z"),
                status == VersionStatus.RELEASED ? Instant.parse("2026-04-26T09:00:00Z") : null,
                null,
                null,
                "planner-admin",
                new GanttData(
                        List.of(new GanttData.Row("row-1", "Reactor-01", ResourceType.REACTOR, 1)),
                        List.of(),
                        List.of(),
                        List.of(),
                        new GanttData.KpiSnapshot(0, 0, 0, 0.0)
                )
        );
    }
}
