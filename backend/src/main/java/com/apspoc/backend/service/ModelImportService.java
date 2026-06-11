package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.ImportBatchErrorDetail;
import com.apspoc.backend.api.dto.ImportedDemandRow;
import com.apspoc.backend.api.dto.ImportedRecipeRow;
import com.apspoc.backend.api.dto.ImportedSetupRuleRow;
import com.apspoc.backend.domain.ImportBatchKind;
import com.apspoc.backend.domain.ResourceType;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.Charset;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ModelImportService {
    private static final List<Charset> CSV_CHARSETS = List.of(
            StandardCharsets.UTF_8,
            Charset.forName("GB18030"),
            Charset.forName("GBK")
    );

    private static final Map<String, Set<String>> RESOURCE_HEADER_ALIASES = Map.of(
            "id", Set.of("id", "标识", "资源编号", "资源id", "资源唯一标识"),
            "label", Set.of("label", "name", "名称", "资源名称"),
            "resourceType", Set.of("resourcetype", "type", "类型", "资源类型"),
            "sortOrder", Set.of("sortorder", "sort", "排序", "排序号", "顺序")
    );
    private static final Map<String, Set<String>> TASK_HEADER_ALIASES = Map.ofEntries(
            Map.entry("id", Set.of("id", "标识", "任务编号", "任务id", "任务唯一标识")),
            Map.entry("label", Set.of("label", "name", "名称", "任务名称")),
            Map.entry("productCode", Set.of("productcode", "product", "产品", "产品编码")),
            Map.entry("durationMinutes", Set.of("durationminutes", "duration", "时长", "持续时长", "任务持续时长分钟", "任务持续时长")),
            Map.entry("dueMinutes", Set.of("dueminutes", "due", "截止分钟", "交期")),
            Map.entry("priority", Set.of("priority", "优先级")),
            Map.entry("candidateResourceIds", Set.of("candidateresourceids", "candidateresources", "candidates", "候选资源", "候选资源列表")),
            Map.entry("pinnedResourceId", Set.of("pinnedresourceid", "pinnedresource", "固定资源", "锁定资源")),
            Map.entry("pinnedStartMinutes", Set.of("pinnedstartminutes", "pinnedstart", "固定开始分钟", "锁定开始分钟", "锁定开始")),
            Map.entry("predecessorTaskIds", Set.of("predecessortaskids", "predecessors", "precedence", "前置任务", "前置任务列表")),
            Map.entry("setupGroup", Set.of("setupgroup", "setup", "换型组", "换型分组"))
    );
    private static final Map<String, Set<String>> RECIPE_HEADER_ALIASES = Map.of(
            "recipeId", Set.of("recipeid", "recipe", "工艺路线编号", "配方编号", "路线编号"),
            "productCode", Set.of("productcode", "product", "产品", "产品编码"),
            "operationCode", Set.of("operationcode", "operation", "工序编码", "工序"),
            "operationName", Set.of("operationname", "operationlabel", "工序名称", "工序名"),
            "sequence", Set.of("sequence", "seq", "顺序", "工序顺序"),
            "durationMinutes", Set.of("durationminutes", "duration", "时长", "持续时长", "标准工时", "工时分钟"),
            "candidateResourceIds", Set.of("candidateresourceids", "candidateresources", "candidates", "候选资源", "候选资源列表", "可用设备"),
            "materialInputs", Set.of("materialinputs", "inputs", "inputmaterials", "投入物料", "投料", "输入物料"),
            "materialOutputs", Set.of("materialoutputs", "outputs", "outputmaterials", "产出物料", "产出", "输出物料"),
            "setupGroup", Set.of("setupgroup", "setup", "换型组", "换型分组")
    );
    private static final Map<String, Set<String>> DEMAND_HEADER_ALIASES = Map.of(
            "demandId", Set.of("demandid", "demand", "订单号", "需求号", "需求编号", "订单编号"),
            "productCode", Set.of("productcode", "product", "产品", "产品编码"),
            "quantity", Set.of("quantity", "qty", "数量", "批量"),
            "dueMinutes", Set.of("dueminutes", "due", "交期", "截止分钟", "交期分钟"),
            "priority", Set.of("priority", "优先级", "重要度"),
            "fixedResourceId", Set.of("fixedresourceid", "fixedresource", "固定设备", "固定资源", "锁定资源"),
            "fixedStartMinutes", Set.of("fixedstartminutes", "fixedstart", "固定开始", "固定开始分钟", "锁定开始")
    );
    private static final Map<String, Set<String>> INVENTORY_BALANCE_HEADER_ALIASES = Map.of(
            "itemCode", Set.of("itemcode", "item", "product", "产品", "产品编码", "物料编码"),
            "availableQuantity", Set.of("availablequantity", "quantity", "onhand", "on_hand", "available", "期初库存", "可用库存"),
            "availableFromMinutes", Set.of("availablefromminutes", "availablefrom", "releaseat", "可用开始分钟", "库存可用分钟"),
            "safetyStockQuantity", Set.of("safetystockquantity", "safetystock", "safety", "安全库存")
    );
    private static final Map<String, Set<String>> DOWNTIME_HEADER_ALIASES = Map.of(
            "id", Set.of("id", "标识", "停机编号", "停机id", "停机唯一标识"),
            "resourceId", Set.of("resourceid", "resource", "资源", "资源编号", "关联资源编号"),
            "startMinutes", Set.of("startminutes", "start", "开始分钟", "停机开始分钟"),
            "endMinutes", Set.of("endminutes", "end", "结束分钟", "停机结束分钟"),
            "downtimeType", Set.of("downtimetype", "type", "停机类型", "类型"),
            "source", Set.of("source", "来源", "停机来源"),
            "description", Set.of("description", "desc", "说明", "备注", "停机说明")
    );
    private static final Map<String, Set<String>> SETUP_RULE_HEADER_ALIASES = Map.of(
            "fromSetupGroup", Set.of("fromsetupgroup", "fromgroup", "前一换型组", "前置换型组"),
            "toSetupGroup", Set.of("tosetupgroup", "togroup", "后一换型组", "后置换型组"),
            "resourceType", Set.of("resourcetype", "type", "资源类型", "适用资源类型"),
            "resourceId", Set.of("resourceid", "resource", "资源", "资源编号", "适用资源"),
            "setupMinutes", Set.of("setupminutes", "setup", "换型时间", "换型时长", "切换分钟")
    );
    private static final Map<String, Map<String, Set<String>>> HEADER_ALIASES_BY_TYPE = Map.of(
            "resource", RESOURCE_HEADER_ALIASES,
            "task", TASK_HEADER_ALIASES,
            "recipe", RECIPE_HEADER_ALIASES,
            "demand", DEMAND_HEADER_ALIASES,
            "inventoryBalance", INVENTORY_BALANCE_HEADER_ALIASES,
            "downtime", DOWNTIME_HEADER_ALIASES,
            "setupRule", SETUP_RULE_HEADER_ALIASES
    );
    private static final List<String> RESOURCE_TEMPLATE_HEADERS = List.of("id", "label", "resourceType", "sortOrder");
    private static final List<String> TASK_TEMPLATE_HEADERS = List.of(
            "id",
            "label",
            "productCode",
            "durationMinutes",
            "dueMinutes",
            "priority",
            "candidateResourceIds",
            "pinnedResourceId",
            "pinnedStartMinutes",
            "predecessorTaskIds",
            "setupGroup"
    );
    private static final List<String> RECIPE_TEMPLATE_HEADERS = List.of(
            "recipeId",
            "productCode",
            "operationCode",
            "operationName",
            "sequence",
            "durationMinutes",
            "candidateResourceIds",
            "materialInputs",
            "materialOutputs",
            "setupGroup"
    );
    private static final List<String> DEMAND_TEMPLATE_HEADERS = List.of(
            "demandId",
            "productCode",
            "quantity",
            "dueMinutes",
            "priority",
            "fixedResourceId",
            "fixedStartMinutes"
    );
    private static final List<String> INVENTORY_BALANCE_TEMPLATE_HEADERS = List.of(
            "itemCode",
            "availableQuantity",
            "availableFromMinutes",
            "safetyStockQuantity"
    );
    private static final List<String> DOWNTIME_TEMPLATE_HEADERS = List.of(
            "id",
            "resourceId",
            "startMinutes",
            "endMinutes",
            "downtimeType",
            "source",
            "description"
    );
    private static final List<String> SETUP_RULE_TEMPLATE_HEADERS = List.of(
            "fromSetupGroup",
            "toSetupGroup",
            "resourceType",
            "resourceId",
            "setupMinutes"
    );

    private final ObjectMapper objectMapper;
    private final ImportBatchService importBatchService;
    private final DataFormatter dataFormatter = new DataFormatter();

    @Autowired
    public ModelImportService(ObjectMapper objectMapper, ImportBatchService importBatchService) {
        this.objectMapper = objectMapper;
        this.importBatchService = importBatchService;
    }

    ModelImportService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.importBatchService = null;
    }

    public List<CreateScheduleJobRequest.ResourceInput> importResources(MultipartFile file) {
        RowData rows = readRows(file);
        validateRequiredHeaders(rows.sheetName(), rows.headerMap(), List.of("id", "label", "resourceType", "sortOrder"), "resource");

        List<CreateScheduleJobRequest.ResourceInput> resources = new ArrayList<>();
        for (int index = 0; index < rows.rows().size(); index++) {
            Map<String, String> row = rows.rows().get(index);
            int lineNumber = index + 2;
            resources.add(new CreateScheduleJobRequest.ResourceInput(
                    requireValue(rows.sheetName(), row, "id", "resource", lineNumber),
                    requireValue(rows.sheetName(), row, "label", "resource", lineNumber),
                    parseResourceType(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "resourceType", "resource", lineNumber),
                            "resource",
                            lineNumber
                    ),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "sortOrder", "resource", lineNumber),
                            "sortOrder",
                            "resource",
                            lineNumber,
                            true
                    )
            ));
        }

        if (resources.isEmpty()) {
            throw validationError(
                    rows.sheetName(),
                    1,
                    null,
                    null,
                    "NO_DATA_ROWS",
                    "The resource import file does not contain any data rows",
                    "Add at least one resource row below the header."
            );
        }
        return resources;
    }

    public List<CreateScheduleJobRequest.TaskInput> importTasks(MultipartFile file) {
        RowData rows = readRows(file);
        validateRequiredHeaders(
                rows.sheetName(),
                rows.headerMap(),
                List.of("id", "label", "productCode", "durationMinutes", "dueMinutes", "priority", "candidateResourceIds"),
                "task"
        );

        List<CreateScheduleJobRequest.TaskInput> tasks = new ArrayList<>();
        for (int index = 0; index < rows.rows().size(); index++) {
            Map<String, String> row = rows.rows().get(index);
            int lineNumber = index + 2;
            String pinnedResourceId = optionalValue(row, "pinnedResourceId", "task");
            Integer pinnedStartMinutes = parseOptionalInteger(
                    rows.sheetName(),
                    optionalValue(row, "pinnedStartMinutes", "task"),
                    "pinnedStartMinutes",
                    "task",
                    lineNumber,
                    true
            );
            List<String> predecessorTaskIds = parseOptionalStringList(optionalValue(row, "predecessorTaskIds", "task"));

            tasks.add(new CreateScheduleJobRequest.TaskInput(
                    requireValue(rows.sheetName(), row, "id", "task", lineNumber),
                    requireValue(rows.sheetName(), row, "label", "task", lineNumber),
                    requireValue(rows.sheetName(), row, "productCode", "task", lineNumber),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "durationMinutes", "task", lineNumber),
                            "durationMinutes",
                            "task",
                            lineNumber,
                            false
                    ),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "dueMinutes", "task", lineNumber),
                            "dueMinutes",
                            "task",
                            lineNumber,
                            false
                    ),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "priority", "task", lineNumber),
                            "priority",
                            "task",
                            lineNumber,
                            false
                    ),
                    parseCandidateResourceIds(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "candidateResourceIds", "task", lineNumber),
                            "task",
                            lineNumber
                    ),
                    pinnedResourceId,
                    pinnedStartMinutes,
                    predecessorTaskIds,
                    optionalValue(row, "setupGroup", "task")
            ));
        }

        if (tasks.isEmpty()) {
            throw validationError(
                    rows.sheetName(),
                    1,
                    null,
                    null,
                    "NO_DATA_ROWS",
                    "The task import file does not contain any data rows",
                    "Add at least one task row below the header."
            );
        }
        return tasks;
    }

    public ImportBatchService.PersistedImportRows<CreateScheduleJobRequest.ResourceInput> importResourcesBatch(
            MultipartFile file,
            String dataVersion,
            String importedBy
    ) {
        return persistImportedBatch(ImportBatchKind.RESOURCE, file, dataVersion, importedBy, this::importResources);
    }

    public ImportBatchService.PersistedImportRows<CreateScheduleJobRequest.TaskInput> importTasksBatch(
            MultipartFile file,
            String dataVersion,
            String importedBy
    ) {
        return persistImportedBatch(ImportBatchKind.TASK, file, dataVersion, importedBy, this::importTasks);
    }

    public List<ImportedRecipeRow> importRecipes(MultipartFile file) {
        RowData rows = readRows(file);
        validateRequiredHeaders(
                rows.sheetName(),
                rows.headerMap(),
                List.of("recipeId", "productCode", "operationCode", "operationName", "sequence", "durationMinutes", "candidateResourceIds"),
                "recipe"
        );

        List<ImportedRecipeRow> recipes = new ArrayList<>();
        for (int index = 0; index < rows.rows().size(); index++) {
            Map<String, String> row = rows.rows().get(index);
            int lineNumber = index + 2;
            recipes.add(new ImportedRecipeRow(
                    requireValue(rows.sheetName(), row, "recipeId", "recipe", lineNumber),
                    requireValue(rows.sheetName(), row, "productCode", "recipe", lineNumber),
                    requireValue(rows.sheetName(), row, "operationCode", "recipe", lineNumber),
                    requireValue(rows.sheetName(), row, "operationName", "recipe", lineNumber),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "sequence", "recipe", lineNumber),
                            "sequence",
                            "recipe",
                            lineNumber,
                            false
                    ),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "durationMinutes", "recipe", lineNumber),
                            "durationMinutes",
                            "recipe",
                            lineNumber,
                            false
                    ),
                    parseCandidateResourceIds(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "candidateResourceIds", "recipe", lineNumber),
                            "recipe",
                            lineNumber
                    ),
                    parseMaterialQuantityList(
                            rows.sheetName(),
                            optionalValue(row, "materialInputs", "recipe"),
                            "materialInputs",
                            "recipe",
                            lineNumber
                    ),
                    parseMaterialQuantityList(
                            rows.sheetName(),
                            optionalValue(row, "materialOutputs", "recipe"),
                            "materialOutputs",
                            "recipe",
                            lineNumber
                    ),
                    optionalValue(row, "setupGroup", "recipe")
            ));
        }

        if (recipes.isEmpty()) {
            throw validationError(
                    rows.sheetName(),
                    1,
                    null,
                    null,
                    "NO_DATA_ROWS",
                    "The recipe import file does not contain any data rows",
                    "Add at least one recipe row below the header."
            );
        }
        return recipes;
    }

    public List<ImportedDemandRow> importDemands(MultipartFile file) {
        RowData rows = readRows(file);
        validateRequiredHeaders(
                rows.sheetName(),
                rows.headerMap(),
                List.of("demandId", "productCode", "dueMinutes", "priority"),
                "demand"
        );

        List<ImportedDemandRow> demands = new ArrayList<>();
        for (int index = 0; index < rows.rows().size(); index++) {
            Map<String, String> row = rows.rows().get(index);
            int lineNumber = index + 2;
            demands.add(new ImportedDemandRow(
                    requireValue(rows.sheetName(), row, "demandId", "demand", lineNumber),
                    requireValue(rows.sheetName(), row, "productCode", "demand", lineNumber),
                    optionalValue(row, "quantity", "demand"),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "dueMinutes", "demand", lineNumber),
                            "dueMinutes",
                            "demand",
                            lineNumber,
                            true
                    ),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "priority", "demand", lineNumber),
                            "priority",
                            "demand",
                            lineNumber,
                            false
                    ),
                    optionalValue(row, "fixedResourceId", "demand"),
                    parseOptionalInteger(
                            rows.sheetName(),
                            optionalValue(row, "fixedStartMinutes", "demand"),
                            "fixedStartMinutes",
                            "demand",
                            lineNumber,
                            true
                    )
            ));
        }

        if (demands.isEmpty()) {
            throw validationError(
                    rows.sheetName(),
                    1,
                    null,
                    null,
                    "NO_DATA_ROWS",
                    "The demand import file does not contain any data rows",
                    "Add at least one demand row below the header."
            );
        }
        return demands;
    }

    public List<CreateScheduleJobRequest.InventoryBalanceInput> importInventoryBalances(MultipartFile file) {
        RowData rows = readRows(file);
        validateRequiredHeaders(
                rows.sheetName(),
                rows.headerMap(),
                List.of("itemCode", "availableQuantity"),
                "inventoryBalance"
        );

        List<CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalances = new ArrayList<>();
        for (int index = 0; index < rows.rows().size(); index++) {
            Map<String, String> row = rows.rows().get(index);
            int lineNumber = index + 2;
            inventoryBalances.add(new CreateScheduleJobRequest.InventoryBalanceInput(
                    requireValue(rows.sheetName(), row, "itemCode", "inventory balance", lineNumber),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "availableQuantity", "inventory balance", lineNumber),
                            "availableQuantity",
                            "inventory balance",
                            lineNumber,
                            true
                    ),
                    parseOptionalInteger(
                            rows.sheetName(),
                            optionalValue(row, "availableFromMinutes", "inventoryBalance"),
                            "availableFromMinutes",
                            "inventory balance",
                            lineNumber,
                            true
                    ),
                    parseOptionalInteger(
                            rows.sheetName(),
                            optionalValue(row, "safetyStockQuantity", "inventoryBalance"),
                            "safetyStockQuantity",
                            "inventory balance",
                            lineNumber,
                            true
                    )
            ));
        }

        if (inventoryBalances.isEmpty()) {
            throw validationError(
                    rows.sheetName(),
                    1,
                    null,
                    null,
                    "NO_DATA_ROWS",
                    "The inventory balance import file does not contain any data rows",
                    "Add at least one inventory balance row below the header."
            );
        }
        return inventoryBalances;
    }

    public ImportBatchService.PersistedImportRows<CreateScheduleJobRequest.InventoryBalanceInput> importInventoryBalancesBatch(
            MultipartFile file,
            String dataVersion,
            String importedBy
    ) {
        return persistImportedBatch(ImportBatchKind.INVENTORY_BALANCE, file, dataVersion, importedBy, this::importInventoryBalances);
    }

    public ImportBatchService.PersistedImportRows<ImportedRecipeRow> importRecipesBatch(
            MultipartFile file,
            String dataVersion,
            String importedBy
    ) {
        return persistImportedBatch(ImportBatchKind.RECIPE, file, dataVersion, importedBy, this::importRecipes);
    }

    public ImportBatchService.PersistedImportRows<ImportedDemandRow> importDemandsBatch(
            MultipartFile file,
            String dataVersion,
            String importedBy
    ) {
        return persistImportedBatch(ImportBatchKind.DEMAND, file, dataVersion, importedBy, this::importDemands);
    }

    public List<CreateScheduleJobRequest.DowntimeInput> importDowntimes(MultipartFile file) {
        RowData rows = readRows(file);
        validateRequiredHeaders(
                rows.sheetName(),
                rows.headerMap(),
                List.of("id", "resourceId", "startMinutes", "endMinutes", "downtimeType"),
                "downtime"
        );

        List<CreateScheduleJobRequest.DowntimeInput> downtimes = new ArrayList<>();
        for (int index = 0; index < rows.rows().size(); index++) {
            Map<String, String> row = rows.rows().get(index);
            int lineNumber = index + 2;
            int startMinutes = parseRequiredInteger(
                    rows.sheetName(),
                    requireValue(rows.sheetName(), row, "startMinutes", "downtime", lineNumber),
                    "startMinutes",
                    "downtime",
                    lineNumber,
                    true
            );
            int endMinutes = parseRequiredInteger(
                    rows.sheetName(),
                    requireValue(rows.sheetName(), row, "endMinutes", "downtime", lineNumber),
                    "endMinutes",
                    "downtime",
                    lineNumber,
                    false
            );

            if (endMinutes <= startMinutes) {
                throw validationError(
                        rows.sheetName(),
                        lineNumber,
                        "endMinutes",
                        String.valueOf(endMinutes),
                        "INVALID_RANGE",
                        "Invalid downtime import row %d: endMinutes must be greater than startMinutes".formatted(lineNumber),
                        "Set endMinutes to a value greater than startMinutes."
                );
            }

            downtimes.add(new CreateScheduleJobRequest.DowntimeInput(
                    requireValue(rows.sheetName(), row, "id", "downtime", lineNumber),
                    requireValue(rows.sheetName(), row, "resourceId", "downtime", lineNumber),
                    startMinutes,
                    endMinutes,
                    requireValue(rows.sheetName(), row, "downtimeType", "downtime", lineNumber),
                    optionalValue(row, "source", "downtime"),
                    optionalValue(row, "description", "downtime")
            ));
        }

        return downtimes;
    }

    public ImportBatchService.PersistedImportRows<CreateScheduleJobRequest.DowntimeInput> importDowntimesBatch(
            MultipartFile file,
            String dataVersion,
            String importedBy
    ) {
        return persistImportedBatch(ImportBatchKind.DOWNTIME, file, dataVersion, importedBy, this::importDowntimes);
    }

    public List<ImportedSetupRuleRow> importSetupRules(MultipartFile file) {
        RowData rows = readRows(file);
        validateRequiredHeaders(
                rows.sheetName(),
                rows.headerMap(),
                List.of("fromSetupGroup", "toSetupGroup", "setupMinutes"),
                "setupRule"
        );

        List<ImportedSetupRuleRow> setupRules = new ArrayList<>();
        for (int index = 0; index < rows.rows().size(); index++) {
            Map<String, String> row = rows.rows().get(index);
            int lineNumber = index + 2;
            setupRules.add(new ImportedSetupRuleRow(
                    requireValue(rows.sheetName(), row, "fromSetupGroup", "setup rule", lineNumber),
                    requireValue(rows.sheetName(), row, "toSetupGroup", "setup rule", lineNumber),
                    parseOptionalResourceType(rows.sheetName(), optionalValue(row, "resourceType", "setupRule"), "setup rule", lineNumber),
                    optionalValue(row, "resourceId", "setupRule"),
                    parseRequiredInteger(
                            rows.sheetName(),
                            requireValue(rows.sheetName(), row, "setupMinutes", "setup rule", lineNumber),
                            "setupMinutes",
                            "setup rule",
                            lineNumber,
                            true
                    )
            ));
        }

        if (setupRules.isEmpty()) {
            throw validationError(
                    rows.sheetName(),
                    1,
                    null,
                    null,
                    "NO_DATA_ROWS",
                    "The setup rule import file does not contain any data rows",
                    "Add at least one setup rule row below the header."
            );
        }
        return setupRules;
    }

    public ImportBatchService.PersistedImportRows<ImportedSetupRuleRow> importSetupRulesBatch(
            MultipartFile file,
            String dataVersion,
            String importedBy
    ) {
        return persistImportedBatch(ImportBatchKind.SETUP_RULE, file, dataVersion, importedBy, this::importSetupRules);
    }

    public byte[] exportTemplateWorkbook() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writeTemplateSheet(
                    workbook,
                    "Resources",
                    RESOURCE_TEMPLATE_HEADERS,
                    List.of("reactor_r01", "Reactor-R01", "REACTOR", "1")
            );
            writeTemplateSheet(
                    workbook,
                    "Tasks",
                    TASK_TEMPLATE_HEADERS,
                    List.of("batch_a", "Batch A", "PA-101", "480", "960", "5", "reactor_r01,reactor_r02", "", "", "", "REACT_A")
            );
            writeTemplateSheet(
                    workbook,
                    "Recipes",
                    RECIPE_TEMPLATE_HEADERS,
                    List.of("rcp_pa101_v1", "PA-101", "REACT", "Reaction Stage", "1", "480", "reactor_r01,reactor_r02", "RM_MONO_A:2|CAT_A:1", "PA-101:1", "REACT_A")
            );
            writeTemplateSheet(
                    workbook,
                    "Demands",
                    DEMAND_TEMPLATE_HEADERS,
                    List.of("ord_pa101_001", "PA-101", "1", "960", "5", "reactor_r01", "60")
            );
            writeTemplateSheet(
                    workbook,
                    "InventoryBalances",
                    INVENTORY_BALANCE_TEMPLATE_HEADERS,
                    List.of("PA-101", "2", "0", "1")
            );
            writeTemplateSheet(
                    workbook,
                    "Downtimes",
                    DOWNTIME_TEMPLATE_HEADERS,
                    List.of("maintenance_reactor_r01_morning", "reactor_r01", "240", "420", "MAINTENANCE", "CALENDAR", "Preventive maintenance window")
            );
            writeTemplateSheet(
                    workbook,
                    "SetupRules",
                    SETUP_RULE_TEMPLATE_HEADERS,
                    List.of("REACT_A", "REACT_B", "REACTOR", "", "60")
            );
            writeReadmeSheet(workbook);
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build the Excel import template");
        }
    }

    private RowData readRows(MultipartFile file) {
        String extension = fileExtension(file.getOriginalFilename());
        if ("csv".equals(extension)) {
            return readCsvRows(file);
        }
        if ("xlsx".equals(extension) || "xls".equals(extension)) {
            return readWorkbookRows(file);
        }
        throw validationError(
                null,
                null,
                null,
                file.getOriginalFilename(),
                "UNSUPPORTED_FILE_TYPE",
                "Only CSV, XLSX, and XLS files are supported",
                "Upload a file with .csv, .xlsx, or .xls extension."
        );
    }

    private RowData readCsvRows(MultipartFile file) {
        try {
            String content = decodeCsvContent(file.getBytes());
            List<List<String>> matrix = parseCsv(content);
            return toRowData(matrix, "CSV");
        } catch (IOException ex) {
            throw validationError(
                    "CSV",
                    null,
                    null,
                    file.getOriginalFilename(),
                    "FILE_READ_FAILED",
                    "Failed to read the CSV file",
                    "Confirm the file uses UTF-8, GB18030, or GBK encoding and try again."
            );
        }
    }

    private String decodeCsvContent(byte[] bytes) throws CharacterCodingException {
        CharacterCodingException lastError = null;
        for (Charset charset : CSV_CHARSETS) {
            try {
                CharsetDecoder decoder = charset.newDecoder()
                        .onMalformedInput(CodingErrorAction.REPORT)
                        .onUnmappableCharacter(CodingErrorAction.REPORT);
                String content = decoder.decode(ByteBuffer.wrap(bytes)).toString();
                return stripLeadingBom(content);
            } catch (CharacterCodingException ex) {
                lastError = ex;
            }
        }
        throw lastError == null ? new CharacterCodingException() : lastError;
    }

    private String stripLeadingBom(String value) {
        if (value != null && !value.isEmpty() && value.charAt(0) == '\uFEFF') {
            return value.substring(1);
        }
        return value;
    }

    private RowData readWorkbookRows(MultipartFile file) {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw validationError(
                        null,
                        null,
                        null,
                        file.getOriginalFilename(),
                        "MISSING_SHEET",
                        "The Excel file does not contain any sheets",
                        "Add at least one worksheet with a header row."
                );
            }

            List<List<String>> matrix = new ArrayList<>();
            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                throw validationError(
                        sheet.getSheetName(),
                        1,
                        null,
                        null,
                        "MISSING_HEADER_ROW",
                        "The Excel file does not contain a header row",
                        "Put the field names in the first row of the worksheet."
                );
            }

            int columnCount = headerRow.getLastCellNum();
            for (int rowNumber = sheet.getFirstRowNum(); rowNumber <= sheet.getLastRowNum(); rowNumber++) {
                Row row = sheet.getRow(rowNumber);
                List<String> values = new ArrayList<>();
                for (int columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                    Cell cell = row == null ? null : row.getCell(columnIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    values.add(cell == null ? "" : dataFormatter.formatCellValue(cell).trim());
                }
                matrix.add(values);
            }

            return toRowData(matrix, sheet.getSheetName());
        } catch (IOException ex) {
            throw validationError(
                    null,
                    null,
                    null,
                    file.getOriginalFilename(),
                    "FILE_READ_FAILED",
                    "Failed to read the Excel file",
                    "Confirm the workbook is not corrupted and try again."
            );
        }
    }

    private RowData toRowData(List<List<String>> matrix, String sheetName) {
        if (matrix.isEmpty()) {
            throw validationError(
                    sheetName,
                    1,
                    null,
                    null,
                    "EMPTY_FILE",
                    "The import file is empty",
                    "Keep the header row and add at least one data row."
            );
        }

        List<String> headerRow = matrix.getFirst();
        Map<Integer, String> headerMap = new LinkedHashMap<>();
        for (int columnIndex = 0; columnIndex < headerRow.size(); columnIndex++) {
            String headerValue = headerRow.get(columnIndex);
            if (!headerValue.isBlank()) {
                headerMap.put(columnIndex, headerValue);
            }
        }

        if (headerMap.isEmpty()) {
            throw validationError(
                    sheetName,
                    1,
                    null,
                    null,
                    "MISSING_HEADER_ROW",
                    "The import file must start with a header row",
                    "Put the field names in the first row of the file."
            );
        }

        List<Map<String, String>> rows = new ArrayList<>();
        for (int rowIndex = 1; rowIndex < matrix.size(); rowIndex++) {
            List<String> values = matrix.get(rowIndex);
            if (values.stream().allMatch(String::isBlank)) {
                continue;
            }

            Map<String, String> row = new LinkedHashMap<>();
            for (Map.Entry<Integer, String> entry : headerMap.entrySet()) {
                int columnIndex = entry.getKey();
                row.put(entry.getValue(), columnIndex < values.size() ? values.get(columnIndex).trim() : "");
            }
            rows.add(row);
        }

        return new RowData(sheetName, headerMap.values().stream().toList(), rows);
    }

    private void validateRequiredHeaders(String sheetName, List<String> headers, List<String> requiredFields, String rowType) {
        Map<String, Set<String>> aliases = headerAliasesForRowType(rowType);
        if (aliases == null) {
            throw new IllegalArgumentException("Unknown row type: " + rowType);
        }

        Map<String, String> resolvedHeaders = resolveHeaders(headers, aliases);
        List<String> missingFields = requiredFields.stream()
                .filter(field -> !resolvedHeaders.containsValue(field))
                .toList();

        if (!missingFields.isEmpty()) {
            throw validationError(
                    "The %s import file is missing required columns: %s".formatted(displayRowType(rowType), String.join(", ", missingFields)),
                    missingFields.stream()
                            .map(field -> buildError(
                                    sheetName,
                                    1,
                                    field,
                                    null,
                                    "MISSING_REQUIRED_COLUMN",
                                    "Missing required column `%s`".formatted(field),
                                    "Add the `%s` column to the header row.".formatted(field)
                            ))
                            .toList()
            );
        }
    }

    private String requireValue(String sheetName, Map<String, String> row, String field, String rowType, int lineNumber) {
        String value = optionalValue(row, field, rowType);
        if (value == null) {
            throw validationError(
                    sheetName,
                    lineNumber,
                    field,
                    null,
                    "REQUIRED_FIELD_MISSING",
                    "Invalid %s import row %d: %s is required".formatted(displayRowType(rowType), lineNumber, field),
                    "Fill in the `%s` field for this row.".formatted(field)
            );
        }
        return value;
    }

    private String optionalValue(Map<String, String> row, String field, String rowType) {
        Set<String> aliases = aliasesForField(rowType, field);
        if (aliases == null) {
            return null;
        }

        for (Map.Entry<String, String> entry : row.entrySet()) {
            if (matchesHeader(entry.getKey(), aliases)) {
                String value = entry.getValue().trim();
                return value.isBlank() ? null : value;
            }
        }
        return null;
    }

    private Set<String> aliasesForField(String rowType, String field) {
        Map<String, Set<String>> aliasMap = headerAliasesForRowType(rowType);
        if (aliasMap == null) {
            return null;
        }
        return aliasMap.get(field);
    }

    private Map<String, Set<String>> headerAliasesForRowType(String rowType) {
        String normalized = normalizeRowTypeKey(rowType);
        for (Map.Entry<String, Map<String, Set<String>>> entry : HEADER_ALIASES_BY_TYPE.entrySet()) {
            if (normalizeRowTypeKey(entry.getKey()).equals(normalized)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String displayRowType(String rowType) {
        return switch (normalizeRowTypeKey(rowType)) {
            case "setuprule" -> "setup rule";
            default -> rowType;
        };
    }

    private Map<String, String> resolveHeaders(List<String> headers, Map<String, Set<String>> aliases) {
        Map<String, String> resolved = new LinkedHashMap<>();
        for (String header : headers) {
            for (Map.Entry<String, Set<String>> entry : aliases.entrySet()) {
                if (matchesHeader(header, entry.getValue())) {
                    resolved.put(header, entry.getKey());
                    break;
                }
            }
        }
        return resolved;
    }

    private boolean matchesHeader(String header, Set<String> aliases) {
        String normalized = normalizeHeader(header);
        for (String alias : aliases) {
            if (normalized.equals(normalizeHeader(alias))) {
                return true;
            }
        }
        return false;
    }

    private void writeTemplateSheet(Workbook workbook, String sheetName, List<String> headers, List<String> exampleRow) {
        Sheet sheet = workbook.createSheet(sheetName);
        Row headerRow = sheet.createRow(0);
        for (int columnIndex = 0; columnIndex < headers.size(); columnIndex++) {
            headerRow.createCell(columnIndex).setCellValue(headers.get(columnIndex));
        }

        Row row = sheet.createRow(1);
        for (int columnIndex = 0; columnIndex < exampleRow.size(); columnIndex++) {
            row.createCell(columnIndex).setCellValue(exampleRow.get(columnIndex));
        }

        sheet.createFreezePane(0, 1);
        for (int columnIndex = 0; columnIndex < headers.size(); columnIndex++) {
            int exampleWidth = columnIndex < exampleRow.size() ? exampleRow.get(columnIndex).length() : 0;
            int widthUnits = Math.max(18, Math.min(60, Math.max(headers.get(columnIndex).length(), exampleWidth) + 2));
            sheet.setColumnWidth(columnIndex, widthUnits * 256);
        }
    }

    private void writeReadmeSheet(Workbook workbook) {
        Sheet sheet = workbook.createSheet("README");
        List<String> lines = List.of(
                "Use the Resources, Tasks, Recipes, Demands, InventoryBalances, Downtimes, and SetupRules sheets to prepare import data.",
                "Keep the header row unchanged so the APS importer can match the columns.",
                "Candidate resource ids can use comma-separated values such as reactor_r01,reactor_r02.",
                "Recipes define operation order, durationMinutes, candidateResourceIds, optional materialInputs/materialOutputs, and optional setupGroup.",
                "Recipe material columns use itemCode:quantity pairs such as RM_MONO_A:2|CAT_A:1.",
                "Demands use dueMinutes and fixedStartMinutes as offsets in minutes from scheduleStartAt.",
                "InventoryBalances define product-level availableQuantity, optional availableFromMinutes, and optional safetyStockQuantity.",
                "Downtime startMinutes and endMinutes are offsets in minutes from scheduleStartAt."
        );

        for (int rowIndex = 0; rowIndex < lines.size(); rowIndex++) {
            sheet.createRow(rowIndex).createCell(0).setCellValue(lines.get(rowIndex));
        }

        sheet.setColumnWidth(0, 108 * 256);
    }

    private String normalizeHeader(String value) {
        return String.valueOf(value)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\s_\\-()/]+", "");
    }

    private String normalizeRowTypeKey(String value) {
        return String.valueOf(value)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\s_\\-]+", "");
    }

    private ResourceType parseResourceType(String sheetName, String value, String rowType, int lineNumber) {
        try {
            return ResourceType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw validationError(
                    sheetName,
                    lineNumber,
                    "resourceType",
                    value,
                    "INVALID_ENUM",
                    "Invalid %s import row %d: resourceType must be one of %s".formatted(
                            displayRowType(rowType),
                            lineNumber,
                            java.util.Arrays.stream(ResourceType.values()).map(Enum::name).collect(Collectors.joining("/"))
                    ),
                    "Use one of %s.".formatted(java.util.Arrays.stream(ResourceType.values()).map(Enum::name).collect(Collectors.joining("/")))
            );
        }
    }

    private ResourceType parseOptionalResourceType(String sheetName, String value, String rowType, int lineNumber) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return parseResourceType(sheetName, value, rowType, lineNumber);
    }

    private int parseRequiredInteger(String sheetName, String value, String field, String rowType, int lineNumber, boolean allowZero) {
        try {
            int parsed = Integer.parseInt(value.trim());
            if (allowZero ? parsed < 0 : parsed <= 0) {
                throw new NumberFormatException("range");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw validationError(
                    sheetName,
                    lineNumber,
                    field,
                    value,
                    "INVALID_INTEGER",
                    "Invalid %s import row %d: %s must be %s integer".formatted(
                            displayRowType(rowType),
                            lineNumber,
                            field,
                            allowZero ? "a non-negative" : "a positive"
                    ),
                    "Enter %s integer for `%s`.".formatted(allowZero ? "a non-negative" : "a positive", field)
            );
        }
    }

    private Integer parseOptionalInteger(String sheetName, String value, String field, String rowType, int lineNumber, boolean allowZero) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return parseRequiredInteger(sheetName, value, field, rowType, lineNumber, allowZero);
    }

    private List<String> parseCandidateResourceIds(String sheetName, String value, String rowType, int lineNumber) {
        try {
            if (value.trim().startsWith("[")) {
                List<String> parsed = objectMapper.readValue(value, new TypeReference<List<String>>() {
                });
                List<String> normalized = parsed.stream()
                        .map(item -> item == null ? "" : item.trim())
                        .filter(item -> !item.isBlank())
                        .toList();
                if (!normalized.isEmpty()) {
                    return normalized;
                }
            }
        } catch (IOException ignored) {
            // Fall back to delimiter-based parsing below.
        }

        List<String> normalized = List.of(value.split("[,;|，]+")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();

        if (normalized.isEmpty()) {
            throw validationError(
                    sheetName,
                    lineNumber,
                    "candidateResourceIds",
                    value,
                    "EMPTY_LIST",
                    "Invalid %s import row %d: candidateResourceIds must contain at least one resource id"
                            .formatted(displayRowType(rowType), lineNumber),
                    "Provide one or more candidate resource ids separated by commas."
            );
        }
        return normalized;
    }

    private List<String> parseOptionalStringList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        try {
            if (value.trim().startsWith("[")) {
                List<String> parsed = objectMapper.readValue(value, new TypeReference<List<String>>() {
                });
                return parsed.stream()
                        .map(item -> item == null ? "" : item.trim())
                        .filter(item -> !item.isBlank())
                        .toList();
            }
        } catch (IOException ignored) {
            // Fall back to delimiter-based parsing below.
        }

        return List.of(value.split("[,;|，]+")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .toList();
    }

    private List<CreateScheduleJobRequest.MaterialQuantityInput> parseMaterialQuantityList(
            String sheetName,
            String value,
            String field,
            String rowType,
            int lineNumber
    ) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        try {
            if (value.trim().startsWith("[")) {
                JsonNode root = objectMapper.readTree(value);
                if (root.isArray()) {
                    List<CreateScheduleJobRequest.MaterialQuantityInput> parsed = new ArrayList<>();
                    for (JsonNode node : root) {
                        if (node.isTextual()) {
                            parsed.add(parseMaterialQuantityToken(sheetName, node.asText(), field, rowType, lineNumber));
                            continue;
                        }
                        if (!node.isObject()) {
                            throw invalidMaterialQuantity(sheetName, field, rowType, lineNumber, value);
                        }
                        String itemCode = node.path("itemCode").asText("").trim();
                        if (itemCode.isBlank() || node.path("quantity").isMissingNode()) {
                            throw invalidMaterialQuantity(sheetName, field, rowType, lineNumber, value);
                        }
                        parsed.add(new CreateScheduleJobRequest.MaterialQuantityInput(
                                itemCode,
                                parseRequiredInteger(sheetName, node.path("quantity").asText(), field, rowType, lineNumber, false)
                        ));
                    }
                    return List.copyOf(parsed);
                }
            }
        } catch (IOException ignored) {
            // Fall back to delimiter-based parsing below.
        }

        return List.of(value.split("[,;|，]+")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .map(item -> parseMaterialQuantityToken(sheetName, item, field, rowType, lineNumber))
                .toList();
    }

    private CreateScheduleJobRequest.MaterialQuantityInput parseMaterialQuantityToken(
            String sheetName,
            String token,
            String field,
            String rowType,
            int lineNumber
    ) {
        String[] parts = token.split("[:：]", 2);
        if (parts.length != 2) {
            throw invalidMaterialQuantity(sheetName, field, rowType, lineNumber, token);
        }

        String itemCode = parts[0].trim();
        String quantity = parts[1].trim();
        if (itemCode.isBlank() || quantity.isBlank()) {
            throw invalidMaterialQuantity(sheetName, field, rowType, lineNumber, token);
        }

        return new CreateScheduleJobRequest.MaterialQuantityInput(
                itemCode,
                parseRequiredInteger(sheetName, quantity, field, rowType, lineNumber, false)
        );
    }

    private ImportBatchValidationException invalidMaterialQuantity(
            String sheetName,
            String field,
            String rowType,
            int lineNumber,
            String rawValue
    ) {
        return validationError(
                sheetName,
                lineNumber,
                field,
                rawValue,
                "INVALID_MATERIAL_QUANTITY",
                "Invalid %s import row %d: %s must use itemCode:quantity pairs".formatted(
                        displayRowType(rowType),
                        lineNumber,
                        field
                ),
                "Use `itemCode:quantity` pairs such as RM_MONO_A:2|CAT_A:1."
        );
    }

    private <T> ImportBatchService.PersistedImportRows<T> persistValidatedBatch(
            ImportBatchKind importType,
            MultipartFile file,
            String dataVersion,
            String importedBy,
            List<T> rows
    ) {
        if (importBatchService == null) {
            throw new IllegalStateException("ImportBatchService is not configured");
        }
        return importBatchService.saveValidatedBatch(
                importType,
                dataVersion,
                file.getOriginalFilename(),
                importedBy,
                rows
        );
    }

    private <T> ImportBatchService.PersistedImportRows<T> persistImportedBatch(
            ImportBatchKind importType,
            MultipartFile file,
            String dataVersion,
            String importedBy,
            ImportParser<T> parser
    ) {
        try {
            return persistValidatedBatch(importType, file, dataVersion, importedBy, parser.parse(file));
        } catch (ImportBatchValidationException ex) {
            if (importBatchService == null) {
                throw ex;
            }
            if (ex.batch() != null) {
                throw ex;
            }
            throw ex.withBatch(importBatchService.saveFailedBatch(
                    importType,
                    dataVersion,
                    file.getOriginalFilename(),
                    importedBy,
                    ex.errors()
            ));
        }
    }

    private ImportBatchValidationException validationError(
            String sheetName,
            Integer rowNumber,
            String fieldName,
            String rawValue,
            String errorCode,
            String message,
            String suggestion
    ) {
        return validationError(message, List.of(buildError(sheetName, rowNumber, fieldName, rawValue, errorCode, message, suggestion)));
    }

    private ImportBatchValidationException validationError(String message, List<ImportBatchErrorDetail> errors) {
        return new ImportBatchValidationException(message, errors);
    }

    private ImportBatchErrorDetail buildError(
            String sheetName,
            Integer rowNumber,
            String fieldName,
            String rawValue,
            String errorCode,
            String message,
            String suggestion
    ) {
        return new ImportBatchErrorDetail(sheetName, rowNumber, fieldName, rawValue, errorCode, message, suggestion);
    }

    private String fileExtension(String fileName) {
        if (fileName == null || fileName.isBlank() || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private List<List<String>> parseCsv(String content) {
        List<List<String>> rows = new ArrayList<>();
        List<String> currentRow = new ArrayList<>();
        StringBuilder currentCell = new StringBuilder();
        boolean inQuotes = false;

        for (int index = 0; index < content.length(); index++) {
            char current = content.charAt(index);

            if (current == '"') {
                if (inQuotes && index + 1 < content.length() && content.charAt(index + 1) == '"') {
                    currentCell.append('"');
                    index++;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (current == ',' && !inQuotes) {
                currentRow.add(currentCell.toString().trim());
                currentCell.setLength(0);
                continue;
            }

            if ((current == '\n' || current == '\r') && !inQuotes) {
                if (current == '\r' && index + 1 < content.length() && content.charAt(index + 1) == '\n') {
                    index++;
                }
                currentRow.add(currentCell.toString().trim());
                currentCell.setLength(0);
                rows.add(new ArrayList<>(currentRow));
                currentRow.clear();
                continue;
            }

            currentCell.append(current);
        }

        currentRow.add(currentCell.toString().trim());
        if (!currentRow.isEmpty() && !(currentRow.size() == 1 && currentRow.getFirst().isBlank() && rows.isEmpty())) {
            rows.add(new ArrayList<>(currentRow));
        }
        return rows;
    }

    @FunctionalInterface
    private interface ImportParser<T> {
        List<T> parse(MultipartFile file);
    }

    private record RowData(
            String sheetName,
            List<String> headerMap,
            List<Map<String, String>> rows
    ) {
    }
}
