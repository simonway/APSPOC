package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.GenerateScenarioFromImportBatchesRequest;
import com.apspoc.backend.api.dto.GenerateScenarioRequest;
import com.apspoc.backend.api.dto.GeneratedScenarioFromImportBatchesResponse;
import com.apspoc.backend.api.dto.GeneratedScenarioResponse;
import com.apspoc.backend.api.dto.ImportedDemandRow;
import com.apspoc.backend.api.dto.ImportedRecipeRow;
import com.apspoc.backend.api.dto.ImportedSetupRuleRow;
import com.apspoc.backend.domain.ImportBatch;
import com.apspoc.backend.domain.ImportBatchKind;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ImportBatchScenarioService {

    private final ImportBatchService importBatchService;
    private final ScenarioGenerationService scenarioGenerationService;
    private final ScenarioPersistenceService scenarioPersistenceService;

    public ImportBatchScenarioService(
            ImportBatchService importBatchService,
            ScenarioGenerationService scenarioGenerationService,
            ScenarioPersistenceService scenarioPersistenceService
    ) {
        this.importBatchService = importBatchService;
        this.scenarioGenerationService = scenarioGenerationService;
        this.scenarioPersistenceService = scenarioPersistenceService;
    }

    public GeneratedScenarioFromImportBatchesResponse generate(GenerateScenarioFromImportBatchesRequest request) {
        ImportBatch resourcesBatch = requireBatch(request.dataVersion(), ImportBatchKind.RESOURCE);
        ImportBatch recipesBatch = requireBatch(request.dataVersion(), ImportBatchKind.RECIPE);
        ImportBatch demandsBatch = requireBatch(request.dataVersion(), ImportBatchKind.DEMAND);
        ImportBatch inventoryBalancesBatch = importBatchService.findLatestValidatedBatch(request.dataVersion(), ImportBatchKind.INVENTORY_BALANCE).orElse(null);
        ImportBatch downtimesBatch = importBatchService.findLatestValidatedBatch(request.dataVersion(), ImportBatchKind.DOWNTIME).orElse(null);
        ImportBatch setupRulesBatch = importBatchService.findLatestValidatedBatch(request.dataVersion(), ImportBatchKind.SETUP_RULE).orElse(null);

        GenerateScenarioRequest inlineRequest = new GenerateScenarioRequest(
                request.scenarioName(),
                request.dataVersion(),
                request.scheduleStartAt(),
                request.horizonMinutes(),
                importBatchService.readRows(resourcesBatch, CreateScheduleJobRequest.ResourceInput.class),
                importBatchService.readRows(recipesBatch, ImportedRecipeRow.class).stream()
                        .map(row -> new GenerateScenarioRequest.RecipeInput(
                                row.recipeId(),
                                row.productCode(),
                                row.operationCode(),
                                row.operationName(),
                                row.sequence(),
                                row.durationMinutes(),
                                row.candidateResourceIds(),
                                row.materialInputs(),
                                row.materialOutputs(),
                                row.setupGroup()
                        ))
                        .toList(),
                importBatchService.readRows(demandsBatch, ImportedDemandRow.class).stream()
                        .map(row -> new GenerateScenarioRequest.DemandInput(
                                row.demandId(),
                                row.productCode(),
                                row.quantity(),
                                row.dueMinutes(),
                                row.priority(),
                                row.fixedResourceId(),
                                row.fixedStartMinutes()
                        ))
                        .toList(),
                downtimesBatch == null ? List.of() : importBatchService.readRows(downtimesBatch, CreateScheduleJobRequest.DowntimeInput.class),
                setupRulesBatch == null ? List.of() : importBatchService.readRows(setupRulesBatch, ImportedSetupRuleRow.class).stream()
                        .map(row -> new GenerateScenarioRequest.SetupRuleInput(
                                row.fromSetupGroup(),
                                row.toSetupGroup(),
                                row.resourceType(),
                                row.resourceId(),
                                row.setupMinutes()
                        ))
                        .toList(),
                request.objectiveWeights(),
                request.solverConfig(),
                inventoryBalancesBatch == null ? List.of() : importBatchService.readRows(inventoryBalancesBatch, CreateScheduleJobRequest.InventoryBalanceInput.class)
        );

        Map<String, String> sourceImportBatchIds = new LinkedHashMap<>();
        sourceImportBatchIds.put("resources", resourcesBatch.importId());
        sourceImportBatchIds.put("recipes", recipesBatch.importId());
        sourceImportBatchIds.put("demands", demandsBatch.importId());
        if (inventoryBalancesBatch != null) {
            sourceImportBatchIds.put("inventoryBalances", inventoryBalancesBatch.importId());
        }
        if (downtimesBatch != null) {
            sourceImportBatchIds.put("downtimes", downtimesBatch.importId());
        }
        if (setupRulesBatch != null) {
            sourceImportBatchIds.put("setupRules", setupRulesBatch.importId());
        }
        GeneratedScenarioResponse scenario = scenarioPersistenceService.save(
                scenarioGenerationService.generate(inlineRequest),
                Map.copyOf(sourceImportBatchIds)
        );
        importBatchService.markScenarioGenerated(sourceImportBatchIds.values());
        return new GeneratedScenarioFromImportBatchesResponse(request.dataVersion(), Map.copyOf(sourceImportBatchIds), scenario);
    }

    private ImportBatch requireBatch(String dataVersion, ImportBatchKind importType) {
        return importBatchService.findLatestValidatedBatch(dataVersion, importType)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Missing validated import batch for dataVersion `%s` and importType `%s`".formatted(dataVersion, importType.name())
                ));
    }
}
