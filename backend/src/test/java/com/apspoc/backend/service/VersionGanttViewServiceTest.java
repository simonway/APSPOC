package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.GanttDataResponse;
import com.apspoc.backend.domain.GanttData;
import com.apspoc.backend.domain.ResourceType;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.TriggerType;
import com.apspoc.backend.domain.VersionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VersionGanttViewServiceTest {

    @Test
    void toResponseProjectsInventoryCoverageMarkersFromSourceRequestSnapshot() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        VersionGanttViewService service = new VersionGanttViewService(objectMapper);

        CreateScheduleJobRequest request = new CreateScheduleJobRequest(
                "snow-test",
                Instant.parse("2026-12-24T00:00:00Z"),
                1_440,
                List.of(new CreateScheduleJobRequest.ResourceInput("pack_l1", "包装1线", ResourceType.OTHER, 1)),
                List.of(new CreateScheduleJobRequest.TaskInput(
                        "task-1",
                        "包装",
                        "FG-A",
                        60,
                        120,
                        5,
                        List.of("pack_l1"),
                        null,
                        null,
                        List.of(),
                        null,
                        List.of(),
                        List.of()
                )),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 2, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 1),
                "dv-test",
                List.of(),
                List.of(new CreateScheduleJobRequest.InventoryBalanceInput("FG-A", 2, 0, 0)),
                List.of(
                        new CreateScheduleJobRequest.InventoryDemandInput("dem-1", "FG-A", 1, 60, 5),
                        new CreateScheduleJobRequest.InventoryDemandInput("dem-2", "FG-A", 2, 120, 1)
                )
        );

        ScheduleVersion version = new ScheduleVersion(
                "ver-1",
                "ver-1",
                VersionStatus.DRAFT,
                TriggerType.MANUAL,
                "snow-test",
                Instant.parse("2026-05-06T08:00:00Z"),
                objectMapper.writeValueAsString(request),
                new GanttData(
                        List.of(new GanttData.Row("pack_l1", "包装1线", ResourceType.OTHER, 1)),
                        List.of(),
                        List.of(),
                        List.of(),
                        new GanttData.KpiSnapshot(0, 0, 0, 0.0)
                )
        );

        GanttDataResponse response = service.toResponse(version);

        assertThat(response.inventoryCoverages()).hasSize(2);
        assertThat(response.inventoryCoverages().getFirst().demandId()).isEqualTo("dem-1");
        assertThat(response.inventoryCoverages().getFirst().coveredQuantity()).isEqualTo(1);
        assertThat(response.inventoryCoverages().getFirst().fullyCovered()).isTrue();
        assertThat(response.inventoryCoverages().get(1).demandId()).isEqualTo("dem-2");
        assertThat(response.inventoryCoverages().get(1).coveredQuantity()).isEqualTo(1);
        assertThat(response.inventoryCoverages().get(1).requestedQuantity()).isEqualTo(2);
        assertThat(response.inventoryCoverages().get(1).fullyCovered()).isFalse();
    }
}
