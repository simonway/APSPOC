package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ModelImportServiceTest {

    private ModelImportService modelImportService;

    @BeforeEach
    void setUp() {
        modelImportService = new ModelImportService(new ObjectMapper());
    }

    @Test
    void importResourcesParsesCsvRowsWithCanonicalHeaders() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resources.csv",
                "text/csv",
                """
                id,label,resourceType,sortOrder
                reactor_01,Reactor-01,REACTOR,1
                reactor_02,Reactor-02,reactor,2
                """.getBytes(StandardCharsets.UTF_8)
        );

        var resources = modelImportService.importResources(file);

        assertThat(resources).hasSize(2);
        assertThat(resources.getFirst().id()).isEqualTo("reactor_01");
        assertThat(resources.get(1).resourceType().name()).isEqualTo("REACTOR");
        assertThat(resources.get(1).sortOrder()).isEqualTo(2);
    }

    @Test
    void importTasksParsesXlsxRowsAndJsonCandidateResources() throws IOException {
        byte[] workbookBytes;
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Tasks");
            var header = sheet.createRow(0);
            header.createCell(0).setCellValue("id");
            header.createCell(1).setCellValue("label");
            header.createCell(2).setCellValue("productCode");
            header.createCell(3).setCellValue("durationMinutes");
            header.createCell(4).setCellValue("dueMinutes");
            header.createCell(5).setCellValue("priority");
            header.createCell(6).setCellValue("candidateResourceIds");
            header.createCell(7).setCellValue("pinnedResourceId");
            header.createCell(8).setCellValue("pinnedStartMinutes");

            var row = sheet.createRow(1);
            row.createCell(0).setCellValue("batch_a");
            row.createCell(1).setCellValue("Batch A");
            row.createCell(2).setCellValue("PA-101");
            row.createCell(3).setCellValue(480);
            row.createCell(4).setCellValue(960);
            row.createCell(5).setCellValue(5);
            row.createCell(6).setCellValue("[\"reactor_01\",\"reactor_02\"]");
            row.createCell(7).setCellValue("reactor_01");
            row.createCell(8).setCellValue(120);

            workbook.write(output);
            workbookBytes = output.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "tasks.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                workbookBytes
        );

        var tasks = modelImportService.importTasks(file);

        assertThat(tasks).hasSize(1);
        assertThat(tasks.getFirst().candidateResourceIds()).containsExactly("reactor_01", "reactor_02");
        assertThat(tasks.getFirst().pinnedResourceId()).isEqualTo("reactor_01");
        assertThat(tasks.getFirst().pinnedStartMinutes()).isEqualTo(120);
    }

    @Test
    void importTasksRejectsMissingRequiredColumns() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "tasks.csv",
                "text/csv",
                """
                id,label,productCode,durationMinutes,dueMinutes,priority
                batch_a,Batch A,PA-101,480,960,5
                """.getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> modelImportService.importTasks(file))
                .isInstanceOf(ImportBatchValidationException.class)
                .satisfies(error -> {
                    ImportBatchValidationException validationException = (ImportBatchValidationException) error;
                    assertThat(validationException.getMessage()).contains("candidateResourceIds");
                    assertThat(validationException.errors()).hasSize(1);
                    assertThat(validationException.errors().getFirst().fieldName()).isEqualTo("candidateResourceIds");
                    assertThat(validationException.errors().getFirst().errorCode()).isEqualTo("MISSING_REQUIRED_COLUMN");
                });
    }

    @Test
    void importRecipesParsesCsvRowsWithMaterialFlowsAndSetupGroup() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "recipes.csv",
                "text/csv",
                """
                recipeId,productCode,operationCode,operationName,sequence,durationMinutes,candidateResourceIds,materialInputs,materialOutputs,setupGroup
                rcp_pa101_v1,PA-101,REACT,Reaction Stage,1,480,"reactor_r01,reactor_r02","RM_MONO_A:2|CAT_A:1","PA-101:1",REACT_A
                """.getBytes(StandardCharsets.UTF_8)
        );

        var recipes = modelImportService.importRecipes(file);

        assertThat(recipes).hasSize(1);
        assertThat(recipes.getFirst().recipeId()).isEqualTo("rcp_pa101_v1");
        assertThat(recipes.getFirst().candidateResourceIds()).containsExactly("reactor_r01", "reactor_r02");
        assertThat(recipes.getFirst().materialInputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("RM_MONO_A", 2),
                new CreateScheduleJobRequest.MaterialQuantityInput("CAT_A", 1)
        );
        assertThat(recipes.getFirst().materialOutputs()).containsExactly(
                new CreateScheduleJobRequest.MaterialQuantityInput("PA-101", 1)
        );
        assertThat(recipes.getFirst().setupGroup()).isEqualTo("REACT_A");
    }

    @Test
    void importDemandsParsesCsvRowsWithOptionalFixedFields() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "demands.csv",
                "text/csv",
                """
                demandId,productCode,quantity,dueMinutes,priority,fixedResourceId,fixedStartMinutes
                ord_pa101_001,PA-101,1,960,5,reactor_r01,60
                """.getBytes(StandardCharsets.UTF_8)
        );

        var demands = modelImportService.importDemands(file);

        assertThat(demands).hasSize(1);
        assertThat(demands.getFirst().demandId()).isEqualTo("ord_pa101_001");
        assertThat(demands.getFirst().quantity()).isEqualTo("1");
        assertThat(demands.getFirst().fixedResourceId()).isEqualTo("reactor_r01");
        assertThat(demands.getFirst().fixedStartMinutes()).isEqualTo(60);
    }

    @Test
    void importInventoryBalancesParsesCsvRowsWithDefaults() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "inventory-balances.csv",
                "text/csv",
                """
                itemCode,availableQuantity,availableFromMinutes,safetyStockQuantity
                PA-101,5,,1
                """.getBytes(StandardCharsets.UTF_8)
        );

        var inventoryBalances = modelImportService.importInventoryBalances(file);

        assertThat(inventoryBalances).hasSize(1);
        assertThat(inventoryBalances.getFirst().itemCode()).isEqualTo("PA-101");
        assertThat(inventoryBalances.getFirst().availableQuantity()).isEqualTo(5);
        assertThat(inventoryBalances.getFirst().availableFromMinutes()).isEqualTo(0);
        assertThat(inventoryBalances.getFirst().safetyStockQuantity()).isEqualTo(1);
    }

    @Test
    void importDowntimesParsesCsvRowsAndAppliesDefaults() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "downtimes.csv",
                "text/csv",
                """
                id,resourceId,startMinutes,endMinutes,downtimeType,source,description
                maintenance_a,reactor_01,240,420,MAINTENANCE,,
                """.getBytes(StandardCharsets.UTF_8)
        );

        var downtimes = modelImportService.importDowntimes(file);

        assertThat(downtimes).hasSize(1);
        assertThat(downtimes.getFirst().id()).isEqualTo("maintenance_a");
        assertThat(downtimes.getFirst().resourceId()).isEqualTo("reactor_01");
        assertThat(downtimes.getFirst().source()).isEqualTo("MANUAL");
        assertThat(downtimes.getFirst().description()).isEmpty();
    }

    @Test
    void importDowntimesAcceptsHeaderOnlyCsvAsEmptyOptionalSection() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "downtimes.csv",
                "text/csv",
                "id,resourceId,startMinutes,endMinutes,downtimeType,source,description\n".getBytes(StandardCharsets.UTF_8)
        );

        var downtimes = modelImportService.importDowntimes(file);

        assertThat(downtimes).isEmpty();
    }

    @Test
    void importSetupRulesParsesCsvRowsWithOptionalScope() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "setup-rules.csv",
                "text/csv",
                """
                fromSetupGroup,toSetupGroup,resourceType,resourceId,setupMinutes
                REACT_A,REACT_B,REACTOR,,60
                """.getBytes(StandardCharsets.UTF_8)
        );

        var setupRules = modelImportService.importSetupRules(file);

        assertThat(setupRules).hasSize(1);
        assertThat(setupRules.getFirst().fromSetupGroup()).isEqualTo("REACT_A");
        assertThat(setupRules.getFirst().resourceType()).isNotNull();
        assertThat(setupRules.getFirst().resourceType().name()).isEqualTo("REACTOR");
        assertThat(setupRules.getFirst().setupMinutes()).isEqualTo(60);
    }

    @Test
    void exportTemplateWorkbookIncludesExpectedSheetsAndHeaders() throws IOException {
        byte[] workbookBytes = modelImportService.exportTemplateWorkbook();

        try (var workbook = WorkbookFactory.create(new ByteArrayInputStream(workbookBytes))) {
            assertThat(workbook.getSheet("Resources")).isNotNull();
            assertThat(workbook.getSheet("Tasks")).isNotNull();
            assertThat(workbook.getSheet("Recipes")).isNotNull();
            assertThat(workbook.getSheet("Demands")).isNotNull();
            assertThat(workbook.getSheet("InventoryBalances")).isNotNull();
            assertThat(workbook.getSheet("Downtimes")).isNotNull();
            assertThat(workbook.getSheet("SetupRules")).isNotNull();
            assertThat(workbook.getSheet("README")).isNotNull();

            var resourcesHeader = workbook.getSheet("Resources").getRow(0);
            var tasksHeader = workbook.getSheet("Tasks").getRow(0);
            var recipesHeader = workbook.getSheet("Recipes").getRow(0);
            var demandsHeader = workbook.getSheet("Demands").getRow(0);
            var inventoryBalancesHeader = workbook.getSheet("InventoryBalances").getRow(0);
            var downtimesHeader = workbook.getSheet("Downtimes").getRow(0);
            var setupRulesHeader = workbook.getSheet("SetupRules").getRow(0);

            assertThat(resourcesHeader.getCell(0).getStringCellValue()).isEqualTo("id");
            assertThat(resourcesHeader.getCell(2).getStringCellValue()).isEqualTo("resourceType");
            assertThat(tasksHeader.getCell(6).getStringCellValue()).isEqualTo("candidateResourceIds");
            assertThat(recipesHeader.getCell(0).getStringCellValue()).isEqualTo("recipeId");
            assertThat(recipesHeader.getCell(7).getStringCellValue()).isEqualTo("materialInputs");
            assertThat(recipesHeader.getCell(8).getStringCellValue()).isEqualTo("materialOutputs");
            assertThat(demandsHeader.getCell(5).getStringCellValue()).isEqualTo("fixedResourceId");
            assertThat(inventoryBalancesHeader.getCell(1).getStringCellValue()).isEqualTo("availableQuantity");
            assertThat(downtimesHeader.getCell(4).getStringCellValue()).isEqualTo("downtimeType");
            assertThat(setupRulesHeader.getCell(4).getStringCellValue()).isEqualTo("setupMinutes");
        }
    }

    @Test
    void importTasksParsesGb18030CsvRowsWithChineseLabels() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "tasks.csv",
                "text/csv",
                """
                id,label,productCode,durationMinutes,dueMinutes,priority,candidateResourceIds,pinnedResourceId,pinnedStartMinutes
                dem_10a500_1229__u04__01_pack,dem_10a500_1229 / U04 / 包装,PKG_500,150,7920,3,"pack_l1,pack_l2,pack_l3",,
                """.getBytes(Charset.forName("GB18030"))
        );

        var tasks = modelImportService.importTasks(file);

        assertThat(tasks).hasSize(1);
        assertThat(tasks.getFirst().label()).isEqualTo("dem_10a500_1229 / U04 / 包装");
    }

    @Test
    void importResourcesParsesUtf8BomCsvRows() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resources.csv",
                "text/csv",
                ("\uFEFFid,label,resourceType,sortOrder\nreactor_01,包装1线,OTHER,1\n").getBytes(StandardCharsets.UTF_8)
        );

        var resources = modelImportService.importResources(file);

        assertThat(resources).hasSize(1);
        assertThat(resources.getFirst().label()).isEqualTo("包装1线");
    }
}
