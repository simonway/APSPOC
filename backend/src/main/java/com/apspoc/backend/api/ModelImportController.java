package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.ImportBatchResponse;
import com.apspoc.backend.api.dto.ImportedDemandRowsResponse;
import com.apspoc.backend.api.dto.ImportedDowntimeRowsResponse;
import com.apspoc.backend.api.dto.ImportedInventoryBalanceRowsResponse;
import com.apspoc.backend.api.dto.ImportedRecipeRowsResponse;
import com.apspoc.backend.api.dto.ImportedResourceRowsResponse;
import com.apspoc.backend.api.dto.ImportedSetupRuleRowsResponse;
import com.apspoc.backend.api.dto.ImportedTaskRowsResponse;
import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.service.AuthService;
import com.apspoc.backend.service.ImportBatchService;
import com.apspoc.backend.service.ModelImportService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/model-import")
public class ModelImportController {

    private final AuthService authService;
    private final ImportBatchService importBatchService;
    private final ModelImportService modelImportService;

    public ModelImportController(
            AuthService authService,
            ImportBatchService importBatchService,
            ModelImportService modelImportService
    ) {
        this.authService = authService;
        this.importBatchService = importBatchService;
        this.modelImportService = modelImportService;
    }

    @PostMapping(value = "/resources", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportedResourceRowsResponse importResources(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dataVersion", required = false) String dataVersion,
            HttpSession session
    ) {
        var persisted = modelImportService.importResourcesBatch(
                file,
                dataVersion,
                authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER).username()
        );
        return ImportedResourceRowsResponse.from(persisted.batch(), persisted.rows());
    }

    @PostMapping(value = "/tasks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportedTaskRowsResponse importTasks(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dataVersion", required = false) String dataVersion,
            HttpSession session
    ) {
        var persisted = modelImportService.importTasksBatch(
                file,
                dataVersion,
                authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER).username()
        );
        return ImportedTaskRowsResponse.from(persisted.batch(), persisted.rows());
    }

    @PostMapping(value = "/recipes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportedRecipeRowsResponse importRecipes(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dataVersion", required = false) String dataVersion,
            HttpSession session
    ) {
        var persisted = modelImportService.importRecipesBatch(
                file,
                dataVersion,
                authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER).username()
        );
        return ImportedRecipeRowsResponse.from(persisted.batch(), persisted.rows());
    }

    @PostMapping(value = "/demands", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportedDemandRowsResponse importDemands(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dataVersion", required = false) String dataVersion,
            HttpSession session
    ) {
        var persisted = modelImportService.importDemandsBatch(
                file,
                dataVersion,
                authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER).username()
        );
        return ImportedDemandRowsResponse.from(persisted.batch(), persisted.rows());
    }

    @PostMapping(value = "/inventory-balances", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportedInventoryBalanceRowsResponse importInventoryBalances(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dataVersion", required = false) String dataVersion,
            HttpSession session
    ) {
        var persisted = modelImportService.importInventoryBalancesBatch(
                file,
                dataVersion,
                authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER).username()
        );
        return ImportedInventoryBalanceRowsResponse.from(persisted.batch(), persisted.rows());
    }

    @PostMapping(value = "/downtimes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportedDowntimeRowsResponse importDowntimes(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dataVersion", required = false) String dataVersion,
            HttpSession session
    ) {
        var persisted = modelImportService.importDowntimesBatch(
                file,
                dataVersion,
                authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER).username()
        );
        return ImportedDowntimeRowsResponse.from(persisted.batch(), persisted.rows());
    }

    @PostMapping(value = "/setup-rules", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportedSetupRuleRowsResponse importSetupRules(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "dataVersion", required = false) String dataVersion,
            HttpSession session
    ) {
        var persisted = modelImportService.importSetupRulesBatch(
                file,
                dataVersion,
                authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER).username()
        );
        return ImportedSetupRuleRowsResponse.from(persisted.batch(), persisted.rows());
    }

    @GetMapping("/batches/{importId}")
    public ImportBatchResponse getBatch(@PathVariable String importId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return importBatchService.getBatchResponse(importId);
    }

    @GetMapping("/batches/{importId}/errors")
    public ResponseEntity<byte[]> downloadBatchErrors(@PathVariable String importId, HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"%s-errors.csv\"".formatted(importId))
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(importBatchService.exportErrorReport(importId));
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> exportTemplate(HttpSession session) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aps_model_import_template.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(modelImportService.exportTemplateWorkbook());
    }
}
