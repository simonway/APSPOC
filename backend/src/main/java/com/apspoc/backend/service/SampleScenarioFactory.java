package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.domain.ResourceType;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class SampleScenarioFactory {

    public CreateScheduleJobRequest create() {
        return new CreateScheduleJobRequest(
                "plant-scale-control-deck",
                Instant.parse("2026-04-15T08:00:00Z"),
                2880,
                List.of(
                        new CreateScheduleJobRequest.ResourceInput("reactor_01", "Reactor-01", ResourceType.REACTOR, 1),
                        new CreateScheduleJobRequest.ResourceInput("reactor_02", "Reactor-02", ResourceType.REACTOR, 2),
                        new CreateScheduleJobRequest.ResourceInput("reactor_03", "Reactor-03", ResourceType.REACTOR, 3),
                        new CreateScheduleJobRequest.ResourceInput("tank_01", "Blend-Tank-01", ResourceType.TANK, 4),
                        new CreateScheduleJobRequest.ResourceInput("tank_02", "Blend-Tank-02", ResourceType.TANK, 5),
                        new CreateScheduleJobRequest.ResourceInput("tank_03", "Hold-Tank-03", ResourceType.TANK, 6),
                        new CreateScheduleJobRequest.ResourceInput("filter_01", "Filter-01", ResourceType.FILTER, 7),
                        new CreateScheduleJobRequest.ResourceInput("filter_02", "Filter-02", ResourceType.FILTER, 8),
                        new CreateScheduleJobRequest.ResourceInput("dryer_01", "Dryer-01", ResourceType.DRYER, 9),
                        new CreateScheduleJobRequest.ResourceInput("dryer_02", "Dryer-02", ResourceType.DRYER, 10)
                ),
                List.of(
                        new CreateScheduleJobRequest.TaskInput("batch_A", "Batch A", "A", 480, 1080, 3, List.of("reactor_01", "reactor_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("batch_B", "Batch B", "B", 720, 900, 5, List.of("reactor_01", "reactor_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("batch_C", "Batch C", "C", 600, 1800, 1, List.of("reactor_01", "reactor_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("batch_D", "Batch D", "D", 360, 1440, 4, List.of("reactor_01", "reactor_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("batch_E", "Batch E", "E", 540, 2100, 2, List.of("reactor_01", "reactor_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("batch_F", "Batch F", "F", 420, 1320, 4, List.of("reactor_02", "reactor_03"), null, null),
                        new CreateScheduleJobRequest.TaskInput("batch_G", "Batch G", "G", 510, 1740, 2, List.of("reactor_02", "reactor_03"), null, null),
                        new CreateScheduleJobRequest.TaskInput("slurry_H", "Slurry H", "H", 300, 1260, 3, List.of("tank_01", "tank_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("slurry_I", "Slurry I", "I", 360, 1560, 4, List.of("tank_01", "tank_02", "tank_03"), null, null),
                        new CreateScheduleJobRequest.TaskInput("hold_J", "Hold J", "J", 240, 1680, 2, List.of("tank_02", "tank_03"), null, null),
                        new CreateScheduleJobRequest.TaskInput("polish_K", "Polish K", "K", 280, 1800, 3, List.of("filter_01", "filter_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("polish_L", "Polish L", "L", 340, 1920, 2, List.of("filter_01", "filter_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("dry_M", "Dry M", "M", 420, 2160, 4, List.of("dryer_01", "dryer_02"), null, null),
                        new CreateScheduleJobRequest.TaskInput("dry_N", "Dry N", "N", 300, 2280, 2, List.of("dryer_01", "dryer_02"), null, null)
                ),
                List.of(
                        new CreateScheduleJobRequest.DowntimeInput(
                                "maintenance_reactor_01_morning",
                                "reactor_01",
                                240,
                                420,
                                "MAINTENANCE",
                                "CALENDAR",
                                "Preventive maintenance window"
                        ),
                        new CreateScheduleJobRequest.DowntimeInput(
                                "cleaning_reactor_03_midday",
                                "reactor_03",
                                900,
                                1080,
                                "CLEANING",
                                "CALENDAR",
                                "Intermediate rinse and line clearance"
                        ),
                        new CreateScheduleJobRequest.DowntimeInput(
                                "cip_tank_02",
                                "tank_02",
                                660,
                                840,
                                "CIP",
                                "CALENDAR",
                                "Tank cleaning cycle"
                        ),
                        new CreateScheduleJobRequest.DowntimeInput(
                                "inspection_filter_01",
                                "filter_01",
                                1080,
                                1200,
                                "INSPECTION",
                                "CALENDAR",
                                "Filter cloth inspection"
                        ),
                        new CreateScheduleJobRequest.DowntimeInput(
                                "calibration_dryer_02",
                                "dryer_02",
                                1260,
                                1380,
                                "CALIBRATION",
                                "CALENDAR",
                                "Dryer sensor calibration"
                        )
                ),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4)
        );
    }
}
