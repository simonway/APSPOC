package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.VersionActionRequest;
import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ResourceType;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VersionServiceTest {

    @Mock
    private ScheduleStore store;

    @Mock
    private VersionDiffService versionDiffService;

    @Test
    void submitForReleaseRejectsNonDraftVersions() {
        VersionService service = new VersionService(store, versionDiffService);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(version("ver-1", VersionStatus.READY_FOR_RELEASE)));

        assertThatThrownBy(() -> service.submitForRelease("ver-1", "planner-admin", new VersionActionRequest("comment", "note")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only draft or rejected versions can be submitted for release.");
    }

    @Test
    void deleteDraftRejectsNonDraftVersions() {
        VersionService service = new VersionService(store, versionDiffService);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(version("ver-1", VersionStatus.RELEASED)));

        assertThatThrownBy(() -> service.deleteDraftVersion("ver-1"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only draft versions can be deleted.");
        verify(store, never()).deleteVersion("ver-1");
    }

    @Test
    void publishRejectsVersionsThatAreNotApproved() {
        VersionService service = new VersionService(store, versionDiffService);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(version("ver-1", VersionStatus.DRAFT)));

        assertThatThrownBy(() -> service.publish("ver-1", "planner-admin", new VersionActionRequest("comment", "note")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only approved versions can be published.");
    }

    @Test
    void rollbackRejectsDraftVersions() {
        VersionService service = new VersionService(store, versionDiffService);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(version("ver-1", VersionStatus.DRAFT)));

        assertThatThrownBy(() -> service.rollback("ver-1", "planner-admin", new VersionActionRequest("comment", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only archived or rolled-back versions can be activated through rollback.");
    }

    @Test
    void submitForReleaseNormalizesCommentAndReleaseNote() {
        VersionService service = new VersionService(store, versionDiffService);
        ScheduleVersion draft = version("ver-1", VersionStatus.DRAFT);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(draft));
        when(store.markReadyForRelease("ver-1", "planner-admin", "ready", "note")).thenReturn(version("ver-1", VersionStatus.READY_FOR_RELEASE));

        service.submitForRelease("ver-1", " planner-admin ", new VersionActionRequest(" ready ", " note "));

        verify(store).markReadyForRelease("ver-1", "planner-admin", "ready", "note");
    }

    @Test
    void approveDelegatesForSubmittedVersions() {
        VersionService service = new VersionService(store, versionDiffService);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(version("ver-1", VersionStatus.READY_FOR_RELEASE)));
        when(store.approve("ver-1", "approver-a", "approved")).thenReturn(version("ver-1", VersionStatus.APPROVED));

        service.approve("ver-1", " approver-a ", new VersionActionRequest(" approved ", null));

        verify(store).approve("ver-1", "approver-a", "approved");
    }

    @Test
    void deleteDraftDelegatesToStore() {
        VersionService service = new VersionService(store, versionDiffService);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(version("ver-1", VersionStatus.DRAFT)));

        service.deleteDraftVersion("ver-1");

        verify(store).deleteVersion("ver-1");
    }

    @Test
    void deleteDraftVersionsRejectsEmptySelection() {
        VersionService service = new VersionService(store, versionDiffService);

        assertThatThrownBy(() -> service.deleteDraftVersions(List.of()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("At least one draft version must be selected.");
    }

    @Test
    void deleteDraftVersionsDeletesDistinctDraftIds() {
        VersionService service = new VersionService(store, versionDiffService);
        when(store.findVersion("ver-1")).thenReturn(Optional.of(version("ver-1", VersionStatus.DRAFT)));
        when(store.findVersion("ver-2")).thenReturn(Optional.of(version("ver-2", VersionStatus.DRAFT)));

        service.deleteDraftVersions(List.of(" ver-1 ", "ver-2", "ver-1"));

        verify(store).deleteVersions(List.of("ver-1", "ver-2"));
    }

    private ScheduleVersion version(String id, VersionStatus status) {
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
