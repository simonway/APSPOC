package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.GenerateScenarioRequest;
import com.apspoc.backend.domain.ResourceType;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScenarioGenerationServiceTest {

    private final ScenarioGenerationService scenarioGenerationService = new ScenarioGenerationService();

    @Test
    void generateExpandsDemandAndRecipeIntoOperationsAndScheduleRequest() {
        var response = scenarioGenerationService.generate(baseRequest());

        assertThat(response.requestedDemandQuantity()).isEqualTo(1);
        assertThat(response.plannedDemandQuantity()).isEqualTo(1);
        assertThat(response.inventoryCoveredQuantity()).isEqualTo(0);
        assertThat(response.operationCount()).isEqualTo(3);
        assertThat(response.precedencePairCount()).isEqualTo(2);
        assertThat(response.bridgeAdjustmentCount()).isEqualTo(1);
        assertThat(response.demandCoverages()).hasSize(1);
        assertThat(response.demandCoverages().getFirst().plannedQuantity()).isEqualTo(1);
        assertThat(response.operations().getFirst().operationId()).isEqualTo("ord_pa101_001__01_react");
        assertThat(response.operations().getFirst().demandUnitIndex()).isEqualTo(1);
        assertThat(response.operations().get(1).predecessorOperationIds()).containsExactly("ord_pa101_001__01_react");
        assertThat(response.scheduleRequest().tasks()).hasSize(3);
        assertThat(response.scheduleRequest().inventoryDemands()).containsExactly(
                new CreateScheduleJobRequest.InventoryDemandInput("ord_pa101_001", "PA-101", 1, 960, 5)
        );
        assertThat(response.scheduleRequest().tasks().getFirst().pinnedResourceId()).isEqualTo("reactor_r01");
        assertThat(response.scheduleRequest().tasks().getFirst().pinnedStartMinutes()).isNull();
        assertThat(response.scheduleRequest().tasks().get(2).materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("PA-101", 1)
        );
    }

    @Test
    void generateUsesInventoryToReducePlannedOperations() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "scenario-inventory",
                "dv-2",
                Instant.parse("2026-05-05T08:00:00Z"),
                1_440,
                List.of(new CreateScheduleJobRequest.ResourceInput("reactor_r01", "Reactor-R01", ResourceType.REACTOR, 1)),
                List.of(new GenerateScenarioRequest.RecipeInput(
                        "rcp_pa101_v1",
                        "PA-101",
                        "REACT",
                        "Reaction Stage",
                        1,
                        120,
                        List.of("reactor_r01"),
                        "REACT_A"
                )),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "ord_pa101_001",
                        "PA-101",
                        "2",
                        960,
                        5,
                        null,
                        null
                )),
                List.of(),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4),
                List.of(new CreateScheduleJobRequest.InventoryBalanceInput("PA-101", 1, 0, 0))
        );

        var response = scenarioGenerationService.generate(request);

        assertThat(response.requestedDemandQuantity()).isEqualTo(2);
        assertThat(response.plannedDemandQuantity()).isEqualTo(1);
        assertThat(response.inventoryCoveredQuantity()).isEqualTo(1);
        assertThat(response.operationCount()).isEqualTo(1);
        assertThat(response.operations().getFirst().operationId()).isEqualTo("ord_pa101_001__u01__01_react");
        assertThat(response.scheduleRequest().tasks()).hasSize(1);
        assertThat(response.scheduleRequest().inventoryBalances()).hasSize(1);
        assertThat(response.scheduleRequest().inventoryDemands()).containsExactly(
                new CreateScheduleJobRequest.InventoryDemandInput("ord_pa101_001", "PA-101", 2, 960, 5)
        );
    }

    @Test
    void generateAllowsDemandToBeFullyCoveredByInventoryWithoutRecipe() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "scenario-covered",
                "dv-3",
                Instant.parse("2026-05-05T08:00:00Z"),
                1_440,
                List.of(new CreateScheduleJobRequest.ResourceInput("reactor_r01", "Reactor-R01", ResourceType.REACTOR, 1)),
                List.of(),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "ord_pa101_001",
                        "PA-101",
                        "1",
                        960,
                        5,
                        null,
                        null
                )),
                List.of(),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4),
                List.of(new CreateScheduleJobRequest.InventoryBalanceInput("PA-101", 1, 0, 0))
        );

        var response = scenarioGenerationService.generate(request);

        assertThat(response.operationCount()).isZero();
        assertThat(response.plannedDemandQuantity()).isZero();
        assertThat(response.inventoryCoveredQuantity()).isEqualTo(1);
        assertThat(response.scheduleRequest()).isNull();
        assertThat(response.demandCoverages().getFirst().inventoryCoveredQuantity()).isEqualTo(1);
    }

    @Test
    void generateRejectsDemandWithoutMatchingRecipe() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "scenario-a",
                "dv-1",
                Instant.parse("2026-05-05T08:00:00Z"),
                1_440,
                List.of(new CreateScheduleJobRequest.ResourceInput("reactor_r01", "Reactor-R01", ResourceType.REACTOR, 1)),
                List.of(new GenerateScenarioRequest.RecipeInput(
                        "rcp_pa101_v1",
                        "PA-101",
                        "REACT",
                        "Reaction Stage",
                        1,
                        480,
                        List.of("reactor_r01"),
                        "REACT_A"
                )),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "ord_missing",
                        "PA-404",
                        "1",
                        960,
                        5,
                        null,
                        null
                )),
                List.of(),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4)
        );

        assertThatThrownBy(() -> scenarioGenerationService.generate(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("unknown productCode");
    }

    @Test
    void generateCarriesRecipeMaterialFlowsIntoOperationsAndScheduleRequest() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "scenario-material-flow",
                "dv-4",
                Instant.parse("2026-05-05T08:00:00Z"),
                1_440,
                List.of(
                        new CreateScheduleJobRequest.ResourceInput("reactor_r01", "Reactor-R01", ResourceType.REACTOR, 1),
                        new CreateScheduleJobRequest.ResourceInput("pack_p01", "Pack-P01", ResourceType.OTHER, 2)
                ),
                List.of(
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_fg100_v1",
                                "FG-100",
                                "REACT",
                                "Reaction Stage",
                                1,
                                120,
                                List.of("reactor_r01"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("RM-100", 2)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("INT-100", 1)),
                                "REACT_A",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_fg100_v1",
                                "FG-100",
                                "PACK",
                                "Packaging",
                                2,
                                60,
                                List.of("pack_p01"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("INT-100", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FG-100", 1)),
                                "PACK_STD",
                                null,
                                null,
                                null,
                                null
                        )
                ),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "ord_fg100_001",
                        "FG-100",
                        "1",
                        480,
                        5,
                        null,
                        null
                )),
                List.of(),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4),
                List.of(new CreateScheduleJobRequest.InventoryBalanceInput("RM-100", 2, 0, 0))
        );

        var response = scenarioGenerationService.generate(request);

        assertThat(response.scheduleRequest().tasks().getFirst().materialInputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("RM-100", 2)
        );
        assertThat(response.scheduleRequest().tasks().getFirst().materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("INT-100", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(1).materialInputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("INT-100", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(1).materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("FG-100", 1)
        );
        assertThat(response.scheduleRequest().inventoryDemands()).containsExactly(
                new CreateScheduleJobRequest.InventoryDemandInput("ord_fg100_001", "FG-100", 1, 480, 5)
        );
    }

    @Test
    void generateExpandsSnowBeerMainChainIntoFourStageOperations() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "snow-beer-main-chain-phase3",
                "dv-snow-p3",
                Instant.parse("2026-12-24T00:00:00Z"),
                4_320,
                List.of(
                        new CreateScheduleJobRequest.ResourceInput("mash_k1", "糖化1锅", ResourceType.REACTOR, 1),
                        new CreateScheduleJobRequest.ResourceInput("ferm_t1", "发酵1罐", ResourceType.TANK, 2),
                        new CreateScheduleJobRequest.ResourceInput("filt_f1", "过滤1线", ResourceType.FILTER, 3),
                        new CreateScheduleJobRequest.ResourceInput("pack_l1", "包装1线", ResourceType.OTHER, 4)
                ),
                List.of(
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_main_p3",
                                "31015630002000000",
                                "SUGARIZATION",
                                "糖化",
                                1,
                                120,
                                List.of("mash_k1"),
                                List.of(
                                        new CreateScheduleJobRequest.MaterialQuantityInput("MALT_A_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("HOPS_A_LOT", 1)
                                ),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_A500_LOT", 1)),
                                "BREW_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_main_p3",
                                "31015630002000000",
                                "FERMENTATION",
                                "发酵",
                                2,
                                240,
                                List.of("ferm_t1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_A500_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FERMENTED_A500_LOT", 1)),
                                "FERM_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_main_p3",
                                "31015630002000000",
                                "FILTRATION",
                                "过滤",
                                3,
                                90,
                                List.of("filt_f1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FERMENTED_A500_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("BRIGHT_A500_LOT", 1)),
                                "FILT_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_main_p3",
                                "31015630002000000",
                                "PACKAGING",
                                "包装",
                                4,
                                150,
                                List.of("pack_l1"),
                                List.of(
                                        new CreateScheduleJobRequest.MaterialQuantityInput("BRIGHT_A500_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("CAP_A_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("CTN_A_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("LBL_A_LOT", 1)
                                ),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("31015630002000000", 1)),
                                "PKG_500",
                                null,
                                null,
                                null,
                                null
                        )
                ),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "dem_a500_spot_1224",
                        "31015630002000000",
                        "1",
                        720,
                        5,
                        null,
                        null
                )),
                List.of(),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 2, 1),
                new CreateScheduleJobRequest.SolverConfig(120, 4),
                List.of(
                        new CreateScheduleJobRequest.InventoryBalanceInput("MALT_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("HOPS_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("CAP_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("CTN_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("LBL_A_LOT", 1, 0, 0)
                )
        );

        var response = scenarioGenerationService.generate(request);

        assertThat(response.operationCount()).isEqualTo(4);
        assertThat(response.precedencePairCount()).isEqualTo(3);
        assertThat(response.operations()).extracting(operation -> operation.operationCode())
                .containsExactly("SUGARIZATION", "FERMENTATION", "FILTRATION", "PACKAGING");
        assertThat(response.operations().getFirst().predecessorOperationIds()).isEmpty();
        assertThat(response.operations().get(1).predecessorOperationIds()).containsExactly("dem_a500_spot_1224__01_sugarization");
        assertThat(response.operations().get(2).predecessorOperationIds()).containsExactly("dem_a500_spot_1224__02_fermentation");
        assertThat(response.operations().get(3).predecessorOperationIds()).containsExactly("dem_a500_spot_1224__03_filtration");
        assertThat(response.operations()).allMatch(operation -> operation.priority() == 5);
        assertThat(response.scheduleRequest().tasks()).hasSize(4);
        assertThat(response.scheduleRequest().tasks().getFirst().materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("WORT_A500_LOT", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(1).materialInputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("WORT_A500_LOT", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(2).materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("BRIGHT_A500_LOT", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(3).materialInputs()).contains(
                new CreateScheduleJobRequest.MaterialQuantityInput("BRIGHT_A500_LOT", 1),
                new CreateScheduleJobRequest.MaterialQuantityInput("CAP_A_LOT", 1)
        );
        assertThat(response.scheduleRequest().inventoryDemands()).containsExactly(
                new CreateScheduleJobRequest.InventoryDemandInput("dem_a500_spot_1224", "31015630002000000", 1, 720, 5)
        );
    }

    @Test
    void generateExpandsPhase4FullSuiteStyleScenarioWithMaterialsInventoryAndSetupRules() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "snow-beer-phase4-full-suite",
                "dv-snow-p4-full-suite",
                Instant.parse("2026-12-24T00:00:00Z"),
                5_760,
                List.of(
                        new CreateScheduleJobRequest.ResourceInput("mash_k1", "糖化1锅", ResourceType.REACTOR, 1),
                        new CreateScheduleJobRequest.ResourceInput("mash_k2", "糖化2锅", ResourceType.REACTOR, 2),
                        new CreateScheduleJobRequest.ResourceInput("ferm_t1", "发酵1罐", ResourceType.TANK, 3),
                        new CreateScheduleJobRequest.ResourceInput("ferm_t2", "发酵2罐", ResourceType.TANK, 4),
                        new CreateScheduleJobRequest.ResourceInput("mature_t1", "成熟1罐", ResourceType.TANK, 5),
                        new CreateScheduleJobRequest.ResourceInput("filt_f1", "过滤1线", ResourceType.FILTER, 6),
                        new CreateScheduleJobRequest.ResourceInput("bright_t1", "清酒1罐", ResourceType.TANK, 7),
                        new CreateScheduleJobRequest.ResourceInput("pack_l1", "包装1线", ResourceType.OTHER, 8)
                ),
                List.of(
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_phase4",
                                "31015630002000000",
                                "SUGARIZATION",
                                "糖化",
                                1,
                                120,
                                List.of("mash_k1", "mash_k2"),
                                List.of(
                                        new CreateScheduleJobRequest.MaterialQuantityInput("MALT_A_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("HOPS_A_LOT", 1)
                                ),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_A500_LOT", 1)),
                                "BREW_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_phase4",
                                "31015630002000000",
                                "FERMENTATION",
                                "发酵",
                                2,
                                480,
                                List.of("ferm_t1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_A500_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FERMENTED_A500_LOT", 1)),
                                "FERM_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_phase4",
                                "31015630002000000",
                                "MATURATION_WAIT",
                                "成熟等待",
                                3,
                                720,
                                List.of("mature_t1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FERMENTED_A500_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("MATURE_A500_LOT", 1)),
                                "MATURE_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_phase4",
                                "31015630002000000",
                                "FILTRATION",
                                "过滤",
                                4,
                                90,
                                List.of("filt_f1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("MATURE_A500_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FILTERED_A500_LOT", 1)),
                                "FILT_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_phase4",
                                "31015630002000000",
                                "BRIGHT_TRANSFER",
                                "清酒罐中转",
                                5,
                                60,
                                List.of("bright_t1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FILTERED_A500_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("BRIGHT_A500_LOT", 1)),
                                "BRIGHT_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_a500_phase4",
                                "31015630002000000",
                                "PACKAGING",
                                "包装",
                                6,
                                150,
                                List.of("pack_l1"),
                                List.of(
                                        new CreateScheduleJobRequest.MaterialQuantityInput("BRIGHT_A500_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("CAP_A_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("CTN_A_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("LBL_A_LOT", 1)
                                ),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("31015630002000000", 1)),
                                "PKG_500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_c700_phase4",
                                "31015670002000000",
                                "BREW_1",
                                "糖化第1锅",
                                1,
                                110,
                                List.of("mash_k1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("MALT_C_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_C700_BREW_1", 1)),
                                "BREW_C700",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_c700_phase4",
                                "31015670002000000",
                                "BREW_2",
                                "糖化第2锅",
                                2,
                                110,
                                List.of("mash_k2"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("MALT_C_LOT", 1)),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_C700_BREW_2", 1)),
                                "BREW_C700",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_c700_phase4",
                                "31015670002000000",
                                "FERMENTATION_FILL",
                                "满罐发酵",
                                3,
                                540,
                                List.of("ferm_t2"),
                                List.of(
                                        new CreateScheduleJobRequest.MaterialQuantityInput("WORT_C700_BREW_1", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("WORT_C700_BREW_2", 1)
                                ),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("FERMENTED_C700_LOT", 1)),
                                "FERM_C700",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_c700_phase4",
                                "31015670002000000",
                                "PACKAGING",
                                "包装",
                                4,
                                180,
                                List.of("pack_l1"),
                                List.of(
                                        new CreateScheduleJobRequest.MaterialQuantityInput("FERMENTED_C700_LOT", 1),
                                        new CreateScheduleJobRequest.MaterialQuantityInput("CAP_C_LOT", 1)
                                ),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("31015670002000000", 1)),
                                "PKG_700",
                                null,
                                null,
                                null,
                                null
                        )
                ),
                List.of(
                        new GenerateScenarioRequest.DemandInput(
                                "dem_a500_phase4_full",
                                "31015630002000000",
                                "1",
                                2_880,
                                6,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.DemandInput(
                                "dem_c700_phase4_full",
                                "31015670002000000",
                                "1",
                                3_600,
                                4,
                                null,
                                null
                        )
                ),
                List.of(),
                List.of(
                        new GenerateScenarioRequest.SetupRuleInput("PKG_500", "PKG_700", ResourceType.OTHER, "pack_l1", 45),
                        new GenerateScenarioRequest.SetupRuleInput("BREW_A500", "BREW_C700", ResourceType.REACTOR, null, 30)
                ),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 2, 1),
                new CreateScheduleJobRequest.SolverConfig(120, 4),
                List.of(
                        new CreateScheduleJobRequest.InventoryBalanceInput("MALT_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("HOPS_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("MALT_C_LOT", 2, 240, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("CAP_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("CAP_C_LOT", 1, 600, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("CTN_A_LOT", 1, 0, 0),
                        new CreateScheduleJobRequest.InventoryBalanceInput("LBL_A_LOT", 1, 0, 0)
                )
        );

        var response = scenarioGenerationService.generate(request);

        assertThat(response.operationCount()).isEqualTo(10);
        assertThat(response.precedencePairCount()).isEqualTo(9);
        assertThat(response.setupRuleCount()).isEqualTo(2);
        assertThat(response.inventoryBalanceCount()).isEqualTo(7);
        assertThat(response.scheduleRequest().tasks()).hasSize(10);
        assertThat(response.scheduleRequest().setupRules()).containsExactly(
                new CreateScheduleJobRequest.SetupRuleInput("PKG_500", "PKG_700", ResourceType.OTHER, "pack_l1", 45),
                new CreateScheduleJobRequest.SetupRuleInput("BREW_A500", "BREW_C700", ResourceType.REACTOR, null, 30)
        );
        assertThat(response.scheduleRequest().inventoryBalances()).contains(
                new CreateScheduleJobRequest.InventoryBalanceInput("MALT_C_LOT", 2, 240, 0),
                new CreateScheduleJobRequest.InventoryBalanceInput("CAP_C_LOT", 1, 600, 0)
        );
        assertThat(response.scheduleRequest().inventoryDemands()).containsExactly(
                new CreateScheduleJobRequest.InventoryDemandInput("dem_a500_phase4_full", "31015630002000000", 1, 2_880, 6),
                new CreateScheduleJobRequest.InventoryDemandInput("dem_c700_phase4_full", "31015670002000000", 1, 3_600, 4)
        );
        assertThat(response.operations()).extracting(operation -> operation.operationCode()).containsExactly(
                "SUGARIZATION",
                "FERMENTATION",
                "MATURATION_WAIT",
                "FILTRATION",
                "BRIGHT_TRANSFER",
                "PACKAGING",
                "BREW_1",
                "BREW_2",
                "FERMENTATION_FILL",
                "PACKAGING"
        );
        assertThat(response.operations().get(4).predecessorOperationIds())
                .containsExactly("dem_a500_phase4_full__04_filtration");
        assertThat(response.operations().get(5).predecessorOperationIds())
                .containsExactly("dem_a500_phase4_full__05_bright_transfer");
        assertThat(response.operations().get(8).predecessorOperationIds())
                .containsExactly("dem_c700_phase4_full__01_brew_1", "dem_c700_phase4_full__02_brew_2");
        assertThat(response.operations().get(9).predecessorOperationIds())
                .containsExactly("dem_c700_phase4_full__03_fermentation_fill");
        assertThat(response.scheduleRequest().tasks().get(4).materialInputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("FILTERED_A500_LOT", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(4).materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("BRIGHT_A500_LOT", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(8).materialInputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("WORT_C700_BREW_1", 1),
                new CreateScheduleJobRequest.MaterialQuantityInput("WORT_C700_BREW_2", 1)
        );
        assertThat(response.scheduleRequest().tasks().get(9).materialInputs()).contains(
                new CreateScheduleJobRequest.MaterialQuantityInput("FERMENTED_C700_LOT", 1),
                new CreateScheduleJobRequest.MaterialQuantityInput("CAP_C_LOT", 1)
        );
    }

    @Test
    void generateCarriesRecipeTankAndMixingFamilyIntoGeneratedTask() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "scenario-tank-mixing",
                "dv-tank-mixing",
                Instant.parse("2026-05-05T08:00:00Z"),
                1_440,
                List.of(new CreateScheduleJobRequest.ResourceInput("ferm_t1", "发酵1罐", ResourceType.TANK, 1)),
                List.of(new GenerateScenarioRequest.RecipeInput(
                        "rcp_fg500_v1",
                        "FG-500",
                        "FERMENTATION",
                        "发酵",
                        1,
                        240,
                        List.of("ferm_t1"),
                        List.of(),
                        List.of(),
                        "FERM_A500",
                        "ferm_t1",
                        "A500",

                        null,
                        null
                )),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "ord_fg500_001",
                        "FG-500",
                        "1",
                        480,
                        5,
                        null,
                        null
                )),
                List.of(),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4)
        );

        var response = scenarioGenerationService.generate(request);

        assertThat(response.scheduleRequest().tasks()).hasSize(1);
        assertThat(response.scheduleRequest().tasks().getFirst().tankId()).isEqualTo("ferm_t1");
        assertThat(response.scheduleRequest().tasks().getFirst().mixingFamily()).isEqualTo("A500");
    }

    @Test
    void generateCarriesRecipeLevelPinIntoGeneratedTask() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "scenario-recipe-pin",
                "dv-recipe-pin",
                Instant.parse("2026-05-05T08:00:00Z"),
                1_440,
                List.of(
                        new CreateScheduleJobRequest.ResourceInput("mash_k1", "糖化1锅", ResourceType.REACTOR, 1),
                        new CreateScheduleJobRequest.ResourceInput("ferm_t1", "发酵1罐", ResourceType.TANK, 2)
                ),
                List.of(
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_fg500_v1",
                                "FG-500",
                                "SUGARIZATION",
                                "糖化",
                                1,
                                120,
                                List.of("mash_k1"),
                                List.of(),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_LOT", 1)),
                                "BREW_A500",
                                null,
                                null,
                                null,
                                null
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_fg500_v1",
                                "FG-500",
                                "FERMENTATION",
                                "发酵",
                                2,
                                240,
                                List.of("ferm_t1"),
                                List.of(new CreateScheduleJobRequest.MaterialQuantityInput("WORT_LOT", 1)),
                                List.of(),
                                "FERM_A500",
                                null,
                                null,
                                "ferm_t1",
                                120
                        )
                ),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "ord_fg500_001",
                        "FG-500",
                        "1",
                        480,
                        5,
                        null,
                        null
                )),
                List.of(),
                List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4)
        );

        var response = scenarioGenerationService.generate(request);

        assertThat(response.scheduleRequest().tasks()).hasSize(2);
        var fermentationTask = response.scheduleRequest().tasks().get(1);
        assertThat(fermentationTask.pinnedResourceId()).isEqualTo("ferm_t1");
        assertThat(fermentationTask.pinnedStartMinutes()).isEqualTo(120);
    }

    private GenerateScenarioRequest baseRequest() {
        return new GenerateScenarioRequest(
                "uat-v1-chemical-plant-mvp",
                "uat_v1_2026_04_28",
                Instant.parse("2026-05-05T08:00:00Z"),
                10_080,
                List.of(
                        new CreateScheduleJobRequest.ResourceInput("reactor_r01", "Reactor-R01", ResourceType.REACTOR, 1),
                        new CreateScheduleJobRequest.ResourceInput("reactor_r02", "Reactor-R02", ResourceType.REACTOR, 2),
                        new CreateScheduleJobRequest.ResourceInput("filter_f01", "Filter-F01", ResourceType.FILTER, 3),
                        new CreateScheduleJobRequest.ResourceInput("dryer_d01", "Dryer-D01", ResourceType.DRYER, 4)
                ),
                List.of(
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_pa101_v1",
                                "PA-101",
                                "REACT",
                                "Reaction Stage",
                                1,
                                480,
                                List.of("reactor_r01", "reactor_r02"),
                                "REACT_A"
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_pa101_v1",
                                "PA-101",
                                "FILTER",
                                "Polish Filtration",
                                2,
                                240,
                                List.of("filter_f01"),
                                "FILT_STD"
                        ),
                        new GenerateScenarioRequest.RecipeInput(
                                "rcp_pa101_v1",
                                "PA-101",
                                "DRY",
                                "Final Drying",
                                3,
                                300,
                                List.of("dryer_d01"),
                                "DRY_STD"
                        )
                ),
                List.of(new GenerateScenarioRequest.DemandInput(
                        "ord_pa101_001",
                        "PA-101",
                        "1",
                        960,
                        5,
                        "reactor_r01",
                        60
                )),
                List.of(new CreateScheduleJobRequest.DowntimeInput(
                        "maint_reactor_r01_day1",
                        "reactor_r01",
                        240,
                        420,
                        "MAINTENANCE",
                        "CALENDAR",
                        "Preventive maintenance"
                )),
                List.of(new GenerateScenarioRequest.SetupRuleInput(
                        "REACT_A",
                        "FILT_STD",
                        ResourceType.REACTOR,
                        null,
                        60
                )),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 1),
                new CreateScheduleJobRequest.SolverConfig(120, 4)
        );
    }
}
