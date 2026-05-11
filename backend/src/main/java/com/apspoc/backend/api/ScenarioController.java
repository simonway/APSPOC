package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.GenerateScenarioFromImportBatchesRequest;
import com.apspoc.backend.api.dto.GenerateScenarioRequest;
import com.apspoc.backend.api.dto.GeneratedScenarioFromImportBatchesResponse;
import com.apspoc.backend.api.dto.GeneratedScenarioResponse;
import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.service.AuthService;
import com.apspoc.backend.service.ImportBatchScenarioService;
import com.apspoc.backend.service.ScenarioGenerationService;
import com.apspoc.backend.service.ScenarioPersistenceService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/schedule/scenarios")
public class ScenarioController {

    private final AuthService authService;
    private final ImportBatchScenarioService importBatchScenarioService;
    private final ScenarioGenerationService scenarioGenerationService;
    private final ScenarioPersistenceService scenarioPersistenceService;

    public ScenarioController(
            AuthService authService,
            ImportBatchScenarioService importBatchScenarioService,
            ScenarioGenerationService scenarioGenerationService,
            ScenarioPersistenceService scenarioPersistenceService
    ) {
        this.authService = authService;
        this.importBatchScenarioService = importBatchScenarioService;
        this.scenarioGenerationService = scenarioGenerationService;
        this.scenarioPersistenceService = scenarioPersistenceService;
    }

    @PostMapping
    public GeneratedScenarioResponse generate(@Valid @RequestBody GenerateScenarioRequest request, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return scenarioPersistenceService.save(scenarioGenerationService.generate(request), java.util.Map.of());
    }

    @PostMapping("/from-import-batches")
    public GeneratedScenarioFromImportBatchesResponse generateFromImportBatches(
            @Valid @RequestBody GenerateScenarioFromImportBatchesRequest request,
            HttpSession session
    ) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return importBatchScenarioService.generate(request);
    }

    @GetMapping("/{scenarioId}")
    public GeneratedScenarioResponse getScenario(@PathVariable String scenarioId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return scenarioPersistenceService.getScenario(scenarioId);
    }
}
