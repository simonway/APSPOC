package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.TrialSolveRequest;
import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ResourceType;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VersionTrialSolveServiceTest {

    private static final Instant BASE_TIME = Instant.parse("2026-04-26T08:00:00Z");

    @Mock
    private VersionService versionService;

    @Mock
    private SchedulingJobService schedulingJobService;

    @Mock
    private SampleScenarioFactory sampleScenarioFactory;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void trialSolveCanUnpinPinnedTask() throws Exception {
        VersionTrialSolveService service = new VersionTrialSolveService(
                versionService,
                schedulingJobService,
                sampleScenarioFactory,
                objectMapper
        );
        ScheduleVersion version = version();
        when(versionService.getVersion("ver-1")).thenReturn(version);
        when(schedulingJobService.submit(any(), anyString())).thenReturn(
                new ScheduleJob("job-1", "scenario", "planner-admin", "{}", Instant.now())
        );

        service.submitTrialSolve(
                "ver-1",
                new TrialSolveRequest(List.of(
                        new TrialSolveRequest.DraftBarInput(
                                "task-A",
                                "row-1",
                                BASE_TIME.toEpochMilli(),
                                BASE_TIME.plusSeconds(60L * 60L).toEpochMilli(),
                                false
                        )
                )),
                "planner-admin"
        );

        ArgumentCaptor<CreateScheduleJobRequest> requestCaptor = ArgumentCaptor.forClass(CreateScheduleJobRequest.class);
        verify(schedulingJobService).submit(requestCaptor.capture(), org.mockito.Mockito.eq("planner-admin"));
        CreateScheduleJobRequest.TaskInput task = requestCaptor.getValue().tasks().getFirst();

        assertThat(task.id()).isEqualTo("task-A");
        assertThat(task.pinnedResourceId()).isNull();
        assertThat(task.pinnedStartMinutes()).isNull();
        assertThat(task.materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("P-A", 1)
        );
        assertThat(requestCaptor.getValue().inventoryBalances()).hasSize(1);
        assertThat(requestCaptor.getValue().inventoryBalances().getFirst().itemCode()).isEqualTo("P-A");
        assertThat(requestCaptor.getValue().inventoryDemands()).containsExactly(
                new CreateScheduleJobRequest.InventoryDemandInput("dmd-1", "P-A", 1, 180)
        );
    }

    private ScheduleVersion version() throws Exception {
        CreateScheduleJobRequest request = new CreateScheduleJobRequest(
                "scenario-A",
                BASE_TIME,
                480,
                List.of(new CreateScheduleJobRequest.ResourceInput("row-1", "Reactor-01", ResourceType.REACTOR, 1)),
                List.of(new CreateScheduleJobRequest.TaskInput(
                        "task-A",
                        "Task A",
                        "P-A",
                        60,
                        180,
                        1,
                        List.of("row-1"),
                        "row-1",
                        0,
                        List.of(),
                        null,
                        List.of(),
                        List.of(new CreateScheduleJobRequest.MaterialQuantityInput("P-A", 1))
                )),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4),
                null,
                List.of(),
                List.of(new CreateScheduleJobRequest.InventoryBalanceInput("P-A", 1, 0, 0)),
                List.of(new CreateScheduleJobRequest.InventoryDemandInput("dmd-1", "P-A", 1, 180))
        );

        return new ScheduleVersion(
                "ver-1",
                "Version 1",
                VersionStatus.DRAFT,
                TriggerType.MANUAL,
                "scenario-A",
                BASE_TIME.plusSeconds(300),
                objectMapper.writeValueAsString(request),
                new GanttData(
                        List.of(new GanttData.Row("row-1", "Reactor-01", ResourceType.REACTOR, 1)),
                        List.of(new GanttData.Bar(
                                "task-A",
                                "row-1",
                                BASE_TIME.toEpochMilli(),
                                BASE_TIME.plusSeconds(60L * 60L).toEpochMilli(),
                                "Task A",
                                "P-A",
                                1,
                                BASE_TIME.plusSeconds(180L * 60L).toEpochMilli(),
                                false,
                                0,
                                true
                        )),
                        List.of(),
                        List.of(),
                        new GanttData.KpiSnapshot(0, 60, 0, 0.5)
                )
        );
    }
}
