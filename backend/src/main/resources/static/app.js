const STORAGE_KEYS = {
    locale: "aps.ui.locale",
    modelDraft: "aps.ui.model.draft.v1",
    modelTables: "aps.ui.model.tables.v1",
    ganttColumns: "aps.ui.gantt.columns",
    ganttRowHeights: "aps.ui.gantt.rows.heights.v2",
    ganttLabelsLocked: "aps.ui.gantt.labels.locked",
    versionsPanelCollapsed: "aps.ui.versions.collapsed",
    kpiCollapsed: "aps.ui.kpi.collapsed",
    ganttLegendCollapsed: "aps.ui.gantt.legend.collapsed",
    ganttDetailCollapsed: "aps.ui.gantt.detail.collapsed",
    ganttDetailHeight: "aps.ui.gantt.detail.height",
};

const DEFAULT_LOCALE = "zh";
const VERSION_DIFF_FOCUS_FLASH_MS = 3600;
const MODEL_DRAFT_KIND = "aps-model-draft-v1";
const CSV_UPLOAD_ENCODINGS = ["utf-8", "gb18030", "gbk"];
const MODEL_RESOURCE_TYPES = ["REACTOR", "TANK", "FILTER", "DRYER", "OTHER"];
const MODEL_RESOURCE_FIELDS = ["id", "label", "resourceType", "sortOrder"];
const MODEL_TASK_FIELDS = [
    "id",
    "label",
    "productCode",
    "durationMinutes",
    "dueMinutes",
    "priority",
    "candidateResourceIds",
    "pinnedResourceId",
    "pinnedStartMinutes",
];
const MODEL_DOWNTIME_FIELDS = [
    "id",
    "resourceId",
    "startMinutes",
    "endMinutes",
    "downtimeType",
    "source",
    "description",
];
const MODEL_TABLE_DEFINITIONS = {
    resources: {
        tableElementKey: "modelResourcesTable",
        bodyElementKey: "modelResourcesBody",
        columns: [
            { key: "id", defaultWidth: 160, minWidth: 120, maxWidth: 320 },
            { key: "label", defaultWidth: 220, minWidth: 140, maxWidth: 420 },
            { key: "resourceType", defaultWidth: 160, minWidth: 120, maxWidth: 260 },
            { key: "sortOrder", defaultWidth: 120, minWidth: 96, maxWidth: 180 },
            { key: "actions", defaultWidth: 132, minWidth: 108, maxWidth: 200 },
        ],
    },
    tasks: {
        tableElementKey: "modelTasksTable",
        bodyElementKey: "modelTasksBody",
        columns: [
            { key: "id", defaultWidth: 160, minWidth: 120, maxWidth: 320 },
            { key: "label", defaultWidth: 220, minWidth: 140, maxWidth: 420 },
            { key: "productCode", defaultWidth: 140, minWidth: 110, maxWidth: 260 },
            { key: "durationMinutes", defaultWidth: 120, minWidth: 96, maxWidth: 200 },
            { key: "dueMinutes", defaultWidth: 120, minWidth: 96, maxWidth: 200 },
            { key: "priority", defaultWidth: 110, minWidth: 90, maxWidth: 160 },
            { key: "candidateResourceIds", defaultWidth: 240, minWidth: 160, maxWidth: 420 },
            { key: "pinnedResourceId", defaultWidth: 180, minWidth: 140, maxWidth: 320 },
            { key: "pinnedStartMinutes", defaultWidth: 160, minWidth: 120, maxWidth: 240 },
            { key: "actions", defaultWidth: 132, minWidth: 108, maxWidth: 200 },
        ],
    },
    downtimes: {
        tableElementKey: "modelDowntimesTable",
        bodyElementKey: "modelDowntimesBody",
        columns: [
            { key: "id", defaultWidth: 180, minWidth: 140, maxWidth: 340 },
            { key: "resourceId", defaultWidth: 180, minWidth: 140, maxWidth: 300 },
            { key: "startMinutes", defaultWidth: 120, minWidth: 96, maxWidth: 200 },
            { key: "endMinutes", defaultWidth: 120, minWidth: 96, maxWidth: 200 },
            { key: "downtimeType", defaultWidth: 180, minWidth: 140, maxWidth: 320 },
            { key: "source", defaultWidth: 160, minWidth: 120, maxWidth: 260 },
            { key: "description", defaultWidth: 280, minWidth: 180, maxWidth: 520 },
            { key: "actions", defaultWidth: 132, minWidth: 108, maxWidth: 200 },
        ],
    },
};
const MODEL_TABLE_KEYS = Object.keys(MODEL_TABLE_DEFINITIONS);
const MODEL_BATCH_IMPORT_DEFINITIONS = {
    resources: {
        inputElementKey: "modelBatchResourcesInput",
        buttonElementKey: "modelBatchResourcesButton",
        statusElementKey: "modelBatchResourcesStatus",
        errorsLinkElementKey: "modelBatchResourcesErrorsLink",
        titleKey: "model.batchResourcesTitle",
        scenarioSourceKey: "resources",
        required: true,
    },
    recipes: {
        inputElementKey: "modelBatchRecipesInput",
        buttonElementKey: "modelBatchRecipesButton",
        statusElementKey: "modelBatchRecipesStatus",
        errorsLinkElementKey: "modelBatchRecipesErrorsLink",
        titleKey: "model.batchRecipesTitle",
        scenarioSourceKey: "recipes",
        required: true,
    },
    demands: {
        inputElementKey: "modelBatchDemandsInput",
        buttonElementKey: "modelBatchDemandsButton",
        statusElementKey: "modelBatchDemandsStatus",
        errorsLinkElementKey: "modelBatchDemandsErrorsLink",
        titleKey: "model.batchDemandsTitle",
        scenarioSourceKey: "demands",
        required: true,
    },
    "inventory-balances": {
        inputElementKey: "modelBatchInventoryBalancesInput",
        buttonElementKey: "modelBatchInventoryBalancesButton",
        statusElementKey: "modelBatchInventoryBalancesStatus",
        errorsLinkElementKey: "modelBatchInventoryBalancesErrorsLink",
        titleKey: "model.batchInventoryBalancesTitle",
        scenarioSourceKey: "inventoryBalances",
        required: false,
    },
    downtimes: {
        inputElementKey: "modelBatchDowntimesInput",
        buttonElementKey: "modelBatchDowntimesButton",
        statusElementKey: "modelBatchDowntimesStatus",
        errorsLinkElementKey: "modelBatchDowntimesErrorsLink",
        titleKey: "model.batchDowntimesTitle",
        scenarioSourceKey: "downtimes",
        required: false,
    },
    "setup-rules": {
        inputElementKey: "modelBatchSetupRulesInput",
        buttonElementKey: "modelBatchSetupRulesButton",
        statusElementKey: "modelBatchSetupRulesStatus",
        errorsLinkElementKey: "modelBatchSetupRulesErrorsLink",
        titleKey: "model.batchSetupRulesTitle",
        scenarioSourceKey: "setupRules",
        required: false,
    },
};
const MODEL_BATCH_IMPORT_KEYS = Object.keys(MODEL_BATCH_IMPORT_DEFINITIONS);

function createEmptyModelBatchImports() {
    return {};
}

const translations = {
    zh: {
        meta: {
            title: "APS 控制台",
        },
        auth: {
            brandEyebrow: "APS",
            brandTitle: "APS 控制台",
            brandSubtitle: "化工生产排程工作台",
            eyebrow: "APS",
            title: "APS 控制台",
            description: "化工生产排程工作台",
            visualEyebrow: "化工生产排程",
            visualTitle: "让装置节拍与计划版本保持一致",
            visualDescription: "以更清晰的方式进入批次节奏、停机窗口与排程版本。",
            visualChipUnits: "批次工序",
            visualChipDowntime: "设备窗口",
            visualChipVersions: "计划版本",
            statOperationsLabel: "覆盖对象",
            statOperationsValue: "反应、储罐、过滤、干燥",
            statControlLabel: "计划节奏",
            statControlValue: "统一处理切换、等待与停机",
            statLanguageLabel: "界面语言",
            statLanguageValue: "中文 / English",
            noteLanguageLabel: "语言",
            noteLanguageValue: "支持中文和英文切换",
            noteSecurityLabel: "访问控制",
            noteSecurityValue: "登录成功后才会加载排程数据和版本信息",
            languageLabel: "语言",
            usernameLabel: "用户名",
            usernamePlaceholder: "请输入用户名",
            passwordLabel: "密码",
            passwordPlaceholder: "请输入密码",
            submit: "进入系统",
            submitLoading: "进入中...",
            invalidCredentials: "用户名或密码错误。",
            sessionExpired: "登录状态已过期，请重新登录。",
            signedOut: "你已退出登录。",
            genericError: "登录失败，请稍后重试。",
            serviceUnavailable: "暂时无法连接后端服务，请确认 8081 端口的后端已经启动。",
        },
        hero: {
            eyebrow: "APS POC",
            title: "控制台",
            description: "查看排程版本、触发样例求解，并直接从后端编排服务读取当前甘特结果。",
        },
        actions: {
            accountMenu: "账户菜单",
            accountSettings: "账号设置",
            approve: "审批通过",
            reject: "驳回版本",
            cancelJob: "取消任务",
            retryJob: "重新提交",
            deleteDraft: "删除草稿",
            selectAllDrafts: "全选草稿",
            clearDraftSelection: "清空已选",
            deleteDrafts: "删除草稿",
            deleteDraftsSelected: "删除草稿（{count}）",
            versionsAdd: "新增",
            openModel: "新建排程请求",
            logout: "退出登录",
            readyForRelease: "提交审批",
            saveReleaseNote: "保存版本说明",
            runSample: "运行样例排程",
            trialSolve: "排程试算",
            refresh: "刷新数据",
            publish: "发布版本",
            rollback: "回退到此版本",
            compareVersions: "对比版本",
            zoomOut: "缩小",
            fitTimeline: "适配",
            zoomIn: "放大",
            resetDraft: "重置草稿",
        },
        account: {
            eyebrow: "账号",
            title: "修改登录凭据",
            description: "修改系统登录用户名；如需更新密码，可同时输入新的密码。",
            close: "关闭",
            cancel: "取消",
            save: "保存修改",
            saveLoading: "保存中...",
            usernameLabel: "用户名",
            usernamePlaceholder: "请输入新的用户名",
            currentPasswordLabel: "当前密码",
            currentPasswordPlaceholder: "请输入当前密码",
            newPasswordLabel: "新密码",
            newPasswordPlaceholder: "留空表示保持当前密码",
            confirmPasswordLabel: "确认新密码",
            confirmPasswordPlaceholder: "请再次输入新密码",
            passwordHint: "如果只想修改用户名，新密码可以留空。",
            usernameRequired: "请输入用户名。",
            currentPasswordRequired: "请输入当前密码。",
            passwordMismatch: "两次输入的新密码不一致。",
            passwordTooShort: "新密码至少需要 6 位。",
            updateSuccess: "登录信息已更新。",
            invalidCurrentPassword: "当前密码不正确。",
            genericError: "保存失败，请稍后重试。",
        },
        model: {
            eyebrow: "业务建模",
            title: "新建排程请求",
            description: "按最小业务口径录入场景、资源、任务与停机窗口，直接复用通用排产 API 创建任务。",
            close: "关闭",
            cancel: "取消",
            submit: "提交排程",
            submitLoading: "提交中...",
            saveDraft: "保存草稿",
            restoreDraft: "恢复草稿",
            exportTemplate: "导出 Excel 模板",
            exportJson: "导出 JSON",
            importTabular: "导入 CSV/Excel",
            importJson: "导入 JSON",
            loadTemplate: "载入示例模板",
            addResource: "新增资源",
            addTask: "新增任务",
            addDowntime: "新增停机",
            removeRow: "删除",
            selectPlaceholder: "请选择",
            basicSection: "基础信息",
            basicHint: "先定义排程窗口、目标权重和求解参数，再录入资源、任务和停机窗口。",
            dataVersionLabel: "数据版本",
            dataVersionPlaceholder: "例如：uat_v1_20260505",
            importHint: "支持导入 `/api/v1/schedule/jobs` 的标准 JSON 请求体，导入后会自动回填到当前表格。",
            batchFlowTitle: "正式导入批次流",
            batchFlowDescription: "在这里上传 Resource / Recipe / Demand 等正式批次。当必需批次共享同一个数据版本时，提交会先调用场景生成，再用生成出的 scheduleRequest 创建排程任务。",
            batchFlowHint: "正式批次流只使用这里上传的批次；不会和下方手工表格内容混合生成场景。",
            batchNoImport: "当前还没有导入批次。",
            batchDownloadErrors: "下载错误报告",
            batchStatusLine: "批次 {importId}\n状态 {status} · 版本 {dataVersion}\n成功 {successCount} · 失败 {failureCount}",
            batchImportedSuccess: "{kind} 已导入为批次 {importId}（dataVersion: {dataVersion}）。",
            batchImportFailed: "{kind} 导入失败，已记录错误报告：{message}",
            batchFlowSubmitting: "正在基于正式导入批次生成场景并创建排程任务。",
            batchFlowNoScheduleRequest: "场景已生成，但当前需求已被库存完全覆盖，没有需要提交的排程任务。",
            batchResourcesTitle: "Resources 批次",
            batchRecipesTitle: "Recipes 批次",
            batchDemandsTitle: "Demands 批次",
            batchInventoryBalancesTitle: "Inventory Balances 批次",
            batchDowntimesTitle: "Downtimes 批次",
            batchSetupRulesTitle: "Setup Rules 批次",
            scenarioNameLabel: "场景名称",
            scenarioNamePlaceholder: "例如：polymer_weekday_window",
            scheduleStartLabel: "排程开始时间",
            horizonLabel: "排程窗口（分钟）",
            sortOrderLabel: "排序号",
            resourceTypeLabel: "资源类型",
            productCodeLabel: "产品编码",
            candidateResourcesLabel: "候选资源",
            pinnedResourceLabel: "锁定资源",
            pinnedStartLabel: "锁定开始分钟",
            downtimeTypeLabel: "停机类型",
            tardinessLabel: "拖期权重",
            earlinessLabel: "过早生产权重",
            makespanLabel: "工期权重",
            timeLimitLabel: "求解时限（秒）",
            workersLabel: "搜索线程数",
            resourcesTitle: "资源定义",
            resourcesDescription: "逐行维护可参与排程的资源，至少填写标识、名称、类型和排序号。",
            tasksTitle: "任务定义",
            tasksDescription: "逐行定义任务、交期和可投放资源。候选资源用英文逗号分隔，锁定字段可留空。",
            downtimesTitle: "停机窗口",
            downtimesDescription: "可选。逐行录入维护、校验或其他不可用窗口；开始和结束均相对排程起点。",
            tableResizeHint: "拖动表头右侧分隔线可调整字段宽度；拖动表头可重排列顺序。",
            columnId: "标识",
            columnLabel: "名称",
            columnResourceType: "类型",
            columnSortOrder: "排序",
            columnActions: "操作",
            columnProductCode: "产品",
            columnDurationMinutes: "时长",
            columnDueMinutes: "交期",
            columnPriority: "优先级",
            columnCandidateResources: "候选资源",
            columnPinnedResource: "锁定资源",
            columnPinnedStartMinutes: "锁定开始",
            columnResourceId: "资源 ID",
            columnStartMinutes: "开始",
            columnEndMinutes: "结束",
            columnDowntimeType: "停机类型",
            columnSource: "来源",
            columnDescription: "说明",
            validationScenarioRequired: "请输入场景名称。",
            validationScheduleStartRequired: "请选择排程开始时间。",
            validationScheduleStartInvalid: "排程开始时间无效。",
            validationPositiveIntegerField: "{field} 需为正整数。",
            validationNonNegativeIntegerField: "{field} 需为非负整数。",
            validationAtLeastOneLine: "请至少填写一条{section}。",
            validationInvalidLine: "{section} 第 {line} 行不合法：{reason}",
            draftSaved: "本地草稿已保存。",
            draftRestored: "本地草稿已恢复到当前表格。",
            draftUnavailable: "当前浏览器里还没有可恢复的本地草稿。",
            draftStorageError: "本地草稿保存失败，请检查浏览器存储权限。",
            templateExported: "Excel 模板已开始下载。",
            exportSuccess: "标准 JSON 已导出。",
            resourcesImported: "资源定义已从表格文件导入。",
            tasksImported: "任务定义已从表格文件导入。",
            downtimesImported: "停机窗口已从表格文件导入。",
            importSuccess: "JSON 已导入并回填到当前表格。",
            importInvalidJson: "导入失败：文件不是合法的 JSON。",
            importInvalidStructure: "导入失败：文件结构与排程请求契约不匹配。",
            reasonRequiredField: "{field} 不能为空",
            reasonDuplicateId: "标识 {value} 重复",
            reasonUnknownResourceType: "资源类型必须是 {value}",
            reasonCandidateResourceRequired: "至少填写一个候选资源",
            reasonUnknownResource: "资源 {value} 不存在",
            reasonPinnedResourceRequired: "填写锁定开始时间时必须同时填写锁定资源",
            reasonPinnedResourceCandidate: "锁定资源必须同时出现在候选资源列表中",
            reasonEndAfterStart: "结束分钟必须大于开始分钟",
            templateLoaded: "已载入可编辑模板。",
        },
        session: {
            signedInAs: "当前用户",
            roleUnknown: "未分配角色",
        },
        job: {
            latestJobLabel: "最新任务",
            idleTitle: "空闲",
            idleDetail: "当前没有正在跟踪的后台任务。",
            modelSubmittingTitle: "建模提交中",
            modelSubmittingDetail: "正在创建自定义排程任务。",
            submittingTitle: "提交中",
            submittingDetail: "正在创建样例排程任务。",
            trialSubmittingTitle: "试算中",
            trialSubmittingDetail: "正在基于当前草稿创建试算任务。",
            trialAcceptedTitle: "试算已受理",
            trialUnavailableDetail: "排程试算接口尚未生效，请先重启 8081 后端服务后再试。",
            acceptedTitle: "已受理",
            acceptedDetail: "正在持续跟踪任务 {jobId}，直到版本生成完成。",
            finishedTitle: "求解完成",
            finishedDetail: "版本 {versionId} 已可查看。",
            failedTitle: "求解失败",
            failedFallback: "求解器返回了失败结果。",
            draftDeleteSuccessTitle: "草稿已删除",
            draftDeleteSuccessDetail: "已从列表移除 {count} 个草稿版本。",
            draftDeleteFailedTitle: "删除草稿失败",
            readyForReleaseSuccessTitle: "版本已提交待发布",
            readyForReleaseSuccessDetail: "当前版本已进入待审批状态。",
            readyForReleaseFailedTitle: "提交待发布失败",
            approveSuccessTitle: "版本已审批通过",
            approveSuccessDetail: "当前版本已进入可发布状态。",
            approveFailedTitle: "审批失败",
            rejectSuccessTitle: "版本已驳回",
            rejectSuccessDetail: "当前版本已回到驳回状态，可补充说明后重新提交。",
            rejectFailedTitle: "驳回失败",
            publishSuccessTitle: "版本已发布",
            publishSuccessDetail: "当前选中版本已标记为生效计划。",
            publishFailedTitle: "发布失败",
            rollbackSuccessTitle: "版本已回退",
            rollbackSuccessDetail: "当前选中历史版本已重新设为生效计划。",
            rollbackFailedTitle: "回退失败",
            cancelSuccessTitle: "任务已取消",
            cancelSuccessDetail: "当前后台任务已标记为取消。",
            cancelFailedTitle: "取消任务失败",
            retrySuccessTitle: "任务已重新提交",
            retrySuccessDetail: "已按原始请求重新创建后台任务。",
            retryFailedTitle: "重试任务失败",
            releaseNoteSavedTitle: "版本说明已保存",
            releaseNoteSavedDetail: "当前版本说明已更新。",
            releaseNoteSaveFailedTitle: "版本说明保存失败",
            pollingErrorTitle: "轮询失败",
            submissionFailedTitle: "提交失败",
            refreshFailedTitle: "刷新失败",
            refreshedTitle: "已刷新",
            refreshedDetail: "已从后端加载最新版本数据。",
            runningDetail: "任务 {jobId} 仍在后台运行。",
        },
        summary: {
            totalVersionsLabel: "版本数",
            totalVersionsFootnote: "已持久化的排程快照",
            publishedVersionsLabel: "已生效",
            publishedVersionsFootnote: "当前生效计划数量",
            selectedStatusLabel: "当前状态",
            lastRefreshLabel: "最近刷新",
            lastRefreshFootnote: "前端抓取时间",
            none: "无",
            chooseVersion: "请选择一个版本查看明细。",
            waiting: "等待中",
        },
        versions: {
            eyebrow: "排程版本",
            title: "版本快照",
            empty: "当前还没有版本。先运行样例排程来生成一个版本。",
            draftCount: "草稿 {count}",
            deleteDraftsConfirm: "确认删除选中的 {count} 个草稿版本吗？此操作不可撤销。",
            collapse: "收起版本快照",
            expand: "展开版本快照",
            createdLabel: "创建",
            publishedLabel: "生效",
            snapshotId: "版本号",
        },
        viewer: {
            eyebrow: "版本详情",
            emptyTitle: "未选择版本",
            emptySubtitle: "先运行样例场景，或从左侧面板选择已有版本。",
            statusLine: "{status}版本",
            createdAt: "创建于 {value}",
            publishedAt: "生效于 {value}",
            inventoryCoverageLine: "库存覆盖 {count} 条需求 · {coveredQuantity}/{requestedQuantity} 单位",
        },
        governance: {
            compareEyebrow: "版本对比",
            compareTitle: "计划差异",
            compareLabel: "对比基线",
            compareUnavailable: "没有可对比的其他版本",
            diffEmpty: "选择另一个版本后可查看计划差异。",
            diffError: "版本差异加载失败：{message}",
            diffNoChanges: "两个版本之间没有任务变化。",
            changedTasksTitle: "变更任务",
            historyEyebrow: "版本治理",
            historyTitle: "版本治理审计",
            historyEmpty: "当前还没有版本治理记录。",
            historyError: "审计历史加载失败：{message}",
            historyFilteredEmpty: "当前筛选条件下没有匹配的治理记录。",
            historyFilterLabel: "事件类型",
            historyFilterAll: "全部事件",
            historySearchPlaceholder: "搜索版本、操作人或备注",
            releaseNoteEyebrow: "版本说明",
            releaseNoteTitle: "版本说明与治理备注",
            releaseNoteLabel: "版本说明",
            releaseNotePlaceholder: "概括这个版本的关键变化、风险和上线说明。",
            releaseNoteHint: "说明会附着在当前版本上，可先保存，也可在发布时一并带上。",
            actionCommentLabel: "提交流转 / 审批 / 发布 / 回退备注",
            actionCommentPlaceholder: "说明这次提交、审批、驳回、发布或回退的原因。",
            actionCommentHint: "提交、审批、驳回、发布和回退都必填，这条备注会写入治理审计流水。",
            commentRequired: "请先填写治理备注。",
            actorLine: "操作人：{actor}",
            commentLine: "备注：{comment}",
            summaryChangedTasks: "变更任务",
            summaryMovedTasks: "时间调整",
            summaryAddedTasks: "新增任务",
            summaryRemovedTasks: "移除任务",
            summaryTotalShift: "总位移",
            summaryMaxShift: "最大位移",
            kpiWeightedTardiness: "加权拖期",
            kpiMakespan: "总工期",
            kpiLateTasks: "延误任务",
            kpiEfficiency: "排程效率",
            baseVersion: "基线版本",
            targetVersion: "当前版本",
            previousPublished: "上一生效版本",
            noPreviousPublished: "首次生效",
            historyReadyForRelease: "将 {target} 提交为待审批版本",
            historyApproved: "审批通过 {target}",
            historyRejected: "驳回 {target}",
            historyPublishedFrom: "从 {previous} 切换到 {target}",
            historyRollbackFrom: "从 {previous} 回退到 {target}",
            historyPublishedInitial: "首次发布 {target}",
            historyRollbackInitial: "将 {target} 设为生效计划",
            taskAdded: "新增到 {target}",
            taskRemoved: "从 {base} 移除",
            taskMoved: "开始 {start}，时长 {duration}，拖期 {tardiness}",
            taskReassigned: "资源 {base} -> {target}",
            taskWindow: "{start} -> {end}",
            taskPinnedChangedLocked: "基线未锁定，当前已锁定",
            taskPinnedChangedUnlocked: "基线已锁定，当前已解锁",
            taskPinnedChanged: "锁定状态已变化",
            diffTaskFocusTitle: "变更任务定位",
            diffTaskFocusedDetail: "已定位到当前版本任务 {task}。",
            diffTaskRowFocusedDetail: "当前版本已无任务条，已定位到相关资源行 {row}。",
            diffTaskFocusUnavailable: "当前版本已无任务 {task}，也无法定位到相关资源行。",
            rowUnknown: "未分配",
        },
        kpi: {
            weightedTardiness: "加权拖期",
            makespan: "总工期",
            lateTasks: "延误任务",
            avgUtilization: "排程效率",
        },
        gantt: {
            eyebrow: "甘特图",
            title: "资源时间轴",
            metricsPanel: "指标",
            legendPanel: "图例",
            detailPanel: "明细",
            labelPaneLocked: "列已锁定",
            labelPaneUnlocked: "列可滚动",
            labelPaneLock: "锁定资源到结束列",
            labelPaneUnlock: "解锁资源到结束列",
            dragModeMove: "移动任务",
            dragModeResizeStart: "调整开始",
            dragModeResizeEnd: "调整结束",
            dragSnapLabel: "吸附",
            dragSnapValue: "{minutes} 分钟",
            dragSnapDisabled: "自由（Shift）",
            dragStatusClear: "当前落点可用",
            dragStatusConflict: "当前落点与目标行任务或停机窗口冲突",
            legendTask: "任务",
            legendLateTask: "延误任务",
            legendPinned: "锁定任务",
            legendDraft: "草稿",
            legendConflict: "冲突",
            legendDowntime: "停机窗口",
            inventoryCoverageTitle: "库存覆盖",
            inventoryCoverageType: "库存",
            inventoryCoverageSummary: "{count} 条需求 · 覆盖 {coveredQuantity}/{requestedQuantity}",
            empty: "尚未加载版本数据。",
            noSelection: "请选择一个版本来渲染资源时间轴。",
            noRows: "该版本没有返回资源行数据。",
            resources: "资源",
            tableRowNo: "行号",
            tableName: "资源",
            tableType: "类型",
            tableSpan: "跨度",
            tableStart: "开始",
            tableFinish: "结束",
            detailEyebrow: "任务明细",
            detailTitle: "当前选中任务",
            detailEmpty: "点击甘特条后，可在这里查看任务详情。",
            detailPinStatusPinned: "当前任务在试算时会锁定到当前位置。",
            detailPinStatusUnlocked: "当前任务在试算时可自由重排，不会固定资源和开始时间。",
            detailPinAction: "锁定到当前位置",
            detailUnpinAction: "改为非锁定",
            detailHint: "未锁定任务支持横向拖动调整时间，也可跨资源行拖动；拖拽会按当前时间刻度吸附，靠近视图边缘时会自动滚动。",
            detailReadOnly: "锁定任务本轮只读，不支持拖动编辑。",
            conflictHint: "当前草稿与同泳道任务或停机窗口发生重叠。",
            draftClean: "当前没有本地草稿",
            draftDirty: "已本地调整 {count} 个任务",
            draftOnly: "这些改动仅存在于当前浏览器视图，尚未写回后端。",
            zoomStatus: "缩放 {percent}%",
            rowActivitySummary: "{taskCount} 个任务 · {downtimeCount} 个窗口",
            rowNoActivity: "当前无活动",
        },
        misc: {
            notPublished: "未发布",
            collapse: "收起",
            expand: "展开",
            product: "产品",
            resource: "资源",
            start: "开始",
            end: "结束",
            due: "交期",
            requested: "需求量",
            covered: "覆盖量",
            coverage: "覆盖状态",
            fullyCovered: "完全覆盖",
            partiallyCovered: "部分覆盖",
            duration: "时长",
            priority: "优先级",
            late: "是否延误",
            lateYes: "是（{minutes} 分钟）",
            lateNo: "否",
            pinned: "是否锁定",
            pinnedYes: "是",
            pinnedNo: "否",
            draft: "本地草稿",
            conflict: "冲突",
            editMode: "编辑状态",
            editable: "可拖动",
            readOnly: "只读",
            yes: "是",
            no: "否",
            source: "来源",
            noDescription: "无说明",
            laneMeta: "{resourceType} · 轨道 {sortOrder}",
            lateCount: "{count} 个延误",
        },
        enums: {
            versionStatus: {
                DRAFT: "草稿",
                READY_FOR_RELEASE: "待审批",
                APPROVED: "已审批",
                REJECTED: "已驳回",
                RELEASED: "已生效",
                ARCHIVED: "已归档",
                ROLLED_BACK: "已回退",
            },
            auditEventType: {
                READY_FOR_RELEASE: "提交审批",
                APPROVE: "审批通过",
                REJECT: "驳回",
                PUBLISH: "发布",
                ROLLBACK: "回退",
            },
            diffTaskChangeType: {
                ADDED: "新增",
                REMOVED: "移除",
                MODIFIED: "调整",
            },
            jobStatus: {
                CREATED: "已创建",
                QUEUED: "排队中",
                RUNNING: "运行中",
                SUCCEEDED: "已完成",
                FAILED: "失败",
                TIMEOUT: "超时",
                CANCELLED: "已取消",
            },
            userRole: {
                ADMIN: "管理员",
                PLANNER: "排产员",
                APPROVER: "审批者",
                VIEWER: "只读",
            },
            triggerType: {
                MANUAL: "手动触发",
                SCHEDULED: "定时触发",
                EVENT: "事件触发",
                THRESHOLD: "阈值触发",
            },
            resourceType: {
                REACTOR: "反应釜",
                TANK: "罐体",
                FILTER: "过滤器",
                DRYER: "干燥机",
                OTHER: "其他",
            },
        },
    },
    en: {
        meta: {
            title: "APS Control Deck",
        },
        auth: {
            brandEyebrow: "APS",
            brandTitle: "APS Control Deck",
            brandSubtitle: "Chemical production scheduling workspace",
            eyebrow: "APS",
            title: "APS Control Deck",
            description: "Chemical production scheduling workspace",
            visualEyebrow: "Chemical Planning",
            visualTitle: "Keep plant rhythm and plan versions aligned",
            visualDescription: "A calm entry point for batch rhythm, downtime windows, and schedule versions.",
            visualChipUnits: "Batch Steps",
            visualChipDowntime: "Asset Windows",
            visualChipVersions: "Plan Versions",
            statOperationsLabel: "Coverage",
            statOperationsValue: "Reactors, tanks, filters, dryers",
            statControlLabel: "Flow",
            statControlValue: "One place for changeovers, waits, and downtime",
            statLanguageLabel: "Language",
            statLanguageValue: "Chinese / English",
            noteLanguageLabel: "Language",
            noteLanguageValue: "Switch between Chinese and English",
            noteSecurityLabel: "Access",
            noteSecurityValue: "A valid login session is required before schedule data is loaded",
            languageLabel: "Language",
            usernameLabel: "Username",
            usernamePlaceholder: "Enter username",
            passwordLabel: "Password",
            passwordPlaceholder: "Enter password",
            submit: "Enter Workspace",
            submitLoading: "Entering...",
            invalidCredentials: "Invalid username or password.",
            sessionExpired: "Your session expired. Please sign in again.",
            signedOut: "You have signed out.",
            genericError: "Sign-in failed. Please try again.",
            serviceUnavailable: "The backend is not reachable right now. Confirm that the backend is running on port 8081.",
        },
        hero: {
            eyebrow: "APS POC",
            title: "Control Deck",
            description: "Inspect schedule versions, launch the sample scenario, and read the current Gantt result directly from the backend orchestration service.",
        },
        actions: {
            accountMenu: "Account Menu",
            accountSettings: "Account Settings",
            approve: "Approve Version",
            reject: "Reject Version",
            cancelJob: "Cancel Job",
            retryJob: "Retry Job",
            deleteDraft: "Delete Draft",
            selectAllDrafts: "Select Drafts",
            clearDraftSelection: "Clear Selection",
            deleteDrafts: "Delete Drafts",
            deleteDraftsSelected: "Delete Drafts ({count})",
            versionsAdd: "Add",
            openModel: "New Schedule Request",
            logout: "Sign Out",
            readyForRelease: "Submit for Approval",
            saveReleaseNote: "Save Release Note",
            runSample: "Run Sample Schedule",
            trialSolve: "Trial Solve",
            refresh: "Refresh Data",
            publish: "Publish Version",
            rollback: "Roll Back to This Version",
            compareVersions: "Compare",
            zoomOut: "Zoom Out",
            fitTimeline: "Fit",
            zoomIn: "Zoom In",
            resetDraft: "Reset Draft",
        },
        account: {
            eyebrow: "Account",
            title: "Update Credentials",
            description: "Update the username used for sign-in, and optionally set a new password at the same time.",
            close: "Close",
            cancel: "Cancel",
            save: "Save Changes",
            saveLoading: "Saving...",
            usernameLabel: "Username",
            usernamePlaceholder: "Enter a new username",
            currentPasswordLabel: "Current Password",
            currentPasswordPlaceholder: "Enter current password",
            newPasswordLabel: "New Password",
            newPasswordPlaceholder: "Leave blank to keep the current password",
            confirmPasswordLabel: "Confirm New Password",
            confirmPasswordPlaceholder: "Re-enter the new password",
            passwordHint: "Leave the new password fields blank if you only want to change the username.",
            usernameRequired: "Enter a username.",
            currentPasswordRequired: "Enter the current password.",
            passwordMismatch: "The new password confirmation does not match.",
            passwordTooShort: "The new password must be at least 6 characters.",
            updateSuccess: "Credentials updated.",
            invalidCurrentPassword: "The current password is incorrect.",
            genericError: "Saving the credentials failed. Please try again.",
        },
        model: {
            eyebrow: "Business Modeling",
            title: "Create Schedule Request",
            description: "Capture a minimal scheduling scenario with resources, tasks, downtime windows, and solver controls, then submit it through the shared scheduling API.",
            close: "Close",
            cancel: "Cancel",
            submit: "Submit Schedule",
            submitLoading: "Submitting...",
            saveDraft: "Save Draft",
            restoreDraft: "Restore Draft",
            exportTemplate: "Export Excel Template",
            exportJson: "Export JSON",
            importTabular: "Import CSV/Excel",
            importJson: "Import JSON",
            loadTemplate: "Load Template",
            addResource: "Add Resource",
            addTask: "Add Task",
            addDowntime: "Add Downtime",
            removeRow: "Remove",
            selectPlaceholder: "Select",
            basicSection: "Basic Scenario",
            basicHint: "Set the schedule window, objective weights, and solver controls before entering business data.",
            dataVersionLabel: "Data Version",
            dataVersionPlaceholder: "For example: uat_v1_20260505",
            importHint: "Imports the standard `/api/v1/schedule/jobs` JSON request shape and backfills the current tables.",
            batchFlowTitle: "Formal Import Batches",
            batchFlowDescription: "Upload the formal Resource / Recipe / Demand batches here. When the required batches share one data version, submit will generate a scenario first and then create the scheduling job from the generated scheduleRequest.",
            batchFlowHint: "The formal batch flow only uses the uploaded batches here and does not mix in the manual rows below.",
            batchNoImport: "No import batch uploaded yet.",
            batchDownloadErrors: "Download error report",
            batchStatusLine: "Batch {importId}\nStatus {status} · Version {dataVersion}\nSuccess {successCount} · Failure {failureCount}",
            batchImportedSuccess: "{kind} imported as batch {importId} (dataVersion: {dataVersion}).",
            batchImportFailed: "{kind} import failed and an error report was recorded: {message}",
            batchFlowSubmitting: "Generating a scenario from the formal import batches and creating the scheduling job.",
            batchFlowNoScheduleRequest: "The scenario was generated, but all demand is already covered by inventory so no scheduling job was submitted.",
            batchResourcesTitle: "Resources Batch",
            batchRecipesTitle: "Recipes Batch",
            batchDemandsTitle: "Demands Batch",
            batchInventoryBalancesTitle: "Inventory Balances Batch",
            batchDowntimesTitle: "Downtimes Batch",
            batchSetupRulesTitle: "Setup Rules Batch",
            scenarioNameLabel: "Scenario Name",
            scenarioNamePlaceholder: "For example: polymer_weekday_window",
            scheduleStartLabel: "Schedule Start",
            horizonLabel: "Horizon Minutes",
            sortOrderLabel: "Sort Order",
            resourceTypeLabel: "Resource Type",
            productCodeLabel: "Product Code",
            candidateResourcesLabel: "Candidate Resources",
            pinnedResourceLabel: "Pinned Resource",
            pinnedStartLabel: "Pinned Start Minutes",
            downtimeTypeLabel: "Downtime Type",
            tardinessLabel: "Tardiness Weight",
            earlinessLabel: "Earliness Weight",
            makespanLabel: "Makespan Weight",
            timeLimitLabel: "Time Limit Seconds",
            workersLabel: "Search Workers",
            resourcesTitle: "Resources",
            resourcesDescription: "Maintain each schedulable asset in its own row, including identifier, label, type, and order.",
            tasksTitle: "Tasks",
            tasksDescription: "Define each task row with due offsets and candidate resources. Candidate resources use comma-separated IDs; pinned fields are optional.",
            downtimesTitle: "Downtime Windows",
            downtimesDescription: "Optional. Capture maintenance, inspection, or blocking windows per resource as rows. Start and end values are minutes from the schedule start.",
            tableResizeHint: "Drag the divider on the right side of a header to resize a field, or drag the header itself to reorder columns.",
            columnId: "ID",
            columnLabel: "Label",
            columnResourceType: "Type",
            columnSortOrder: "Sort Order",
            columnActions: "Actions",
            columnProductCode: "Product",
            columnDurationMinutes: "Duration",
            columnDueMinutes: "Due",
            columnPriority: "Priority",
            columnCandidateResources: "Candidate Resources",
            columnPinnedResource: "Pinned Resource",
            columnPinnedStartMinutes: "Pinned Start",
            columnResourceId: "Resource ID",
            columnStartMinutes: "Start",
            columnEndMinutes: "End",
            columnDowntimeType: "Downtime Type",
            columnSource: "Source",
            columnDescription: "Description",
            validationScenarioRequired: "Enter a scenario name.",
            validationScheduleStartRequired: "Choose a schedule start time.",
            validationScheduleStartInvalid: "The schedule start time is invalid.",
            validationPositiveIntegerField: "{field} must be a positive integer.",
            validationNonNegativeIntegerField: "{field} must be a non-negative integer.",
            validationAtLeastOneLine: "Enter at least one row in {section}.",
            validationInvalidLine: "{section} line {line} is invalid: {reason}",
            draftSaved: "The local draft has been saved.",
            draftRestored: "The local draft has been restored into the current tables.",
            draftUnavailable: "No saved local draft is available in this browser.",
            draftStorageError: "Saving the local draft failed. Check browser storage availability.",
            templateExported: "The Excel template download has started.",
            exportSuccess: "The standard JSON request has been exported.",
            resourcesImported: "Resource rows were imported from the tabular file.",
            tasksImported: "Task rows were imported from the tabular file.",
            downtimesImported: "Downtime rows were imported from the tabular file.",
            importSuccess: "The JSON file was imported into the current tables.",
            importInvalidJson: "Import failed: the file is not valid JSON.",
            importInvalidStructure: "Import failed: the file does not match the scheduling request shape.",
            reasonRequiredField: "{field} is required",
            reasonDuplicateId: "duplicate id {value}",
            reasonUnknownResourceType: "resource type must be one of {value}",
            reasonCandidateResourceRequired: "at least one candidate resource is required",
            reasonUnknownResource: "resource {value} does not exist",
            reasonPinnedResourceRequired: "a pinned resource is required when a pinned start is set",
            reasonPinnedResourceCandidate: "the pinned resource must also be listed as a candidate resource",
            reasonEndAfterStart: "end minutes must be greater than start minutes",
            templateLoaded: "An editable template has been loaded.",
        },
        session: {
            signedInAs: "Signed in as",
            roleUnknown: "Role unavailable",
        },
        job: {
            latestJobLabel: "Latest Job",
            idleTitle: "Idle",
            idleDetail: "No background job is being tracked.",
            modelSubmittingTitle: "Submitting Model",
            modelSubmittingDetail: "Creating a scheduling job from the business modeling form.",
            submittingTitle: "Submitting",
            submittingDetail: "Creating the sample scheduling job.",
            trialSubmittingTitle: "Trial Solving",
            trialSubmittingDetail: "Creating a trial solve job from the current draft.",
            trialAcceptedTitle: "Trial Solve Accepted",
            trialUnavailableDetail: "The trial solve endpoint is not active yet. Restart the backend on port 8081 and try again.",
            acceptedTitle: "Job Accepted",
            acceptedDetail: "Tracking job {jobId} until the version is created.",
            finishedTitle: "Solve Finished",
            finishedDetail: "Version {versionId} is ready.",
            failedTitle: "Solve Failed",
            failedFallback: "The solver returned a failure.",
            draftDeleteSuccessTitle: "Draft Deleted",
            draftDeleteSuccessDetail: "{count} draft version(s) have been removed from the list.",
            draftDeleteFailedTitle: "Draft Delete Failed",
            readyForReleaseSuccessTitle: "Version Ready for Release",
            readyForReleaseSuccessDetail: "The selected version is now waiting for approval.",
            readyForReleaseFailedTitle: "Submit for Release Failed",
            approveSuccessTitle: "Version Approved",
            approveSuccessDetail: "The selected version is now ready to publish.",
            approveFailedTitle: "Approval Failed",
            rejectSuccessTitle: "Version Rejected",
            rejectSuccessDetail: "The selected version has been rejected and can be resubmitted after updates.",
            rejectFailedTitle: "Reject Failed",
            publishSuccessTitle: "Version Published",
            publishSuccessDetail: "The selected version is now marked as the active plan.",
            publishFailedTitle: "Publish Failed",
            rollbackSuccessTitle: "Version Rolled Back",
            rollbackSuccessDetail: "The selected historical version is active again.",
            rollbackFailedTitle: "Rollback Failed",
            cancelSuccessTitle: "Job Cancelled",
            cancelSuccessDetail: "The current background job is now marked as cancelled.",
            cancelFailedTitle: "Cancel Job Failed",
            retrySuccessTitle: "Job Retried",
            retrySuccessDetail: "A new background job was created from the original request.",
            retryFailedTitle: "Retry Job Failed",
            releaseNoteSavedTitle: "Release Note Saved",
            releaseNoteSavedDetail: "The selected version note has been updated.",
            releaseNoteSaveFailedTitle: "Release Note Save Failed",
            pollingErrorTitle: "Polling Error",
            submissionFailedTitle: "Submission Failed",
            refreshFailedTitle: "Refresh Failed",
            refreshedTitle: "Refreshed",
            refreshedDetail: "Latest version data loaded from the backend.",
            runningDetail: "Job {jobId} is still running in the background.",
        },
        summary: {
            totalVersionsLabel: "Versions",
            totalVersionsFootnote: "Persisted schedule snapshots",
            publishedVersionsLabel: "Released",
            publishedVersionsFootnote: "Current live plan count",
            selectedStatusLabel: "Selected Status",
            lastRefreshLabel: "Last Refresh",
            lastRefreshFootnote: "Client-side fetch timestamp",
            none: "None",
            chooseVersion: "Choose a version to inspect.",
            waiting: "Waiting",
        },
        versions: {
            eyebrow: "Schedule Versions",
            title: "Snapshots",
            empty: "No versions available yet. Run the sample schedule to create one.",
            draftCount: "Drafts {count}",
            deleteDraftsConfirm: "Delete the selected {count} draft version(s)? This action cannot be undone.",
            collapse: "Collapse version snapshots",
            expand: "Expand version snapshots",
            createdLabel: "Created",
            publishedLabel: "Released",
            snapshotId: "Snapshot ID",
        },
        viewer: {
            eyebrow: "Version Detail",
            emptyTitle: "No version selected",
            emptySubtitle: "Generate the sample scenario or pick an existing version from the left panel.",
            statusLine: "{status} version",
            createdAt: "Created {value}",
            publishedAt: "Released {value}",
            inventoryCoverageLine: "Inventory coverage: {count} demand(s) · {coveredQuantity}/{requestedQuantity} units",
        },
        governance: {
            compareEyebrow: "Version Diff",
            compareTitle: "Compare Plans",
            compareLabel: "Compare With",
            compareUnavailable: "No other version is available for comparison",
            diffEmpty: "Choose another version to inspect the delta.",
            diffError: "Failed to load version diff: {message}",
            diffNoChanges: "No task changes were detected between these versions.",
            changedTasksTitle: "Changed Tasks",
            historyEyebrow: "Governance History",
            historyTitle: "Version Governance Audit",
            historyEmpty: "No governance events have been recorded yet.",
            historyError: "Failed to load audit history: {message}",
            historyFilteredEmpty: "No governance events match the current filters.",
            historyFilterLabel: "Event Type",
            historyFilterAll: "All Events",
            historySearchPlaceholder: "Search version, actor, or comment",
            releaseNoteEyebrow: "Release Note",
            releaseNoteTitle: "Release Note and Governance Comment",
            releaseNoteLabel: "Release Note",
            releaseNotePlaceholder: "Summarize what changed, what to watch, and how this version should be used.",
            releaseNoteHint: "The note stays attached to the selected version. Save it before publish or include it when publishing.",
            actionCommentLabel: "Submit / Approve / Publish / Rollback Comment",
            actionCommentPlaceholder: "Explain why this submit, approve, reject, publish, or rollback is being performed.",
            actionCommentHint: "Required for submit, approve, reject, publish, and rollback. The comment is stored in the governance audit trail.",
            commentRequired: "Enter a governance comment first.",
            actorLine: "Actor: {actor}",
            commentLine: "Comment: {comment}",
            summaryChangedTasks: "Changed Tasks",
            summaryMovedTasks: "Time Moves",
            summaryAddedTasks: "Added Tasks",
            summaryRemovedTasks: "Removed Tasks",
            summaryTotalShift: "Total Shift",
            summaryMaxShift: "Max Shift",
            kpiWeightedTardiness: "Weighted Tardiness",
            kpiMakespan: "Makespan",
            kpiLateTasks: "Late Tasks",
            kpiEfficiency: "Efficiency",
            baseVersion: "Base Version",
            targetVersion: "Target Version",
            previousPublished: "Previous Live Version",
            noPreviousPublished: "First activation",
            historyReadyForRelease: "Submitted {target} for approval",
            historyApproved: "Approved {target}",
            historyRejected: "Rejected {target}",
            historyPublishedFrom: "Switched from {previous} to {target}",
            historyRollbackFrom: "Rolled back from {previous} to {target}",
            historyPublishedInitial: "Published {target} for the first time",
            historyRollbackInitial: "Set {target} as the active plan",
            taskAdded: "Added to {target}",
            taskRemoved: "Removed from {base}",
            taskMoved: "Start {start}, duration {duration}, tardiness {tardiness}",
            taskReassigned: "Resource {base} -> {target}",
            taskWindow: "{start} -> {end}",
            taskPinnedChangedLocked: "Was unpinned in base, now pinned",
            taskPinnedChangedUnlocked: "Was pinned in base, now unpinned",
            taskPinnedChanged: "Pinned state changed",
            diffTaskFocusTitle: "Changed Task Focus",
            diffTaskFocusedDetail: "Focused current-version task {task}.",
            diffTaskRowFocusedDetail: "The current version no longer has a task bar, so the related row {row} was focused instead.",
            diffTaskFocusUnavailable: "Task {task} no longer exists in the current version, and no related row could be focused.",
            rowUnknown: "Unassigned",
        },
        kpi: {
            weightedTardiness: "Weighted Tardiness",
            makespan: "Makespan",
            lateTasks: "Late Tasks",
            avgUtilization: "Schedule Efficiency",
        },
        gantt: {
            eyebrow: "Gantt View",
            title: "Resource Timeline",
            metricsPanel: "Metrics",
            legendPanel: "Legend",
            detailPanel: "Detail",
            labelPaneLocked: "Columns Locked",
            labelPaneUnlocked: "Columns Scroll",
            labelPaneLock: "Lock resource-to-finish columns",
            labelPaneUnlock: "Unlock resource-to-finish columns",
            dragModeMove: "Move Task",
            dragModeResizeStart: "Adjust Start",
            dragModeResizeEnd: "Adjust Finish",
            dragSnapLabel: "Snap",
            dragSnapValue: "{minutes} min",
            dragSnapDisabled: "Free (Shift)",
            dragStatusClear: "Current drop is clear",
            dragStatusConflict: "Current drop overlaps a task or downtime on the target row",
            legendTask: "Task",
            legendLateTask: "Late Task",
            legendPinned: "Pinned",
            legendDraft: "Draft",
            legendConflict: "Conflict",
            legendDowntime: "Downtime",
            inventoryCoverageTitle: "Inventory Coverage",
            inventoryCoverageType: "Stock",
            inventoryCoverageSummary: "{count} demand(s) · cover {coveredQuantity}/{requestedQuantity}",
            empty: "No version data loaded yet.",
            noSelection: "Select a version to render its resource timeline.",
            noRows: "No row data returned for this version.",
            resources: "Resources",
            tableRowNo: "No.",
            tableName: "Resource",
            tableType: "Type",
            tableSpan: "Span",
            tableStart: "Start",
            tableFinish: "Finish",
            detailEyebrow: "Task Detail",
            detailTitle: "Selected Task",
            detailEmpty: "Select a task bar to inspect its details.",
            detailPinStatusPinned: "This task will stay pinned to its current slot during trial solve.",
            detailPinStatusUnlocked: "This task can be rescheduled during trial solve without forcing its row or start time.",
            detailPinAction: "Pin at current slot",
            detailUnpinAction: "Set as unpinned",
            detailHint: "Unlocked tasks can be dragged horizontally to change time, moved across resource rows, snapped to the current timeline scale, resized from either edge, and the view auto-scrolls near its boundary.",
            detailReadOnly: "Pinned tasks are read-only in this round and cannot be dragged.",
            conflictHint: "The current draft overlaps another task or a downtime window in the same lane.",
            draftClean: "No local draft",
            draftDirty: "{count} task(s) adjusted locally",
            draftOnly: "These edits only exist in the current browser view and are not saved to the backend.",
            zoomStatus: "Zoom {percent}%",
            rowActivitySummary: "{taskCount} task(s) · {downtimeCount} window(s)",
            rowNoActivity: "No scheduled activity",
        },
        misc: {
            notPublished: "Not published",
            collapse: "Collapse",
            expand: "Expand",
            product: "Product",
            resource: "Resource",
            start: "Start",
            end: "End",
            due: "Due",
            requested: "Requested",
            covered: "Covered",
            coverage: "Coverage",
            fullyCovered: "Fully Covered",
            partiallyCovered: "Partially Covered",
            duration: "Duration",
            priority: "Priority",
            late: "Late",
            lateYes: "Yes ({minutes} min)",
            lateNo: "No",
            pinned: "Pinned",
            pinnedYes: "Yes",
            pinnedNo: "No",
            draft: "Draft",
            conflict: "Conflict",
            editMode: "Edit Mode",
            editable: "Draggable",
            readOnly: "Read-only",
            yes: "Yes",
            no: "No",
            source: "Source",
            noDescription: "No description",
            laneMeta: "{resourceType} · lane {sortOrder}",
            lateCount: "{count} late",
        },
        enums: {
            versionStatus: {
                DRAFT: "Draft",
                READY_FOR_RELEASE: "Pending Approval",
                APPROVED: "Approved",
                REJECTED: "Rejected",
                RELEASED: "Released",
                ARCHIVED: "Archived",
                ROLLED_BACK: "Rolled Back",
            },
            auditEventType: {
                READY_FOR_RELEASE: "Submitted",
                APPROVE: "Approved",
                REJECT: "Rejected",
                PUBLISH: "Publish",
                ROLLBACK: "Rollback",
            },
            diffTaskChangeType: {
                ADDED: "Added",
                REMOVED: "Removed",
                MODIFIED: "Modified",
            },
            jobStatus: {
                CREATED: "Created",
                QUEUED: "Queued",
                RUNNING: "Running",
                SUCCEEDED: "Succeeded",
                FAILED: "Failed",
                TIMEOUT: "Timed Out",
                CANCELLED: "Cancelled",
            },
            userRole: {
                ADMIN: "Admin",
                PLANNER: "Planner",
                APPROVER: "Approver",
                VIEWER: "Viewer",
            },
            triggerType: {
                MANUAL: "Manual",
                SCHEDULED: "Scheduled",
                EVENT: "Event",
                THRESHOLD: "Threshold",
            },
            resourceType: {
                REACTOR: "Reactor",
                TANK: "Tank",
                FILTER: "Filter",
                DRYER: "Dryer",
                OTHER: "Other",
            },
        },
    },
};

function resolveApiBaseUrl() {
    const configured = document.querySelector('meta[name="aps-api-base"]')?.content?.trim();
    if (configured) {
        return configured.replace(/\/$/, "");
    }

    const { protocol, hostname, port } = window.location;
    if (port === "8080") {
        return `${protocol}//${hostname}:8081`;
    }

    if (port) {
        return `${protocol}//${hostname}:${port}`;
    }

    return window.location.origin;
}

const API_BASE_URL = resolveApiBaseUrl();

const GANTT_MIN_TIMELINE_WIDTH = 960;
const GANTT_MAX_TIMELINE_WIDTH = 2400;
const GANTT_PIXELS_PER_MINUTE = 1.15;
const GANTT_MIN_ZOOM = 0.5;
const GANTT_MAX_ZOOM = 3;
const GANTT_ZOOM_STEP = 1.2;
const MINUTE_MS = 60 * 1000;
const GANTT_DRAG_SNAP_MS = 15 * MINUTE_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const GANTT_MIN_TASK_DURATION_MS = MINUTE_MS;
const GANTT_DRAG_THRESHOLD_PX = 3;
const GANTT_AUTO_SCROLL_EDGE_PX = 72;
const GANTT_AUTO_SCROLL_MIN_STEP_PX = 4;
const GANTT_AUTO_SCROLL_MAX_STEP_PX = 14;
const GANTT_AUTO_SCROLL_HORIZONTAL_LEAD_PX = 56;
const GANTT_AUTO_SCROLL_VERTICAL_EDGE_PX = 56;
const GANTT_AUTO_SCROLL_MOVE_VERTICAL_EDGE_PX = 12;
const GANTT_AUTO_SCROLL_VERTICAL_MIN_STEP_PX = 6;
const GANTT_AUTO_SCROLL_VERTICAL_MAX_STEP_PX = 18;
const GANTT_AUTO_SCROLL_VERTICAL_INTENT_PX = 16;
const GANTT_AUTO_SCROLL_OUTSIDE_BOOST_PX = 8;
const GANTT_AUTO_SCROLL_MOVE_HORIZONTAL_MULTIPLIER = 0.88;
const GANTT_AUTO_SCROLL_MOVE_VERTICAL_MULTIPLIER = 0.72;
const GANTT_CROSS_ROW_INTENT_PX = 18;
const GANTT_CROSS_ROW_COMMIT_MIN_PX = 16;
const GANTT_CROSS_ROW_COMMIT_MAX_PX = 34;
const GANTT_CROSS_ROW_COMMIT_RATIO = 0.34;
const GANTT_CROSS_ROW_STICKY_MS = 72;
const GANTT_CLICK_GUARD_MS = 220;
const GANTT_DRAFT_HISTORY_LIMIT = 200;
const GANTT_ROW_HEIGHT_MIN = 34;
const GANTT_ROW_HEIGHT_MAX = 320;
const GANTT_TABLE_COLUMNS = [
    { key: "rowNo", labelKey: "gantt.tableRowNo", defaultWidth: 72, minWidth: 48, maxWidth: 120, tabletWidth: 64, mobileWidth: 56 },
    { key: "name", labelKey: "gantt.tableName", defaultWidth: 276, minWidth: 132, maxWidth: 520, tabletWidth: 232, mobileWidth: 184 },
    { key: "type", labelKey: "gantt.tableType", defaultWidth: 124, minWidth: 64, maxWidth: 220, tabletWidth: 104, mobileWidth: 82 },
    { key: "span", labelKey: "gantt.tableSpan", defaultWidth: 132, minWidth: 72, maxWidth: 220, tabletWidth: 108, mobileWidth: 84 },
    { key: "start", labelKey: "gantt.tableStart", defaultWidth: 176, minWidth: 96, maxWidth: 280, tabletWidth: 140, mobileWidth: 112 },
    { key: "finish", labelKey: "gantt.tableFinish", defaultWidth: 176, minWidth: 96, maxWidth: 280, tabletWidth: 140, mobileWidth: 112 },
];

class ApiError extends Error {
    constructor(status, message, payload = null) {
        super(message);
        this.status = status;
        this.payload = payload;
        this.code = payload?.code || null;
    }
}

const state = {
    locale: loadLocale(),
    versions: [],
    selectedVersionId: null,
    selectedVersion: null,
    selectedDraftVersionIds: new Set(),
    isDeleteDraftVersionsPending: false,
    versionAuditHistory: [],
    versionAuditHistoryError: null,
    versionAuditHistoryFilter: "ALL",
    versionAuditHistoryQuery: "",
    selectedVersionDiff: null,
    selectedVersionDiffError: null,
    selectedVersionDiffTaskId: null,
    selectedVersionDiffFocusTaskId: null,
    selectedVersionDiffFocusRowId: null,
    selectedVersionDiffFocusChangeType: null,
    selectedVersionDiffFocusTimer: null,
    selectedVersionCompareBaseId: null,
    versionsPanelCollapsed: loadVersionsPanelCollapsed(),
    isKpiCollapsed: loadStoredFlag(STORAGE_KEYS.kpiCollapsed),
    isGanttLegendCollapsed: loadStoredFlag(STORAGE_KEYS.ganttLegendCollapsed),
    isGanttDetailCollapsed: loadStoredFlag(STORAGE_KEYS.ganttDetailCollapsed),
    ganttDetailHeight: loadStoredNumber(STORAGE_KEYS.ganttDetailHeight, 256, 140, 520),
    selectedBarId: null,
    selectedRowId: null,
    ganttZoom: 0.5,
    ganttZoomMode: "manual",
    draftBars: {},
    draftHistory: [],
    hasDraftChanges: false,
    ganttViewModel: null,
    modelTableLayouts: loadModelTableLayouts(),
    ganttColumnWidths: loadGanttColumnWidths(),
    ganttRowHeights: loadGanttRowHeights(),
    ganttLabelsLocked: loadGanttLabelsLocked(),
    modelColumnResizeSession: null,
    modelColumnDragSession: null,
    ganttColumnResizeSession: null,
    ganttRowResizeSession: null,
    dragSession: null,
    taskClickGuardUntil: 0,
    pendingTaskFocusBarId: null,
    pendingGanttFocusTarget: null,
    lastGanttFocusTarget: null,
    ganttFocusRestoreToken: 0,
    currentJob: null,
    currentUser: null,
    currentRole: null,
    isAuthenticated: false,
    pollTimer: null,
    lastRefreshAt: null,
    isLoginPending: false,
    isModelPending: false,
    isAccountPending: false,
    modelDialogOpen: false,
    modelBatchImports: createEmptyModelBatchImports(),
    accountDialogOpen: false,
    accountMenuOpen: false,
    jobStatus: {
        titleKey: "job.idleTitle",
        detailKey: "job.idleDetail",
        params: {},
        detailText: null,
    },
    authFeedback: null,
    modelFeedback: null,
    accountFeedback: null,
};

const elements = {
    authShell: document.getElementById("auth-shell"),
    appShell: document.getElementById("app-shell"),
    localeButtons: Array.from(document.querySelectorAll("[data-locale-option]")),
    loginForm: document.getElementById("login-form"),
    usernameInput: document.getElementById("username-input"),
    passwordInput: document.getElementById("password-input"),
    loginButton: document.getElementById("login-button"),
    authFeedback: document.getElementById("auth-feedback"),
    sessionAvatar: document.getElementById("session-avatar"),
    sessionUser: document.getElementById("session-user"),
    sessionRole: document.getElementById("session-role"),
    accountMenu: document.getElementById("account-menu"),
    accountMenuButton: document.getElementById("account-menu-button"),
    accountMenuPanel: document.getElementById("account-menu-panel"),
    accountSettingsButton: document.getElementById("account-settings-button"),
    logoutButton: document.getElementById("logout-button"),
    openModelButton: document.getElementById("open-model-button"),
    modelOverlay: document.getElementById("model-overlay"),
    modelCloseButton: document.getElementById("model-close-button"),
    modelCancelButton: document.getElementById("model-cancel-button"),
    modelSaveDraftButton: document.getElementById("model-save-draft-button"),
    modelRestoreDraftButton: document.getElementById("model-restore-draft-button"),
    modelExportTemplateButton: document.getElementById("model-export-template-button"),
    modelExportButton: document.getElementById("model-export-button"),
    modelResourceImportInput: document.getElementById("model-resource-import-input"),
    modelResourceImportButton: document.getElementById("model-resource-import-button"),
    modelTaskImportInput: document.getElementById("model-task-import-input"),
    modelTaskImportButton: document.getElementById("model-task-import-button"),
    modelDowntimeImportInput: document.getElementById("model-downtime-import-input"),
    modelDowntimeImportButton: document.getElementById("model-downtime-import-button"),
    modelImportInput: document.getElementById("model-import-input"),
    modelImportButton: document.getElementById("model-import-button"),
    modelTemplateButton: document.getElementById("model-template-button"),
    modelAddResourceButton: document.getElementById("model-add-resource-button"),
    modelAddTaskButton: document.getElementById("model-add-task-button"),
    modelAddDowntimeButton: document.getElementById("model-add-downtime-button"),
    modelForm: document.getElementById("model-form"),
    modelScenarioNameInput: document.getElementById("model-scenario-name-input"),
    modelDataVersionInput: document.getElementById("model-data-version-input"),
    modelScheduleStartInput: document.getElementById("model-schedule-start-input"),
    modelHorizonInput: document.getElementById("model-horizon-input"),
    modelTardinessInput: document.getElementById("model-tardiness-input"),
    modelEarlinessInput: document.getElementById("model-earliness-input"),
    modelMakespanInput: document.getElementById("model-makespan-input"),
    modelTimeLimitInput: document.getElementById("model-time-limit-input"),
    modelWorkersInput: document.getElementById("model-workers-input"),
    modelBatchResourcesInput: document.getElementById("model-batch-resources-input"),
    modelBatchResourcesButton: document.getElementById("model-batch-resources-button"),
    modelBatchResourcesStatus: document.getElementById("model-batch-resources-status"),
    modelBatchResourcesErrorsLink: document.getElementById("model-batch-resources-errors-link"),
    modelBatchRecipesInput: document.getElementById("model-batch-recipes-input"),
    modelBatchRecipesButton: document.getElementById("model-batch-recipes-button"),
    modelBatchRecipesStatus: document.getElementById("model-batch-recipes-status"),
    modelBatchRecipesErrorsLink: document.getElementById("model-batch-recipes-errors-link"),
    modelBatchDemandsInput: document.getElementById("model-batch-demands-input"),
    modelBatchDemandsButton: document.getElementById("model-batch-demands-button"),
    modelBatchDemandsStatus: document.getElementById("model-batch-demands-status"),
    modelBatchDemandsErrorsLink: document.getElementById("model-batch-demands-errors-link"),
    modelBatchInventoryBalancesInput: document.getElementById("model-batch-inventory-balances-input"),
    modelBatchInventoryBalancesButton: document.getElementById("model-batch-inventory-balances-button"),
    modelBatchInventoryBalancesStatus: document.getElementById("model-batch-inventory-balances-status"),
    modelBatchInventoryBalancesErrorsLink: document.getElementById("model-batch-inventory-balances-errors-link"),
    modelBatchDowntimesInput: document.getElementById("model-batch-downtimes-input"),
    modelBatchDowntimesButton: document.getElementById("model-batch-downtimes-button"),
    modelBatchDowntimesStatus: document.getElementById("model-batch-downtimes-status"),
    modelBatchDowntimesErrorsLink: document.getElementById("model-batch-downtimes-errors-link"),
    modelBatchSetupRulesInput: document.getElementById("model-batch-setup-rules-input"),
    modelBatchSetupRulesButton: document.getElementById("model-batch-setup-rules-button"),
    modelBatchSetupRulesStatus: document.getElementById("model-batch-setup-rules-status"),
    modelBatchSetupRulesErrorsLink: document.getElementById("model-batch-setup-rules-errors-link"),
    modelResourcesTable: document.getElementById("model-resources-table"),
    modelResourcesBody: document.getElementById("model-resources-body"),
    modelTasksTable: document.getElementById("model-tasks-table"),
    modelTasksBody: document.getElementById("model-tasks-body"),
    modelDowntimesTable: document.getElementById("model-downtimes-table"),
    modelDowntimesBody: document.getElementById("model-downtimes-body"),
    modelResourceRowTemplate: document.getElementById("model-resource-row-template"),
    modelTaskRowTemplate: document.getElementById("model-task-row-template"),
    modelDowntimeRowTemplate: document.getElementById("model-downtime-row-template"),
    modelFeedback: document.getElementById("model-feedback"),
    modelSubmitButton: document.getElementById("model-submit-button"),
    accountOverlay: document.getElementById("account-overlay"),
    accountCloseButton: document.getElementById("account-close-button"),
    accountCancelButton: document.getElementById("account-cancel-button"),
    accountForm: document.getElementById("account-form"),
    accountUsernameInput: document.getElementById("account-username-input"),
    accountCurrentPasswordInput: document.getElementById("account-current-password-input"),
    accountNewPasswordInput: document.getElementById("account-new-password-input"),
    accountConfirmPasswordInput: document.getElementById("account-confirm-password-input"),
    accountFeedback: document.getElementById("account-feedback"),
    accountSaveButton: document.getElementById("account-save-button"),
    runSampleButton: document.getElementById("run-sample-button"),
    refreshButton: document.getElementById("refresh-button"),
    versionsOpenModelButton: document.getElementById("versions-open-model-button"),
    selectAllDraftVersionsButton: document.getElementById("select-all-draft-versions-button"),
    deleteDraftVersionsButton: document.getElementById("delete-draft-versions-button"),
    readyForReleaseButton: document.getElementById("ready-for-release-button"),
    approveButton: document.getElementById("approve-button"),
    rejectButton: document.getElementById("reject-button"),
    rollbackButton: document.getElementById("rollback-button"),
    publishButton: document.getElementById("publish-button"),
    versionReleaseNoteInput: document.getElementById("version-release-note-input"),
    versionReleaseNoteSaveButton: document.getElementById("version-release-note-save-button"),
    versionActionCommentInput: document.getElementById("version-action-comment-input"),
    versionCompareSelect: document.getElementById("version-compare-select"),
    versionCompareButton: document.getElementById("version-compare-button"),
    versionDiffEmpty: document.getElementById("version-diff-empty"),
    versionDiffContent: document.getElementById("version-diff-content"),
    versionDiffSummary: document.getElementById("version-diff-summary"),
    versionDiffKpis: document.getElementById("version-diff-kpis"),
    versionDiffTaskList: document.getElementById("version-diff-task-list"),
    versionHistoryFilterSelect: document.getElementById("version-history-filter-select"),
    versionHistorySearchInput: document.getElementById("version-history-search-input"),
    versionHistoryEmpty: document.getElementById("version-history-empty"),
    versionHistoryList: document.getElementById("version-history-list"),
    versionList: document.getElementById("version-list"),
    workspaceGrid: document.getElementById("workspace-grid"),
    versionsPanel: document.getElementById("versions-panel"),
    versionsPanelToggleButton: document.getElementById("versions-panel-toggle-button"),
    versionsPanelToggleIcon: document.getElementById("versions-panel-toggle-icon"),
    versionsPanelRail: document.getElementById("versions-panel-rail"),
    versionsDraftCountBadge: document.getElementById("versions-draft-count-badge"),
    versionsRailTotal: document.getElementById("versions-rail-total"),
    versionsRailPublished: document.getElementById("versions-rail-published"),
    versionsRailSelectedStatus: document.getElementById("versions-rail-selected-status"),
    kpiToggleButton: document.getElementById("kpi-toggle-button"),
    ganttLegend: document.getElementById("gantt-legend"),
    ganttLegendToggleButton: document.getElementById("gantt-legend-toggle-button"),
    ganttDetailCard: document.getElementById("gantt-detail-card"),
    ganttDetailToggleButton: document.getElementById("gantt-detail-toggle-button"),
    viewerTitle: document.getElementById("viewer-title"),
    viewerSubtitle: document.getElementById("viewer-subtitle"),
    kpiGrid: document.getElementById("kpi-grid"),
    ganttZoomOutButton: document.getElementById("gantt-zoom-out-button"),
    ganttFitButton: document.getElementById("gantt-fit-button"),
    ganttZoomInButton: document.getElementById("gantt-zoom-in-button"),
    ganttResetDraftButton: document.getElementById("gantt-reset-draft-button"),
    ganttTrialButton: document.getElementById("gantt-trial-button"),
    ganttLabelLockButton: document.getElementById("gantt-label-lock-button"),
    ganttLabelLockText: document.getElementById("gantt-label-lock-text"),
    ganttZoomValue: document.getElementById("gantt-zoom-value"),
    ganttDraftStatus: document.getElementById("gantt-draft-status"),
    ganttDragHud: document.getElementById("gantt-drag-hud"),
    ganttDragMode: document.getElementById("gantt-drag-mode"),
    ganttDragSnap: document.getElementById("gantt-drag-snap"),
    ganttDragStatus: document.getElementById("gantt-drag-status"),
    ganttDragStart: document.getElementById("gantt-drag-start"),
    ganttDragEnd: document.getElementById("gantt-drag-end"),
    ganttDragDuration: document.getElementById("gantt-drag-duration"),
    ganttDragResource: document.getElementById("gantt-drag-resource"),
    ganttDetailEmpty: document.getElementById("gantt-detail-empty"),
    ganttDetailContent: document.getElementById("gantt-detail-content"),
    ganttDetailTitle: document.getElementById("gantt-detail-title"),
    ganttDetailSubtitle: document.getElementById("gantt-detail-subtitle"),
    ganttDetailBadges: document.getElementById("gantt-detail-badges"),
    ganttDetailPinStatus: document.getElementById("gantt-detail-pin-status"),
    ganttDetailPinButton: document.getElementById("gantt-detail-pin-button"),
    ganttDetailGrid: document.getElementById("gantt-detail-grid"),
    ganttDetailHint: document.getElementById("gantt-detail-hint"),
    ganttEmptyState: document.getElementById("gantt-empty-state"),
    ganttScroll: document.getElementById("gantt-scroll"),
    ganttBoard: document.getElementById("gantt-board"),
    summaryTotalVersions: document.getElementById("summary-total-versions"),
    summaryPublishedVersions: document.getElementById("summary-published-versions"),
    summarySelectedStatus: document.getElementById("summary-selected-status"),
    summarySelectedName: document.getElementById("summary-selected-name"),
    summaryLastRefresh: document.getElementById("summary-last-refresh"),
    jobStatusText: document.getElementById("job-status-text"),
    jobStatusDetail: document.getElementById("job-status-detail"),
    jobCancelButton: document.getElementById("job-cancel-button"),
    jobRetryButton: document.getElementById("job-retry-button"),
    kpiTardiness: document.getElementById("kpi-tardiness"),
    kpiMakespan: document.getElementById("kpi-makespan"),
    kpiLateCount: document.getElementById("kpi-late-count"),
    kpiUtilization: document.getElementById("kpi-utilization"),
    versionItemTemplate: document.getElementById("version-item-template"),
};

function loadLocale() {
    const saved = window.localStorage.getItem(STORAGE_KEYS.locale);
    return saved && translations[saved] ? saved : DEFAULT_LOCALE;
}

function loadVersionsPanelCollapsed() {
    return window.localStorage.getItem(STORAGE_KEYS.versionsPanelCollapsed) === "1";
}

function loadStoredFlag(storageKey) {
    return window.localStorage.getItem(storageKey) === "1";
}

function loadStoredNumber(storageKey, fallback, min, max) {
    const value = Number(window.localStorage.getItem(storageKey));
    return clamp(Number.isFinite(value) ? value : fallback, min, max);
}

function getModelTableDefinition(tableKey) {
    return MODEL_TABLE_DEFINITIONS[tableKey] || null;
}

function getModelTableColumnDefinition(tableKey, columnKey) {
    return getModelTableDefinition(tableKey)?.columns.find((column) => column.key === columnKey) || null;
}

function buildDefaultModelTableLayout(tableKey) {
    const definition = getModelTableDefinition(tableKey);
    if (!definition) {
        return { order: [], widths: {} };
    }

    return {
        order: definition.columns.map((column) => column.key),
        widths: Object.fromEntries(definition.columns.map((column) => [column.key, column.defaultWidth])),
    };
}

function normalizeModelTableColumnWidth(tableKey, columnKey, value) {
    const column = getModelTableColumnDefinition(tableKey, columnKey);
    if (!column) {
        return 0;
    }

    const numericValue = Number(value);
    const fallback = column.defaultWidth;
    return clamp(
        Math.round(Number.isFinite(numericValue) ? numericValue : fallback),
        column.minWidth,
        column.maxWidth
    );
}

function normalizeModelTableOrder(tableKey, order) {
    const definition = getModelTableDefinition(tableKey);
    if (!definition) {
        return [];
    }

    const validKeys = definition.columns.map((column) => column.key);
    const normalized = [];
    if (Array.isArray(order)) {
        for (const key of order) {
            if (typeof key !== "string" || !validKeys.includes(key) || normalized.includes(key)) {
                continue;
            }
            normalized.push(key);
        }
    }

    for (const key of validKeys) {
        if (!normalized.includes(key)) {
            normalized.push(key);
        }
    }
    return normalized;
}

function normalizeModelTableLayout(tableKey, raw) {
    const definition = getModelTableDefinition(tableKey);
    if (!definition) {
        return { order: [], widths: {} };
    }

    const order = normalizeModelTableOrder(tableKey, raw?.order);
    const widths = Object.fromEntries(
        definition.columns.map((column) => [
            column.key,
            normalizeModelTableColumnWidth(
                tableKey,
                column.key,
                raw?.widths?.[column.key] ?? raw?.[column.key] ?? column.defaultWidth
            ),
        ])
    );

    return { order, widths };
}

function loadModelTableLayouts() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.modelTables);
        const parsed = raw ? JSON.parse(raw) : null;
        return Object.fromEntries(
            MODEL_TABLE_KEYS.map((tableKey) => [tableKey, normalizeModelTableLayout(tableKey, parsed?.[tableKey])])
        );
    } catch (error) {
        return Object.fromEntries(
            MODEL_TABLE_KEYS.map((tableKey) => [tableKey, buildDefaultModelTableLayout(tableKey)])
        );
    }
}

function saveModelTableLayouts() {
    window.localStorage.setItem(STORAGE_KEYS.modelTables, JSON.stringify(state.modelTableLayouts));
}

function resolveModelTableLayout(tableKey) {
    return state.modelTableLayouts?.[tableKey] ?? buildDefaultModelTableLayout(tableKey);
}

function loadGanttLabelsLocked() {
    return window.localStorage.getItem(STORAGE_KEYS.ganttLabelsLocked) !== "0";
}

function getGanttColumnDefinition(columnKey) {
    return GANTT_TABLE_COLUMNS.find((column) => column.key === columnKey) || null;
}

function buildDefaultGanttColumnWidths() {
    return Object.fromEntries(GANTT_TABLE_COLUMNS.map((column) => [column.key, column.defaultWidth]));
}

function normalizeGanttColumnWidth(columnKey, value) {
    const column = getGanttColumnDefinition(columnKey);
    if (!column) {
        return 0;
    }

    const numericValue = Number(value);
    const fallback = column.defaultWidth;
    return clamp(Math.round(Number.isFinite(numericValue) ? numericValue : fallback), column.minWidth, column.maxWidth);
}

function loadGanttColumnWidths() {
    const defaults = buildDefaultGanttColumnWidths();
    try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.ganttColumns);
        if (!raw) {
            return defaults;
        }

        const parsed = JSON.parse(raw);
        return Object.fromEntries(
            GANTT_TABLE_COLUMNS.map((column) => [
                column.key,
                normalizeGanttColumnWidth(column.key, parsed?.[column.key] ?? column.defaultWidth),
            ])
        );
    } catch (error) {
        return defaults;
    }
}

function saveGanttColumnWidths() {
    window.localStorage.setItem(STORAGE_KEYS.ganttColumns, JSON.stringify(state.ganttColumnWidths));
}

function getDefaultGanttRowHeight() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1440;
    if (viewportWidth <= 700) {
        return 36;
    }
    if (viewportWidth <= 1100) {
        return 40;
    }
    return 44;
}

function normalizeGanttRowHeight(value) {
    const numericValue = Number(value);
    const fallback = getDefaultGanttRowHeight();
    return clamp(
        Math.round(Number.isFinite(numericValue) ? numericValue : fallback),
        GANTT_ROW_HEIGHT_MIN,
        GANTT_ROW_HEIGHT_MAX
    );
}

function loadGanttRowHeights() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEYS.ganttRowHeights);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") {
            return {};
        }

        return Object.fromEntries(
            Object.entries(parsed)
                .filter(([key]) => typeof key === "string" && key.length > 0)
                .map(([key, value]) => [key, normalizeGanttRowHeight(value)])
        );
    } catch (error) {
        return {};
    }
}

function saveGanttRowHeights() {
    window.localStorage.setItem(STORAGE_KEYS.ganttRowHeights, JSON.stringify(state.ganttRowHeights));
}

function resolveGanttRowHeight(rowId) {
    return normalizeGanttRowHeight(state.ganttRowHeights[rowId] ?? getDefaultGanttRowHeight());
}

function computeGanttRowMetrics(rowHeight) {
    const normalizedHeight = normalizeGanttRowHeight(rowHeight);
    const downtimeInset = clamp(Math.round(normalizedHeight * 0.14), 8, 24);
    const taskHeight = clamp(Math.round(normalizedHeight * 0.18), 18, Math.max(18, normalizedHeight - 18));
    const taskTop = clamp(
        Math.round((normalizedHeight - taskHeight) / 2),
        8,
        Math.max(8, normalizedHeight - taskHeight - 8)
    );

    return {
        rowHeight: normalizedHeight,
        downtimeInset,
        taskTop,
        taskHeight,
    };
}

function applyGanttRowLayout(target, rowHeight) {
    if (!target) {
        return;
    }

    const metrics = computeGanttRowMetrics(rowHeight);
    target.style.setProperty("--gantt-row-height", `${metrics.rowHeight}px`);
    target.style.setProperty("--gantt-downtime-inset", `${metrics.downtimeInset}px`);
    target.style.setProperty("--gantt-task-top", `${metrics.taskTop}px`);
    target.style.setProperty("--gantt-task-height", `${metrics.taskHeight}px`);
}

function resolveGanttColumnLayout() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1440;
    const widthPreset = viewportWidth <= 700 ? "mobileWidth" : viewportWidth <= 1100 ? "tabletWidth" : null;
    const widths = Object.fromEntries(
        GANTT_TABLE_COLUMNS.map((column) => {
            const nextWidth = widthPreset
                ? column[widthPreset]
                : state.ganttColumnWidths[column.key] ?? column.defaultWidth;
            return [column.key, normalizeGanttColumnWidth(column.key, nextWidth)];
        })
    );

    return {
        widths,
        totalWidth: Object.values(widths).reduce((total, width) => total + width, 0),
    };
}

function deriveResponsiveSize(width, minWidth, maxWidth, minSize, maxSize) {
    if (!Number.isFinite(width)) {
        return minSize;
    }

    const ratio = clamp((width - minWidth) / Math.max(1, maxWidth - minWidth), 0, 1);
    return minSize + (maxSize - minSize) * ratio;
}

function applyGanttColumnTypography(target, widths) {
    if (!target || !widths) {
        return;
    }

    const compactWidth = Math.min(widths.type, widths.span);
    const timeWidth = Math.min(widths.start, widths.finish);
    const minimumWidth = Math.min(widths.name, compactWidth, timeWidth);

    target.style.setProperty("--gantt-cell-pad-inline", `${deriveResponsiveSize(minimumWidth, 64, 176, 8, 16).toFixed(1)}px`);
    target.style.setProperty("--gantt-cell-pad-block", `${deriveResponsiveSize(minimumWidth, 64, 176, 10, 14).toFixed(1)}px`);
    target.style.setProperty("--gantt-font-header", `${deriveResponsiveSize(Math.max(compactWidth, timeWidth), 72, 176, 10, 13).toFixed(1)}px`);
    target.style.setProperty("--gantt-font-name-primary", `${deriveResponsiveSize(widths.name, 132, 320, 8.8, 10.8).toFixed(1)}px`);
    target.style.setProperty("--gantt-font-name-secondary", `${deriveResponsiveSize(widths.name, 132, 320, 7.8, 10).toFixed(1)}px`);
    target.style.setProperty("--gantt-font-compact-primary", `${deriveResponsiveSize(compactWidth, 64, 132, 8, 10).toFixed(1)}px`);
    target.style.setProperty("--gantt-font-compact-secondary", `${deriveResponsiveSize(compactWidth, 64, 132, 7.6, 10).toFixed(1)}px`);
    target.style.setProperty("--gantt-font-time-primary", `${deriveResponsiveSize(timeWidth, 96, 176, 8.2, 10).toFixed(1)}px`);
    target.style.setProperty("--gantt-font-time-secondary", `${deriveResponsiveSize(timeWidth, 96, 176, 7.8, 10).toFixed(1)}px`);
}

function applyGanttColumnLayout(target, columnLayout) {
    if (!target || !columnLayout) {
        return;
    }

    target.style.setProperty("--label-width", `${columnLayout.totalWidth}px`);
    for (const column of GANTT_TABLE_COLUMNS) {
        target.style.setProperty(`--gantt-col-${column.key}`, `${columnLayout.widths[column.key]}px`);
    }
    applyGanttColumnTypography(target, columnLayout.widths);
}

function applyToggleButtonState(button, visibleLabelKey, isCollapsed) {
    const actionKey = isCollapsed ? "misc.expand" : "misc.collapse";
    const title = `${t(actionKey)} ${t(visibleLabelKey)}`;
    button.classList.toggle("is-collapsed", isCollapsed);
    button.setAttribute("aria-pressed", String(isCollapsed));
    button.setAttribute("aria-label", title);
    button.setAttribute("title", title);
}

function renderWorkspaceLayout() {
    elements.workspaceGrid.classList.toggle("is-versions-collapsed", state.versionsPanelCollapsed);
    elements.versionsPanel.classList.toggle("is-collapsed", state.versionsPanelCollapsed);
    elements.versionsPanelToggleIcon.textContent = state.versionsPanelCollapsed ? "▶" : "◀";
    const labelKey = state.versionsPanelCollapsed ? "versions.expand" : "versions.collapse";
    const label = t(labelKey);
    elements.versionsPanelToggleButton.setAttribute("aria-label", label);
    elements.versionsPanelToggleButton.setAttribute("title", label);
    elements.versionsPanelToggleButton.setAttribute("aria-pressed", String(state.versionsPanelCollapsed));
}

function renderViewerWidgetState() {
    elements.kpiGrid.classList.toggle("hidden", state.isKpiCollapsed);
    elements.ganttLegend.classList.toggle("hidden", state.isGanttLegendCollapsed);
    elements.ganttDetailCard.classList.toggle("hidden", state.isGanttDetailCollapsed);
    elements.ganttDetailCard.style.setProperty("--gantt-detail-height", `${state.ganttDetailHeight}px`);
    applyToggleButtonState(elements.kpiToggleButton, "gantt.metricsPanel", state.isKpiCollapsed);
    applyToggleButtonState(elements.ganttLegendToggleButton, "gantt.legendPanel", state.isGanttLegendCollapsed);
    applyToggleButtonState(elements.ganttDetailToggleButton, "gantt.detailPanel", state.isGanttDetailCollapsed);
}

function toggleVersionsPanel() {
    state.versionsPanelCollapsed = !state.versionsPanelCollapsed;
    window.localStorage.setItem(STORAGE_KEYS.versionsPanelCollapsed, state.versionsPanelCollapsed ? "1" : "0");
    renderWorkspaceLayout();

    if (state.selectedVersion) {
        renderGantt(state.selectedVersion);
    }
}

function toggleKpiSection() {
    state.isKpiCollapsed = !state.isKpiCollapsed;
    window.localStorage.setItem(STORAGE_KEYS.kpiCollapsed, state.isKpiCollapsed ? "1" : "0");
    renderViewerWidgetState();
}

function toggleGanttLegend() {
    state.isGanttLegendCollapsed = !state.isGanttLegendCollapsed;
    window.localStorage.setItem(STORAGE_KEYS.ganttLegendCollapsed, state.isGanttLegendCollapsed ? "1" : "0");
    renderViewerWidgetState();
}

function toggleGanttDetail() {
    state.isGanttDetailCollapsed = !state.isGanttDetailCollapsed;
    window.localStorage.setItem(STORAGE_KEYS.ganttDetailCollapsed, state.isGanttDetailCollapsed ? "1" : "0");
    renderViewerWidgetState();
}

function renderGanttLabelLockState(hasVersion = Boolean(state.selectedVersion)) {
    const isLocked = state.ganttLabelsLocked;
    elements.ganttScroll.classList.toggle("is-label-pane-unlocked", !isLocked);
    elements.ganttLabelLockButton.classList.toggle("is-active", isLocked && hasVersion);
    elements.ganttLabelLockButton.disabled = !hasVersion;
    elements.ganttLabelLockButton.setAttribute("aria-pressed", String(isLocked));
    elements.ganttLabelLockText.textContent = t(isLocked ? "gantt.labelPaneLocked" : "gantt.labelPaneUnlocked");
    const actionKey = isLocked ? "gantt.labelPaneUnlock" : "gantt.labelPaneLock";
    const actionLabel = t(actionKey);
    elements.ganttLabelLockButton.setAttribute("aria-label", actionLabel);
    elements.ganttLabelLockButton.setAttribute("title", actionLabel);
}

function toggleGanttLabelLock() {
    state.ganttLabelsLocked = !state.ganttLabelsLocked;
    window.localStorage.setItem(STORAGE_KEYS.ganttLabelsLocked, state.ganttLabelsLocked ? "1" : "0");
    renderGanttLabelLockState(Boolean(state.selectedVersion));
}

function renderVersionsPanelRail(publishedCount, selectedSummary) {
    elements.versionsRailTotal.textContent = String(state.versions.length);
    elements.versionsRailPublished.textContent = String(publishedCount);
    elements.versionsRailSelectedStatus.textContent = selectedSummary
        ? translateEnum("versionStatus", selectedSummary.status)
        : t("summary.none");
    elements.versionsRailSelectedStatus.title = selectedSummary?.versionName || t("summary.chooseVersion");
    elements.versionsPanelRail.dataset.state = selectedSummary?.status || "NONE";
}

function setLocale(locale) {
    if (!translations[locale]) {
        return;
    }

    state.locale = locale;
    window.localStorage.setItem(STORAGE_KEYS.locale, locale);
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    for (const button of elements.localeButtons) {
        const isActive = button.dataset.localeOption === locale;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    }
    applyStaticTranslations();
    renderApplicationState();
    renderJobStatus();
    updateSummary();
    renderVersionList();
    renderSelectedVersion(state.selectedVersion);
    renderWorkspaceLayout();
    renderViewerWidgetState();
    setLoginPending(state.isLoginPending);
    setModelPending(state.isModelPending);
    setAccountPending(state.isAccountPending);
}

function dictionaryValue(locale, key) {
    return key.split(".").reduce((value, segment) => value?.[segment], translations[locale]);
}

function interpolate(template, params = {}) {
    return template.replace(/\{(\w+)}/g, (_, name) => String(params[name] ?? ""));
}

function t(key, params = {}) {
    const value = dictionaryValue(state.locale, key) ?? dictionaryValue("en", key) ?? key;
    return typeof value === "string" ? interpolate(value, params) : value;
}

function translateEnum(group, value) {
    if (!value) {
        return t("summary.none");
    }

    const translated = dictionaryValue(state.locale, `enums.${group}.${value}`) ?? dictionaryValue("en", `enums.${group}.${value}`);
    return translated || value;
}

function buildApiUrl(path) {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function requestJson(path, options = {}, requestOptions = {}) {
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;

    if (hasBody && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(buildApiUrl(path), {
        ...options,
        headers,
        credentials: "include",
    });

    if (!response.ok) {
        throw await buildApiError(response, requestOptions);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function requestBlob(path, options = {}, requestOptions = {}) {
    const response = await fetch(buildApiUrl(path), {
        ...options,
        headers: new Headers(options.headers || {}),
        credentials: "include",
    });

    if (!response.ok) {
        throw await buildApiError(response, requestOptions);
    }

    return response.blob();
}

async function buildApiError(response, requestOptions = {}) {
    let message = `${response.status} ${response.statusText}`;
    let payload = null;

    try {
        payload = await response.json();
        message = payload.message || payload.detail || message;
    } catch (error) {
        try {
            const text = await response.text();
            if (text) {
                message = text;
            }
        } catch (ignored) {
            // Keep the default message if the response body is not readable.
        }
    }

    if (response.status === 401 && !requestOptions.allowUnauthorized) {
        handleUnauthorized();
    }

    return new ApiError(response.status, message, payload);
}

function formatDateTimeLocalInputValue(value) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    const normalized = new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS);
    return normalized.toISOString().slice(0, 16);
}

function createModeledScenarioName(date) {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `manual-window-${year}${month}${day}-${hour}${minute}`;
}

function applyTranslationsWithin(root) {
    const translatableNodes = [];
    if (root instanceof Element && root.matches("[data-i18n]")) {
        translatableNodes.push(root);
    }
    if (root instanceof Element) {
        translatableNodes.push(...root.querySelectorAll("[data-i18n]"));
    }
    for (const element of translatableNodes) {
        element.textContent = t(element.dataset.i18n);
    }

    const placeholderNodes = [];
    if (root instanceof Element && root.matches("[data-i18n-placeholder]")) {
        placeholderNodes.push(root);
    }
    if (root instanceof Element) {
        placeholderNodes.push(...root.querySelectorAll("[data-i18n-placeholder]"));
    }
    for (const element of placeholderNodes) {
        element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    }
}

function buildModelTemplatePayload() {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);

    return {
        scenarioName: createModeledScenarioName(start),
        scheduleStartAt: formatDateTimeLocalInputValue(start),
        horizonMinutes: 2880,
        tardiness: 100,
        earliness: 2,
        makespan: 1,
        timeLimitSeconds: 10,
        numSearchWorkers: 4,
        resources: [
            { id: "reactor_01", label: "Reactor-01", resourceType: "REACTOR", sortOrder: 1 },
            { id: "reactor_02", label: "Reactor-02", resourceType: "REACTOR", sortOrder: 2 },
        ],
        tasks: [
            {
                id: "batch_A",
                label: "Batch A",
                productCode: "A",
                durationMinutes: 480,
                dueMinutes: 1080,
                priority: 3,
                candidateResourceIds: ["reactor_01", "reactor_02"],
                pinnedResourceId: null,
                pinnedStartMinutes: null,
            },
            {
                id: "batch_B",
                label: "Batch B",
                productCode: "B",
                durationMinutes: 720,
                dueMinutes: 900,
                priority: 5,
                candidateResourceIds: ["reactor_01", "reactor_02"],
                pinnedResourceId: null,
                pinnedStartMinutes: null,
            },
            {
                id: "batch_C",
                label: "Batch C",
                productCode: "C",
                durationMinutes: 600,
                dueMinutes: 1800,
                priority: 1,
                candidateResourceIds: ["reactor_01", "reactor_02"],
                pinnedResourceId: null,
                pinnedStartMinutes: null,
            },
        ],
        downtimes: [
            {
                id: "maintenance_r01",
                resourceId: "reactor_01",
                startMinutes: 240,
                endMinutes: 420,
                downtimeType: "MAINTENANCE",
                source: "CALENDAR",
                description: "Preventive maintenance window",
            },
        ],
    };
}

function cloneModelRow(templateElement) {
    const row = templateElement.content.firstElementChild.cloneNode(true);
    applyTranslationsWithin(row);
    return row;
}

function getModelRowField(row, field) {
    return row.querySelector(`[data-field="${field}"]`);
}

function setModelRowFieldValue(row, field, value) {
    const input = getModelRowField(row, field);
    if (input) {
        input.value = value == null ? "" : String(value);
    }
}

function getModelRowFieldValue(row, field) {
    const input = getModelRowField(row, field);
    return input ? input.value.trim() : "";
}

function clearModelTable(body) {
    body.innerHTML = "";
}

function getModelTableElement(tableKey) {
    const definition = getModelTableDefinition(tableKey);
    return definition ? elements[definition.tableElementKey] : null;
}

function getModelTableBodyElement(tableKey) {
    const definition = getModelTableDefinition(tableKey);
    return definition ? elements[definition.bodyElementKey] : null;
}

function getModelTableHeaderRow(tableKey) {
    return getModelTableElement(tableKey)?.tHead?.rows?.[0] || null;
}

function getModelTableHeaderCell(tableKey, columnKey) {
    return getModelTableHeaderRow(tableKey)?.querySelector(`th[data-column-key="${columnKey}"]`) || null;
}

function ensureModelTableColGroup(table) {
    if (!table) {
        return null;
    }

    let colGroup = table.querySelector("colgroup");
    if (!colGroup) {
        colGroup = document.createElement("colgroup");
        table.insertBefore(colGroup, table.firstChild);
    }
    return colGroup;
}

function calculateModelTableTotalWidth(layout) {
    return layout.order.reduce((total, columnKey) => total + (layout.widths[columnKey] || 0), 0);
}

function applyModelTableOrderToRow(row, order) {
    if (!row) {
        return;
    }

    const cellsByKey = new Map(
        Array.from(row.children)
            .filter((cell) => cell instanceof HTMLElement)
            .map((cell) => [cell.dataset.columnKey, cell])
    );

    for (const columnKey of order) {
        const cell = cellsByKey.get(columnKey);
        if (cell) {
            row.appendChild(cell);
        }
    }
}

function renderModelTableColGroup(tableKey) {
    const table = getModelTableElement(tableKey);
    if (!table) {
        return;
    }

    const layout = resolveModelTableLayout(tableKey);
    const colGroup = ensureModelTableColGroup(table);
    if (!colGroup) {
        return;
    }

    colGroup.replaceChildren(
        ...layout.order.map((columnKey) => {
            const col = document.createElement("col");
            col.dataset.columnKey = columnKey;
            col.style.width = `${layout.widths[columnKey]}px`;
            return col;
        })
    );
    table.style.setProperty("--model-table-total-width", `${calculateModelTableTotalWidth(layout)}px`);
}

function applyModelTableWidths(tableKey) {
    renderModelTableColGroup(tableKey);
}

function applyModelTableRowLayout(tableKey, row) {
    applyModelTableOrderToRow(row, resolveModelTableLayout(tableKey).order);
}

function applyModelTableLayout(tableKey) {
    const headerRow = getModelTableHeaderRow(tableKey);
    const body = getModelTableBodyElement(tableKey);
    const layout = resolveModelTableLayout(tableKey);

    applyModelTableOrderToRow(headerRow, layout.order);
    for (const row of body?.rows || []) {
        applyModelTableOrderToRow(row, layout.order);
    }
    applyModelTableWidths(tableKey);
}

function updateModelTableLayout(tableKey, updater) {
    const currentLayout = resolveModelTableLayout(tableKey);
    const nextLayout = normalizeModelTableLayout(tableKey, updater(currentLayout));
    state.modelTableLayouts = {
        ...state.modelTableLayouts,
        [tableKey]: nextLayout,
    };
    return nextLayout;
}

function clearModelColumnDropIndicators(tableKey = null) {
    const tableKeys = tableKey ? [tableKey] : MODEL_TABLE_KEYS;
    for (const key of tableKeys) {
        const headerRow = getModelTableHeaderRow(key);
        for (const cell of headerRow?.cells || []) {
            cell.classList.remove("is-drop-before", "is-drop-after");
        }
    }
}

function clearModelColumnDragSession() {
    const session = state.modelColumnDragSession;
    if (!session) {
        return;
    }

    getModelTableHeaderCell(session.tableKey, session.columnKey)?.classList.remove("is-dragging");
    clearModelColumnDropIndicators(session.tableKey);
    state.modelColumnDragSession = null;
}

function getModelColumnDropPosition(headerCell, clientX) {
    const rect = headerCell.getBoundingClientRect();
    return clientX < rect.left + rect.width / 2 ? "before" : "after";
}

function moveModelTableColumn(tableKey, columnKey, targetColumnKey, position) {
    if (!columnKey || !targetColumnKey || columnKey === targetColumnKey) {
        return;
    }

    const currentLayout = resolveModelTableLayout(tableKey);
    const orderWithoutDragged = currentLayout.order.filter((key) => key !== columnKey);
    const targetIndex = orderWithoutDragged.indexOf(targetColumnKey);
    if (targetIndex < 0) {
        return;
    }

    const nextOrder = [...orderWithoutDragged];
    nextOrder.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, columnKey);

    if (nextOrder.every((key, index) => key === currentLayout.order[index])) {
        return;
    }

    updateModelTableLayout(tableKey, (layout) => ({
        ...layout,
        order: nextOrder,
    }));
    applyModelTableLayout(tableKey);
    saveModelTableLayouts();
}

function resetModelTableColumnWidth(tableKey, columnKey) {
    const column = getModelTableColumnDefinition(tableKey, columnKey);
    if (!column) {
        return;
    }

    updateModelTableLayout(tableKey, (layout) => ({
        ...layout,
        widths: {
            ...layout.widths,
            [columnKey]: column.defaultWidth,
        },
    }));
    applyModelTableWidths(tableKey);
    saveModelTableLayouts();
}

function stopModelColumnResize() {
    if (!state.modelColumnResizeSession) {
        return;
    }

    const { pointerId, captureElement } = state.modelColumnResizeSession;
    captureElement?.classList.remove("is-active");

    if (captureElement?.hasPointerCapture?.(pointerId)) {
        try {
            captureElement.releasePointerCapture(pointerId);
        } catch (error) {
            // Ignore capture cleanup failures during teardown.
        }
    }

    window.removeEventListener("pointermove", handleModelColumnResize);
    window.removeEventListener("pointerup", finishModelColumnResize);
    window.removeEventListener("pointercancel", finishModelColumnResize);
    document.body.classList.remove("is-model-column-resizing");
    state.modelColumnResizeSession = null;
}

function handleModelColumnResize(event) {
    const session = state.modelColumnResizeSession;
    if (!session || event.pointerId !== session.pointerId) {
        return;
    }

    event.preventDefault();

    const scrollDelta = session.scrollElement.scrollLeft - session.startScrollLeft;
    const nextWidth = normalizeModelTableColumnWidth(
        session.tableKey,
        session.columnKey,
        session.originalWidth + (event.clientX - session.startClientX) + scrollDelta
    );

    const currentWidth = resolveModelTableLayout(session.tableKey).widths[session.columnKey];
    if (nextWidth === currentWidth) {
        return;
    }

    updateModelTableLayout(session.tableKey, (layout) => ({
        ...layout,
        widths: {
            ...layout.widths,
            [session.columnKey]: nextWidth,
        },
    }));
    applyModelTableWidths(session.tableKey);
}

function finishModelColumnResize(event) {
    if (!state.modelColumnResizeSession) {
        return;
    }

    if (event?.pointerId !== undefined && event.pointerId !== state.modelColumnResizeSession.pointerId) {
        return;
    }

    stopModelColumnResize();
    saveModelTableLayouts();
}

function startModelColumnResize(event, tableKey, columnKey) {
    if (event.button !== 0) {
        return;
    }

    const table = getModelTableElement(tableKey);
    const scrollElement = table?.closest(".model-table-wrap");
    const captureElement = event.currentTarget;
    if (!table || !scrollElement || !captureElement) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    clearModelColumnDragSession();
    stopModelColumnResize();

    state.modelColumnResizeSession = {
        tableKey,
        columnKey,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startScrollLeft: scrollElement.scrollLeft,
        originalWidth: resolveModelTableLayout(tableKey).widths[columnKey],
        scrollElement,
        captureElement,
    };

    captureElement.classList.add("is-active");
    if (captureElement.setPointerCapture) {
        try {
            captureElement.setPointerCapture(event.pointerId);
        } catch (error) {
            // Ignore capture failures and fall back to window listeners.
        }
    }

    document.body.classList.add("is-model-column-resizing");
    window.addEventListener("pointermove", handleModelColumnResize);
    window.addEventListener("pointerup", finishModelColumnResize);
    window.addEventListener("pointercancel", finishModelColumnResize);
}

function createModelColumnResizer(tableKey, columnKey) {
    const handle = document.createElement("span");
    handle.className = "model-column-resizer";
    handle.dataset.columnKey = columnKey;
    handle.setAttribute("aria-hidden", "true");
    handle.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    handle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    handle.addEventListener("pointerdown", (event) => {
        startModelColumnResize(event, tableKey, columnKey);
    });
    handle.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        resetModelTableColumnWidth(tableKey, columnKey);
    });
    return handle;
}

function handleModelColumnDragStart(event) {
    if (state.modelColumnResizeSession || (event.target instanceof Element && event.target.closest(".model-column-resizer"))) {
        event.preventDefault();
        return;
    }

    const headerCell = event.currentTarget;
    const tableKey = headerCell.dataset.tableKey;
    const columnKey = headerCell.dataset.columnKey;
    if (!tableKey || !columnKey || !event.dataTransfer) {
        event.preventDefault();
        return;
    }

    clearModelColumnDragSession();
    state.modelColumnDragSession = {
        tableKey,
        columnKey,
        dropColumnKey: null,
        dropPosition: null,
    };

    headerCell.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${tableKey}:${columnKey}`);
}

function handleModelColumnDragOver(event) {
    const session = state.modelColumnDragSession;
    const headerCell = event.currentTarget;
    const tableKey = headerCell.dataset.tableKey;
    const columnKey = headerCell.dataset.columnKey;
    if (!session || session.tableKey !== tableKey || !columnKey) {
        return;
    }

    if (columnKey === session.columnKey) {
        session.dropColumnKey = null;
        session.dropPosition = null;
        clearModelColumnDropIndicators(tableKey);
        return;
    }

    event.preventDefault();
    const dropPosition = getModelColumnDropPosition(headerCell, event.clientX);
    session.dropColumnKey = columnKey;
    session.dropPosition = dropPosition;

    clearModelColumnDropIndicators(tableKey);
    headerCell.classList.add(dropPosition === "before" ? "is-drop-before" : "is-drop-after");

    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
    }
}

function handleModelColumnDrop(event) {
    const session = state.modelColumnDragSession;
    const headerCell = event.currentTarget;
    const tableKey = headerCell.dataset.tableKey;
    if (!session || session.tableKey !== tableKey) {
        return;
    }

    event.preventDefault();
    const targetColumnKey = session.dropColumnKey || headerCell.dataset.columnKey;
    const dropPosition = session.dropPosition || getModelColumnDropPosition(headerCell, event.clientX);
    moveModelTableColumn(tableKey, session.columnKey, targetColumnKey, dropPosition);
    clearModelColumnDragSession();
}

function handleModelColumnDragEnd() {
    clearModelColumnDragSession();
}

function initializeModelTableHeaderCell(tableKey, headerCell) {
    const columnKey = headerCell.dataset.columnKey;
    if (!columnKey) {
        return;
    }

    headerCell.dataset.tableKey = tableKey;
    if (headerCell.dataset.modelColumnInteractive === "1") {
        return;
    }

    headerCell.dataset.modelColumnInteractive = "1";
    headerCell.classList.add("is-draggable");
    headerCell.draggable = true;
    headerCell.addEventListener("dragstart", handleModelColumnDragStart);
    headerCell.addEventListener("dragover", handleModelColumnDragOver);
    headerCell.addEventListener("drop", handleModelColumnDrop);
    headerCell.addEventListener("dragend", handleModelColumnDragEnd);

    if (!headerCell.querySelector(".model-column-resizer")) {
        headerCell.appendChild(createModelColumnResizer(tableKey, columnKey));
    }
}

function initializeModelTableInteractions() {
    for (const tableKey of MODEL_TABLE_KEYS) {
        const headerRow = getModelTableHeaderRow(tableKey);
        for (const headerCell of headerRow?.cells || []) {
            initializeModelTableHeaderCell(tableKey, headerCell);
        }
        applyModelTableLayout(tableKey);
    }
}

function buildModelRowsSnapshot(body, fields) {
    return Array.from(body.querySelectorAll("tr")).map((row) => {
        const snapshot = {};
        for (const field of fields) {
            const input = getModelRowField(row, field);
            snapshot[field] = input ? input.value : "";
        }
        return snapshot;
    });
}

function buildModelDraftSnapshot() {
    return {
        kind: MODEL_DRAFT_KIND,
        scenarioName: elements.modelScenarioNameInput.value,
        dataVersion: elements.modelDataVersionInput.value,
        scheduleStartAt: elements.modelScheduleStartInput.value,
        horizonMinutes: elements.modelHorizonInput.value,
        tardiness: elements.modelTardinessInput.value,
        earliness: elements.modelEarlinessInput.value,
        makespan: elements.modelMakespanInput.value,
        timeLimitSeconds: elements.modelTimeLimitInput.value,
        numSearchWorkers: elements.modelWorkersInput.value,
        batchImports: state.modelBatchImports,
        resources: buildModelRowsSnapshot(elements.modelResourcesBody, MODEL_RESOURCE_FIELDS),
        tasks: buildModelRowsSnapshot(elements.modelTasksBody, MODEL_TASK_FIELDS),
        downtimes: buildModelRowsSnapshot(elements.modelDowntimesBody, MODEL_DOWNTIME_FIELDS),
    };
}

function normalizeModelDraftRows(rows, fields) {
    if (!Array.isArray(rows)) {
        return [];
    }

    return rows.map((row) => {
        const normalized = {};
        for (const field of fields) {
            normalized[field] = row?.[field] == null ? "" : String(row[field]);
        }
        return normalized;
    });
}

function normalizeModelDraftSnapshot(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }
    if (raw.kind !== MODEL_DRAFT_KIND) {
        return null;
    }

    return {
        scenarioName: raw.scenarioName == null ? "" : String(raw.scenarioName),
        dataVersion: raw.dataVersion == null ? "" : String(raw.dataVersion),
        scheduleStartAt: raw.scheduleStartAt == null ? "" : String(raw.scheduleStartAt),
        horizonMinutes: raw.horizonMinutes == null ? "" : String(raw.horizonMinutes),
        tardiness: raw.tardiness == null ? "" : String(raw.tardiness),
        earliness: raw.earliness == null ? "" : String(raw.earliness),
        makespan: raw.makespan == null ? "" : String(raw.makespan),
        timeLimitSeconds: raw.timeLimitSeconds == null ? "" : String(raw.timeLimitSeconds),
        numSearchWorkers: raw.numSearchWorkers == null ? "" : String(raw.numSearchWorkers),
        batchImports: normalizeModelBatchImports(raw.batchImports),
        resources: normalizeModelDraftRows(raw.resources, MODEL_RESOURCE_FIELDS),
        tasks: normalizeModelDraftRows(raw.tasks, MODEL_TASK_FIELDS),
        downtimes: normalizeModelDraftRows(raw.downtimes, MODEL_DOWNTIME_FIELDS),
    };
}

function readStoredModelDraft() {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEYS.modelDraft);
        if (!stored) {
            return null;
        }

        return normalizeModelDraftSnapshot(JSON.parse(stored));
    } catch (error) {
        return null;
    }
}

function updateModelDraftActionState() {
    elements.modelRestoreDraftButton.disabled = state.isModelPending || !readStoredModelDraft();
}

function clearStoredModelDraft() {
    try {
        window.localStorage.removeItem(STORAGE_KEYS.modelDraft);
    } catch (error) {
        // Ignore localStorage failures; the user can continue working without draft persistence.
    }
    updateModelDraftActionState();
}

function normalizeModelBatchImport(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return null;
    }
    if (!raw.importId) {
        return null;
    }

    return {
        importId: String(raw.importId),
        dataVersion: raw.dataVersion == null ? "" : String(raw.dataVersion),
        status: raw.status == null ? "" : String(raw.status),
        successCount: Number.isFinite(Number(raw.successCount)) ? Number(raw.successCount) : 0,
        failureCount: Number.isFinite(Number(raw.failureCount)) ? Number(raw.failureCount) : 0,
        sourceFileName: raw.sourceFileName == null ? "" : String(raw.sourceFileName),
        createdAt: raw.createdAt == null ? "" : String(raw.createdAt),
        errorsDownloadPath: raw.errorsDownloadPath == null ? "" : String(raw.errorsDownloadPath),
    };
}

function normalizeModelBatchImports(raw) {
    const normalized = createEmptyModelBatchImports();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return normalized;
    }

    for (const kind of MODEL_BATCH_IMPORT_KEYS) {
        const batch = normalizeModelBatchImport(raw[kind]);
        if (batch) {
            normalized[kind] = batch;
        }
    }
    return normalized;
}

function restoreModelFormFromDraft(snapshot) {
    elements.modelScenarioNameInput.value = snapshot.scenarioName;
    elements.modelDataVersionInput.value = snapshot.dataVersion;
    elements.modelScheduleStartInput.value = snapshot.scheduleStartAt;
    elements.modelHorizonInput.value = snapshot.horizonMinutes;
    elements.modelTardinessInput.value = snapshot.tardiness;
    elements.modelEarlinessInput.value = snapshot.earliness;
    elements.modelMakespanInput.value = snapshot.makespan;
    elements.modelTimeLimitInput.value = snapshot.timeLimitSeconds;
    elements.modelWorkersInput.value = snapshot.numSearchWorkers;
    state.modelBatchImports = normalizeModelBatchImports(snapshot.batchImports);

    clearModelTable(elements.modelResourcesBody);
    clearModelTable(elements.modelTasksBody);
    clearModelTable(elements.modelDowntimesBody);

    for (const resource of snapshot.resources) {
        appendModelResourceRow(resource);
    }
    for (const task of snapshot.tasks) {
        appendModelTaskRow(task);
    }
    for (const downtime of snapshot.downtimes) {
        appendModelDowntimeRow(downtime);
    }
    renderModelBatchImports();
}

function getModelDataVersion() {
    return elements.modelDataVersionInput.value.trim();
}

function buildAdhocDataVersion() {
    const date = new Date();
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    return `adhoc_${year}${month}${day}${hour}${minute}${second}`;
}

function ensureModelBatchDataVersion() {
    const current = getModelDataVersion();
    if (current) {
        return current;
    }
    const generated = buildAdhocDataVersion();
    elements.modelDataVersionInput.value = generated;
    return generated;
}

function isSuccessfulModelBatchStatus(status) {
    return status === "VALIDATED" || status === "SCENARIO_GENERATED";
}

function hasAnyModelBatchImports() {
    return MODEL_BATCH_IMPORT_KEYS.some((kind) => Boolean(state.modelBatchImports[kind]));
}

function createModelBatchImportRecord(payload, fallbackFileName = "") {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const importId = payload.importId || payload.importBatch?.importId;
    if (!importId) {
        return null;
    }

    return {
        importId: String(importId),
        dataVersion: String(payload.dataVersion || payload.importBatch?.dataVersion || ""),
        status: String(payload.status || payload.importBatch?.status || ""),
        successCount: Number(payload.successCount ?? payload.importBatch?.successCount ?? 0) || 0,
        failureCount: Number(payload.failureCount ?? payload.importBatch?.failureCount ?? 0) || 0,
        sourceFileName: String(payload.sourceFileName || payload.importBatch?.sourceFileName || fallbackFileName || ""),
        createdAt: String(payload.createdAt || payload.importBatch?.createdAt || new Date().toISOString()),
        errorsDownloadPath: String(
            payload.errorsDownloadPath
            || payload.importBatch?.errorsDownloadPath
            || (importId ? `/api/v1/model-import/batches/${importId}/errors` : "")
        ),
    };
}

function setModelBatchImport(kind, batch) {
    if (batch) {
        state.modelBatchImports = {
            ...state.modelBatchImports,
            [kind]: batch,
        };
    } else if (state.modelBatchImports[kind]) {
        const next = {
            ...state.modelBatchImports,
        };
        delete next[kind];
        state.modelBatchImports = next;
    }
    renderModelBatchImports();
}

function clearModelBatchImports() {
    state.modelBatchImports = createEmptyModelBatchImports();
    renderModelBatchImports();
}

function formatModelBatchStatus(batch) {
    const statusText = t("model.batchStatusLine", {
        importId: batch.importId,
        status: batch.status || "-",
        dataVersion: batch.dataVersion || "-",
        successCount: String(batch.successCount ?? 0),
        failureCount: String(batch.failureCount ?? 0),
    });
    return batch.sourceFileName ? `${statusText}\n${batch.sourceFileName}` : statusText;
}

function renderModelBatchImports() {
    for (const kind of MODEL_BATCH_IMPORT_KEYS) {
        const definition = MODEL_BATCH_IMPORT_DEFINITIONS[kind];
        const statusElement = elements[definition.statusElementKey];
        const errorsLink = elements[definition.errorsLinkElementKey];
        const batch = state.modelBatchImports[kind];

        if (!batch) {
            statusElement.textContent = t("model.batchNoImport");
            errorsLink.classList.add("hidden");
            errorsLink.removeAttribute("href");
            continue;
        }

        statusElement.textContent = formatModelBatchStatus(batch);
        if (batch.errorsDownloadPath && !isSuccessfulModelBatchStatus(batch.status)) {
            errorsLink.classList.remove("hidden");
            errorsLink.href = buildApiUrl(batch.errorsDownloadPath);
        } else {
            errorsLink.classList.add("hidden");
            errorsLink.removeAttribute("href");
        }
    }
}

function revealModelRow(row) {
    if (!row) {
        return;
    }

    const primaryField = row.querySelector("input, select, textarea");
    window.requestAnimationFrame(() => {
        row.scrollIntoView({ block: "nearest", inline: "nearest" });
        primaryField?.focus();
    });
}

function appendModelResourceRow(resource = {}) {
    const row = cloneModelRow(elements.modelResourceRowTemplate);
    setModelRowFieldValue(row, "id", resource.id);
    setModelRowFieldValue(row, "label", resource.label);
    setModelRowFieldValue(row, "resourceType", resource.resourceType);
    setModelRowFieldValue(row, "sortOrder", resource.sortOrder);
    applyModelTableRowLayout("resources", row);
    elements.modelResourcesBody.appendChild(row);
    return row;
}

function appendModelTaskRow(task = {}) {
    const row = cloneModelRow(elements.modelTaskRowTemplate);
    setModelRowFieldValue(row, "id", task.id);
    setModelRowFieldValue(row, "label", task.label);
    setModelRowFieldValue(row, "productCode", task.productCode);
    setModelRowFieldValue(row, "durationMinutes", task.durationMinutes);
    setModelRowFieldValue(row, "dueMinutes", task.dueMinutes);
    setModelRowFieldValue(row, "priority", task.priority);
    setModelRowFieldValue(
        row,
        "candidateResourceIds",
        Array.isArray(task.candidateResourceIds) ? task.candidateResourceIds.join(",") : task.candidateResourceIds
    );
    setModelRowFieldValue(row, "pinnedResourceId", task.pinnedResourceId);
    setModelRowFieldValue(row, "pinnedStartMinutes", task.pinnedStartMinutes);
    applyModelTableRowLayout("tasks", row);
    elements.modelTasksBody.appendChild(row);
    return row;
}

function appendModelDowntimeRow(downtime = {}) {
    const row = cloneModelRow(elements.modelDowntimeRowTemplate);
    setModelRowFieldValue(row, "id", downtime.id);
    setModelRowFieldValue(row, "resourceId", downtime.resourceId);
    setModelRowFieldValue(row, "startMinutes", downtime.startMinutes);
    setModelRowFieldValue(row, "endMinutes", downtime.endMinutes);
    setModelRowFieldValue(row, "downtimeType", downtime.downtimeType);
    setModelRowFieldValue(row, "source", downtime.source);
    setModelRowFieldValue(row, "description", downtime.description);
    applyModelTableRowLayout("downtimes", row);
    elements.modelDowntimesBody.appendChild(row);
    return row;
}

function populateModelFormFromPayload(payload) {
    elements.modelScenarioNameInput.value = payload.scenarioName || "";
    elements.modelDataVersionInput.value = payload.dataVersion || "";
    elements.modelScheduleStartInput.value = formatDateTimeLocalInputValue(payload.scheduleStartAt || new Date());
    elements.modelHorizonInput.value = String(payload.horizonMinutes ?? 2880);
    elements.modelTardinessInput.value = String(payload.objectiveWeights?.tardiness ?? payload.tardiness ?? 100);
    elements.modelEarlinessInput.value = String(payload.objectiveWeights?.earliness ?? payload.earliness ?? 0);
    elements.modelMakespanInput.value = String(payload.objectiveWeights?.makespan ?? payload.makespan ?? 1);
    elements.modelTimeLimitInput.value = String(payload.solverConfig?.timeLimitSeconds ?? payload.timeLimitSeconds ?? 10);
    elements.modelWorkersInput.value = String(payload.solverConfig?.numSearchWorkers ?? payload.numSearchWorkers ?? 4);
    state.modelBatchImports = createEmptyModelBatchImports();

    clearModelTable(elements.modelResourcesBody);
    clearModelTable(elements.modelTasksBody);
    clearModelTable(elements.modelDowntimesBody);

    for (const resource of payload.resources || []) {
        appendModelResourceRow(resource);
    }
    for (const task of payload.tasks || []) {
        appendModelTaskRow(task);
    }
    for (const downtime of payload.downtimes || []) {
        appendModelDowntimeRow(downtime);
    }
    renderModelBatchImports();
}

function applyModelTemplate(showFeedback = true) {
    populateModelFormFromPayload(buildModelTemplatePayload());

    if (showFeedback) {
        setModelFeedbackKey("model.templateLoaded", "info");
    }
}

function ensureModelFormSeeded() {
    if (
        elements.modelScenarioNameInput.value.trim()
        || elements.modelDataVersionInput.value.trim()
        || elements.modelResourcesBody.children.length
        || elements.modelTasksBody.children.length
        || hasAnyModelBatchImports()
    ) {
        return;
    }

    applyModelTemplate(false);
}

function parseIntegerStrict(value) {
    const normalized = String(value ?? "").trim();
    if (!/^-?\d+$/.test(normalized)) {
        return null;
    }
    return Number.parseInt(normalized, 10);
}

function parsePositiveIntegerField(value, fieldKey) {
    const parsed = parseIntegerStrict(value);
    if (parsed === null || parsed <= 0) {
        throw new Error(t("model.validationPositiveIntegerField", { field: t(fieldKey) }));
    }
    return parsed;
}

function parseNonNegativeIntegerField(value, fieldKey) {
    const parsed = parseIntegerStrict(value);
    if (parsed === null || parsed < 0) {
        throw new Error(t("model.validationNonNegativeIntegerField", { field: t(fieldKey) }));
    }
    return parsed;
}

function buildModelLineError(sectionKey, lineNumber, reason) {
    return new Error(t("model.validationInvalidLine", { section: t(sectionKey), line: lineNumber, reason }));
}

function buildRequiredFieldReason(fieldKey) {
    return t("model.reasonRequiredField", { field: t(fieldKey) });
}

function ensureUniqueModelId(seenIds, id, sectionKey, lineNumber) {
    if (seenIds.has(id)) {
        throw buildModelLineError(sectionKey, lineNumber, t("model.reasonDuplicateId", { value: id }));
    }
    seenIds.add(id);
}

function findDuplicateValue(values) {
    const seen = new Set();
    for (const value of values) {
        if (seen.has(value)) {
            return value;
        }
        seen.add(value);
    }
    return null;
}

function getNonBlankModelRows(body, fields) {
    return Array.from(body.querySelectorAll("tr"))
        .map((row, index) => ({ row, lineNumber: index + 1 }))
        .filter(({ row }) => fields.some((field) => getModelRowFieldValue(row, field)));
}

function parseResourceRows() {
    const rows = getNonBlankModelRows(elements.modelResourcesBody, MODEL_RESOURCE_FIELDS);
    if (!rows.length) {
        throw new Error(t("model.validationAtLeastOneLine", { section: t("model.resourcesTitle") }));
    }

    const seenIds = new Set();
    return rows.map(({ row, lineNumber }) => {
        const id = getModelRowFieldValue(row, "id");
        const label = getModelRowFieldValue(row, "label");
        const resourceType = getModelRowFieldValue(row, "resourceType").toUpperCase();
        const sortOrderRaw = getModelRowFieldValue(row, "sortOrder");

        if (!id || !label) {
            throw buildModelLineError("model.resourcesTitle", lineNumber, !id
                ? buildRequiredFieldReason("model.columnId")
                : buildRequiredFieldReason("model.columnLabel"));
        }
        if (!MODEL_RESOURCE_TYPES.includes(resourceType)) {
            throw buildModelLineError(
                "model.resourcesTitle",
                lineNumber,
                t("model.reasonUnknownResourceType", { value: MODEL_RESOURCE_TYPES.join("/") })
            );
        }

        ensureUniqueModelId(seenIds, id, "model.resourcesTitle", lineNumber);

        return {
            id,
            label,
            resourceType,
            sortOrder: parseNonNegativeIntegerField(sortOrderRaw, "model.sortOrderLabel"),
        };
    });
}

function parseTaskRows(resourceIds) {
    const rows = getNonBlankModelRows(elements.modelTasksBody, MODEL_TASK_FIELDS);
    if (!rows.length) {
        throw new Error(t("model.validationAtLeastOneLine", { section: t("model.tasksTitle") }));
    }

    const seenIds = new Set();
    return rows.map(({ row, lineNumber }) => {
        const id = getModelRowFieldValue(row, "id");
        const label = getModelRowFieldValue(row, "label");
        const productCode = getModelRowFieldValue(row, "productCode");
        const durationRaw = getModelRowFieldValue(row, "durationMinutes");
        const dueRaw = getModelRowFieldValue(row, "dueMinutes");
        const priorityRaw = getModelRowFieldValue(row, "priority");
        const candidateRaw = getModelRowFieldValue(row, "candidateResourceIds");
        const pinnedResourceIdRaw = getModelRowFieldValue(row, "pinnedResourceId");
        const pinnedStartRaw = getModelRowFieldValue(row, "pinnedStartMinutes");

        if (!id || !label || !productCode) {
            const fieldKey = !id ? "model.columnId" : (!label ? "model.columnLabel" : "model.columnProductCode");
            throw buildModelLineError("model.tasksTitle", lineNumber, buildRequiredFieldReason(fieldKey));
        }

        ensureUniqueModelId(seenIds, id, "model.tasksTitle", lineNumber);

        const candidateResourceIds = candidateRaw
            .split(",")
            .map((resourceId) => resourceId.trim())
            .filter(Boolean);

        if (!candidateResourceIds.length) {
            throw buildModelLineError("model.tasksTitle", lineNumber, t("model.reasonCandidateResourceRequired"));
        }

        for (const candidateResourceId of candidateResourceIds) {
            if (!resourceIds.has(candidateResourceId)) {
                throw buildModelLineError(
                    "model.tasksTitle",
                    lineNumber,
                    t("model.reasonUnknownResource", { value: candidateResourceId })
                );
            }
        }

        const pinnedResourceId = pinnedResourceIdRaw || null;
        const pinnedStartMinutes = pinnedStartRaw
            ? parseNonNegativeIntegerField(pinnedStartRaw, "misc.start")
            : null;

        if (pinnedStartMinutes !== null && !pinnedResourceId) {
            throw buildModelLineError("model.tasksTitle", lineNumber, t("model.reasonPinnedResourceRequired"));
        }
        if (pinnedResourceId && !resourceIds.has(pinnedResourceId)) {
            throw buildModelLineError(
                "model.tasksTitle",
                lineNumber,
                t("model.reasonUnknownResource", { value: pinnedResourceId })
            );
        }
        if (pinnedResourceId && !candidateResourceIds.includes(pinnedResourceId)) {
            throw buildModelLineError("model.tasksTitle", lineNumber, t("model.reasonPinnedResourceCandidate"));
        }

        return {
            id,
            label,
            productCode,
            durationMinutes: parsePositiveIntegerField(durationRaw, "misc.duration"),
            dueMinutes: parsePositiveIntegerField(dueRaw, "misc.due"),
            priority: parsePositiveIntegerField(priorityRaw, "misc.priority"),
            candidateResourceIds,
            pinnedResourceId,
            pinnedStartMinutes,
        };
    });
}

function parseDowntimeRows(resourceIds) {
    const rows = getNonBlankModelRows(elements.modelDowntimesBody, MODEL_DOWNTIME_FIELDS);
    if (!rows.length) {
        return [];
    }

    const seenIds = new Set();
    return rows.map(({ row, lineNumber }) => {
        const id = getModelRowFieldValue(row, "id");
        const resourceId = getModelRowFieldValue(row, "resourceId");
        const startRaw = getModelRowFieldValue(row, "startMinutes");
        const endRaw = getModelRowFieldValue(row, "endMinutes");
        const downtimeType = getModelRowFieldValue(row, "downtimeType");
        const source = getModelRowFieldValue(row, "source");
        const description = getModelRowFieldValue(row, "description");

        if (!id || !resourceId || !downtimeType) {
            const fieldKey = !id ? "model.columnId" : (!resourceId ? "model.columnResourceId" : "model.columnDowntimeType");
            throw buildModelLineError("model.downtimesTitle", lineNumber, buildRequiredFieldReason(fieldKey));
        }
        if (!resourceIds.has(resourceId)) {
            throw buildModelLineError(
                "model.downtimesTitle",
                lineNumber,
                t("model.reasonUnknownResource", { value: resourceId })
            );
        }

        ensureUniqueModelId(seenIds, id, "model.downtimesTitle", lineNumber);

        const startMinutes = parseNonNegativeIntegerField(startRaw, "misc.start");
        const endMinutes = parsePositiveIntegerField(endRaw, "misc.end");
        if (endMinutes <= startMinutes) {
            throw buildModelLineError("model.downtimesTitle", lineNumber, t("model.reasonEndAfterStart"));
        }

        return {
            id,
            resourceId,
            startMinutes,
            endMinutes,
            downtimeType,
            source: source || "MANUAL",
            description,
        };
    });
}

function normalizeImportedInteger(value, options = {}) {
    if (value == null || value === "") {
        return options.optional ? null : Number.NaN;
    }

    const parsed = parseIntegerStrict(value);
    if (parsed === null) {
        return Number.NaN;
    }
    if (options.min != null && parsed < options.min) {
        return Number.NaN;
    }
    return parsed;
}

function normalizeImportedPayload(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error(t("model.importInvalidStructure"));
    }

    const scheduleStartAt = new Date(raw.scheduleStartAt);
    if (!String(raw.scenarioName || "").trim() || Number.isNaN(scheduleStartAt.getTime())) {
        throw new Error(t("model.importInvalidStructure"));
    }
    if (!Array.isArray(raw.resources) || !Array.isArray(raw.tasks)) {
        throw new Error(t("model.importInvalidStructure"));
    }

    const resources = raw.resources.map((resource) => {
        const resourceType = String(resource?.resourceType || "").trim().toUpperCase();
        const sortOrder = normalizeImportedInteger(resource?.sortOrder, { min: 0 });
        if (
            !String(resource?.id || "").trim()
            || !String(resource?.label || "").trim()
            || !MODEL_RESOURCE_TYPES.includes(resourceType)
            || Number.isNaN(sortOrder)
        ) {
            throw new Error(t("model.importInvalidStructure"));
        }

        return {
            id: String(resource.id).trim(),
            label: String(resource.label).trim(),
            resourceType,
            sortOrder,
        };
    });

    const tasks = raw.tasks.map((task) => {
        const durationMinutes = normalizeImportedInteger(task?.durationMinutes, { min: 1 });
        const dueMinutes = normalizeImportedInteger(task?.dueMinutes, { min: 1 });
        const priority = normalizeImportedInteger(task?.priority, { min: 1 });
        const pinnedStartMinutes = normalizeImportedInteger(task?.pinnedStartMinutes, { min: 0, optional: true });
        if (
            !String(task?.id || "").trim()
            || !String(task?.label || "").trim()
            || !String(task?.productCode || "").trim()
            || Number.isNaN(durationMinutes)
            || Number.isNaN(dueMinutes)
            || Number.isNaN(priority)
            || !Array.isArray(task?.candidateResourceIds)
        ) {
            throw new Error(t("model.importInvalidStructure"));
        }

        return {
            id: String(task.id).trim(),
            label: String(task.label).trim(),
            productCode: String(task.productCode).trim(),
            durationMinutes,
            dueMinutes,
            priority,
            candidateResourceIds: task.candidateResourceIds.map((resourceId) => String(resourceId || "").trim()).filter(Boolean),
            pinnedResourceId: task.pinnedResourceId == null ? null : String(task.pinnedResourceId).trim(),
            pinnedStartMinutes,
        };
    });

    if (!resources.length || !tasks.length || tasks.some((task) => task.candidateResourceIds.length === 0)) {
        throw new Error(t("model.importInvalidStructure"));
    }

    const resourceIds = new Set(resources.map((resource) => resource.id));
    const duplicateResourceId = resourceIds.size === resources.length ? null : findDuplicateValue(resources.map((resource) => resource.id));
    const duplicateTaskId = findDuplicateValue(tasks.map((task) => task.id));
    if (duplicateResourceId || duplicateTaskId) {
        throw new Error(t("model.importInvalidStructure"));
    }

    for (const task of tasks) {
        if (task.pinnedStartMinutes !== null && !task.pinnedResourceId) {
            throw new Error(t("model.importInvalidStructure"));
        }
        if (task.pinnedResourceId && !resourceIds.has(task.pinnedResourceId)) {
            throw new Error(t("model.importInvalidStructure"));
        }
        if (task.pinnedResourceId && !task.candidateResourceIds.includes(task.pinnedResourceId)) {
            throw new Error(t("model.importInvalidStructure"));
        }
        if (task.candidateResourceIds.some((resourceId) => !resourceIds.has(resourceId))) {
            throw new Error(t("model.importInvalidStructure"));
        }
    }

    const downtimes = Array.isArray(raw.downtimes) ? raw.downtimes.map((downtime) => {
        const startMinutes = normalizeImportedInteger(downtime?.startMinutes, { min: 0 });
        const endMinutes = normalizeImportedInteger(downtime?.endMinutes, { min: 1 });
        if (
            !String(downtime?.id || "").trim()
            || !String(downtime?.resourceId || "").trim()
            || !String(downtime?.downtimeType || "").trim()
            || Number.isNaN(startMinutes)
            || Number.isNaN(endMinutes)
        ) {
            throw new Error(t("model.importInvalidStructure"));
        }

        return {
            id: String(downtime.id).trim(),
            resourceId: String(downtime.resourceId).trim(),
            startMinutes,
            endMinutes,
            downtimeType: String(downtime.downtimeType).trim(),
            source: downtime.source == null ? "" : String(downtime.source).trim(),
            description: downtime.description == null ? "" : String(downtime.description).trim(),
        };
    }) : [];

    const duplicateDowntimeId = findDuplicateValue(downtimes.map((downtime) => downtime.id));
    if (duplicateDowntimeId) {
        throw new Error(t("model.importInvalidStructure"));
    }
    for (const downtime of downtimes) {
        if (!resourceIds.has(downtime.resourceId) || downtime.endMinutes <= downtime.startMinutes) {
            throw new Error(t("model.importInvalidStructure"));
        }
    }

    const horizonMinutes = normalizeImportedInteger(raw.horizonMinutes, { min: 1 });
    const tardiness = normalizeImportedInteger(raw.objectiveWeights?.tardiness ?? raw.tardiness ?? 100, { min: 1 });
    const earliness = normalizeImportedInteger(raw.objectiveWeights?.earliness ?? raw.earliness ?? 0, { min: 0 });
    const makespan = normalizeImportedInteger(raw.objectiveWeights?.makespan ?? raw.makespan ?? 1, { min: 0 });
    const timeLimitSeconds = normalizeImportedInteger(raw.solverConfig?.timeLimitSeconds ?? raw.timeLimitSeconds ?? 10, { min: 1 });
    const numSearchWorkers = normalizeImportedInteger(raw.solverConfig?.numSearchWorkers ?? raw.numSearchWorkers ?? 4, { min: 1 });

    if (
        Number.isNaN(horizonMinutes)
        || Number.isNaN(tardiness)
        || Number.isNaN(earliness)
        || Number.isNaN(makespan)
        || Number.isNaN(timeLimitSeconds)
        || Number.isNaN(numSearchWorkers)
    ) {
        throw new Error(t("model.importInvalidStructure"));
    }

    return {
        scenarioName: String(raw.scenarioName).trim(),
        dataVersion: raw.dataVersion == null ? "" : String(raw.dataVersion).trim(),
        scheduleStartAt,
        horizonMinutes,
        objectiveWeights: {
            tardiness,
            earliness,
            makespan,
        },
        solverConfig: {
            timeLimitSeconds,
            numSearchWorkers,
        },
        resources,
        tasks,
        downtimes,
    };
}

function buildModeledSchedulePayload() {
    const scenarioName = elements.modelScenarioNameInput.value.trim();
    if (!scenarioName) {
        throw new Error(t("model.validationScenarioRequired"));
    }

    const scheduleStartRaw = elements.modelScheduleStartInput.value;
    if (!scheduleStartRaw) {
        throw new Error(t("model.validationScheduleStartRequired"));
    }

    const scheduleStartAt = new Date(scheduleStartRaw);
    if (Number.isNaN(scheduleStartAt.getTime())) {
        throw new Error(t("model.validationScheduleStartInvalid"));
    }

    const resources = parseResourceRows();
    const resourceIds = new Set(resources.map((resource) => resource.id));

    return {
        scenarioName,
        dataVersion: getModelDataVersion() || null,
        scheduleStartAt: scheduleStartAt.toISOString(),
        horizonMinutes: parsePositiveIntegerField(elements.modelHorizonInput.value, "model.horizonLabel"),
        resources,
        tasks: parseTaskRows(resourceIds),
        downtimes: parseDowntimeRows(resourceIds),
        objectiveWeights: {
            tardiness: parsePositiveIntegerField(elements.modelTardinessInput.value, "model.tardinessLabel"),
            earliness: parseNonNegativeIntegerField(elements.modelEarlinessInput.value, "model.earlinessLabel"),
            makespan: parseNonNegativeIntegerField(elements.modelMakespanInput.value, "model.makespanLabel"),
        },
        solverConfig: {
            timeLimitSeconds: parsePositiveIntegerField(elements.modelTimeLimitInput.value, "model.timeLimitLabel"),
            numSearchWorkers: parsePositiveIntegerField(elements.modelWorkersInput.value, "model.workersLabel"),
        },
    };
}

function buildModelExportFileName(scenarioName) {
    const normalized = String(scenarioName || "")
        .trim()
        .replace(/[^a-z0-9_-]+/gi, "_")
        .replace(/^_+|_+$/g, "");

    return normalized || "schedule_request";
}

function downloadBlobFile(blob, fileName) {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
}

function downloadModelJsonFile(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlobFile(blob, `${buildModelExportFileName(payload.scenarioName)}.json`);
}

function applyStaticTranslations() {
    document.title = t("meta.title");
    applyTranslationsWithin(document.body);
    renderModelBatchImports();
    updateDeleteDraftVersionsActionState();
    updateVersionsDraftCountBadge();
    elements.versionsOpenModelButton.textContent = t("actions.versionsAdd");
    elements.versionsOpenModelButton.setAttribute("aria-label", t("actions.openModel"));
    elements.versionsOpenModelButton.setAttribute("title", t("actions.openModel"));
}

function buildSessionAvatar(username) {
    const normalized = (username || "").trim();
    if (!normalized) {
        return "?";
    }

    const [firstCharacter = "?"] = Array.from(normalized);
    return /[a-z]/i.test(firstCharacter) ? firstCharacter.toUpperCase() : firstCharacter;
}

function hasAnyRole(...roles) {
    return Boolean(state.currentRole && roles.includes(state.currentRole));
}

function canCreateSchedules() {
    return hasAnyRole("ADMIN", "PLANNER");
}

function canEditGovernance() {
    return hasAnyRole("ADMIN", "PLANNER", "APPROVER");
}

function canSubmitVersion() {
    return hasAnyRole("ADMIN", "PLANNER");
}

function canApproveVersion() {
    return hasAnyRole("ADMIN", "APPROVER");
}

function canPublishVersion() {
    return hasAnyRole("ADMIN", "APPROVER");
}

function canRollbackVersion() {
    return hasAnyRole("ADMIN", "APPROVER");
}

function canRunTrialSolve() {
    return hasAnyRole("ADMIN", "PLANNER", "APPROVER");
}

function canManageJobs() {
    return hasAnyRole("ADMIN", "PLANNER");
}

function renderAccessState() {
    const canSchedule = canCreateSchedules();
    const canGovern = canEditGovernance();

    elements.openModelButton.disabled = !canSchedule;
    elements.versionsOpenModelButton.disabled = !canSchedule;
    elements.runSampleButton.disabled = !canSchedule;
    elements.versionReleaseNoteInput.disabled = !state.selectedVersion || !canGovern;
    elements.versionReleaseNoteSaveButton.disabled = !state.selectedVersion || !canGovern;
    elements.versionActionCommentInput.disabled = !state.selectedVersion || !(canSubmitVersion() || canApproveVersion() || canPublishVersion() || canRollbackVersion());
    updateJobActionState();
}

function renderApplicationState() {
    elements.authShell.classList.toggle("hidden", state.isAuthenticated);
    elements.appShell.classList.toggle("hidden", !state.isAuthenticated);
    elements.sessionAvatar.textContent = buildSessionAvatar(state.currentUser);
    elements.sessionUser.textContent = state.currentUser || "-";
    elements.sessionRole.textContent = state.currentRole
        ? translateEnum("userRole", state.currentRole)
        : t("session.roleUnknown");
    renderAccountMenu();
    renderWorkspaceLayout();
    renderViewerWidgetState();
    renderAccessState();
    renderAuthFeedback();
    renderModelDialog();
    renderModelFeedback();
    renderAccountDialog();
    renderAccountFeedback();
}

function renderAuthFeedback() {
    if (!state.authFeedback) {
        elements.authFeedback.classList.add("hidden");
        elements.authFeedback.textContent = "";
        elements.authFeedback.removeAttribute("data-tone");
        return;
    }

    elements.authFeedback.classList.remove("hidden");
    elements.authFeedback.dataset.tone = state.authFeedback.tone;
    elements.authFeedback.textContent = state.authFeedback.text ?? t(state.authFeedback.key, state.authFeedback.params);
}

function setAuthFeedbackKey(key, tone = "error", params = {}) {
    state.authFeedback = { key, tone, params };
    renderAuthFeedback();
}

function setAuthFeedbackText(text, tone = "error") {
    state.authFeedback = { text, tone };
    renderAuthFeedback();
}

function clearAuthFeedback() {
    state.authFeedback = null;
    renderAuthFeedback();
}

function renderModelDialog() {
    const showDialog = state.isAuthenticated && state.modelDialogOpen;
    elements.modelOverlay.classList.toggle("hidden", !showDialog);
}

function renderModelFeedback() {
    if (!state.modelFeedback) {
        elements.modelFeedback.classList.add("hidden");
        elements.modelFeedback.textContent = "";
        elements.modelFeedback.removeAttribute("data-tone");
        return;
    }

    elements.modelFeedback.classList.remove("hidden");
    elements.modelFeedback.dataset.tone = state.modelFeedback.tone;
    elements.modelFeedback.textContent = state.modelFeedback.text ?? t(state.modelFeedback.key, state.modelFeedback.params);
}

function setModelFeedbackKey(key, tone = "error", params = {}) {
    state.modelFeedback = { key, tone, params };
    renderModelFeedback();
}

function setModelFeedbackText(text, tone = "error") {
    state.modelFeedback = { text, tone };
    renderModelFeedback();
}

function clearModelFeedback() {
    state.modelFeedback = null;
    renderModelFeedback();
}

function renderAccountDialog() {
    const showDialog = state.isAuthenticated && state.accountDialogOpen;
    elements.accountOverlay.classList.toggle("hidden", !showDialog);
}

function renderAccountMenu() {
    const isOpen = state.isAuthenticated && state.accountMenuOpen && !state.accountDialogOpen;
    const menuLabel = t("actions.accountMenu");

    if (!state.isAuthenticated && state.accountMenuOpen) {
        state.accountMenuOpen = false;
    }

    elements.accountMenu.classList.toggle("is-open", isOpen);
    elements.accountMenuPanel.classList.toggle("hidden", !isOpen);
    elements.accountMenuButton.setAttribute("aria-expanded", String(isOpen));
    elements.accountMenuButton.setAttribute("aria-label", menuLabel);
    elements.accountMenuButton.setAttribute("title", menuLabel);
}

function closeAccountMenu(options = {}) {
    const { focusButton = false } = options;
    if (!state.accountMenuOpen) {
        return;
    }

    state.accountMenuOpen = false;
    renderAccountMenu();
    if (focusButton) {
        elements.accountMenuButton.focus({ preventScroll: true });
    }
}

function toggleAccountMenu() {
    if (!state.isAuthenticated || state.accountDialogOpen) {
        return;
    }

    state.accountMenuOpen = !state.accountMenuOpen;
    renderAccountMenu();
}

function handleAccountMenuPointerDown(event) {
    if (!state.accountMenuOpen) {
        return;
    }

    if (elements.accountMenu.contains(event.target)) {
        return;
    }

    closeAccountMenu();
}

function handleAccountMenuEscape(event) {
    if (event.key !== "Escape" || !state.accountMenuOpen) {
        return;
    }

    event.preventDefault();
    closeAccountMenu({ focusButton: true });
}

function renderAccountFeedback() {
    if (!state.accountFeedback) {
        elements.accountFeedback.classList.add("hidden");
        elements.accountFeedback.textContent = "";
        elements.accountFeedback.removeAttribute("data-tone");
        return;
    }

    elements.accountFeedback.classList.remove("hidden");
    elements.accountFeedback.dataset.tone = state.accountFeedback.tone;
    elements.accountFeedback.textContent = state.accountFeedback.text ?? t(state.accountFeedback.key, state.accountFeedback.params);
}

function setAccountFeedbackKey(key, tone = "error", params = {}) {
    state.accountFeedback = { key, tone, params };
    renderAccountFeedback();
}

function setAccountFeedbackText(text, tone = "error") {
    state.accountFeedback = { text, tone };
    renderAccountFeedback();
}

function clearAccountFeedback() {
    state.accountFeedback = null;
    renderAccountFeedback();
}

function renderJobStatus() {
    elements.jobStatusText.textContent = t(state.jobStatus.titleKey, state.jobStatus.params);
    elements.jobStatusDetail.textContent = state.jobStatus.detailText ?? t(state.jobStatus.detailKey, state.jobStatus.params);
}

function setJobStatus(titleKey, detailKey, params = {}) {
    state.jobStatus = {
        titleKey,
        detailKey,
        params,
        detailText: null,
    };
    renderJobStatus();
}

function setJobStatusWithText(titleKey, detailText, params = {}) {
    state.jobStatus = {
        titleKey,
        detailKey: null,
        params,
        detailText,
    };
    renderJobStatus();
}

function formatDateTime(value) {
    if (!value) {
        return t("misc.notPublished");
    }

    return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatVersionCardId(value) {
    if (!value) {
        return "-";
    }

    const normalized = String(value).replace(/^ver-/i, "");
    return normalized.slice(0, 8).toUpperCase();
}

function formatDatePoint(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatDateMarker(value) {
    return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
    }).format(new Date(value));
}

function formatHourMarker(value) {
    return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en-US", {
        hour: "2-digit",
    }).format(new Date(value));
}

function formatDayMarker(value) {
    return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
    }).format(new Date(value));
}

function formatMonthMarker(value) {
    return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "long",
    }).format(new Date(value));
}

function formatNumber(value) {
    return new Intl.NumberFormat(state.locale === "zh" ? "zh-CN" : "en-US").format(value);
}

function formatMinutes(value) {
    return `${formatNumber(value)} min`;
}

function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
}

function formatSignedNumber(value) {
    const normalized = Number(value || 0);
    const formatted = formatNumber(Math.abs(normalized));
    if (normalized > 0) {
        return `+${formatted}`;
    }
    if (normalized < 0) {
        return `-${formatted}`;
    }
    return "0";
}

function formatSignedMinutes(value) {
    const normalized = Number(value || 0);
    const formatted = `${formatNumber(Math.abs(normalized))} min`;
    if (normalized > 0) {
        return `+${formatted}`;
    }
    if (normalized < 0) {
        return `-${formatted}`;
    }
    return `0 min`;
}

function formatSignedPercent(value) {
    const normalized = Number(value || 0);
    const formatted = `${Math.round(Math.abs(normalized) * 100)}%`;
    if (normalized > 0) {
        return `+${formatted}`;
    }
    if (normalized < 0) {
        return `-${formatted}`;
    }
    return "0%";
}

function isCsvLikeFile(file) {
    if (!file) {
        return false;
    }
    const name = String(file.name || "").toLowerCase();
    const type = String(file.type || "").toLowerCase();
    return name.endsWith(".csv") || type.includes("csv") || type === "text/plain";
}

function stripLeadingBom(value) {
    return value.startsWith("\uFEFF") ? value.slice(1) : value;
}

function decodeTextBytes(bytes, encodings = CSV_UPLOAD_ENCODINGS) {
    for (const encoding of encodings) {
        try {
            const decoder = new TextDecoder(encoding, { fatal: true });
            return stripLeadingBom(decoder.decode(bytes));
        } catch (error) {
            // Try the next encoding candidate.
        }
    }
    return null;
}

async function normalizeCsvUploadFile(file) {
    if (!isCsvLikeFile(file) || typeof TextDecoder !== "function" || typeof file.arrayBuffer !== "function") {
        return file;
    }

    try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const decoded = decodeTextBytes(bytes);
        if (decoded == null) {
            return file;
        }
        return new File([decoded], file.name, {
            type: file.type || "text/csv",
            lastModified: file.lastModified || Date.now(),
        });
    } catch (error) {
        return file;
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function formatDuration(durationMs) {
    return formatMinutes(Math.round(durationMs / 60000));
}

function formatGanttSnapValue(stepMs) {
    if (stepMs % DAY_MS === 0) {
        const days = stepMs / DAY_MS;
        return state.locale === "zh"
            ? `${formatNumber(days)} 天`
            : `${formatNumber(days)} day${days === 1 ? "" : "s"}`;
    }

    if (stepMs % HOUR_MS === 0) {
        const hours = stepMs / HOUR_MS;
        return state.locale === "zh"
            ? `${formatNumber(hours)} 小时`
            : `${formatNumber(hours)} hr`;
    }

    const minutes = stepMs / MINUTE_MS;
    return state.locale === "zh"
        ? `${formatNumber(minutes)} 分钟`
        : `${formatNumber(minutes)} min`;
}

function getGanttDragSnapMs(viewModel = state.ganttViewModel) {
    const minorUnit = viewModel?.timescale?.minorUnit;
    const zoom = viewModel?.effectiveZoom || state.ganttZoom || 1;

    if (minorUnit === "week") {
        return DAY_MS;
    }

    if (minorUnit === "day") {
        return zoom >= 1.65 ? HOUR_MS : (2 * HOUR_MS);
    }

    if (minorUnit === "6hour") {
        return zoom >= 1.45 ? (15 * MINUTE_MS) : (30 * MINUTE_MS);
    }

    if (minorUnit === "2hour") {
        return zoom >= 1.45 ? (5 * MINUTE_MS) : (15 * MINUTE_MS);
    }

    return GANTT_DRAG_SNAP_MS;
}

function roundToStep(value, step) {
    return Math.round(value / step) * step;
}

function roundToMinute(value, step = getGanttDragSnapMs()) {
    const timezoneOffsetMs = new Date(value).getTimezoneOffset() * MINUTE_MS;
    return roundToStep(value - timezoneOffsetMs, step) + timezoneOffsetMs;
}

function rangesOverlap(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
}

function cloneDraftBars(draftBars = state.draftBars) {
    return Object.fromEntries(
        Object.entries(draftBars || {}).map(([barId, draft]) => [barId, { ...draft }])
    );
}

function buildNormalizedDraftBar(baseBar, draftCandidate = {}) {
    const startMs = draftCandidate.startMs ?? baseBar.startMs;
    const endMs = draftCandidate.endMs ?? baseBar.endMs;
    const rowId = draftCandidate.rowId ?? baseBar.rowId;
    const pinned = draftCandidate.pinned ?? baseBar.pinned;
    const nextDraft = {};

    if (startMs !== baseBar.startMs) {
        nextDraft.startMs = startMs;
    }
    if (endMs !== baseBar.endMs) {
        nextDraft.endMs = endMs;
    }
    if (rowId !== baseBar.rowId) {
        nextDraft.rowId = rowId;
    }
    if (pinned !== baseBar.pinned) {
        nextDraft.pinned = Boolean(pinned);
    }

    return nextDraft;
}

function buildNextDraftBarsForBar(barId, draftCandidate, options = {}) {
    const { version = state.selectedVersion, sourceDraftBars = state.draftBars } = options;
    const baseBar = findBaseBar(version, barId);
    if (!baseBar) {
        return null;
    }

    const nextDraftBars = cloneDraftBars(sourceDraftBars);
    const nextDraft = buildNormalizedDraftBar(baseBar, draftCandidate);
    if (Object.keys(nextDraft).length === 0) {
        delete nextDraftBars[barId];
    } else {
        nextDraftBars[barId] = nextDraft;
    }

    return nextDraftBars;
}

function areDraftBarsEqual(leftDraftBars, rightDraftBars) {
    const leftEntries = Object.entries(leftDraftBars || {});
    const rightEntries = Object.entries(rightDraftBars || {});
    if (leftEntries.length !== rightEntries.length) {
        return false;
    }

    for (const [barId, leftDraft] of leftEntries) {
        const rightDraft = rightDraftBars?.[barId];
        if (!rightDraft) {
            return false;
        }
        if (
            (leftDraft.startMs ?? null) !== (rightDraft.startMs ?? null)
            || (leftDraft.endMs ?? null) !== (rightDraft.endMs ?? null)
            || (leftDraft.rowId ?? null) !== (rightDraft.rowId ?? null)
            || (leftDraft.pinned ?? null) !== (rightDraft.pinned ?? null)
        ) {
            return false;
        }
    }

    return true;
}

function syncDraftState() {
    state.hasDraftChanges = Object.keys(state.draftBars).length > 0;
}

function clearDraftHistory() {
    state.draftHistory = [];
}

function recordDraftUndoStep(previousDraftBars) {
    const snapshot = cloneDraftBars(previousDraftBars);
    if (areDraftBarsEqual(snapshot, state.draftBars)) {
        return;
    }

    const nextHistory = state.draftHistory.length >= GANTT_DRAFT_HISTORY_LIMIT
        ? state.draftHistory.slice(-(GANTT_DRAFT_HISTORY_LIMIT - 1))
        : state.draftHistory.slice();
    nextHistory.push(snapshot);
    state.draftHistory = nextHistory;
}

function findDisplayBar(version, barId, draftBars = state.draftBars) {
    const baseBar = findBaseBar(version, barId);
    if (!baseBar) {
        return null;
    }

    const draft = draftBars?.[barId];
    return draft ? { ...baseBar, ...draft } : { ...baseBar };
}

function applyDraftBarsState(nextDraftBars, options = {}) {
    const { focusBarId = state.selectedBarId, render = true } = options;
    const normalizedDraftBars = cloneDraftBars(nextDraftBars);
    state.draftBars = normalizedDraftBars;
    syncDraftState();

    const displayBar = focusBarId && state.selectedVersion
        ? findDisplayBar(state.selectedVersion, focusBarId, normalizedDraftBars)
        : null;
    if (displayBar) {
        state.selectedRowId = displayBar.rowId;
    }

    if (!render || !state.selectedVersion) {
        return;
    }

    refreshGanttTaskInteractionView(state.selectedVersion);
    if (focusBarId && displayBar) {
        rememberGanttFocusTarget({ type: "task", id: focusBarId });
        queueTaskFocusRestore(focusBarId);
        scheduleGanttFocusRestore({ type: "task", id: focusBarId }, state.selectedVersion);
    } else if (state.selectedRowId) {
        rememberGanttFocusTarget({ type: "row", id: state.selectedRowId });
        scheduleGanttFocusRestore({ type: "row", id: state.selectedRowId }, state.selectedVersion);
    }
}

function undoLastDraftChange() {
    if (!state.selectedVersion || state.dragSession || state.draftHistory.length === 0) {
        return false;
    }

    const previousDraftBars = state.draftHistory[state.draftHistory.length - 1];
    state.draftHistory = state.draftHistory.slice(0, -1);
    applyDraftBarsState(previousDraftBars);
    return true;
}

function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return target.isContentEditable
        || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
        || Boolean(target.closest("[contenteditable=\"true\"]"));
}

function handleDraftUndoKeyboard(event) {
    const isUndoShortcut = (event.ctrlKey || event.metaKey)
        && !event.shiftKey
        && !event.altKey
        && String(event.key || "").toLowerCase() === "z";

    if (!isUndoShortcut || event.defaultPrevented || event.repeat) {
        return;
    }
    if (state.modelDialogOpen || state.accountDialogOpen || isEditableTarget(event.target)) {
        return;
    }

    if (undoLastDraftChange()) {
        event.preventDefault();
    }
}

function queueTaskFocusRestore(barId) {
    state.pendingTaskFocusBarId = barId || null;
}

function normalizeGanttFocusTarget(target) {
    if (!target?.id) {
        return null;
    }

    return {
        type: target.type === "row" ? "row" : "task",
        id: target.id,
    };
}

function rememberGanttFocusTarget(target) {
    state.lastGanttFocusTarget = normalizeGanttFocusTarget(target);
}

function isGanttFocusTargetActive(target) {
    const normalizedTarget = normalizeGanttFocusTarget(target);
    if (!normalizedTarget) {
        return false;
    }

    if (normalizedTarget.type === "row") {
        return document.activeElement?.closest?.(".gantt-row")?.dataset?.rowId === normalizedTarget.id;
    }

    return document.activeElement?.closest?.(".lane-task")?.dataset?.barId === normalizedTarget.id;
}

function captureGanttFocusTarget(options = {}) {
    const { fallbackToSelection = false } = options;
    const activeTaskBarId = document.activeElement?.closest?.(".lane-task")?.dataset?.barId || null;
    if (activeTaskBarId) {
        return { type: "task", id: activeTaskBarId };
    }

    const activeRowId = document.activeElement?.closest?.(".gantt-row")?.dataset?.rowId || null;
    if (activeRowId) {
        return { type: "row", id: activeRowId };
    }

    if (!fallbackToSelection) {
        return null;
    }

    if (state.selectedBarId) {
        return { type: "task", id: state.selectedBarId };
    }

    if (state.selectedRowId) {
        return { type: "row", id: state.selectedRowId };
    }

    return null;
}

function queueGanttFocusRestore(target) {
    const normalizedTarget = normalizeGanttFocusTarget(target);
    if (!normalizedTarget) {
        state.pendingGanttFocusTarget = null;
        return;
    }

    state.pendingGanttFocusTarget = normalizedTarget;
    rememberGanttFocusTarget(normalizedTarget);
}

function consumeGanttFocusRestoreTarget() {
    const target = state.pendingGanttFocusTarget
        || captureGanttFocusTarget()
        || state.lastGanttFocusTarget
        || captureGanttFocusTarget({ fallbackToSelection: true });
    state.pendingGanttFocusTarget = null;
    return normalizeGanttFocusTarget(target);
}

function consumeTaskFocusRestoreId() {
    const activeTaskBarId = document.activeElement?.closest?.(".lane-task")?.dataset?.barId || null;
    const barId = state.pendingTaskFocusBarId || activeTaskBarId;
    state.pendingTaskFocusBarId = null;
    return barId;
}

function restoreTaskFocus(barId) {
    if (!barId) {
        return false;
    }

    const lane = Array.from(elements.ganttBoard.querySelectorAll(".lane-task"))
        .find((item) => item.dataset.barId === barId);
    if (!lane) {
        return false;
    }

    lane.focus({ preventScroll: true });
    return document.activeElement === lane || document.activeElement?.closest?.(".lane-task") === lane;
}

function restoreGanttFocus(target) {
    if (!target?.id) {
        return;
    }

    if (state.dragSession?.isDragging) {
        return;
    }

    if (target.type === "row") {
        if (focusGanttRow(target.id)) {
            rememberGanttFocusTarget(target);
        }
        return;
    }

    if (restoreTaskFocus(target.id)) {
        rememberGanttFocusTarget(target);
        return;
    }

    const fallbackRowId = state.ganttViewModel?.barMap.get(target.id)?.rowId || null;
    if (fallbackRowId) {
        if (focusGanttRow(fallbackRowId)) {
            rememberGanttFocusTarget({ type: "row", id: fallbackRowId });
        }
    }
}

function scheduleGanttFocusRestore(target, version) {
    const normalizedTarget = normalizeGanttFocusTarget(target);
    if (!normalizedTarget) {
        return;
    }

    const restoreToken = state.ganttFocusRestoreToken + 1;
    state.ganttFocusRestoreToken = restoreToken;

    const attemptRestore = (delay) => {
        window.setTimeout(() => {
            window.requestAnimationFrame(() => {
                if (state.ganttFocusRestoreToken !== restoreToken) {
                    return;
                }
                if (version && state.selectedVersion !== version) {
                    return;
                }
                if (state.dragSession?.isDragging) {
                    return;
                }
                if (isGanttFocusTargetActive(normalizedTarget)) {
                    return;
                }

                restoreGanttFocus(normalizedTarget);
            });
        }, delay);
    };

    restoreGanttFocus(normalizedTarget);
    if (isGanttFocusTargetActive(normalizedTarget)) {
        return;
    }

    attemptRestore(0);
    attemptRestore(32);
    attemptRestore(96);
}

function maintainTaskDragFocus(session) {
    if (!session?.barId) {
        return;
    }

    rememberGanttFocusTarget({ type: "task", id: session.barId });
}

function clearTaskDragGhost(session = state.dragSession) {
    if (!session?.dragGhostElement) {
        return;
    }

    session.dragGhostElement.remove();
    session.dragGhostElement = null;
}

function getGanttScrollInteractionBounds() {
    const container = elements.ganttScroll;
    const rect = container.getBoundingClientRect();
    const headerRect = elements.ganttBoard.querySelector(".gantt-header")?.getBoundingClientRect() || null;
    const contentTop = clamp(
        headerRect ? headerRect.bottom : rect.top,
        rect.top,
        rect.bottom
    );

    return {
        rect,
        contentTop,
        contentBottom: rect.bottom,
    };
}

function getClampedRowViewportRect(rowElement) {
    if (!rowElement) {
        return null;
    }

    const rect = rowElement.getBoundingClientRect();
    const bounds = getGanttScrollInteractionBounds();
    const top = Math.max(rect.top, bounds.contentTop);
    const bottom = Math.min(rect.bottom, bounds.contentBottom);
    const height = bottom - top;

    if (height <= 0) {
        return null;
    }

    return {
        top,
        bottom,
        height,
        centerY: top + (height / 2),
    };
}

function getTaskDragPreviewBar(session = state.dragSession) {
    if (!session?.barId || !state.ganttViewModel) {
        return null;
    }

    const bar = state.ganttViewModel.barMap.get(session.barId);
    if (!bar) {
        return null;
    }

    if (!session.isDragging || session.mode !== "move") {
        return bar;
    }

    return {
        ...bar,
        startMs: session.previewStartMs ?? bar.startMs,
        endMs: session.previewEndMs ?? bar.endMs,
        rowId: session.previewRowId || session.targetRowId || session.originalRowId,
        isDraft: bar.isDraft || (
            (session.previewStartMs ?? bar.startMs) !== session.originalStartMs
            || (session.previewEndMs ?? bar.endMs) !== session.originalEndMs
            || (session.previewRowId || session.targetRowId || session.originalRowId) !== session.originalRowId
        ),
    };
}

function getTaskDragViewportRect(session = state.dragSession) {
    if (!session?.initialLaneRect) {
        return null;
    }

    const bar = getTaskDragPreviewBar(session)
        || state.ganttViewModel?.barMap.get(session.barId)
        || null;
    if (!bar) {
        return null;
    }

    const bounds = getGanttScrollInteractionBounds();
    const left = session.initialLaneRect.left + ((bar.startMs - session.originalStartMs) / session.msPerPixel);
    const pointerOffsetY = Number.isFinite(session.pointerOffsetY)
        ? session.pointerOffsetY
        : (session.initialLaneRect.height / 2);
    const topRaw = session.pointerClientY - pointerOffsetY;
    const width = Math.max((bar.endMs - bar.startMs) / session.msPerPixel, 48);
    const height = session.initialLaneRect.height;
    const maxTop = Math.max(bounds.contentTop, bounds.contentBottom - height);
    const top = clamp(topRaw, bounds.contentTop, maxTop);

    return {
        left,
        right: left + width,
        top,
        bottom: top + height,
        width,
        height,
    };
}

function getTaskPreviewViewportRect(bar, options = {}) {
    const { fallbackHeight = null } = options;
    const viewModel = state.ganttViewModel;
    if (!bar || !viewModel) {
        return null;
    }

    const track = findGanttRowTrackElement(bar.rowId);
    if (!track) {
        return null;
    }

    const trackRect = track.getBoundingClientRect();
    const trackStyle = window.getComputedStyle(track);
    const taskTop = parseFloat(trackStyle.getPropertyValue("--gantt-task-top")) || 0;
    const resolvedHeight = Number.isFinite(fallbackHeight) && fallbackHeight > 0
        ? fallbackHeight
        : (parseFloat(trackStyle.getPropertyValue("--gantt-task-height")) || 0);
    const startPercent = clamp(((bar.startMs - viewModel.min) / viewModel.spanMs) * 100, 0, 100);
    const widthPercent = Math.max(((bar.endMs - bar.startMs) / viewModel.spanMs) * 100, 2.8);
    const left = trackRect.left + ((trackRect.width * startPercent) / 100);
    const width = (trackRect.width * widthPercent) / 100;
    const top = trackRect.top + taskTop;

    return {
        left,
        right: left + width,
        top,
        bottom: top + resolvedHeight,
        width,
        height: resolvedHeight,
    };
}

function hasTaskBarConflict(bar, viewModel = state.ganttViewModel) {
    if (!bar || !viewModel) {
        return false;
    }

    const rowBars = viewModel.barsByRow.get(bar.rowId) || [];
    const rowDowntimes = viewModel.downtimesByRow.get(bar.rowId) || [];
    const overlapsTask = rowBars.some((other) =>
        other.id !== bar.id && rangesOverlap(bar.startMs, bar.endMs, other.startMs, other.endMs)
    );
    const overlapsDowntime = rowDowntimes.some((downtime) =>
        rangesOverlap(bar.startMs, bar.endMs, downtime.startMs, downtime.endMs)
    );

    return overlapsTask || overlapsDowntime;
}

function syncTaskDragGhost(session = state.dragSession) {
    if (!session?.isDragging || session.mode !== "move") {
        clearTaskDragGhost(session);
        return;
    }

    const lane = session.sourceElement || findTaskLaneElement(session.barId);
    const bar = getTaskDragPreviewBar(session);
    if (!lane || !bar || !session.initialLaneRect) {
        clearTaskDragGhost(session);
        return;
    }

    let ghost = session.dragGhostElement;
    if (!ghost) {
        ghost = document.createElement("div");
        ghost.setAttribute("aria-hidden", "true");
        const content = lane.querySelector(".lane-task-content")?.cloneNode(true) || null;
        if (content) {
            ghost.appendChild(content);
        }
        document.body.appendChild(ghost);
        session.dragGhostElement = ghost;
    }

    const ghostRect = getTaskPreviewViewportRect(bar, {
        fallbackHeight: session.initialLaneRect?.height ?? null,
    }) || getTaskDragViewportRect(session);
    if (!ghostRect) {
        clearTaskDragGhost(session);
        return;
    }
    const widthPx = ghostRect.width;

    ghost.className = "lane-task lane-task-drag-ghost";
    ghost.classList.toggle("is-late", lane.classList.contains("is-late"));
    ghost.classList.toggle("is-pinned", lane.classList.contains("is-pinned"));
    ghost.classList.toggle("is-draft", Boolean(bar.isDraft));
    ghost.classList.toggle("is-conflict", hasTaskBarConflict(bar));
    ghost.classList.toggle("is-selected", lane.classList.contains("is-selected"));
    ghost.classList.toggle("is-compact", widthPx < 180);
    ghost.classList.toggle("is-tight", widthPx < 128);
    ghost.classList.add("is-dragging");
    ghost.style.left = `${ghostRect.left}px`;
    ghost.style.top = `${ghostRect.top}px`;
    ghost.style.width = `${ghostRect.width}px`;
    ghost.style.height = `${ghostRect.height}px`;
}

function findGanttRowTrackElement(rowId) {
    return findGanttRowElement(rowId)?.querySelector(".gantt-row-track") || null;
}

function getTaskDragModeLabel(mode) {
    if (mode === "resize-start") {
        return t("gantt.dragModeResizeStart");
    }
    if (mode === "resize-end") {
        return t("gantt.dragModeResizeEnd");
    }
    return t("gantt.dragModeMove");
}

function getEffectiveTaskDragSnapMs(session = state.dragSession) {
    if (session?.snapDisabled) {
        return MINUTE_MS;
    }

    return session?.snapMs || getGanttDragSnapMs();
}

function getTaskDragSnapValue(session = state.dragSession) {
    if (session?.snapDisabled) {
        return t("gantt.dragSnapDisabled");
    }

    return formatGanttSnapValue(getEffectiveTaskDragSnapMs(session));
}

function captureWindowScrollPosition() {
    return {
        left: window.scrollX || window.pageXOffset || 0,
        top: window.scrollY || window.pageYOffset || 0,
    };
}

function restoreWindowScrollPosition(position) {
    if (!position) {
        return;
    }

    if (document.body.classList.contains("is-gantt-dragging")) {
        return;
    }

    const currentLeft = window.scrollX || window.pageXOffset || 0;
    const currentTop = window.scrollY || window.pageYOffset || 0;
    if (Math.abs(currentLeft - position.left) < 1 && Math.abs(currentTop - position.top) < 1) {
        return;
    }

    window.scrollTo(position.left, position.top);
}

function maintainTaskDragWindowScroll(session) {
    if (!session?.windowScrollPosition) {
        return;
    }

    if (document.body.classList.contains("is-gantt-dragging")) {
        return;
    }

    const lockedPosition = session.windowScrollPosition;
    restoreWindowScrollPosition(lockedPosition);
    window.requestAnimationFrame(() => {
        if (state.dragSession && state.dragSession !== session) {
            return;
        }
        restoreWindowScrollPosition(lockedPosition);
    });
}

function setTaskDragSnapDisabled(session, nextDisabled, options = {}) {
    const { refresh = true } = options;
    if (!session || session.snapDisabled === nextDisabled) {
        return;
    }

    session.snapDisabled = nextDisabled;
    if (!refresh) {
        return;
    }

    if (session.isDragging) {
        applyTaskDragPosition(session);
        renderTaskDragAssist(session);
        maintainTaskDragFocus(session);
        syncTaskDragGhost(session);
        return;
    }

    if (state.selectedVersion) {
        renderTaskDragAssist(session);
    }
}

function handleTaskDragKeyboardToggle(event) {
    const session = state.dragSession;
    if (!session || event.key !== "Shift") {
        return;
    }

    setTaskDragSnapDisabled(session, event.type === "keydown");
}

function clearTaskDragAssist() {
    elements.ganttDragHud.classList.add("hidden");
    elements.ganttDragHud.removeAttribute("data-state");
    elements.ganttDragHud.removeAttribute("data-snap");
    elements.ganttDragStatus.classList.add("hidden");
    elements.ganttDragStatus.textContent = "";
    elements.ganttDragStatus.removeAttribute("data-state");
    for (const rowElement of elements.ganttBoard.querySelectorAll(".gantt-row")) {
        rowElement.classList.remove("is-drag-guide-active");
        rowElement.classList.remove("is-drop-target");
        rowElement.classList.remove("is-drop-conflict");
    }
    for (const layer of elements.ganttBoard.querySelectorAll(".gantt-drag-assist")) {
        layer.classList.remove("is-active");
        delete layer.dataset.conflict;
        delete layer.dataset.crossRow;
    }
}

function resetTaskCrossRowCandidate(session = state.dragSession) {
    if (!session) {
        return;
    }

    session.crossRowCandidateId = null;
    session.crossRowCandidateSince = 0;
}

function resolveStickyCrossRowTarget(session, candidateRowId, fallbackRowId = null) {
    if (!session || session.mode !== "move") {
        return candidateRowId || fallbackRowId;
    }

    if (!candidateRowId || candidateRowId === fallbackRowId) {
        resetTaskCrossRowCandidate(session);
        return candidateRowId || fallbackRowId;
    }

    if (!fallbackRowId) {
        resetTaskCrossRowCandidate(session);
        return candidateRowId;
    }

    const now = window.performance.now();
    if (session.crossRowCandidateId !== candidateRowId) {
        session.crossRowCandidateId = candidateRowId;
        session.crossRowCandidateSince = now;
        return fallbackRowId;
    }

    if ((now - session.crossRowCandidateSince) < GANTT_CROSS_ROW_STICKY_MS) {
        return fallbackRowId;
    }

    resetTaskCrossRowCandidate(session);
    return candidateRowId;
}

function resolveTaskDragTargetRowId(pointerClientY, fallbackRowId = null) {
    const rowElements = Array.from(elements.ganttBoard.querySelectorAll(".gantt-row"));
    const session = state.dragSession;
    const dragRect = session?.mode === "move" ? getTaskDragViewportRect(session) : null;
    const probeClientY = dragRect
        ? clamp((dragRect.top + dragRect.bottom) / 2, dragRect.top, dragRect.bottom)
        : pointerClientY;
    if (rowElements.length === 0) {
        return fallbackRowId;
    }

    const bounds = getGanttScrollInteractionBounds();
    if (probeClientY < bounds.contentTop || probeClientY > bounds.contentBottom) {
        resetTaskCrossRowCandidate(session);
        return fallbackRowId;
    }

    const fallbackElement = fallbackRowId
        ? rowElements.find((rowElement) => rowElement.dataset.rowId === fallbackRowId) || null
        : null;
    const directionDeltaY = state.dragSession
        ? (state.dragSession.pointerClientY - state.dragSession.startClientY)
        : 0;
    let fallbackCenterY = null;

    if (fallbackElement) {
        const fallbackRect = getClampedRowViewportRect(fallbackElement);
        fallbackCenterY = fallbackRect?.centerY ?? null;
        if (fallbackRect && probeClientY >= fallbackRect.top && probeClientY <= fallbackRect.bottom) {
            resetTaskCrossRowCandidate(session);
            return fallbackRowId;
        }
    }

    for (const rowElement of rowElements) {
        const rowId = rowElement.dataset.rowId;
        if (!rowId || rowId === fallbackRowId) {
            continue;
        }

        const rect = getClampedRowViewportRect(rowElement);
        if (!rect || probeClientY < rect.top || probeClientY > rect.bottom) {
            continue;
        }

        const candidateCenterY = rect.centerY;
        if (
            fallbackCenterY !== null
            && directionDeltaY > GANTT_CROSS_ROW_INTENT_PX
            && candidateCenterY < fallbackCenterY
        ) {
            continue;
        }
        if (
            fallbackCenterY !== null
            && directionDeltaY < -GANTT_CROSS_ROW_INTENT_PX
            && candidateCenterY > fallbackCenterY
        ) {
            continue;
        }

        const commitHeight = clamp(
            rect.height * GANTT_CROSS_ROW_COMMIT_RATIO,
            GANTT_CROSS_ROW_COMMIT_MIN_PX,
            Math.min(GANTT_CROSS_ROW_COMMIT_MAX_PX, rect.height)
        );
        const commitTop = rect.top + ((rect.height - commitHeight) / 2);
        const commitBottom = commitTop + commitHeight;
        if (probeClientY >= commitTop && probeClientY <= commitBottom) {
            return resolveStickyCrossRowTarget(session, rowId, fallbackRowId);
        }
    }

    resetTaskCrossRowCandidate(session);
    return fallbackRowId;
}

function renderTaskDragAssist(session) {
    if (!session?.isDragging || !state.ganttViewModel) {
        clearTaskDragAssist();
        return;
    }

    const bar = getTaskDragPreviewBar(session);
    if (!bar) {
        clearTaskDragAssist();
        return;
    }

    const targetRowId = session.mode === "move"
        ? (session.previewRowId || session.targetRowId || bar.rowId)
        : bar.rowId;
    const rowElement = findGanttRowElement(targetRowId);
    const track = findGanttRowTrackElement(targetRowId);
    const layer = track?.querySelector(".gantt-drag-assist");
    if (!rowElement || !track || !layer) {
        clearTaskDragAssist();
        return;
    }

    const row = state.ganttViewModel.rowMap.get(targetRowId);
    const startPercent = clamp(((bar.startMs - state.ganttViewModel.min) / state.ganttViewModel.spanMs) * 100, 0, 100);
    const endPercent = clamp(((bar.endMs - state.ganttViewModel.min) / state.ganttViewModel.spanMs) * 100, 0, 100);
    const widthPercent = Math.max(endPercent - startPercent, 0);
    const slotShadow = layer.querySelector(".gantt-drag-guide-slot-shadow");
    const slot = layer.querySelector(".gantt-drag-guide-slot");
    const band = layer.querySelector(".gantt-drag-guide-band");
    const startLine = layer.querySelector('.gantt-drag-guide-line[data-edge="start"]');
    const endLine = layer.querySelector('.gantt-drag-guide-line[data-edge="end"]');
    const dropLine = layer.querySelector('.gantt-drag-guide-line[data-edge="drop"]');
    const startLabel = startLine?.querySelector(".gantt-drag-guide-label");
    const endLabel = endLine?.querySelector(".gantt-drag-guide-label");
    const dropLabel = dropLine?.querySelector(".gantt-drag-guide-label");
    const isMoveMode = session.mode === "move";
    const isCrossRowMove = isMoveMode && targetRowId !== session.originalRowId;
    const hasConflict = hasTaskBarConflict(bar, state.ganttViewModel);

    clearTaskDragAssist();
    rowElement.classList.add("is-drag-guide-active");
    rowElement.classList.toggle("is-drop-target", isMoveMode);
    rowElement.classList.toggle("is-drop-conflict", hasConflict);
    layer.classList.add("is-active");
    layer.dataset.mode = session.mode;
    layer.dataset.conflict = String(hasConflict);
    layer.dataset.crossRow = String(isCrossRowMove);

    slotShadow.style.left = `${startPercent}%`;
    slotShadow.style.width = `${widthPercent}%`;
    slot.style.left = `${startPercent}%`;
    slot.style.width = `${widthPercent}%`;
    band.style.left = `${startPercent}%`;
    band.style.width = `${widthPercent}%`;
    startLine.style.left = `${startPercent}%`;
    endLine.style.left = `${endPercent}%`;
    dropLine.style.left = `${startPercent}%`;
    startLine.classList.toggle("is-active", session.mode !== "resize-end");
    startLine.classList.toggle("is-anchor", session.mode === "resize-end");
    startLine.classList.toggle("is-support", isMoveMode);
    endLine.classList.toggle("is-active", session.mode !== "resize-start");
    endLine.classList.toggle("is-anchor", session.mode === "resize-start");
    endLine.classList.toggle("is-support", isMoveMode);
    dropLine.classList.toggle("is-active", isMoveMode);
    dropLine.classList.toggle("is-drop-preview", isMoveMode);
    startLabel.textContent = isMoveMode ? "" : formatDatePoint(bar.startMs);
    endLabel.textContent = formatDatePoint(bar.endMs);
    dropLabel.textContent = isMoveMode ? formatDatePoint(bar.startMs) : "";

    elements.ganttDragHud.classList.remove("hidden");
    elements.ganttDragHud.dataset.state = hasConflict ? "conflict" : "clear";
    elements.ganttDragHud.dataset.snap = session.snapDisabled ? "off" : "on";
    elements.ganttDragMode.textContent = getTaskDragModeLabel(session.mode);
    elements.ganttDragSnap.textContent = getTaskDragSnapValue(session);
    elements.ganttDragStatus.classList.remove("hidden");
    elements.ganttDragStatus.dataset.state = hasConflict ? "conflict" : "clear";
    elements.ganttDragStatus.textContent = hasConflict
        ? t("gantt.dragStatusConflict")
        : t("gantt.dragStatusClear");
    elements.ganttDragStart.textContent = formatDateTime(bar.startMs);
    elements.ganttDragEnd.textContent = formatDateTime(bar.endMs);
    elements.ganttDragDuration.textContent = formatDuration(bar.endMs - bar.startMs);
    elements.ganttDragResource.textContent = row?.label || targetRowId;
}

function findGanttRowElement(rowId) {
    if (!rowId) {
        return null;
    }

    return Array.from(elements.ganttBoard.querySelectorAll(".gantt-row"))
        .find((item) => item.dataset.rowId === rowId) || null;
}

function focusGanttRow(rowId) {
    const rowElement = findGanttRowElement(rowId);
    if (!rowElement) {
        return false;
    }

    rowElement.focus({ preventScroll: true });
    return document.activeElement === rowElement || document.activeElement?.closest?.(".gantt-row") === rowElement;
}

function syncSelectedGanttRowState() {
    const selectedRowId = state.selectedRowId;
    for (const rowElement of elements.ganttBoard.querySelectorAll(".gantt-row")) {
        const isSelected = Boolean(selectedRowId && rowElement.dataset.rowId === selectedRowId);
        const isDiffFocused = Boolean(
            state.selectedVersionDiffFocusRowId
            && rowElement.dataset.rowId === state.selectedVersionDiffFocusRowId
        );
        rowElement.classList.toggle("is-selected", isSelected);
        rowElement.classList.toggle("is-diff-focused", isDiffFocused);
        if (isDiffFocused && state.selectedVersionDiffFocusChangeType) {
            rowElement.dataset.diffFocusKind = state.selectedVersionDiffFocusChangeType;
        } else {
            delete rowElement.dataset.diffFocusKind;
        }
        rowElement.setAttribute("aria-selected", String(isSelected));
    }
}

function findTaskLaneElement(barId) {
    if (!barId) {
        return null;
    }

    return Array.from(elements.ganttBoard.querySelectorAll(".lane-task"))
        .find((item) => item.dataset.barId === barId) || null;
}

function syncSelectedTaskBarState() {
    const selectedBarId = state.selectedBarId;
    for (const lane of elements.ganttBoard.querySelectorAll(".lane-task")) {
        const isSelected = Boolean(selectedBarId && lane.dataset.barId === selectedBarId);
        const isDiffFocused = Boolean(
            state.selectedVersionDiffFocusTaskId
            && lane.dataset.barId === state.selectedVersionDiffFocusTaskId
        );
        lane.classList.toggle("is-selected", isSelected);
        lane.classList.toggle("is-diff-focused", isDiffFocused);
        if (isDiffFocused && state.selectedVersionDiffFocusChangeType) {
            lane.dataset.diffFocusKind = state.selectedVersionDiffFocusChangeType;
        } else {
            delete lane.dataset.diffFocusKind;
        }
        lane.setAttribute("aria-pressed", String(isSelected));
    }
}

function updateGanttTableCellContent(cell, primaryText, secondaryText = null) {
    if (!cell) {
        return;
    }

    const primary = cell.querySelector(".gantt-cell-primary");
    if (primary) {
        primary.textContent = primaryText;
    }

    const secondary = cell.querySelector(".gantt-cell-secondary");
    if (secondary) {
        secondary.textContent = secondaryText ?? "";
    }
}

function updateGanttRowLabelPresentation(rowElement, row, summary) {
    if (!rowElement || !row || !summary) {
        return;
    }

    updateGanttTableCellContent(
        rowElement.querySelector('.gantt-table-cell[data-column-key="rowNo"]'),
        String(row.sortOrder).padStart(2, "0")
    );
    updateGanttTableCellContent(
        rowElement.querySelector('.gantt-table-cell[data-column-key="name"]'),
        row.label,
        summary.activityText
    );
    updateGanttTableCellContent(
        rowElement.querySelector('.gantt-table-cell[data-column-key="type"]'),
        translateEnum("resourceType", row.resourceType)
    );
    updateGanttTableCellContent(
        rowElement.querySelector('.gantt-table-cell[data-column-key="span"]'),
        summary.spanText
    );
    updateGanttTableCellContent(
        rowElement.querySelector('.gantt-table-cell[data-column-key="start"]'),
        summary.startText
    );
    updateGanttTableCellContent(
        rowElement.querySelector('.gantt-table-cell[data-column-key="finish"]'),
        summary.finishText
    );
}

function updateTaskLanePresentation(lane, bar, row, viewModel) {
    if (!lane || !bar || !viewModel) {
        return;
    }

    const msPerPixel = Number.isFinite(viewModel.msPerPixel) && viewModel.msPerPixel > 0 ? viewModel.msPerPixel : 1;
    const widthPercent = Math.max(((bar.endMs - bar.startMs) / viewModel.spanMs) * 100, 2.8);
    const leftPercent = ((bar.startMs - viewModel.min) / viewModel.spanMs) * 100;
    const widthPx = (bar.endMs - bar.startMs) / msPerPixel;
    const isSelected = bar.id === state.selectedBarId;
    const isConflict = viewModel.conflictIds.has(bar.id);
    const isDragging = state.dragSession?.barId === bar.id;
    const isResizing = isDragging && state.dragSession.mode !== "move";
    const isMoveDragging = isDragging && state.dragSession.mode === "move" && state.dragSession.isDragging;

    lane.style.left = `${leftPercent}%`;
    lane.style.width = `${widthPercent}%`;
    lane.dataset.rowId = bar.rowId;
    lane.dataset.pinned = String(Boolean(bar.pinned));
    lane.title = buildTaskTitle(bar, row, isConflict);
    lane.classList.toggle("is-late", Boolean(bar.late));
    lane.classList.toggle("is-pinned", Boolean(bar.pinned));
    lane.classList.toggle("is-draft", Boolean(bar.isDraft));
    lane.classList.toggle("is-selected", isSelected);
    lane.classList.toggle("is-diff-focused", bar.id === state.selectedVersionDiffFocusTaskId);
    lane.classList.toggle("is-conflict", isConflict);
    lane.classList.toggle("is-draggable", !bar.pinned);
    lane.classList.toggle("is-dragging", isDragging);
    lane.classList.toggle("is-resizing", isResizing);
    lane.classList.toggle("is-drag-source-muted", isMoveDragging);
    lane.classList.toggle("is-compact", widthPx < 180);
    lane.classList.toggle("is-tight", widthPx < 128);
    lane.setAttribute("aria-pressed", String(isSelected));
    if (bar.id === state.selectedVersionDiffFocusTaskId && state.selectedVersionDiffFocusChangeType) {
        lane.dataset.diffFocusKind = state.selectedVersionDiffFocusChangeType;
    } else {
        delete lane.dataset.diffFocusKind;
    }

    const meta = lane.querySelector("small");
    if (meta) {
        meta.textContent = `${bar.productCode} · ${formatDuration(bar.endMs - bar.startMs)}`;
    }
}

function syncGanttTaskLaneRows(viewModel) {
    if (!viewModel) {
        return;
    }

    const laneMap = new Map(
        Array.from(elements.ganttBoard.querySelectorAll(".lane-task"))
            .map((lane) => [lane.dataset.barId, lane])
    );

    for (const [barId, lane] of laneMap.entries()) {
        if (!viewModel.barMap.has(barId)) {
            lane.remove();
        }
    }

    for (const [rowId, row] of viewModel.rowMap.entries()) {
        const track = findGanttRowTrackElement(rowId);
        if (!track) {
            continue;
        }

        for (const bar of viewModel.barsByRow.get(rowId) || []) {
            let lane = laneMap.get(bar.id);
            const needsRebuild = lane && (lane.dataset.pinned === "true") !== Boolean(bar.pinned);
            if (needsRebuild) {
                const replacement = createTaskLane(bar, row, viewModel);
                lane.replaceWith(replacement);
                lane = replacement;
                laneMap.set(bar.id, lane);
            }
            if (!lane) {
                lane = createTaskLane(bar, row, viewModel);
                laneMap.set(bar.id, lane);
            }

            track.appendChild(lane);
            updateTaskLanePresentation(lane, bar, row, viewModel);
        }
    }
}

function refreshGanttTaskInteractionView(version) {
    if (!version) {
        clearTaskDragAssist();
        return;
    }

    const viewModel = buildGanttViewModel(version);
    state.ganttViewModel = viewModel;
    renderGanttToolbar(viewModel, version);
    renderSelectedTaskDetails(viewModel, version);
    syncSelectedGanttRowState();
    syncSelectedTaskBarState();

    for (const rowElement of elements.ganttBoard.querySelectorAll(".gantt-row")) {
        const rowId = rowElement.dataset.rowId;
        updateGanttRowLabelPresentation(
            rowElement,
            viewModel.rowMap.get(rowId),
            viewModel.rowSummaries.get(rowId)
        );
    }

    syncGanttTaskLaneRows(viewModel);
    renderTaskDragAssist(state.dragSession);
    syncTaskDragGhost(state.dragSession);
    maintainTaskDragWindowScroll(state.dragSession);
}

function selectGanttRow(rowId, options = {}) {
    const { focus = false } = options;
    state.selectedRowId = rowId || null;
    syncSelectedGanttRowState();

    if (focus && state.selectedRowId) {
        rememberGanttFocusTarget({ type: "row", id: state.selectedRowId });
        focusGanttRow(state.selectedRowId);
    }
}

function armTaskClickGuard() {
    state.taskClickGuardUntil = window.performance.now() + GANTT_CLICK_GUARD_MS;
}

function isTaskClickGuardActive() {
    return state.taskClickGuardUntil > window.performance.now();
}

function stopTaskDrag() {
    if (!state.dragSession) {
        clearTaskDragAssist();
        return;
    }

    const { autoScrollTimerId, pointerId, captureElement, windowScrollPosition, sourceElement } = state.dragSession;

    if (autoScrollTimerId) {
        window.clearInterval(autoScrollTimerId);
    }

    if (captureElement?.hasPointerCapture?.(pointerId)) {
        try {
            captureElement.releasePointerCapture(pointerId);
        } catch (error) {
            // The capture element may already be unavailable during teardown.
        }
    }

    window.removeEventListener("pointermove", handleTaskDrag);
    window.removeEventListener("pointerup", finishTaskDrag);
    window.removeEventListener("pointercancel", finishTaskDrag);
    window.removeEventListener("keydown", handleTaskDragKeyboardToggle);
    window.removeEventListener("keyup", handleTaskDragKeyboardToggle);
    document.body.classList.remove("is-gantt-dragging");
    sourceElement?.classList.remove("is-dragging", "is-resizing", "is-drag-source-hidden", "is-drag-source-muted");
    clearTaskDragGhost(state.dragSession);
    state.dragSession = null;
    clearTaskDragAssist();
    restoreWindowScrollPosition(windowScrollPosition);
}

function stopGanttColumnResize() {
    if (!state.ganttColumnResizeSession) {
        return;
    }

    const { pointerId, captureElement } = state.ganttColumnResizeSession;
    captureElement?.classList.remove("is-active");

    if (captureElement?.hasPointerCapture?.(pointerId)) {
        try {
            captureElement.releasePointerCapture(pointerId);
        } catch (error) {
            // The capture element may already be unavailable during teardown.
        }
    }

    window.removeEventListener("pointermove", handleGanttColumnResize);
    window.removeEventListener("pointerup", finishGanttColumnResize);
    window.removeEventListener("pointercancel", finishGanttColumnResize);
    document.body.classList.remove("is-gantt-column-resizing");
    state.ganttColumnResizeSession = null;
}

function stopGanttRowResize() {
    if (!state.ganttRowResizeSession) {
        return;
    }

    const { pointerId, captureElement, rowElement } = state.ganttRowResizeSession;
    captureElement?.classList.remove("is-active");
    rowElement?.classList.remove("is-row-resize-active");

    if (captureElement?.hasPointerCapture?.(pointerId)) {
        try {
            captureElement.releasePointerCapture(pointerId);
        } catch (error) {
            // The capture element may already be unavailable during teardown.
        }
    }

    window.removeEventListener("pointermove", handleGanttRowResize);
    window.removeEventListener("pointerup", finishGanttRowResize);
    window.removeEventListener("pointercancel", finishGanttRowResize);
    document.body.classList.remove("is-gantt-row-resizing");
    state.ganttRowResizeSession = null;
}

function handleGanttColumnResize(event) {
    const session = state.ganttColumnResizeSession;
    if (!session || event.pointerId !== session.pointerId) {
        return;
    }

    event.preventDefault();

    const scrollDelta = elements.ganttScroll.scrollLeft - session.startScrollLeft;
    const nextWidth = normalizeGanttColumnWidth(
        session.columnKey,
        session.originalWidth + (event.clientX - session.startClientX) + scrollDelta
    );

    if (nextWidth === state.ganttColumnWidths[session.columnKey]) {
        return;
    }

    state.ganttColumnWidths = {
        ...state.ganttColumnWidths,
        [session.columnKey]: nextWidth,
    };
    applyGanttColumnLayout(elements.ganttBoard, resolveGanttColumnLayout());
}

function handleGanttRowResize(event) {
    const session = state.ganttRowResizeSession;
    if (!session || event.pointerId !== session.pointerId) {
        return;
    }

    event.preventDefault();

    const scrollDelta = elements.ganttScroll.scrollTop - session.startScrollTop;
    const nextHeight = normalizeGanttRowHeight(
        session.originalHeight + (event.clientY - session.startClientY) + scrollDelta
    );

    if (nextHeight === session.lastHeight) {
        return;
    }

    session.lastHeight = nextHeight;
    state.ganttRowHeights = {
        ...state.ganttRowHeights,
        [session.rowId]: nextHeight,
    };
    applyGanttRowLayout(session.rowElement, nextHeight);
    updateGanttRowHeightBadge(session.rowElement, nextHeight);
}

function finishGanttColumnResize(event) {
    if (!state.ganttColumnResizeSession) {
        return;
    }

    if (event?.pointerId !== undefined && event.pointerId !== state.ganttColumnResizeSession.pointerId) {
        return;
    }

    const focusTarget = consumeGanttFocusRestoreTarget();
    stopGanttColumnResize();
    saveGanttColumnWidths();

    if (state.selectedVersion) {
        refreshGanttColumnResizeView(state.selectedVersion);
    } else {
        applyGanttColumnLayout(elements.ganttBoard, resolveGanttColumnLayout());
    }

    if (focusTarget) {
        scheduleGanttFocusRestore(focusTarget, state.selectedVersion);
    }
}

function finishGanttRowResize(event) {
    if (!state.ganttRowResizeSession) {
        return;
    }

    if (event?.pointerId !== undefined && event.pointerId !== state.ganttRowResizeSession.pointerId) {
        return;
    }

    const { rowId } = state.ganttRowResizeSession;
    stopGanttRowResize();
    saveGanttRowHeights();
    selectGanttRow(rowId, { focus: true });
}

function startGanttColumnResize(event, columnKey) {
    if (event.button !== 0) {
        return;
    }

    event.stopPropagation();
    queueGanttFocusRestore(captureGanttFocusTarget({ fallbackToSelection: true }));
    stopTaskDrag();
    stopGanttColumnResize();
    stopGanttRowResize();

    const columnLayout = resolveGanttColumnLayout();
    const captureElement = event.currentTarget;
    state.ganttColumnResizeSession = {
        columnKey,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startScrollLeft: elements.ganttScroll.scrollLeft,
        originalWidth: columnLayout.widths[columnKey],
        captureElement,
    };

    captureElement.classList.add("is-active");
    if (captureElement?.setPointerCapture) {
        try {
            captureElement.setPointerCapture(event.pointerId);
        } catch (error) {
            // Ignore capture failures and fall back to window-level listeners.
        }
    }

    document.body.classList.add("is-gantt-column-resizing");
    window.addEventListener("pointermove", handleGanttColumnResize);
    window.addEventListener("pointerup", finishGanttColumnResize);
    window.addEventListener("pointercancel", finishGanttColumnResize);
    event.preventDefault();
}

function resetGanttRowHeight(rowId) {
    if (!rowId || !(rowId in state.ganttRowHeights)) {
        return;
    }

    const nextRowHeights = { ...state.ganttRowHeights };
    delete nextRowHeights[rowId];
    state.ganttRowHeights = nextRowHeights;
    saveGanttRowHeights();
    selectGanttRow(rowId, { focus: true });

    const rowElement = findGanttRowElement(rowId);
    if (rowElement) {
        const nextHeight = resolveGanttRowHeight(rowId);
        applyGanttRowLayout(rowElement, nextHeight);
        updateGanttRowHeightBadge(rowElement, nextHeight);
    }
}

function startGanttRowResize(event, rowId, rowElement) {
    if (event.button !== 0) {
        return;
    }

    event.stopPropagation();
    stopTaskDrag();
    stopGanttColumnResize();
    stopGanttRowResize();
    selectGanttRow(rowId, { focus: true });

    const captureElement = event.currentTarget;
    const originalHeight = resolveGanttRowHeight(rowId);
    state.ganttRowResizeSession = {
        rowId,
        rowElement,
        pointerId: event.pointerId,
        startClientY: event.clientY,
        startScrollTop: elements.ganttScroll.scrollTop,
        originalHeight,
        lastHeight: originalHeight,
        captureElement,
    };

    captureElement.classList.add("is-active");
    rowElement?.classList.add("is-row-resize-active");
    if (captureElement?.setPointerCapture) {
        try {
            captureElement.setPointerCapture(event.pointerId);
        } catch (error) {
            // Ignore capture failures and fall back to window-level listeners.
        }
    }

    updateGanttRowHeightBadge(rowElement, originalHeight);
    document.body.classList.add("is-gantt-row-resizing");
    window.addEventListener("pointermove", handleGanttRowResize);
    window.addEventListener("pointerup", finishGanttRowResize);
    window.addEventListener("pointercancel", finishGanttRowResize);
    event.preventDefault();
}

function resetVersionInteractionState(options = {}) {
    const { keepZoom = true } = options;
    stopGanttColumnResize();
    stopGanttRowResize();
    stopTaskDrag();
    clearVersionDiffFocus();
    state.selectedBarId = null;
    state.selectedRowId = null;
    state.draftBars = {};
    clearDraftHistory();
    state.hasDraftChanges = false;
    state.ganttViewModel = null;

    if (!keepZoom) {
        state.ganttZoom = 0.5;
        state.ganttZoomMode = "manual";
    }
}

function buildDisplayBars(version) {
    return version.bars.map((bar) => {
        const draft = state.draftBars[bar.id];
        return draft
            ? { ...bar, ...draft, isDraft: true }
            : { ...bar, isDraft: false };
    });
}

function getInventoryCoverages(version) {
    return Array.isArray(version?.inventoryCoverages) ? version.inventoryCoverages : [];
}

function buildInventoryCoverageSummary(version) {
    const inventoryCoverages = getInventoryCoverages(version);
    return inventoryCoverages.reduce((summary, item) => {
        summary.count += 1;
        summary.coveredQuantity += item.coveredQuantity || 0;
        summary.requestedQuantity += item.requestedQuantity || 0;
        return summary;
    }, {
        count: 0,
        coveredQuantity: 0,
        requestedQuantity: 0,
    });
}

function findBaseBar(version, barId) {
    return version?.bars.find((bar) => bar.id === barId) || null;
}

function startOfLocalDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

function startOfLocalWeek(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const mondayOffset = (day + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    return date.getTime();
}

function startOfLocalMonth(value) {
    const date = new Date(value);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

function startOfHourStep(value, hours) {
    const date = new Date(value);
    date.setMinutes(0, 0, 0);
    date.setHours(date.getHours() - (date.getHours() % hours));
    return date.getTime();
}

function startOfTimescaleUnit(value, unit) {
    if (unit === "month") {
        return startOfLocalMonth(value);
    }
    if (unit === "week") {
        return startOfLocalWeek(value);
    }
    if (unit === "day") {
        return startOfLocalDay(value);
    }
    if (unit === "6hour") {
        return startOfHourStep(value, 6);
    }
    return startOfHourStep(value, 2);
}

function addTimescaleUnit(value, unit) {
    const date = new Date(value);

    if (unit === "month") {
        date.setMonth(date.getMonth() + 1, 1);
        return date.getTime();
    }
    if (unit === "week") {
        date.setDate(date.getDate() + 7);
        return date.getTime();
    }
    if (unit === "day") {
        date.setDate(date.getDate() + 1);
        return date.getTime();
    }
    if (unit === "6hour") {
        date.setHours(date.getHours() + 6);
        return date.getTime();
    }

    date.setHours(date.getHours() + 2);
    return date.getTime();
}

function formatTimescaleMajorLabel(unit, value) {
    if (unit === "month") {
        return formatMonthMarker(value);
    }
    if (unit === "week") {
        return formatDateMarker(value);
    }
    return formatDayMarker(value);
}

function formatTimescaleMinorLabel(unit, value) {
    if (unit === "week" || unit === "day") {
        return formatDateMarker(value);
    }
    return formatHourMarker(value);
}

function clipTimescaleSegment(startMs, endMs, minMs, maxMs, label, isMajorBoundary = false) {
    const clippedStartMs = Math.max(startMs, minMs);
    const clippedEndMs = Math.min(endMs, maxMs);

    if (clippedEndMs <= clippedStartMs) {
        return null;
    }

    const spanMs = Math.max(maxMs - minMs, 1);
    return {
        startMs,
        endMs,
        clippedStartMs,
        clippedEndMs,
        leftPercent: ((clippedStartMs - minMs) / spanMs) * 100,
        widthPercent: ((clippedEndMs - clippedStartMs) / spanMs) * 100,
        label,
        isMajorBoundary,
    };
}

function selectTimescaleStrategy(spanMs) {
    if (spanMs >= 45 * DAY_MS) {
        return { majorUnit: "month", minorUnit: "week" };
    }
    if (spanMs >= 10 * DAY_MS) {
        return { majorUnit: "week", minorUnit: "day" };
    }
    if (spanMs >= 2 * DAY_MS) {
        return { majorUnit: "day", minorUnit: "6hour" };
    }
    return { majorUnit: "day", minorUnit: "2hour" };
}

function buildGanttTimescale(minMs, maxMs) {
    const spanMs = Math.max(maxMs - minMs, 1);
    const strategy = selectTimescaleStrategy(spanMs);
    const majorSegments = [];
    const minorSegments = [];
    const markers = [];
    const majorBoundaries = new Set();

    for (
        let cursor = startOfTimescaleUnit(minMs, strategy.majorUnit);
        cursor < maxMs;
        cursor = addTimescaleUnit(cursor, strategy.majorUnit)
    ) {
        const nextCursor = addTimescaleUnit(cursor, strategy.majorUnit);
        majorBoundaries.add(cursor);
        const segment = clipTimescaleSegment(
            cursor,
            nextCursor,
            minMs,
            maxMs,
            formatTimescaleMajorLabel(strategy.majorUnit, cursor),
            true
        );
        if (segment) {
            majorSegments.push(segment);
        }
    }

    for (
        let cursor = startOfTimescaleUnit(minMs, strategy.minorUnit);
        cursor < maxMs;
        cursor = addTimescaleUnit(cursor, strategy.minorUnit)
    ) {
        const nextCursor = addTimescaleUnit(cursor, strategy.minorUnit);
        const segment = clipTimescaleSegment(
            cursor,
            nextCursor,
            minMs,
            maxMs,
            formatTimescaleMinorLabel(strategy.minorUnit, cursor),
            majorBoundaries.has(cursor)
        );
        if (!segment) {
            continue;
        }

        minorSegments.push(segment);
        markers.push({
            positionPercent: segment.leftPercent,
            isMajor: segment.isMajorBoundary,
        });
    }

    markers.push({ positionPercent: 100, isMajor: true });
    return {
        ...strategy,
        majorSegments,
        minorSegments,
        markers,
    };
}

function buildRowSummary(row, bars, downtimes) {
    const activity = [...bars, ...downtimes];
    if (activity.length === 0) {
        return {
            rowId: row.id,
            activityText: t("gantt.rowNoActivity"),
            spanText: "-",
            startText: "-",
            finishText: "-",
        };
    }

    const startMs = Math.min(...activity.map((item) => item.startMs));
    const endMs = Math.max(...activity.map((item) => item.endMs));
    return {
        rowId: row.id,
        activityText: t("gantt.rowActivitySummary", {
            taskCount: bars.length,
            downtimeCount: downtimes.length,
        }),
        spanText: formatDuration(endMs - startMs),
        startText: formatDatePoint(startMs),
        finishText: formatDatePoint(endMs),
    };
}

function buildInventoryCoverageRowSummary(inventoryCoverages) {
    if (!inventoryCoverages.length) {
        return {
            activityText: t("gantt.rowNoActivity"),
            spanText: "-",
            startText: "-",
            finishText: "-",
        };
    }

    const summary = buildInventoryCoverageSummary({ inventoryCoverages });
    const dueDates = inventoryCoverages.map((item) => item.dueDateMs);
    return {
        activityText: t("gantt.inventoryCoverageSummary", summary),
        spanText: formatDuration(Math.max(...dueDates) - Math.min(...dueDates)),
        startText: formatDatePoint(Math.min(...dueDates)),
        finishText: formatDatePoint(Math.max(...dueDates)),
    };
}

function calculateTimelineLayout(spanMs) {
    const spanMinutes = spanMs / 60000;
    const columnLayout = resolveGanttColumnLayout();
    const labelWidth = columnLayout.totalWidth;
    const naturalWidth = Math.max(
        GANTT_MIN_TIMELINE_WIDTH,
        Math.min(GANTT_MAX_TIMELINE_WIDTH, spanMinutes * GANTT_PIXELS_PER_MINUTE)
    );
    const availableTrackWidth = Math.max((elements.ganttScroll.clientWidth || 0) - labelWidth, 640);
    const fitZoom = clamp(availableTrackWidth / naturalWidth, GANTT_MIN_ZOOM, GANTT_MAX_ZOOM);
    const effectiveZoom = state.ganttZoomMode === "fit"
        ? fitZoom
        : clamp(state.ganttZoom, GANTT_MIN_ZOOM, GANTT_MAX_ZOOM);
    const timelineWidth = Math.max(availableTrackWidth, naturalWidth * effectiveZoom);

    return {
        columnLayout,
        labelWidth,
        naturalWidth,
        availableTrackWidth,
        fitZoom,
        effectiveZoom,
        timelineWidth,
        msPerPixel: spanMs / timelineWidth,
    };
}

function detectDraftConflicts(barsByRow, downtimesByRow) {
    const conflicts = new Set();

    for (const [rowId, bars] of barsByRow.entries()) {
        const rowDowntimes = downtimesByRow.get(rowId) || [];

        for (const bar of bars) {
            if (!bar.isDraft) {
                continue;
            }

            const overlapsTask = bars.some((other) =>
                other.id !== bar.id && rangesOverlap(bar.startMs, bar.endMs, other.startMs, other.endMs)
            );
            const overlapsDowntime = rowDowntimes.some((downtime) =>
                rangesOverlap(bar.startMs, bar.endMs, downtime.startMs, downtime.endMs)
            );

            if (overlapsTask || overlapsDowntime) {
                conflicts.add(bar.id);
            }
        }
    }

    return conflicts;
}

function buildGanttViewModel(version) {
    const bars = buildDisplayBars(version);
    const inventoryCoverages = [...getInventoryCoverages(version)].sort((left, right) => left.dueDateMs - right.dueDateMs);
    const barsByRow = groupBy(bars, (item) => item.rowId);
    const downtimesByRow = groupBy(version.downtimes, (item) => item.rowId);

    for (const bucket of barsByRow.values()) {
        bucket.sort((left, right) => left.startMs - right.startMs);
    }

    const { min, max } = calculateTimeRange(version);
    const spanMs = Math.max(max - min, 1);
    const layout = calculateTimelineLayout(spanMs);
    const barMap = new Map(bars.map((bar) => [bar.id, bar]));
    const rowMap = new Map(version.rows.map((row) => [row.id, row]));
    const rowSummaries = new Map(
        version.rows.map((row) => {
            const rowBars = barsByRow.get(row.id) || [];
            const rowDowntimes = downtimesByRow.get(row.id) || [];
            return [row.id, buildRowSummary(row, rowBars, rowDowntimes)];
        })
    );

    return {
        ...layout,
        min,
        max,
        spanMs,
        rowMap,
        rowSummaries,
        barMap,
        barsByRow,
        downtimesByRow,
        inventoryCoverages,
        conflictIds: detectDraftConflicts(barsByRow, downtimesByRow),
        timescale: buildGanttTimescale(min, max),
    };
}

function refreshGanttColumnResizeView(version) {
    if (!version) {
        return;
    }

    const viewModel = buildGanttViewModel(version);
    state.ganttViewModel = viewModel;
    renderGanttToolbar(viewModel, version);
    renderSelectedTaskDetails(viewModel, version);
    applyGanttColumnLayout(elements.ganttBoard, viewModel.columnLayout);
    elements.ganttBoard.style.setProperty("--timeline-width", `${viewModel.timelineWidth}px`);

    const header = elements.ganttBoard.querySelector(".gantt-header");
    header?.style.setProperty("--timeline-width", `${viewModel.timelineWidth}px`);

    for (const rowElement of elements.ganttBoard.querySelectorAll(".gantt-row")) {
        rowElement.style.setProperty("--timeline-width", `${viewModel.timelineWidth}px`);
    }

    for (const lane of elements.ganttBoard.querySelectorAll(".lane-task")) {
        const bar = viewModel.barMap.get(lane.dataset.barId);
        if (!bar) {
            continue;
        }

        const row = viewModel.rowMap.get(bar.rowId);
        const msPerPixel = Number.isFinite(viewModel.msPerPixel) && viewModel.msPerPixel > 0 ? viewModel.msPerPixel : 1;
        const widthPercent = Math.max(((bar.endMs - bar.startMs) / viewModel.spanMs) * 100, 2.8);
        const leftPercent = ((bar.startMs - viewModel.min) / viewModel.spanMs) * 100;
        const widthPx = (bar.endMs - bar.startMs) / msPerPixel;
        const hasConflict = viewModel.conflictIds.has(bar.id);

        lane.style.left = `${leftPercent}%`;
        lane.style.width = `${widthPercent}%`;
        lane.title = buildTaskTitle(bar, row, hasConflict);
        lane.classList.toggle("is-compact", widthPx < 180);
        lane.classList.toggle("is-tight", widthPx < 128);
        lane.classList.toggle("is-conflict", hasConflict);
        lane.classList.toggle("is-selected", bar.id === state.selectedBarId);
        lane.setAttribute("aria-pressed", String(bar.id === state.selectedBarId));
    }
}

function setGanttZoom(nextZoom, mode = "manual") {
    state.ganttZoom = clamp(nextZoom, GANTT_MIN_ZOOM, GANTT_MAX_ZOOM);
    state.ganttZoomMode = mode;

    if (state.selectedVersion) {
        renderGantt(state.selectedVersion);
    }
}

function zoomGantt(factor) {
    const currentZoom = state.ganttViewModel?.effectiveZoom || state.ganttZoom;
    setGanttZoom(currentZoom * factor);
}

function fitGanttTimeline() {
    state.ganttZoomMode = "fit";

    if (state.selectedVersion) {
        renderGantt(state.selectedVersion);
    }
}

function updateDraftBar(barId, startMs, endMs, rowId = null) {
    const baseBar = findBaseBar(state.selectedVersion, barId);
    if (!baseBar) {
        return;
    }

    const normalizedRowId = rowId || baseBar.rowId;
    const nextDraftBars = buildNextDraftBarsForBar(barId, {
        ...(state.draftBars[barId] || {}),
        startMs,
        endMs,
        rowId: normalizedRowId,
    });
    if (!nextDraftBars) {
        return;
    }

    state.draftBars = nextDraftBars;
    syncDraftState();
}

function resetDraftBars() {
    stopTaskDrag();
    clearDraftHistory();
    applyDraftBarsState({}, { render: Boolean(state.selectedVersion) });
}

function buildTrialSolvePayload() {
    if (!state.selectedVersion || !state.hasDraftChanges) {
        return null;
    }

    const draftBars = Object.entries(state.draftBars)
        .map(([barId, draft]) => {
            const baseBar = findBaseBar(state.selectedVersion, barId);
            if (!baseBar) {
                return null;
            }

            const merged = { ...baseBar, ...draft };
            return {
                barId,
                rowId: merged.rowId,
                startMs: merged.startMs,
                endMs: merged.endMs,
                pinned: Boolean(merged.pinned),
            };
        })
        .filter(Boolean);

    return draftBars.length > 0 ? { draftBars } : null;
}

function toggleSelectedTaskPinned() {
    if (!state.selectedVersion || !state.selectedBarId) {
        return;
    }

    const barId = state.selectedBarId;
    const displayBar = findDisplayBar(state.selectedVersion, barId);
    if (!displayBar) {
        return;
    }

    const previousDraftBars = cloneDraftBars(state.draftBars);
    const nextDraftBars = buildNextDraftBarsForBar(barId, {
        ...(state.draftBars[barId] || {}),
        startMs: displayBar.startMs,
        endMs: displayBar.endMs,
        rowId: displayBar.rowId,
        pinned: !displayBar.pinned,
    });
    if (!nextDraftBars || areDraftBarsEqual(previousDraftBars, nextDraftBars)) {
        return;
    }

    recordDraftUndoStep(previousDraftBars);
    applyDraftBarsState(nextDraftBars, { focusBarId: barId });
}

function unlockDiffTaskForAdjustment(change) {
    if (!change || !state.selectedVersion) {
        return false;
    }
    if (!change.pinnedChanged || change.basePinned !== false || change.targetPinned !== true) {
        return false;
    }

    const displayBar = findDisplayBar(state.selectedVersion, change.taskId);
    if (!displayBar || !displayBar.pinned) {
        return false;
    }

    const previousDraftBars = cloneDraftBars(state.draftBars);
    const nextDraftBars = buildNextDraftBarsForBar(change.taskId, {
        ...(state.draftBars[change.taskId] || {}),
        startMs: displayBar.startMs,
        endMs: displayBar.endMs,
        rowId: displayBar.rowId,
        pinned: false,
    });
    if (!nextDraftBars || areDraftBarsEqual(previousDraftBars, nextDraftBars)) {
        return false;
    }

    recordDraftUndoStep(previousDraftBars);
    applyDraftBarsState(nextDraftBars, { focusBarId: change.taskId });
    return true;
}

function buildAutoScrollStep(distanceToEdge, edgePx, minStepPx, maxStepPx, options = {}) {
    const { multiplier = 1, outsideBoostPx = 0 } = options;
    const normalizedDistance = Math.max(distanceToEdge, 0);
    const ratio = clamp((edgePx - normalizedDistance) / edgePx, 0, 1);
    if (ratio <= 0 && distanceToEdge >= 0) {
        return 0;
    }

    let step = minStepPx + ((maxStepPx - minStepPx) * ratio * ratio);
    if (distanceToEdge < 0 && outsideBoostPx > 0) {
        const overshootRatio = clamp(Math.abs(distanceToEdge) / edgePx, 0, 1.5);
        step += outsideBoostPx * (1 + overshootRatio);
    }

    return Math.round(step * multiplier);
}

function getTaskAutoScrollDelta(pointerClientX, pointerClientY, session = state.dragSession) {
    const container = elements.ganttScroll;
    const bounds = getGanttScrollInteractionBounds();
    const rect = bounds.rect;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const dragRect = getTaskDragViewportRect(session);
    const horizontalProbeLeft = dragRect
        ? Math.min(pointerClientX, Math.max(dragRect.left, pointerClientX - GANTT_AUTO_SCROLL_HORIZONTAL_LEAD_PX))
        : pointerClientX;
    const horizontalProbeRight = dragRect
        ? Math.max(pointerClientX, Math.min(dragRect.right, pointerClientX + GANTT_AUTO_SCROLL_HORIZONTAL_LEAD_PX))
        : pointerClientX;
    const verticalProbeTop = dragRect ? dragRect.top : pointerClientY;
    const verticalProbeBottom = dragRect ? dragRect.bottom : pointerClientY;
    const leftGap = horizontalProbeLeft - rect.left;
    const rightGap = rect.right - horizontalProbeRight;
    const topGap = verticalProbeTop - bounds.contentTop;
    const bottomGap = bounds.contentBottom - verticalProbeBottom;
    const isMoveMode = session?.mode === "move";
    const horizontalMultiplier = isMoveMode ? GANTT_AUTO_SCROLL_MOVE_HORIZONTAL_MULTIPLIER : 1;
    const verticalMultiplier = isMoveMode ? GANTT_AUTO_SCROLL_MOVE_VERTICAL_MULTIPLIER : 1.15;
    const verticalEdgePx = isMoveMode ? GANTT_AUTO_SCROLL_MOVE_VERTICAL_EDGE_PX : GANTT_AUTO_SCROLL_VERTICAL_EDGE_PX;
    const pointerVerticalDelta = session
        ? (session.pointerClientY - session.startClientY)
        : 0;
    const isDraggingUp = pointerVerticalDelta <= -GANTT_AUTO_SCROLL_VERTICAL_INTENT_PX;
    const isDraggingDown = pointerVerticalDelta >= GANTT_AUTO_SCROLL_VERTICAL_INTENT_PX;
    let horizontal = 0;
    let vertical = 0;

    if (maxScrollLeft > 0) {
        if (leftGap < GANTT_AUTO_SCROLL_EDGE_PX && container.scrollLeft > 0) {
            horizontal = -buildAutoScrollStep(
                leftGap,
                GANTT_AUTO_SCROLL_EDGE_PX,
                GANTT_AUTO_SCROLL_MIN_STEP_PX,
                GANTT_AUTO_SCROLL_MAX_STEP_PX,
                {
                    multiplier: horizontalMultiplier,
                    outsideBoostPx: GANTT_AUTO_SCROLL_OUTSIDE_BOOST_PX,
                }
            );
        } else if (rightGap < GANTT_AUTO_SCROLL_EDGE_PX && container.scrollLeft < maxScrollLeft) {
            horizontal = buildAutoScrollStep(
                rightGap,
                GANTT_AUTO_SCROLL_EDGE_PX,
                GANTT_AUTO_SCROLL_MIN_STEP_PX,
                GANTT_AUTO_SCROLL_MAX_STEP_PX,
                {
                    multiplier: horizontalMultiplier,
                    outsideBoostPx: GANTT_AUTO_SCROLL_OUTSIDE_BOOST_PX,
                }
            );
        }
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    if (maxScrollTop > 0) {
        if (
            topGap < verticalEdgePx
            && container.scrollTop > 0
            && (!isMoveMode || isDraggingUp)
        ) {
            vertical = -buildAutoScrollStep(
                topGap,
                verticalEdgePx,
                GANTT_AUTO_SCROLL_VERTICAL_MIN_STEP_PX,
                GANTT_AUTO_SCROLL_VERTICAL_MAX_STEP_PX,
                {
                    multiplier: verticalMultiplier,
                    outsideBoostPx: GANTT_AUTO_SCROLL_OUTSIDE_BOOST_PX,
                }
            );
        } else if (
            bottomGap < verticalEdgePx
            && container.scrollTop < maxScrollTop
            && (!isMoveMode || isDraggingDown)
        ) {
            vertical = buildAutoScrollStep(
                bottomGap,
                verticalEdgePx,
                GANTT_AUTO_SCROLL_VERTICAL_MIN_STEP_PX,
                GANTT_AUTO_SCROLL_VERTICAL_MAX_STEP_PX,
                {
                    multiplier: verticalMultiplier,
                    outsideBoostPx: GANTT_AUTO_SCROLL_OUTSIDE_BOOST_PX,
                }
            );
        }
    }

    return { horizontal, vertical };
}

function getTaskDragPointerDelta(session) {
    const horizontalScrollDelta = elements.ganttScroll.scrollLeft - session.startScrollLeft;
    const verticalScrollDelta = elements.ganttScroll.scrollTop - session.startScrollTop;
    return {
        horizontal: (session.pointerClientX - session.startClientX) + horizontalScrollDelta,
        vertical: (session.pointerClientY - session.startClientY) + verticalScrollDelta,
        horizontalScrollDelta,
        verticalScrollDelta,
    };
}

function commitTaskDraftChange(session, nextStartMs, nextEndMs, nextRowId = null) {
    const normalizedRowId = nextRowId || session.lastAppliedRowId || session.originalRowId;
    if (
        nextStartMs === session.lastAppliedStartMs
        && nextEndMs === session.lastAppliedEndMs
        && normalizedRowId === session.lastAppliedRowId
    ) {
        return;
    }

    const rowChanged = normalizedRowId !== session.lastAppliedRowId;
    session.lastAppliedStartMs = nextStartMs;
    session.lastAppliedEndMs = nextEndMs;
    session.lastAppliedRowId = normalizedRowId;
    session.targetRowId = normalizedRowId;
    state.selectedRowId = normalizedRowId;
    updateDraftBar(session.barId, nextStartMs, nextEndMs, normalizedRowId);
    if (rowChanged) {
        rememberGanttFocusTarget({ type: "task", id: session.barId });
        queueTaskFocusRestore(session.barId);
    }

    refreshGanttTaskInteractionView(state.selectedVersion);

    maintainTaskDragFocus(session);
    maintainTaskDragWindowScroll(session);
}

function applyTaskDragPosition(session) {
    const delta = getTaskDragPointerDelta(session);
    const deltaPixels = delta.horizontal;
    const snapMs = getEffectiveTaskDragSnapMs(session);

    if (session.mode === "resize-start") {
        const maxStartMs = Math.max(session.minStartMs, session.originalEndMs - GANTT_MIN_TASK_DURATION_MS);
        const desiredStartMs = session.originalStartMs + (deltaPixels * session.msPerPixel);
        const boundedStartMs = clamp(desiredStartMs, session.minStartMs, maxStartMs);
        const nextStartMs = clamp(roundToMinute(boundedStartMs, snapMs), session.minStartMs, maxStartMs);
        commitTaskDraftChange(session, nextStartMs, session.originalEndMs);
        return;
    }

    if (session.mode === "resize-end") {
        const minEndMs = Math.min(session.maxEndMs, session.originalStartMs + GANTT_MIN_TASK_DURATION_MS);
        const desiredEndMs = session.originalEndMs + (deltaPixels * session.msPerPixel);
        const boundedEndMs = clamp(desiredEndMs, minEndMs, session.maxEndMs);
        const nextEndMs = clamp(roundToMinute(boundedEndMs, snapMs), minEndMs, session.maxEndMs);
        commitTaskDraftChange(session, session.originalStartMs, nextEndMs);
        return;
    }

    const desiredStartMs = session.originalStartMs + (deltaPixels * session.msPerPixel);
    const boundedStartMs = clamp(
        desiredStartMs,
        session.minStartMs,
        session.maxEndMs - session.durationMs
    );
    const nextStartMs = clamp(
        roundToMinute(boundedStartMs, snapMs),
        session.minStartMs,
        session.maxEndMs - session.durationMs
    );
    const nextRowId = resolveTaskDragTargetRowId(
        session.pointerClientY,
        session.previewRowId || session.lastAppliedRowId || session.originalRowId
    );
    session.previewStartMs = nextStartMs;
    session.previewEndMs = nextStartMs + session.durationMs;
    session.previewRowId = nextRowId;
    session.targetRowId = nextRowId;
}

function stepTaskAutoScroll() {
    const session = state.dragSession;
    if (!session || !session.isDragging) {
        return;
    }

    maintainTaskDragFocus(session);

    const autoScrollDelta = getTaskAutoScrollDelta(session.pointerClientX, session.pointerClientY, session);
    if (autoScrollDelta.horizontal === 0 && autoScrollDelta.vertical === 0) {
        return;
    }

    const container = elements.ganttScroll;
    let horizontalChanged = false;
    let verticalChanged = false;

    if (autoScrollDelta.horizontal !== 0) {
        const nextScrollLeft = clamp(
            container.scrollLeft + autoScrollDelta.horizontal,
            0,
            container.scrollWidth - container.clientWidth
        );

        if (nextScrollLeft !== container.scrollLeft) {
            container.scrollLeft = nextScrollLeft;
            horizontalChanged = true;
        }
    }

    if (autoScrollDelta.vertical !== 0) {
        const nextScrollTop = clamp(
            container.scrollTop + autoScrollDelta.vertical,
            0,
            container.scrollHeight - container.clientHeight
        );

        if (nextScrollTop !== container.scrollTop) {
            container.scrollTop = nextScrollTop;
            verticalChanged = true;
        }
    }

    if (horizontalChanged || verticalChanged) {
        applyTaskDragPosition(session);
        renderTaskDragAssist(session);
        syncTaskDragGhost(session);
        maintainTaskDragWindowScroll(session);
    }
}

function startTaskAutoScroll() {
    const session = state.dragSession;
    if (!session || !session.isDragging || session.autoScrollTimerId) {
        return;
    }

    session.autoScrollTimerId = window.setInterval(stepTaskAutoScroll, 16);
}

function activateTaskDrag(session) {
    if (session.isDragging) {
        return;
    }

    session.isDragging = true;
    selectTaskBar(session.barId, { sourceElement: session.sourceElement, focus: false });
    document.body.classList.add("is-gantt-dragging");
    startTaskAutoScroll();
    session.sourceElement?.classList.add("is-dragging");
    if (session.mode !== "move") {
        session.sourceElement?.classList.add("is-resizing");
    } else {
        session.sourceElement?.classList.add("is-drag-source-muted");
    }
    session.targetRowId = session.lastAppliedRowId || session.originalRowId;
    maintainTaskDragFocus(session);
    renderTaskDragAssist(session);
    syncTaskDragGhost(session);
}

function renderGanttToolbar(viewModel, version) {
    const hasVersion = Boolean(version);
    const zoomPercent = Math.round((viewModel?.effectiveZoom || state.ganttZoom || 1) * 100);

    elements.ganttZoomOutButton.disabled = !hasVersion;
    elements.ganttFitButton.disabled = !hasVersion;
    elements.ganttZoomInButton.disabled = !hasVersion;
    elements.ganttResetDraftButton.disabled = !hasVersion || !state.hasDraftChanges;
    elements.ganttTrialButton.disabled = !hasVersion || !state.hasDraftChanges;
    elements.ganttTrialButton.classList.toggle("is-active", hasVersion && state.hasDraftChanges);
    elements.ganttFitButton.classList.toggle("is-active", state.ganttZoomMode === "fit" && hasVersion);
    elements.ganttZoomValue.textContent = t("gantt.zoomStatus", { percent: zoomPercent });
    elements.ganttDraftStatus.textContent = state.hasDraftChanges
        ? t("gantt.draftDirty", { count: Object.keys(state.draftBars).length })
        : t("gantt.draftClean");
    elements.ganttDraftStatus.dataset.state = state.hasDraftChanges ? "dirty" : "clean";
    renderGanttLabelLockState(hasVersion);
}

function createDetailItem(label, value) {
    const wrapper = document.createElement("div");
    wrapper.className = "gantt-detail-item";

    const detailLabel = document.createElement("span");
    detailLabel.className = "gantt-detail-item-label";
    detailLabel.textContent = label;
    wrapper.appendChild(detailLabel);

    const detailValue = document.createElement("strong");
    detailValue.className = "gantt-detail-item-value";
    detailValue.textContent = value;
    wrapper.appendChild(detailValue);

    return wrapper;
}

function createDetailBadge(text, tone) {
    const badge = document.createElement("span");
    badge.className = "gantt-detail-badge";
    badge.dataset.tone = tone;
    badge.textContent = text;
    return badge;
}

function renderSelectedTaskDetails(viewModel, version) {
    if (!version || !viewModel || !state.selectedBarId || !viewModel.barMap.has(state.selectedBarId)) {
        state.selectedBarId = viewModel?.barMap.has(state.selectedBarId) ? state.selectedBarId : null;
        elements.ganttDetailEmpty.classList.remove("hidden");
        elements.ganttDetailContent.classList.add("hidden");
        elements.ganttDetailEmpty.textContent = t("gantt.detailEmpty");
        elements.ganttDetailBadges.innerHTML = "";
        elements.ganttDetailGrid.innerHTML = "";
        elements.ganttDetailHint.textContent = "";
        elements.ganttDetailPinStatus.textContent = "";
        elements.ganttDetailPinButton.textContent = "";
        elements.ganttDetailPinButton.disabled = true;
        elements.ganttDetailPinButton.setAttribute("aria-pressed", "false");
        return;
    }

    const bar = viewModel.barMap.get(state.selectedBarId);
    const row = viewModel.rowMap.get(bar.rowId);
    const hasConflict = viewModel.conflictIds.has(bar.id);
    const detailItems = [
        [t("misc.product"), bar.productCode],
        [t("misc.resource"), row?.label || bar.rowId],
        [t("misc.start"), formatDateTime(bar.startMs)],
        [t("misc.end"), formatDateTime(bar.endMs)],
        [t("misc.due"), formatDateTime(bar.dueDateMs)],
        [t("misc.duration"), formatDuration(bar.endMs - bar.startMs)],
        [t("misc.priority"), formatNumber(bar.priority)],
        [t("misc.late"), bar.late ? t("misc.lateYes", { minutes: bar.tardinessMinutes }) : t("misc.lateNo")],
        [t("misc.pinned"), bar.pinned ? t("misc.pinnedYes") : t("misc.pinnedNo")],
        [t("misc.draft"), bar.isDraft ? t("misc.yes") : t("misc.no")],
        [t("misc.conflict"), hasConflict ? t("misc.yes") : t("misc.no")],
        [t("misc.editMode"), bar.pinned ? t("misc.readOnly") : t("misc.editable")],
    ];
    const hints = [];

    if (hasConflict) {
        hints.push(t("gantt.conflictHint"));
    }
    if (bar.pinned) {
        hints.push(t("gantt.detailReadOnly"));
    } else {
        hints.push(t("gantt.detailHint"));
    }
    if (bar.isDraft) {
        hints.push(t("gantt.draftOnly"));
    }

    elements.ganttDetailEmpty.classList.add("hidden");
    elements.ganttDetailContent.classList.remove("hidden");
    elements.ganttDetailTitle.textContent = bar.label;
    elements.ganttDetailSubtitle.textContent = `${row?.label || bar.rowId} · ${bar.productCode}`;
    elements.ganttDetailBadges.innerHTML = "";
    elements.ganttDetailGrid.innerHTML = "";
    elements.ganttDetailPinStatus.textContent = bar.pinned
        ? t("gantt.detailPinStatusPinned")
        : t("gantt.detailPinStatusUnlocked");
    elements.ganttDetailPinButton.textContent = bar.pinned
        ? t("gantt.detailUnpinAction")
        : t("gantt.detailPinAction");
    elements.ganttDetailPinButton.disabled = false;
    elements.ganttDetailPinButton.setAttribute("aria-pressed", String(bar.pinned));
    elements.ganttDetailHint.textContent = hints.join(" ");

    if (bar.isDraft) {
        elements.ganttDetailBadges.appendChild(createDetailBadge(t("gantt.legendDraft"), "draft"));
    }
    if (hasConflict) {
        elements.ganttDetailBadges.appendChild(createDetailBadge(t("gantt.legendConflict"), "conflict"));
    }
    if (bar.pinned) {
        elements.ganttDetailBadges.appendChild(createDetailBadge(t("gantt.legendPinned"), "pinned"));
    }
    if (bar.late) {
        elements.ganttDetailBadges.appendChild(createDetailBadge(t("gantt.legendLateTask"), "late"));
    }

    for (const [label, value] of detailItems) {
        elements.ganttDetailGrid.appendChild(createDetailItem(label, value));
    }
}

function selectTaskBar(barId, options = {}) {
    const { sourceElement = null, focus = true } = options;
    state.selectedBarId = barId;
    selectGanttRow(state.ganttViewModel?.barMap.get(barId)?.rowId || null);
    syncSelectedTaskBarState();
    renderSelectedTaskDetails(state.ganttViewModel, state.selectedVersion);
    rememberGanttFocusTarget({ type: "task", id: barId });
    queueTaskFocusRestore(barId);

    if (focus) {
        const lane = sourceElement?.dataset?.barId === barId ? sourceElement : findTaskLaneElement(barId);
        lane?.focus({ preventScroll: true });
    }
}

function startTaskDrag(event, item, sourceElement, mode = "move") {
    if (item.pinned || event.button !== 0 || !state.ganttViewModel) {
        return;
    }

    stopTaskDrag();
    stopGanttRowResize();
    selectTaskBar(item.id, { sourceElement, focus: false });

    const viewModel = state.ganttViewModel;
    const captureElement = sourceElement || elements.ganttScroll;
    const sourceRect = sourceElement?.getBoundingClientRect ? sourceElement.getBoundingClientRect() : null;
    state.dragSession = {
        mode,
        barId: item.id,
        originalRowId: item.rowId,
        startClientX: event.clientX,
        pointerClientX: event.clientX,
        startClientY: event.clientY,
        pointerClientY: event.clientY,
        originalStartMs: item.startMs,
        originalEndMs: item.endMs,
        durationMs: item.endMs - item.startMs,
        minStartMs: viewModel.min,
        maxEndMs: viewModel.max,
        msPerPixel: viewModel.msPerPixel,
        snapMs: getGanttDragSnapMs(viewModel),
        snapDisabled: Boolean(event.shiftKey),
        startScrollLeft: elements.ganttScroll.scrollLeft,
        startScrollTop: elements.ganttScroll.scrollTop,
        lastAppliedStartMs: item.startMs,
        lastAppliedEndMs: item.endMs,
        lastAppliedRowId: item.rowId,
        targetRowId: item.rowId,
        previewStartMs: item.startMs,
        previewEndMs: item.endMs,
        previewRowId: item.rowId,
        crossRowCandidateId: null,
        crossRowCandidateSince: 0,
        autoScrollTimerId: null,
        initialDraftBarsSnapshot: cloneDraftBars(state.draftBars),
        pointerId: event.pointerId,
        sourceElement,
        captureElement,
        initialLaneRect: sourceRect?.toJSON ? sourceRect.toJSON() : null,
        pointerOffsetY: sourceRect
            ? clamp(
                event.clientY - sourceRect.top,
                0,
                sourceRect.height
            )
            : 0,
        dragGhostElement: null,
        windowScrollPosition: captureWindowScrollPosition(),
        isDragging: false,
    };

    if (captureElement?.setPointerCapture) {
        try {
            captureElement.setPointerCapture(event.pointerId);
        } catch (error) {
            // Ignore capture failures and fall back to window-level listeners.
        }
    }

    window.addEventListener("pointermove", handleTaskDrag);
    window.addEventListener("pointerup", finishTaskDrag);
    window.addEventListener("pointercancel", finishTaskDrag);
    window.addEventListener("keydown", handleTaskDragKeyboardToggle);
    window.addEventListener("keyup", handleTaskDragKeyboardToggle);
    event.preventDefault();
}

function handleTaskDrag(event) {
    if (!state.dragSession) {
        return;
    }

    const session = state.dragSession;
    if (event.pointerId !== session.pointerId) {
        return;
    }

    event.preventDefault();
    session.pointerClientX = event.clientX;
    session.pointerClientY = event.clientY;
    setTaskDragSnapDisabled(session, Boolean(event.shiftKey), { refresh: session.isDragging });
    maintainTaskDragFocus(session);
    const delta = getTaskDragPointerDelta(session);
    const deltaPixels = delta.horizontal;
    const deltaRows = delta.vertical;

    if (!session.isDragging) {
        if (
            Math.abs(deltaPixels) < GANTT_DRAG_THRESHOLD_PX
            && Math.abs(deltaRows) < GANTT_DRAG_THRESHOLD_PX
            && delta.horizontalScrollDelta === 0
            && delta.verticalScrollDelta === 0
        ) {
            return;
        }

        activateTaskDrag(session);
    }

    stepTaskAutoScroll();
    applyTaskDragPosition(session);
    renderTaskDragAssist(session);
    syncTaskDragGhost(session);
    maintainTaskDragWindowScroll(session);
}

function finishTaskDrag(event) {
    if (!state.dragSession) {
        return;
    }

    if (event?.pointerId !== undefined && event.pointerId !== state.dragSession.pointerId) {
        return;
    }

    const session = state.dragSession;
    const { isDragging } = session;

    if (isDragging && Number.isFinite(event?.clientX) && Number.isFinite(event?.clientY)) {
        session.pointerClientX = event.clientX;
        session.pointerClientY = event.clientY;
        applyTaskDragPosition(session);
    }

    const pendingMoveDraft = isDragging && session.mode === "move"
        ? {
            startMs: session.previewStartMs ?? session.originalStartMs,
            endMs: session.previewEndMs ?? session.originalEndMs,
            rowId: session.previewRowId || session.targetRowId || session.originalRowId,
        }
        : null;

    stopTaskDrag();

    if (!isDragging) {
        return;
    }

    if (pendingMoveDraft) {
        state.selectedRowId = pendingMoveDraft.rowId;
        updateDraftBar(session.barId, pendingMoveDraft.startMs, pendingMoveDraft.endMs, pendingMoveDraft.rowId);
    }
    recordDraftUndoStep(session.initialDraftBarsSnapshot);

    armTaskClickGuard();
    queueTaskFocusRestore(state.selectedBarId);
    if (state.selectedVersion) {
        refreshGanttTaskInteractionView(state.selectedVersion);
        scheduleGanttFocusRestore({ type: "task", id: state.selectedBarId }, state.selectedVersion);
        restoreWindowScrollPosition(session.windowScrollPosition);
    }
}

function setLoading(isLoading) {
    elements.openModelButton.disabled = isLoading;
    elements.versionsOpenModelButton.disabled = isLoading;
    elements.runSampleButton.disabled = isLoading;
    elements.refreshButton.disabled = isLoading;
}

function setLoginPending(isPending) {
    state.isLoginPending = isPending;
    elements.loginButton.disabled = isPending;
    elements.usernameInput.disabled = isPending;
    elements.passwordInput.disabled = isPending;
    for (const button of elements.localeButtons) {
        button.disabled = isPending;
    }
    elements.loginButton.textContent = isPending ? t("auth.submitLoading") : t("auth.submit");
}

function setModelPending(isPending) {
    state.isModelPending = isPending;
    elements.modelScenarioNameInput.disabled = isPending;
    elements.modelScheduleStartInput.disabled = isPending;
    elements.modelHorizonInput.disabled = isPending;
    elements.modelTardinessInput.disabled = isPending;
    elements.modelMakespanInput.disabled = isPending;
    elements.modelTimeLimitInput.disabled = isPending;
    elements.modelWorkersInput.disabled = isPending;
    for (const input of elements.modelForm.querySelectorAll("input, select, textarea")) {
        if (!["model-close-button", "model-cancel-button", "model-template-button", "model-import-button", "model-submit-button"].includes(input.id)) {
            input.disabled = isPending;
        }
    }
    elements.modelCloseButton.disabled = isPending;
    elements.modelCancelButton.disabled = isPending;
    elements.modelSaveDraftButton.disabled = isPending;
    elements.modelResourceImportButton.disabled = isPending;
    elements.modelTaskImportButton.disabled = isPending;
    elements.modelDowntimeImportButton.disabled = isPending;
    elements.modelBatchResourcesButton.disabled = isPending;
    elements.modelBatchRecipesButton.disabled = isPending;
    elements.modelBatchDemandsButton.disabled = isPending;
    elements.modelBatchInventoryBalancesButton.disabled = isPending;
    elements.modelBatchDowntimesButton.disabled = isPending;
    elements.modelBatchSetupRulesButton.disabled = isPending;
    elements.modelTemplateButton.disabled = isPending;
    elements.modelExportTemplateButton.disabled = isPending;
    elements.modelExportButton.disabled = isPending;
    elements.modelImportButton.disabled = isPending;
    elements.modelAddResourceButton.disabled = isPending;
    elements.modelAddTaskButton.disabled = isPending;
    elements.modelAddDowntimeButton.disabled = isPending;
    for (const button of elements.modelForm.querySelectorAll("[data-row-remove]")) {
        button.disabled = isPending;
    }
    elements.modelSubmitButton.disabled = isPending;
    elements.modelSubmitButton.textContent = isPending ? t("model.submitLoading") : t("model.submit");
    updateModelDraftActionState();
}

function setAccountPending(isPending) {
    state.isAccountPending = isPending;
    elements.accountUsernameInput.disabled = isPending;
    elements.accountCurrentPasswordInput.disabled = isPending;
    elements.accountNewPasswordInput.disabled = isPending;
    elements.accountConfirmPasswordInput.disabled = isPending;
    elements.accountCloseButton.disabled = isPending;
    elements.accountCancelButton.disabled = isPending;
    elements.accountSaveButton.disabled = isPending;
    elements.accountSaveButton.textContent = isPending ? t("account.saveLoading") : t("account.save");
}

function setPublishEnabled(enabled) {
    elements.publishButton.disabled = !enabled;
}

function setReadyForReleaseEnabled(enabled) {
    elements.readyForReleaseButton.disabled = !enabled;
}

function setApproveEnabled(enabled) {
    elements.approveButton.disabled = !enabled;
}

function setRejectEnabled(enabled) {
    elements.rejectButton.disabled = !enabled;
}

function setRollbackEnabled(enabled) {
    elements.rollbackButton.disabled = !enabled;
}

function updateJobActionState() {
    const currentJob = state.currentJob;
    const canCancel = Boolean(currentJob && ["CREATED", "QUEUED", "RUNNING"].includes(currentJob.status) && canManageJobs());
    const canRetry = Boolean(currentJob && ["FAILED", "TIMEOUT", "CANCELLED"].includes(currentJob.status) && canManageJobs());
    elements.jobCancelButton.disabled = !canCancel;
    elements.jobRetryButton.disabled = !canRetry;
}

function resetSelectedVersionGovernance() {
    clearVersionDiffFocus();
    state.selectedVersionDiff = null;
    state.selectedVersionDiffError = null;
    state.selectedVersionDiffTaskId = null;
    state.selectedVersionCompareBaseId = null;
}

function getReleasedVersionSummary(exceptVersionId = null) {
    return state.versions.find((version) => version.status === "RELEASED" && version.versionId !== exceptVersionId) || null;
}

function getVersionCompareCandidates(targetVersionId) {
    return state.versions.filter((version) => version.versionId !== targetVersionId);
}

function resolveDefaultCompareBaseVersionId(targetVersionId) {
    const released = getReleasedVersionSummary(targetVersionId);
    if (released) {
        return released.versionId;
    }
    return getVersionCompareCandidates(targetVersionId)[0]?.versionId || null;
}

function updateVersionActionState(version) {
    setReadyForReleaseEnabled(Boolean(version && ["DRAFT", "REJECTED"].includes(version.status) && canSubmitVersion()));
    setApproveEnabled(Boolean(version && version.status === "READY_FOR_RELEASE" && canApproveVersion()));
    setRejectEnabled(Boolean(version && version.status === "READY_FOR_RELEASE" && canApproveVersion()));
    setPublishEnabled(Boolean(version && version.status === "APPROVED" && canPublishVersion()));
    setRollbackEnabled(Boolean(
        version
        && ["ARCHIVED", "ROLLED_BACK"].includes(version.status)
        && getReleasedVersionSummary(version.versionId)
        && canRollbackVersion()
    ));
}

function syncVersionGovernanceForm(version, { clearActionComment = false } = {}) {
    const hasVersion = Boolean(version);
    elements.versionReleaseNoteInput.disabled = !hasVersion || !canEditGovernance();
    elements.versionReleaseNoteSaveButton.disabled = !hasVersion || !canEditGovernance();
    elements.versionActionCommentInput.disabled = !hasVersion || !(canSubmitVersion() || canApproveVersion() || canPublishVersion() || canRollbackVersion());

    if (!hasVersion) {
        elements.versionReleaseNoteInput.value = "";
        elements.versionActionCommentInput.value = "";
        return;
    }

    elements.versionReleaseNoteInput.value = version.releaseNote || "";
    if (clearActionComment) {
        elements.versionActionCommentInput.value = "";
    }
}

function buildVersionSummaryPatchFromPayload(version) {
    if (!version) {
        return;
    }
    const summary = findVersionSummary(version.versionId);
    if (!summary) {
        return;
    }
    Object.assign(summary, {
        status: version.status,
        publishedAt: version.publishedAt || summary.publishedAt,
        releaseNote: version.releaseNote ?? null,
        createdBy: version.createdBy || summary.createdBy,
    });
}

function getRequiredGovernanceComment(titleKey) {
    const comment = elements.versionActionCommentInput.value.trim();
    if (comment) {
        return comment;
    }
    setJobStatusWithText(titleKey, t("governance.commentRequired"));
    elements.versionActionCommentInput.scrollIntoView({ block: "center", behavior: "smooth" });
    elements.versionActionCommentInput.focus();
    return null;
}

function getStatusClass(status) {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "READY_FOR_RELEASE" || normalized === "APPROVED") {
        return "status-ready";
    }
    if (normalized === "REJECTED") {
        return "status-rolled-back";
    }
    if (normalized === "RELEASED" || normalized === "PUBLISHED") {
        return "status-published";
    }
    if (normalized === "ROLLED_BACK") {
        return "status-rolled-back";
    }
    if (normalized === "ARCHIVED") {
        return "status-archived";
    }
    return "status-draft";
}

function updateSummary() {
    const publishedCount = state.versions.filter((version) => version.status === "RELEASED").length;
    const selectedSummary = state.versions.find((version) => version.versionId === state.selectedVersionId);

    elements.summaryTotalVersions.textContent = String(state.versions.length);
    elements.summaryPublishedVersions.textContent = String(publishedCount);
    elements.summarySelectedStatus.textContent = selectedSummary ? translateEnum("versionStatus", selectedSummary.status) : t("summary.none");
    elements.summarySelectedName.textContent = selectedSummary ? selectedSummary.versionName : t("summary.chooseVersion");
    elements.summaryLastRefresh.textContent = state.lastRefreshAt ? formatDateTime(state.lastRefreshAt) : t("summary.waiting");
    renderVersionsPanelRail(publishedCount, selectedSummary);
}

function canDeleteVersion(version) {
    return Boolean(version && version.status === "DRAFT");
}

function getDraftVersions() {
    return state.versions.filter(canDeleteVersion);
}

function getDraftVersionIds() {
    return getDraftVersions().map((version) => version.versionId);
}

function areAllDraftVersionsSelected() {
    const draftVersionIds = getDraftVersionIds();
    return draftVersionIds.length > 0 && draftVersionIds.every((versionId) => state.selectedDraftVersionIds.has(versionId));
}

function isDraftVersionSelected(versionId) {
    return state.selectedDraftVersionIds.has(versionId);
}

function toggleDraftVersionSelection(versionId, selected) {
    if (selected) {
        state.selectedDraftVersionIds.add(versionId);
    } else {
        state.selectedDraftVersionIds.delete(versionId);
    }
    updateDeleteDraftVersionsActionState();
}

function reconcileSelectedDraftVersionIds() {
    const validDraftVersionIds = new Set(getDraftVersionIds());
    state.selectedDraftVersionIds = new Set(
        [...state.selectedDraftVersionIds].filter((versionId) => validDraftVersionIds.has(versionId))
    );
    updateDeleteDraftVersionsActionState();
}

function updateDeleteDraftVersionsActionState() {
    const draftCount = getDraftVersions().length;
    const selectedCount = state.selectedDraftVersionIds.size;
    const allDraftsSelected = areAllDraftVersionsSelected();
    elements.selectAllDraftVersionsButton.disabled = draftCount === 0 || state.isDeleteDraftVersionsPending;
    elements.selectAllDraftVersionsButton.textContent = allDraftsSelected
        ? t("actions.clearDraftSelection")
        : t("actions.selectAllDrafts");
    elements.deleteDraftVersionsButton.disabled = selectedCount === 0 || state.isDeleteDraftVersionsPending;
    elements.deleteDraftVersionsButton.textContent = selectedCount > 0
        ? t("actions.deleteDraftsSelected", { count: selectedCount })
        : t("actions.deleteDrafts");
}

function updateVersionsDraftCountBadge() {
    const draftCount = getDraftVersions().length;
    elements.versionsDraftCountBadge.textContent = t("versions.draftCount", { count: draftCount });
}

function toggleSelectAllDraftVersions() {
    const draftVersionIds = getDraftVersionIds();
    if (draftVersionIds.length === 0 || state.isDeleteDraftVersionsPending) {
        return;
    }

    if (areAllDraftVersionsSelected()) {
        state.selectedDraftVersionIds.clear();
    } else {
        state.selectedDraftVersionIds = new Set(draftVersionIds);
    }
    renderVersionList();
}

function renderVersionList() {
    elements.versionList.innerHTML = "";
    updateVersionsDraftCountBadge();

    if (state.versions.length === 0) {
        elements.versionList.innerHTML = `<div class="empty-state">${t("versions.empty")}</div>`;
        updateDeleteDraftVersionsActionState();
        return;
    }

    for (const version of state.versions) {
        const fragment = elements.versionItemTemplate.content.cloneNode(true);
        const item = fragment.querySelector(".version-list-item");
        const selector = fragment.querySelector(".version-item-selector");
        const checkbox = fragment.querySelector(".version-item-checkbox");
        const button = fragment.querySelector(".version-item");
        const chip = fragment.querySelector(".version-status-chip");
        const triggerChip = fragment.querySelector(".version-trigger-chip");
        const name = fragment.querySelector(".version-name");
        const createdLabel = fragment.querySelector(".version-created-label");
        const createdAt = fragment.querySelector(".version-created-at");
        const publishedLabel = fragment.querySelector(".version-published-label");
        const publishedAt = fragment.querySelector(".version-published-at");
        const makespanLabel = fragment.querySelector(".version-makespan-label");
        const makespan = fragment.querySelector(".version-makespan");
        const lateLabel = fragment.querySelector(".version-late-label");
        const lateCount = fragment.querySelector(".version-late-count");
        const versionIdLabel = fragment.querySelector(".version-id-label");
        const versionIdCode = fragment.querySelector(".version-id-code");

        chip.textContent = translateEnum("versionStatus", version.status);
        chip.classList.add(getStatusClass(version.status));
        triggerChip.textContent = translateEnum("triggerType", version.triggerType);
        name.textContent = version.versionName;
        createdLabel.textContent = t("versions.createdLabel");
        createdAt.textContent = formatDatePoint(version.createdAt);
        publishedLabel.textContent = t("versions.publishedLabel");
        publishedAt.textContent = version.publishedAt ? formatDatePoint(version.publishedAt) : t("misc.notPublished");
        makespanLabel.textContent = t("kpi.makespan");
        makespan.textContent = formatMinutes(version.totalMakespan);
        lateLabel.textContent = t("kpi.lateTasks");
        lateCount.textContent = t("misc.lateCount", { count: version.lateTaskCount });
        versionIdLabel.textContent = t("versions.snapshotId");
        versionIdCode.textContent = formatVersionCardId(version.versionId);
        versionIdCode.title = version.versionId;

        button.classList.toggle("is-active", version.versionId === state.selectedVersionId);
        button.addEventListener("click", () => {
            loadVersion(version.versionId);
        });

        if (canDeleteVersion(version)) {
            item.classList.add("has-selector");
            selector.classList.remove("hidden");
            checkbox.checked = isDraftVersionSelected(version.versionId);
            selector.addEventListener("click", (event) => {
                event.stopPropagation();
            });
            checkbox.addEventListener("click", (event) => {
                event.stopPropagation();
            });
            checkbox.addEventListener("change", (event) => {
                toggleDraftVersionSelection(version.versionId, event.target.checked);
            });
        } else {
            selector.remove();
        }

        elements.versionList.appendChild(item);
    }

    updateDeleteDraftVersionsActionState();
}

function renderKpis(version) {
    if (!version) {
        elements.kpiTardiness.textContent = "-";
        elements.kpiMakespan.textContent = "-";
        elements.kpiLateCount.textContent = "-";
        elements.kpiUtilization.textContent = "-";
        return;
    }

    elements.kpiTardiness.textContent = formatNumber(version.kpis.totalWeightedTardiness);
    elements.kpiMakespan.textContent = formatMinutes(version.kpis.totalMakespan);
    elements.kpiLateCount.textContent = String(version.kpis.lateTaskCount);
    elements.kpiUtilization.textContent = formatPercent(version.kpis.averageUtilization);
}

function renderVersionCompareOptions(version) {
    elements.versionCompareSelect.innerHTML = "";

    if (!version) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = t("governance.compareUnavailable");
        elements.versionCompareSelect.appendChild(option);
        elements.versionCompareSelect.disabled = true;
        elements.versionCompareButton.disabled = true;
        return;
    }

    const candidates = getVersionCompareCandidates(version.versionId);
    if (candidates.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = t("governance.compareUnavailable");
        elements.versionCompareSelect.appendChild(option);
        elements.versionCompareSelect.disabled = true;
        elements.versionCompareButton.disabled = true;
        state.selectedVersionCompareBaseId = null;
        return;
    }

    if (!candidates.some((candidate) => candidate.versionId === state.selectedVersionCompareBaseId)) {
        state.selectedVersionCompareBaseId = resolveDefaultCompareBaseVersionId(version.versionId);
    }

    for (const candidate of candidates) {
        const option = document.createElement("option");
        option.value = candidate.versionId;
        option.textContent = `${candidate.versionName} · ${translateEnum("versionStatus", candidate.status)} · ${formatDateTime(candidate.createdAt)}`;
        elements.versionCompareSelect.appendChild(option);
    }

    elements.versionCompareSelect.value = state.selectedVersionCompareBaseId || candidates[0].versionId;
    elements.versionCompareSelect.disabled = false;
    elements.versionCompareButton.disabled = !elements.versionCompareSelect.value;
}

function createGovernanceMetricCard(label, value) {
    const card = document.createElement("article");
    card.className = "governance-metric-card";

    const metricLabel = document.createElement("span");
    metricLabel.className = "governance-metric-label";
    metricLabel.textContent = label;
    card.appendChild(metricLabel);

    const metricValue = document.createElement("strong");
    metricValue.className = "governance-metric-value";
    metricValue.textContent = value;
    card.appendChild(metricValue);

    return card;
}

function createGovernanceKpiItem(label, baseValue, targetValue, deltaValue) {
    const item = document.createElement("div");
    item.className = "governance-kpi-item";

    const kpiLabel = document.createElement("span");
    kpiLabel.className = "governance-kpi-label";
    kpiLabel.textContent = label;
    item.appendChild(kpiLabel);

    const values = document.createElement("strong");
    values.className = "governance-kpi-value";
    values.textContent = `${baseValue} -> ${targetValue}`;
    item.appendChild(values);

    const delta = document.createElement("span");
    delta.className = "governance-kpi-delta";
    delta.textContent = deltaValue;
    item.appendChild(delta);

    return item;
}

function buildVersionDiffTaskLines(change) {
    const unknownRow = t("governance.rowUnknown");
    if (change.changeType === "ADDED") {
        return [
            t("governance.taskAdded", { target: change.targetRowId || unknownRow }),
            t("governance.taskWindow", {
                start: formatDatePoint(change.targetStartMs),
                end: formatDatePoint(change.targetEndMs),
            }),
        ];
    }

    if (change.changeType === "REMOVED") {
        return [
            t("governance.taskRemoved", { base: change.baseRowId || unknownRow }),
            t("governance.taskWindow", {
                start: formatDatePoint(change.baseStartMs),
                end: formatDatePoint(change.baseEndMs),
            }),
        ];
    }

    const lines = [];
    if ((change.baseRowId || "") !== (change.targetRowId || "")) {
        lines.push(t("governance.taskReassigned", {
            base: change.baseRowId || unknownRow,
            target: change.targetRowId || unknownRow,
        }));
    }
    lines.push(t("governance.taskMoved", {
        start: formatSignedMinutes(change.startShiftMinutes),
        duration: formatSignedMinutes(change.durationDeltaMinutes),
        tardiness: formatSignedNumber(change.tardinessDeltaMinutes),
    }));
    lines.push(t("governance.taskWindow", {
        start: formatDatePoint(change.baseStartMs),
        end: formatDatePoint(change.targetStartMs),
    }));
    if (change.pinnedChanged) {
        if (change.basePinned === true && change.targetPinned === false) {
            lines.push(t("governance.taskPinnedChangedUnlocked"));
        } else if (change.basePinned === false && change.targetPinned === true) {
            lines.push(t("governance.taskPinnedChangedLocked"));
        } else {
            lines.push(t("governance.taskPinnedChanged"));
        }
    }
    return lines;
}

function revealTaskLane(barId) {
    const lane = findTaskLaneElement(barId);
    if (!lane) {
        return false;
    }
    lane.scrollIntoView({ block: "nearest", inline: "nearest" });
    lane.focus({ preventScroll: true });
    return true;
}

function revealGanttRowSelection(rowId) {
    const rowElement = findGanttRowElement(rowId);
    if (!rowElement) {
        return false;
    }
    rowElement.scrollIntoView({ block: "nearest", inline: "nearest" });
    rowElement.focus({ preventScroll: true });
    return true;
}

function clearVersionDiffFocus(options = {}) {
    const { sync = true } = options;
    if (state.selectedVersionDiffFocusTimer) {
        clearTimeout(state.selectedVersionDiffFocusTimer);
        state.selectedVersionDiffFocusTimer = null;
    }
    state.selectedVersionDiffFocusTaskId = null;
    state.selectedVersionDiffFocusRowId = null;
    state.selectedVersionDiffFocusChangeType = null;
    if (sync) {
        syncVersionDiffFocusState();
    }
}

function syncVersionDiffFocusState() {
    for (const rowElement of elements.ganttBoard.querySelectorAll(".gantt-row")) {
        const isDiffFocused = Boolean(
            state.selectedVersionDiffFocusRowId
            && rowElement.dataset.rowId === state.selectedVersionDiffFocusRowId
        );
        rowElement.classList.toggle("is-diff-focused", isDiffFocused);
        if (isDiffFocused && state.selectedVersionDiffFocusChangeType) {
            rowElement.dataset.diffFocusKind = state.selectedVersionDiffFocusChangeType;
        } else {
            delete rowElement.dataset.diffFocusKind;
        }
    }

    for (const lane of elements.ganttBoard.querySelectorAll(".lane-task")) {
        const isDiffFocused = Boolean(
            state.selectedVersionDiffFocusTaskId
            && lane.dataset.barId === state.selectedVersionDiffFocusTaskId
        );
        lane.classList.toggle("is-diff-focused", isDiffFocused);
        if (isDiffFocused && state.selectedVersionDiffFocusChangeType) {
            lane.dataset.diffFocusKind = state.selectedVersionDiffFocusChangeType;
        } else {
            delete lane.dataset.diffFocusKind;
        }
    }
}

function setVersionDiffFocus(target = null, options = {}) {
    const { durationMs = VERSION_DIFF_FOCUS_FLASH_MS } = options;
    clearVersionDiffFocus({ sync: false });
    state.selectedVersionDiffFocusTaskId = target?.taskId || null;
    state.selectedVersionDiffFocusRowId = target?.rowId || null;
    state.selectedVersionDiffFocusChangeType = target?.changeType || null;
    syncVersionDiffFocusState();

    if (durationMs > 0 && (state.selectedVersionDiffFocusTaskId || state.selectedVersionDiffFocusRowId)) {
        state.selectedVersionDiffFocusTimer = window.setTimeout(() => {
            clearVersionDiffFocus();
        }, durationMs);
    }
}

function activateVersionDiffTask(change) {
    state.selectedVersionDiffTaskId = change?.taskId || null;
    renderVersionDiff();

    if (!change || !state.selectedVersion || !state.ganttViewModel) {
        return;
    }

    const taskLabel = change.label || change.taskId || "-";
    unlockDiffTaskForAdjustment(change);

    if (state.ganttViewModel.barMap.has(change.taskId)) {
        const rowId = state.ganttViewModel.barMap.get(change.taskId)?.rowId || null;
        selectTaskBar(change.taskId, { focus: false });
        revealTaskLane(change.taskId);
        setVersionDiffFocus({ taskId: change.taskId, rowId, changeType: change.changeType });
        setJobStatus("governance.diffTaskFocusTitle", "governance.diffTaskFocusedDetail", { task: taskLabel });
        return;
    }

    const rowId = change.targetRowId || change.baseRowId;
    if (!rowId || !state.ganttViewModel.rowMap.has(rowId)) {
        clearVersionDiffFocus();
        setJobStatus("governance.diffTaskFocusTitle", "governance.diffTaskFocusUnavailable", { task: taskLabel });
        return;
    }

    state.selectedBarId = null;
    rememberGanttFocusTarget({ type: "row", id: rowId });
    selectGanttRow(rowId, { focus: false });
    syncSelectedTaskBarState();
    renderSelectedTaskDetails(state.ganttViewModel, state.selectedVersion);
    revealGanttRowSelection(rowId);
    setVersionDiffFocus({ rowId, changeType: change.changeType });
    setJobStatus("governance.diffTaskFocusTitle", "governance.diffTaskRowFocusedDetail", { row: rowId });
}

function renderVersionDiff() {
    elements.versionDiffSummary.innerHTML = "";
    elements.versionDiffKpis.innerHTML = "";
    elements.versionDiffTaskList.innerHTML = "";

    if (!state.selectedVersion) {
        elements.versionDiffEmpty.textContent = t("governance.diffEmpty");
        elements.versionDiffEmpty.classList.remove("hidden");
        elements.versionDiffContent.classList.add("hidden");
        return;
    }

    if (state.selectedVersionDiffError) {
        elements.versionDiffEmpty.textContent = t("governance.diffError", { message: state.selectedVersionDiffError });
        elements.versionDiffEmpty.classList.remove("hidden");
        elements.versionDiffContent.classList.add("hidden");
        return;
    }

    if (!state.selectedVersionDiff) {
        elements.versionDiffEmpty.textContent = state.selectedVersionCompareBaseId
            ? t("governance.diffEmpty")
            : t("governance.compareUnavailable");
        elements.versionDiffEmpty.classList.remove("hidden");
        elements.versionDiffContent.classList.add("hidden");
        return;
    }

    const diff = state.selectedVersionDiff;
    const summaryMetrics = [
        [t("governance.summaryChangedTasks"), String(diff.summary.changedTaskCount)],
        [t("governance.summaryMovedTasks"), String(diff.summary.movedTaskCount)],
        [t("governance.summaryAddedTasks"), String(diff.summary.addedTaskCount)],
        [t("governance.summaryRemovedTasks"), String(diff.summary.removedTaskCount)],
        [t("governance.summaryTotalShift"), formatMinutes(diff.summary.totalStartShiftMinutes)],
        [t("governance.summaryMaxShift"), formatMinutes(diff.summary.maxStartShiftMinutes)],
    ];
    summaryMetrics.forEach(([label, value]) => {
        elements.versionDiffSummary.appendChild(createGovernanceMetricCard(label, value));
    });

    elements.versionDiffKpis.append(
        createGovernanceKpiItem(
            t("governance.kpiWeightedTardiness"),
            formatNumber(diff.kpis.baseTotalWeightedTardiness),
            formatNumber(diff.kpis.targetTotalWeightedTardiness),
            formatSignedNumber(diff.kpis.totalWeightedTardinessDelta)
        ),
        createGovernanceKpiItem(
            t("governance.kpiMakespan"),
            formatMinutes(diff.kpis.baseTotalMakespan),
            formatMinutes(diff.kpis.targetTotalMakespan),
            formatSignedMinutes(diff.kpis.totalMakespanDelta)
        ),
        createGovernanceKpiItem(
            t("governance.kpiLateTasks"),
            formatNumber(diff.kpis.baseLateTaskCount),
            formatNumber(diff.kpis.targetLateTaskCount),
            formatSignedNumber(diff.kpis.lateTaskCountDelta)
        ),
        createGovernanceKpiItem(
            t("governance.kpiEfficiency"),
            formatPercent(diff.kpis.baseAverageUtilization),
            formatPercent(diff.kpis.targetAverageUtilization),
            formatSignedPercent(diff.kpis.averageUtilizationDelta)
        )
    );

    if (diff.changedTasks.length === 0) {
        const item = document.createElement("div");
        item.className = "governance-event-item is-empty";
        item.textContent = t("governance.diffNoChanges");
        elements.versionDiffTaskList.appendChild(item);
    } else {
        diff.changedTasks.forEach((change) => {
            const item = document.createElement("article");
            item.className = "governance-event-item";
            item.classList.toggle("is-selected", change.taskId === state.selectedVersionDiffTaskId);
            item.classList.add("is-actionable");
            item.dataset.changeType = change.changeType;
            item.tabIndex = 0;
            item.setAttribute("role", "button");

            const head = document.createElement("div");
            head.className = "governance-event-head";

            const title = document.createElement("strong");
            title.textContent = change.label || change.taskId;
            head.appendChild(title);

            const chip = document.createElement("span");
            chip.className = `version-status-chip ${getStatusClass("DRAFT")}`;
            chip.textContent = translateEnum("diffTaskChangeType", change.changeType);
            head.appendChild(chip);

            item.appendChild(head);

            const meta = document.createElement("span");
            meta.className = "governance-event-meta";
            meta.textContent = change.taskId;
            item.appendChild(meta);

            buildVersionDiffTaskLines(change).forEach((line) => {
                const detail = document.createElement("span");
                detail.className = "governance-event-detail";
                detail.textContent = line;
                item.appendChild(detail);
            });

            item.addEventListener("click", () => {
                activateVersionDiffTask(change);
            });
            item.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    activateVersionDiffTask(change);
                }
            });

            elements.versionDiffTaskList.appendChild(item);
        });
    }

    elements.versionDiffEmpty.classList.add("hidden");
    elements.versionDiffContent.classList.remove("hidden");
}

function buildVersionHistoryMessage(entry) {
    const target = entry.targetVersionName || entry.targetVersionId;
    const previous = entry.previousPublishedVersionName || entry.previousPublishedVersionId;
    if (entry.eventType === "READY_FOR_RELEASE") {
        return t("governance.historyReadyForRelease", { target });
    }
    if (entry.eventType === "APPROVE") {
        return t("governance.historyApproved", { target });
    }
    if (entry.eventType === "REJECT") {
        return t("governance.historyRejected", { target });
    }
    if (entry.eventType === "PUBLISH") {
        return previous
            ? t("governance.historyPublishedFrom", { previous, target })
            : t("governance.historyPublishedInitial", { target });
    }
    return previous
        ? t("governance.historyRollbackFrom", { previous, target })
        : t("governance.historyRollbackInitial", { target });
}

function getFilteredVersionAuditHistory() {
    const filter = state.versionAuditHistoryFilter;
    const query = state.versionAuditHistoryQuery.trim().toLowerCase();

    return state.versionAuditHistory.filter((entry) => {
        if (filter !== "ALL" && entry.eventType !== filter) {
            return false;
        }

        if (!query) {
            return true;
        }

        return [
            entry.targetVersionName,
            entry.targetVersionId,
            entry.previousPublishedVersionName,
            entry.previousPublishedVersionId,
            entry.actorUsername,
            entry.comment,
            translateEnum("auditEventType", entry.eventType),
        ].some((value) => String(value || "").toLowerCase().includes(query));
    });
}

function renderVersionHistory() {
    elements.versionHistoryList.innerHTML = "";
    elements.versionHistoryFilterSelect.value = state.versionAuditHistoryFilter;
    elements.versionHistorySearchInput.value = state.versionAuditHistoryQuery;

    if (state.versionAuditHistoryError) {
        elements.versionHistoryEmpty.textContent = t("governance.historyError", { message: state.versionAuditHistoryError });
        elements.versionHistoryEmpty.classList.remove("hidden");
        elements.versionHistoryList.classList.add("hidden");
        return;
    }

    if (state.versionAuditHistory.length === 0) {
        elements.versionHistoryEmpty.textContent = t("governance.historyEmpty");
        elements.versionHistoryEmpty.classList.remove("hidden");
        elements.versionHistoryList.classList.add("hidden");
        return;
    }

    const filteredHistory = getFilteredVersionAuditHistory();
    if (filteredHistory.length === 0) {
        elements.versionHistoryEmpty.textContent = t("governance.historyFilteredEmpty");
        elements.versionHistoryEmpty.classList.remove("hidden");
        elements.versionHistoryList.classList.add("hidden");
        return;
    }

    filteredHistory.forEach((entry) => {
        const item = document.createElement("article");
        item.className = "governance-event-item";
        item.classList.toggle("is-selected", entry.targetVersionId === state.selectedVersionId);

        const head = document.createElement("div");
        head.className = "governance-event-head";

        const title = document.createElement("strong");
        title.textContent = translateEnum("auditEventType", entry.eventType);
        head.appendChild(title);

        const chip = document.createElement("span");
        const auditStatus = entry.eventType === "READY_FOR_RELEASE"
            ? "READY_FOR_RELEASE"
            : (entry.eventType === "ROLLBACK" ? "ROLLED_BACK" : "RELEASED");
        chip.className = `version-status-chip ${getStatusClass(auditStatus)}`;
        chip.textContent = translateEnum("auditEventType", entry.eventType);
        head.appendChild(chip);

        item.appendChild(head);

        const meta = document.createElement("span");
        meta.className = "governance-event-meta";
        meta.textContent = `${entry.targetVersionName || entry.targetVersionId} · ${formatDateTime(entry.createdAt)}`;
        item.appendChild(meta);

        const detail = document.createElement("span");
        detail.className = "governance-event-detail";
        detail.textContent = buildVersionHistoryMessage(entry);
        item.appendChild(detail);

        if (entry.actorUsername) {
            const actor = document.createElement("span");
            actor.className = "governance-event-detail";
            actor.textContent = t("governance.actorLine", { actor: entry.actorUsername });
            item.appendChild(actor);
        }

        if (entry.comment) {
            const comment = document.createElement("span");
            comment.className = "governance-event-detail";
            comment.textContent = t("governance.commentLine", { comment: entry.comment });
            item.appendChild(comment);
        }

        if (entry.previousPublishedVersionName || entry.previousPublishedVersionId) {
            const previous = document.createElement("span");
            previous.className = "governance-event-detail";
            previous.textContent = `${t("governance.previousPublished")}: ${entry.previousPublishedVersionName || entry.previousPublishedVersionId}`;
            item.appendChild(previous);
        }

        elements.versionHistoryList.appendChild(item);
    });

    elements.versionHistoryEmpty.classList.add("hidden");
    elements.versionHistoryList.classList.remove("hidden");
}

function renderVersionGovernance(version) {
    renderVersionCompareOptions(version);
    renderVersionDiff();
    renderVersionHistory();
}

function createTimelineGridline(marker) {
    const line = document.createElement("div");
    line.className = "gantt-gridline";
    if (marker.isMajor) {
        line.classList.add("is-major");
    }
    line.style.left = `${marker.positionPercent}%`;
    return line;
}

function createTimelineBand(segment, index) {
    const band = document.createElement("div");
    band.className = "gantt-timeline-band";
    if (index % 2 === 1) {
        band.classList.add("is-alt");
    }
    band.style.left = `${segment.leftPercent}%`;
    band.style.width = `${segment.widthPercent}%`;
    return band;
}

function createGanttDragAssistLayer() {
    const layer = document.createElement("div");
    layer.className = "gantt-drag-assist";

    const slotShadow = document.createElement("div");
    slotShadow.className = "gantt-drag-guide-slot-shadow";
    layer.appendChild(slotShadow);

    const slot = document.createElement("div");
    slot.className = "gantt-drag-guide-slot";
    layer.appendChild(slot);

    const band = document.createElement("div");
    band.className = "gantt-drag-guide-band";
    layer.appendChild(band);

    ["start", "end", "drop"].forEach((edge) => {
        const line = document.createElement("div");
        line.className = "gantt-drag-guide-line";
        line.dataset.edge = edge;

        const label = document.createElement("span");
        label.className = "gantt-drag-guide-label";
        line.appendChild(label);

        layer.appendChild(line);
    });

    return layer;
}

function createTimescaleSegment(segment, tier) {
    const element = document.createElement("div");
    element.className = `gantt-timescale-segment gantt-timescale-segment-${tier}`;
    if (segment.isMajorBoundary) {
        element.classList.add("is-major-boundary");
    }
    element.style.left = `${segment.leftPercent}%`;
    element.style.width = `${segment.widthPercent}%`;

    const label = document.createElement("span");
    label.className = "gantt-timescale-label";
    label.textContent = segment.label;
    element.appendChild(label);

    return element;
}

function createGanttTableCell(primaryText, { className = "", secondaryText = "", columnKey = "" } = {}) {
    const cell = document.createElement("div");
    cell.className = `gantt-table-cell ${className}`.trim();
    if (columnKey) {
        cell.dataset.columnKey = columnKey;
    }

    const primary = document.createElement("span");
    primary.className = "gantt-cell-primary";
    primary.textContent = primaryText;
    cell.appendChild(primary);

    if (secondaryText) {
        const secondary = document.createElement("span");
        secondary.className = "gantt-cell-secondary";
        secondary.textContent = secondaryText;
        cell.appendChild(secondary);
    }

    return cell;
}

function resetGanttColumnWidth(columnKey) {
    const column = getGanttColumnDefinition(columnKey);
    if (!column) {
        return;
    }

    const focusTarget = captureGanttFocusTarget({ fallbackToSelection: true });
    queueGanttFocusRestore(focusTarget);
    state.ganttColumnWidths = {
        ...state.ganttColumnWidths,
        [columnKey]: column.defaultWidth,
    };
    saveGanttColumnWidths();

    if (state.selectedVersion) {
        refreshGanttColumnResizeView(state.selectedVersion);
        if (focusTarget) {
            scheduleGanttFocusRestore(focusTarget, state.selectedVersion);
        }
    } else {
        applyGanttColumnLayout(elements.ganttBoard, resolveGanttColumnLayout());
    }
}

function createGanttColumnResizer(columnKey, extraClassName = "") {
    const handle = document.createElement("span");
    handle.className = `gantt-column-resizer ${extraClassName}`.trim();
    handle.dataset.columnKey = columnKey;
    handle.setAttribute("aria-hidden", "true");
    handle.addEventListener("mousedown", (event) => {
        event.preventDefault();
    });
    handle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    handle.addEventListener("pointerdown", (event) => {
        startGanttColumnResize(event, columnKey);
    });
    handle.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        resetGanttColumnWidth(columnKey);
    });
    return handle;
}

function createGanttRowResizer(rowId, rowElement) {
    const handle = document.createElement("span");
    handle.className = "gantt-row-resizer";
    handle.dataset.rowId = rowId;
    handle.setAttribute("aria-hidden", "true");
    handle.addEventListener("pointerdown", (event) => {
        startGanttRowResize(event, rowId, rowElement);
    });
    handle.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        resetGanttRowHeight(rowId);
    });
    return handle;
}

function updateGanttRowHeightBadge(rowElement, height) {
    if (!rowElement) {
        return;
    }

    let badge = rowElement.querySelector(".gantt-row-height-badge");
    if (!badge) {
        badge = document.createElement("span");
        badge.className = "gantt-row-height-badge";
        rowElement.appendChild(badge);
    }

    badge.textContent = `${height}px`;
}

function createGanttHeaderCell(column, index) {
    const cell = createGanttTableCell(t(column.labelKey), {
        className: `is-${column.key} is-header`,
        columnKey: column.key,
    });

    cell.appendChild(createGanttColumnResizer(column.key));

    return cell;
}

function createGanttHeaderTable() {
    const label = document.createElement("div");
    label.className = "gantt-header-label";

    const grid = document.createElement("div");
    grid.className = "gantt-table-header";
    GANTT_TABLE_COLUMNS.forEach((column, index) => {
        grid.appendChild(createGanttHeaderCell(column, index));
    });
    label.appendChild(grid);
    label.appendChild(createGanttColumnResizer("name", "gantt-pane-resizer"));

    return label;
}

function createGanttRowLabel(row, summary) {
    const resourceType = translateEnum("resourceType", row.resourceType);
    const label = document.createElement("div");
    label.className = "gantt-row-label";

    const grid = document.createElement("div");
    grid.className = "gantt-table-row";
    grid.append(
        createGanttTableCell(String(row.sortOrder).padStart(2, "0"), {
            className: "is-rowNo",
            columnKey: "rowNo",
        }),
        createGanttTableCell(row.label, {
            className: "is-name",
            secondaryText: summary.activityText,
            columnKey: "name",
        }),
        createGanttTableCell(resourceType, {
            className: "is-type",
            columnKey: "type",
        }),
        createGanttTableCell(summary.spanText, { className: "is-span", columnKey: "span" }),
        createGanttTableCell(summary.startText, { className: "is-start", columnKey: "start" }),
        createGanttTableCell(summary.finishText, { className: "is-finish", columnKey: "finish" })
    );
    label.appendChild(grid);

    return label;
}

function calculateTimeRange(version) {
    const items = [...version.bars, ...version.downtimes];
    const coverageDates = getInventoryCoverages(version).map((item) => item.dueDateMs);
    if (items.length === 0 && coverageDates.length === 0) {
        const now = Date.now();
        return { min: now, max: now + 60 * 60 * 1000 };
    }

    const starts = [
        ...items.map((item) => item.startMs),
        ...coverageDates,
    ];
    const ends = [
        ...items.map((item) => item.endMs),
        ...coverageDates,
    ];
    return { min: Math.min(...starts), max: Math.max(...ends) };
}

function buildInventoryCoverageTitle(item) {
    return [
        item.demandId,
        `${t("misc.product")}: ${item.itemCode}`,
        `${t("misc.due")}: ${formatDateTime(item.dueDateMs)}`,
        `${t("misc.covered")}: ${formatNumber(item.coveredQuantity)}`,
        `${t("misc.requested")}: ${formatNumber(item.requestedQuantity)}`,
        `${t("misc.priority")}: ${formatNumber(item.priority || 0)}`,
        `${t("misc.coverage")}: ${item.fullyCovered ? t("misc.fullyCovered") : t("misc.partiallyCovered")}`,
    ].join("\n");
}

function createInventoryCoverageMarker(item, minMs, spanMs) {
    const marker = document.createElement("div");
    marker.className = "inventory-coverage-marker";
    if (!item.fullyCovered) {
        marker.classList.add("is-partial");
    }
    marker.style.left = `${((item.dueDateMs - minMs) / spanMs) * 100}%`;
    marker.title = buildInventoryCoverageTitle(item);

    const strong = document.createElement("strong");
    strong.textContent = `${item.coveredQuantity}/${item.requestedQuantity}`;
    marker.appendChild(strong);

    const meta = document.createElement("small");
    meta.textContent = item.itemCode;
    marker.appendChild(meta);
    return marker;
}

function createInventoryCoverageRow(viewModel) {
    if (!viewModel.inventoryCoverages.length) {
        return null;
    }

    const rowElement = document.createElement("div");
    rowElement.className = "gantt-row is-inventory-coverage";
    rowElement.style.setProperty("--timeline-width", `${viewModel.timelineWidth}px`);

    const label = document.createElement("div");
    label.className = "gantt-row-label";
    const summary = buildInventoryCoverageRowSummary(viewModel.inventoryCoverages);
    const grid = document.createElement("div");
    grid.className = "gantt-table-row";
    grid.append(
        createGanttTableCell("IV", { className: "is-rowNo", columnKey: "rowNo" }),
        createGanttTableCell(t("gantt.inventoryCoverageTitle"), {
            className: "is-name",
            secondaryText: summary.activityText,
            columnKey: "name",
        }),
        createGanttTableCell(t("gantt.inventoryCoverageType"), {
            className: "is-type",
            columnKey: "type",
        }),
        createGanttTableCell(summary.spanText, { className: "is-span", columnKey: "span" }),
        createGanttTableCell(summary.startText, { className: "is-start", columnKey: "start" }),
        createGanttTableCell(summary.finishText, { className: "is-finish", columnKey: "finish" })
    );
    label.appendChild(grid);
    rowElement.appendChild(label);

    const track = document.createElement("div");
    track.className = "gantt-row-track gantt-inventory-track";
    viewModel.timescale.majorSegments.forEach((segment, segmentIndex) => {
        track.appendChild(createTimelineBand(segment, segmentIndex));
    });
    for (const marker of viewModel.timescale.markers) {
        track.appendChild(createTimelineGridline(marker));
    }
    for (const item of viewModel.inventoryCoverages) {
        track.appendChild(createInventoryCoverageMarker(item, viewModel.min, viewModel.spanMs));
    }
    rowElement.appendChild(track);

    return rowElement;
}

function buildTaskTitle(item, row, hasConflict) {
    const lines = [
        item.label,
        `${t("misc.product")}: ${item.productCode}`,
        `${t("misc.resource")}: ${row?.label || item.rowId}`,
        `${t("misc.start")}: ${formatDateTime(item.startMs)}`,
        `${t("misc.end")}: ${formatDateTime(item.endMs)}`,
        `${t("misc.due")}: ${formatDateTime(item.dueDateMs)}`,
        `${t("misc.duration")}: ${formatDuration(item.endMs - item.startMs)}`,
        `${t("misc.priority")}: ${formatNumber(item.priority)}`,
        `${t("misc.late")}: ${item.late ? t("misc.lateYes", { minutes: item.tardinessMinutes }) : t("misc.lateNo")}`,
        `${t("misc.pinned")}: ${item.pinned ? t("misc.pinnedYes") : t("misc.pinnedNo")}`,
        `${t("misc.draft")}: ${item.isDraft ? t("misc.yes") : t("misc.no")}`,
        `${t("misc.conflict")}: ${hasConflict ? t("misc.yes") : t("misc.no")}`,
    ];

    return lines.join("\n");
}

function createTaskResizeHandle(item, lane, edge) {
    const handle = document.createElement("span");
    handle.className = "lane-task-handle";
    handle.dataset.edge = edge;
    handle.setAttribute("aria-hidden", "true");
    handle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    handle.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        startTaskDrag(event, item, lane, edge === "start" ? "resize-start" : "resize-end");
    });
    return handle;
}

function createTaskLane(item, row, viewModel) {
    const lane = document.createElement("button");
    lane.type = "button";
    lane.className = "lane-task";
    lane.dataset.barId = item.id;
    lane.dataset.rowId = item.rowId;
    lane.dataset.pinned = String(Boolean(item.pinned));
    if (item.late) {
        lane.classList.add("is-late");
    }
    if (item.pinned) {
        lane.classList.add("is-pinned");
    }
    if (item.isDraft) {
        lane.classList.add("is-draft");
    }
    if (item.id === state.selectedBarId) {
        lane.classList.add("is-selected");
    }
    if (item.id === state.selectedVersionDiffFocusTaskId) {
        lane.classList.add("is-diff-focused");
        if (state.selectedVersionDiffFocusChangeType) {
            lane.dataset.diffFocusKind = state.selectedVersionDiffFocusChangeType;
        }
    }
    if (viewModel.conflictIds.has(item.id)) {
        lane.classList.add("is-conflict");
    }
    if (!item.pinned) {
        lane.classList.add("is-draggable");
    }
    if (state.dragSession?.barId === item.id) {
        lane.classList.add("is-dragging");
        if (state.dragSession.mode !== "move") {
            lane.classList.add("is-resizing");
        } else if (state.dragSession.isDragging) {
            lane.classList.add("is-drag-source-muted");
        }
    }

    const leftPercent = ((item.startMs - viewModel.min) / viewModel.spanMs) * 100;
    const widthPercent = Math.max(((item.endMs - item.startMs) / viewModel.spanMs) * 100, 2.8);
    const msPerPixel = Number.isFinite(viewModel.msPerPixel) && viewModel.msPerPixel > 0 ? viewModel.msPerPixel : 1;
    const widthPx = (item.endMs - item.startMs) / msPerPixel;

    lane.style.left = `${leftPercent}%`;
    lane.style.width = `${widthPercent}%`;
    lane.title = buildTaskTitle(item, row, viewModel.conflictIds.has(item.id));
    lane.setAttribute("aria-pressed", String(item.id === state.selectedBarId));
    if (widthPx < 180) {
        lane.classList.add("is-compact");
    }
    if (widthPx < 128) {
        lane.classList.add("is-tight");
    }

    const content = document.createElement("span");
    content.className = "lane-task-content";

    const strong = document.createElement("strong");
    strong.textContent = item.label;
    content.appendChild(strong);

    const meta = document.createElement("small");
    meta.textContent = `${item.productCode} · ${formatDuration(item.endMs - item.startMs)}`;
    content.appendChild(meta);
    lane.appendChild(content);

    if (!item.pinned) {
        lane.appendChild(createTaskResizeHandle(item, lane, "start"));
        lane.appendChild(createTaskResizeHandle(item, lane, "end"));

        const grip = document.createElement("span");
        grip.className = "lane-task-grip";
        grip.setAttribute("aria-hidden", "true");
        lane.appendChild(grip);
    }

    lane.addEventListener("click", (event) => {
        if (isTaskClickGuardActive()) {
            event.preventDefault();
            return;
        }

        selectTaskBar(item.id, { sourceElement: lane, focus: true });
    });

    if (!item.pinned) {
        lane.addEventListener("pointerdown", (event) => {
            startTaskDrag(event, item, lane, "move");
        });
    }

    return lane;
}

function createDowntimeLane(item, minMs, spanMs) {
    const lane = document.createElement("div");
    lane.className = "lane-downtime";
    lane.style.left = `${((item.startMs - minMs) / spanMs) * 100}%`;
    lane.style.width = `${Math.max(((item.endMs - item.startMs) / spanMs) * 100, 1.6)}%`;
    lane.title = [
        item.downtimeType,
        `${t("misc.source")}: ${item.source}`,
        `${t("misc.start")}: ${formatDateTime(item.startMs)}`,
        `${t("misc.end")}: ${formatDateTime(item.endMs)}`,
        item.description || t("misc.noDescription"),
    ].join("\n");
    return lane;
}

function renderGantt(version) {
    const previousScrollLeft = elements.ganttScroll.scrollLeft;
    const previousScrollTop = elements.ganttScroll.scrollTop;
    const focusTarget = consumeGanttFocusRestoreTarget();
    const focusBarId = consumeTaskFocusRestoreId();
    const effectiveFocusTarget = normalizeGanttFocusTarget(focusTarget || (focusBarId ? { type: "task", id: focusBarId } : null));
    elements.ganttBoard.innerHTML = "";
    state.ganttViewModel = null;
    const wasHidden = elements.ganttScroll.classList.contains("hidden");

    if (!version) {
        renderGanttToolbar(null, null);
        renderSelectedTaskDetails(null, null);
        elements.ganttEmptyState.textContent = t("gantt.noSelection");
        elements.ganttEmptyState.classList.remove("hidden");
        elements.ganttScroll.classList.add("hidden");
        return;
    }

    if (version.rows.length === 0) {
        renderGanttToolbar(null, version);
        renderSelectedTaskDetails(null, version);
        elements.ganttEmptyState.textContent = t("gantt.noRows");
        elements.ganttEmptyState.classList.remove("hidden");
        elements.ganttScroll.classList.add("hidden");
        return;
    }

    const viewModel = buildGanttViewModel(version);
    if (state.selectedBarId && !viewModel.barMap.has(state.selectedBarId)) {
        state.selectedBarId = null;
    }
    if (state.selectedRowId && !viewModel.rowMap.has(state.selectedRowId)) {
        state.selectedRowId = null;
    }
    state.ganttViewModel = viewModel;
    renderGanttToolbar(viewModel, version);
    renderSelectedTaskDetails(viewModel, version);
    applyGanttColumnLayout(elements.ganttBoard, viewModel.columnLayout);
    elements.ganttBoard.style.setProperty("--timeline-width", `${viewModel.timelineWidth}px`);

    const header = document.createElement("div");
    header.className = "gantt-header";
    header.style.setProperty("--timeline-width", `${viewModel.timelineWidth}px`);

    header.appendChild(createGanttHeaderTable());

    const headerTrack = document.createElement("div");
    headerTrack.className = "gantt-header-track";

    const majorTimescale = document.createElement("div");
    majorTimescale.className = "gantt-timescale gantt-timescale-major";
    for (const segment of viewModel.timescale.majorSegments) {
        majorTimescale.appendChild(createTimescaleSegment(segment, "major"));
    }

    const minorTimescale = document.createElement("div");
    minorTimescale.className = "gantt-timescale gantt-timescale-minor";
    for (const segment of viewModel.timescale.minorSegments) {
        minorTimescale.appendChild(createTimescaleSegment(segment, "minor"));
    }

    for (const marker of viewModel.timescale.markers) {
        headerTrack.appendChild(createTimelineGridline(marker));
    }

    headerTrack.appendChild(majorTimescale);
    headerTrack.appendChild(minorTimescale);
    header.appendChild(headerTrack);
    elements.ganttBoard.appendChild(header);

    const inventoryCoverageRow = createInventoryCoverageRow(viewModel);
    if (inventoryCoverageRow) {
        elements.ganttBoard.appendChild(inventoryCoverageRow);
    }

    version.rows.forEach((row, rowIndex) => {
        const rowElement = document.createElement("div");
        rowElement.className = "gantt-row";
        rowElement.dataset.rowId = row.id;
        rowElement.tabIndex = -1;
        rowElement.setAttribute("aria-selected", String(row.id === state.selectedRowId));
        rowElement.classList.toggle("is-selected", row.id === state.selectedRowId);
        rowElement.classList.toggle("is-diff-focused", row.id === state.selectedVersionDiffFocusRowId);
        if (row.id === state.selectedVersionDiffFocusRowId && state.selectedVersionDiffFocusChangeType) {
            rowElement.dataset.diffFocusKind = state.selectedVersionDiffFocusChangeType;
        }
        if (rowIndex % 2 === 1) {
            rowElement.classList.add("is-alt");
        }
        rowElement.style.setProperty("--timeline-width", `${viewModel.timelineWidth}px`);
        applyGanttRowLayout(rowElement, resolveGanttRowHeight(row.id));

        const summary = viewModel.rowSummaries.get(row.id) || buildRowSummary(row, [], []);
        rowElement.appendChild(createGanttRowLabel(row, summary));

        const track = document.createElement("div");
        track.className = "gantt-row-track";

        viewModel.timescale.majorSegments.forEach((segment, segmentIndex) => {
            track.appendChild(createTimelineBand(segment, segmentIndex));
        });
        for (const marker of viewModel.timescale.markers) {
            track.appendChild(createTimelineGridline(marker));
        }

        track.appendChild(createGanttDragAssistLayer());

        for (const downtime of viewModel.downtimesByRow.get(row.id) || []) {
            track.appendChild(createDowntimeLane(downtime, viewModel.min, viewModel.spanMs));
        }

        for (const bar of viewModel.barsByRow.get(row.id) || []) {
            track.appendChild(createTaskLane(bar, row, viewModel));
        }

        rowElement.appendChild(track);
        rowElement.appendChild(createGanttRowResizer(row.id, rowElement));
        elements.ganttBoard.appendChild(rowElement);
    });

    elements.ganttEmptyState.classList.add("hidden");
    elements.ganttScroll.classList.remove("hidden");
    elements.ganttScroll.scrollLeft = previousScrollLeft;
    elements.ganttScroll.scrollTop = previousScrollTop;
    if (effectiveFocusTarget) {
        scheduleGanttFocusRestore(effectiveFocusTarget, version);
    }

    if (wasHidden) {
        window.requestAnimationFrame(() => {
            if (state.selectedVersion === version) {
                renderGantt(state.selectedVersion);
            }
        });
    }
}

function groupBy(items, keySelector) {
    const map = new Map();
    for (const item of items) {
        const key = keySelector(item);
        const bucket = map.get(key) || [];
        bucket.push(item);
        map.set(key, bucket);
    }
    return map;
}

function renderSelectedVersion(version) {
    state.selectedVersion = version;
    renderKpis(version);

    if (!version) {
        elements.viewerTitle.textContent = t("viewer.emptyTitle");
        elements.viewerSubtitle.textContent = t("viewer.emptySubtitle");
        updateVersionActionState(null);
        renderVersionGovernance(null);
        syncVersionGovernanceForm(null, { clearActionComment: true });
        renderGantt(null);
        updateSummary();
        return;
    }

    elements.viewerTitle.textContent = version.versionName;
    const subtitleParts = [
        t("viewer.statusLine", { status: translateEnum("versionStatus", version.status) }),
        t("viewer.createdAt", { value: formatDateTime(findVersionSummary(version.versionId)?.createdAt) }),
        t("viewer.publishedAt", { value: formatDateTime(findVersionSummary(version.versionId)?.publishedAt) }),
    ];
    if (version.createdBy) {
        subtitleParts.push(t("governance.actorLine", { actor: version.createdBy }));
    }
    const inventoryCoverageSummary = buildInventoryCoverageSummary(version);
    if (inventoryCoverageSummary.count > 0) {
        subtitleParts.push(t("viewer.inventoryCoverageLine", inventoryCoverageSummary));
    }
    elements.viewerSubtitle.textContent = subtitleParts.join(" · ");

    updateVersionActionState(version);
    renderVersionGovernance(version);
    renderGantt(version);
    updateSummary();
}

function findVersionSummary(versionId) {
    return state.versions.find((version) => version.versionId === versionId) || null;
}

async function loadVersions(preferredVersionId = state.selectedVersionId) {
    state.versions = await requestJson("/api/v1/versions");
    reconcileSelectedDraftVersionIds();
    state.lastRefreshAt = new Date().toISOString();
    renderVersionList();
    updateSummary();

    if (state.versions.length === 0) {
        state.selectedVersionId = null;
        resetSelectedVersionGovernance();
        renderSelectedVersion(null);
        return;
    }

    const selected = state.versions.find((version) => version.versionId === preferredVersionId) || state.versions[0];
    await loadVersion(selected.versionId);
}

async function loadSelectedVersionDiff(baseVersionId = state.selectedVersionCompareBaseId) {
    state.selectedVersionCompareBaseId = baseVersionId || null;
    state.selectedVersionDiff = null;
    state.selectedVersionDiffError = null;
    state.selectedVersionDiffTaskId = null;
    clearVersionDiffFocus();
    renderVersionGovernance(state.selectedVersion);

    if (!state.selectedVersionId || !state.selectedVersionCompareBaseId) {
        return;
    }

    try {
        state.selectedVersionDiff = await requestJson(
            `/api/v1/versions/${state.selectedVersionId}/diff?baseVersionId=${encodeURIComponent(state.selectedVersionCompareBaseId)}`
        );
    } catch (error) {
        state.selectedVersionDiffError = error.message;
    }
    renderVersionGovernance(state.selectedVersion);
}

async function loadVersionAuditHistory() {
    state.versionAuditHistoryError = null;
    try {
        const history = await requestJson("/api/v1/versions/audit-history");
        state.versionAuditHistory = Array.isArray(history) ? history : [];
    } catch (error) {
        state.versionAuditHistory = [];
        state.versionAuditHistoryError = error.message;
    }
    renderVersionHistory();
}

async function loadVersion(versionId) {
    stopTaskDrag();
    state.selectedVersionId = versionId;
    renderVersionList();
    resetSelectedVersionGovernance();
    const payload = await requestJson(`/api/v1/versions/${versionId}/gantt-data`);
    if (state.selectedVersionId !== versionId) {
        return;
    }
    payload.inventoryCoverages = getInventoryCoverages(payload);
    state.selectedVersionCompareBaseId = resolveDefaultCompareBaseVersionId(versionId);
    resetVersionInteractionState({ keepZoom: true });
    renderSelectedVersion(payload);
    syncVersionGovernanceForm(payload, { clearActionComment: true });
    void loadVersionAuditHistory();
    void loadSelectedVersionDiff(state.selectedVersionCompareBaseId);
}

async function saveSelectedVersionReleaseNote() {
    if (!state.selectedVersionId || !state.selectedVersion) {
        return;
    }

    elements.versionReleaseNoteSaveButton.disabled = true;
    try {
        const payload = await requestJson(`/api/v1/versions/${state.selectedVersionId}/release-note`, {
            method: "PUT",
            body: JSON.stringify({
                releaseNote: elements.versionReleaseNoteInput.value,
            }),
        });
        if (!payload || state.selectedVersionId !== payload.versionId) {
            return;
        }
        buildVersionSummaryPatchFromPayload(payload);
        renderSelectedVersion(payload);
        syncVersionGovernanceForm(payload, { clearActionComment: false });
        setJobStatus("job.releaseNoteSavedTitle", "job.releaseNoteSavedDetail");
    } catch (error) {
        setJobStatusWithText("job.releaseNoteSaveFailedTitle", error.message);
        syncVersionGovernanceForm(state.selectedVersion, { clearActionComment: false });
    } finally {
        if (state.selectedVersion) {
            elements.versionReleaseNoteSaveButton.disabled = false;
        }
    }
}

async function deleteSelectedDraftVersions() {
    const versionIds = [...state.selectedDraftVersionIds];
    if (versionIds.length === 0) {
        return;
    }

    const confirmed = window.confirm(t("versions.deleteDraftsConfirm", { count: versionIds.length }));
    if (!confirmed) {
        return;
    }

    state.isDeleteDraftVersionsPending = true;
    updateDeleteDraftVersionsActionState();
    try {
        await requestJson("/api/v1/versions/delete-drafts", {
            method: "POST",
            body: JSON.stringify({
                versionIds,
            }),
        });
        const deletedSelectedVersion = versionIds.includes(state.selectedVersionId);
        const preferredVersionId = deletedSelectedVersion ? null : state.selectedVersionId;
        state.selectedDraftVersionIds.clear();
        state.versions = state.versions.filter((version) => !versionIds.includes(version.versionId));
        reconcileSelectedDraftVersionIds();
        renderVersionList();
        updateSummary();

        if (deletedSelectedVersion || state.versions.length === 0) {
            state.selectedVersionId = null;
            resetSelectedVersionGovernance();
            resetVersionInteractionState({ keepZoom: true });
            renderSelectedVersion(null);
        }

        setJobStatus("job.draftDeleteSuccessTitle", "job.draftDeleteSuccessDetail", { count: versionIds.length });
        await loadVersions(preferredVersionId);
    } catch (error) {
        setJobStatusWithText("job.draftDeleteFailedTitle", error.message);
    } finally {
        state.isDeleteDraftVersionsPending = false;
        updateDeleteDraftVersionsActionState();
    }
}

async function submitSelectedVersionForRelease() {
    if (!state.selectedVersionId || !state.selectedVersion || !["DRAFT", "REJECTED"].includes(state.selectedVersion.status) || !canSubmitVersion()) {
        return;
    }

    const comment = getRequiredGovernanceComment("job.readyForReleaseFailedTitle");
    if (!comment) {
        return;
    }

    elements.readyForReleaseButton.disabled = true;
    try {
        await requestJson(`/api/v1/versions/${state.selectedVersionId}/ready-for-release`, {
            method: "POST",
            body: JSON.stringify({
                comment,
                releaseNote: elements.versionReleaseNoteInput.value,
            }),
        });
        setJobStatus("job.readyForReleaseSuccessTitle", "job.readyForReleaseSuccessDetail");
        elements.versionActionCommentInput.value = "";
        await loadVersions(state.selectedVersionId);
    } catch (error) {
        setJobStatusWithText("job.readyForReleaseFailedTitle", error.message);
        updateVersionActionState(state.selectedVersion);
    }
}

async function approveSelectedVersion() {
    if (!state.selectedVersionId || !state.selectedVersion || state.selectedVersion.status !== "READY_FOR_RELEASE" || !canApproveVersion()) {
        return;
    }

    const comment = getRequiredGovernanceComment("job.approveFailedTitle");
    if (!comment) {
        return;
    }

    elements.approveButton.disabled = true;
    try {
        await requestJson(`/api/v1/versions/${state.selectedVersionId}/approve`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
        setJobStatus("job.approveSuccessTitle", "job.approveSuccessDetail");
        elements.versionActionCommentInput.value = "";
        await loadVersions(state.selectedVersionId);
    } catch (error) {
        setJobStatusWithText("job.approveFailedTitle", error.message);
        updateVersionActionState(state.selectedVersion);
    }
}

async function rejectSelectedVersion() {
    if (!state.selectedVersionId || !state.selectedVersion || state.selectedVersion.status !== "READY_FOR_RELEASE" || !canApproveVersion()) {
        return;
    }

    const comment = getRequiredGovernanceComment("job.rejectFailedTitle");
    if (!comment) {
        return;
    }

    elements.rejectButton.disabled = true;
    try {
        await requestJson(`/api/v1/versions/${state.selectedVersionId}/reject`, {
            method: "POST",
            body: JSON.stringify({ comment }),
        });
        setJobStatus("job.rejectSuccessTitle", "job.rejectSuccessDetail");
        elements.versionActionCommentInput.value = "";
        await loadVersions(state.selectedVersionId);
    } catch (error) {
        setJobStatusWithText("job.rejectFailedTitle", error.message);
        updateVersionActionState(state.selectedVersion);
    }
}

async function publishSelectedVersion() {
    if (!state.selectedVersionId || !state.selectedVersion || state.selectedVersion.status !== "APPROVED" || !canPublishVersion()) {
        return;
    }

    const comment = getRequiredGovernanceComment("job.publishFailedTitle");
    if (!comment) {
        return;
    }

    elements.publishButton.disabled = true;
    try {
        await requestJson(`/api/v1/versions/${state.selectedVersionId}/publish`, {
            method: "POST",
            body: JSON.stringify({
                comment,
                releaseNote: elements.versionReleaseNoteInput.value,
            }),
        });
        setJobStatus("job.publishSuccessTitle", "job.publishSuccessDetail");
        elements.versionActionCommentInput.value = "";
        await loadVersions(state.selectedVersionId);
    } catch (error) {
        setJobStatusWithText("job.publishFailedTitle", error.message);
        updateVersionActionState(state.selectedVersion);
    }
}

async function rollbackSelectedVersion() {
    if (!state.selectedVersionId || !state.selectedVersion || !["ARCHIVED", "ROLLED_BACK"].includes(state.selectedVersion.status) || !canRollbackVersion()) {
        return;
    }

    const comment = getRequiredGovernanceComment("job.rollbackFailedTitle");
    if (!comment) {
        return;
    }

    elements.rollbackButton.disabled = true;
    try {
        await requestJson(`/api/v1/versions/${state.selectedVersionId}/rollback`, {
            method: "POST",
            body: JSON.stringify({
                comment,
            }),
        });
        setJobStatus("job.rollbackSuccessTitle", "job.rollbackSuccessDetail");
        elements.versionActionCommentInput.value = "";
        await loadVersions(state.selectedVersionId);
    } catch (error) {
        setJobStatusWithText("job.rollbackFailedTitle", error.message);
        updateVersionActionState(state.selectedVersion);
    }
}

async function cancelCurrentJob() {
    if (!state.currentJob?.jobId || !canManageJobs()) {
        return;
    }

    elements.jobCancelButton.disabled = true;
    try {
        const job = await requestJson(`/api/v1/schedule/jobs/${state.currentJob.jobId}/cancel`, {
            method: "POST",
        });
        state.currentJob = job;
        setJobStatus("job.cancelSuccessTitle", "job.cancelSuccessDetail");
        stopPolling();
        setLoading(false);
        updateJobActionState();
    } catch (error) {
        setJobStatusWithText("job.cancelFailedTitle", error.message);
        updateJobActionState();
    }
}

async function retryCurrentJob() {
    if (!state.currentJob?.jobId || !canManageJobs()) {
        return;
    }

    elements.jobRetryButton.disabled = true;
    try {
        const job = await requestJson(`/api/v1/schedule/jobs/${state.currentJob.jobId}/retry`, {
            method: "POST",
        });
        state.currentJob = job;
        setLoading(true);
        setJobStatus("job.retrySuccessTitle", "job.retrySuccessDetail");
        updateJobActionState();
        await pollJob(job.jobId);
    } catch (error) {
        setJobStatusWithText("job.retryFailedTitle", error.message);
        updateJobActionState();
    }
}

function handleVersionHistoryFilterChange() {
    state.versionAuditHistoryFilter = elements.versionHistoryFilterSelect.value || "ALL";
    renderVersionHistory();
}

function handleVersionHistorySearchInput() {
    state.versionAuditHistoryQuery = elements.versionHistorySearchInput.value || "";
    renderVersionHistory();
}

function handleVersionCompareSelection() {
    state.selectedVersionCompareBaseId = elements.versionCompareSelect.value || null;
    state.selectedVersionDiff = null;
    state.selectedVersionDiffError = null;
    elements.versionCompareButton.disabled = !state.selectedVersionCompareBaseId;
    renderVersionDiff();
}

async function compareSelectedVersion() {
    if (!state.selectedVersionId) {
        return;
    }
    await loadSelectedVersionDiff(elements.versionCompareSelect.value || null);
}

function stopPolling() {
    if (state.pollTimer) {
        clearTimeout(state.pollTimer);
        state.pollTimer = null;
    }
}

async function pollJob(jobId) {
    try {
        const job = await requestJson(`/api/v1/schedule/jobs/${jobId}`);
        state.currentJob = job;
        updateJobActionState();

        if (job.status === "SUCCEEDED") {
            setJobStatus("job.finishedTitle", "job.finishedDetail", { versionId: job.versionId });
            stopPolling();
            await loadVersions(job.versionId);
            setLoading(false);
            return;
        }

        if (["FAILED", "TIMEOUT", "CANCELLED"].includes(job.status)) {
            setJobStatusWithText(`enums.jobStatus.${job.status}`, job.errorMessage || t("job.failedFallback"));
            stopPolling();
            setLoading(false);
            return;
        }

        setJobStatus(`enums.jobStatus.${job.status}`, "job.runningDetail", { jobId: job.jobId });
        state.pollTimer = window.setTimeout(() => pollJob(jobId), 1500);
    } catch (error) {
        setJobStatusWithText("job.pollingErrorTitle", error.message);
        stopPolling();
        setLoading(false);
    }
}

async function runSampleSchedule() {
    if (!canCreateSchedules()) {
        return;
    }
    setLoading(true);
    setJobStatus("job.submittingTitle", "job.submittingDetail");
    stopPolling();

    try {
        const job = await requestJson("/api/v1/schedule/jobs/sample", { method: "POST" });
        state.currentJob = job;
        setJobStatus("job.acceptedTitle", "job.acceptedDetail", { jobId: job.jobId });
        await pollJob(job.jobId);
    } catch (error) {
        setJobStatusWithText("job.submissionFailedTitle", error.message);
        setLoading(false);
    }
}

async function runTrialSolve() {
    if (!state.selectedVersionId || !state.hasDraftChanges || !canRunTrialSolve()) {
        return;
    }

    const payload = buildTrialSolvePayload();
    if (!payload) {
        return;
    }

    setLoading(true);
    setJobStatus("job.trialSubmittingTitle", "job.trialSubmittingDetail");
    stopPolling();

    try {
        const job = await requestJson(`/api/v1/versions/${state.selectedVersionId}/trial-solve`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
        state.currentJob = job;
        setJobStatus("job.trialAcceptedTitle", "job.acceptedDetail", { jobId: job.jobId });
        await pollJob(job.jobId);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            setJobStatusWithText("job.submissionFailedTitle", t("job.trialUnavailableDetail"));
        } else {
            setJobStatusWithText("job.submissionFailedTitle", error.message);
        }
        setLoading(false);
    }
}

async function refreshAll() {
    setLoading(true);
    try {
        await loadVersions();
        if (!state.currentJob) {
            setJobStatus("job.refreshedTitle", "job.refreshedDetail");
        }
    } catch (error) {
        setJobStatusWithText("job.refreshFailedTitle", error.message);
        renderSelectedVersion(null);
    } finally {
        setLoading(false);
    }
}

function addModelResourceRow(resource = {}) {
    revealModelRow(appendModelResourceRow(resource));
}

function addModelTaskRow(task = {}) {
    revealModelRow(appendModelTaskRow(task));
}

function addModelDowntimeRow(downtime = {}) {
    revealModelRow(appendModelDowntimeRow(downtime));
}

function removeModelRowFromEvent(event) {
    const removeButton = event.target.closest("[data-row-remove]");
    if (!removeButton || state.isModelPending) {
        return;
    }

    const row = removeButton.closest("tr");
    if (row) {
        row.remove();
    }
}

function saveModelDraft() {
    try {
        window.localStorage.setItem(STORAGE_KEYS.modelDraft, JSON.stringify(buildModelDraftSnapshot()));
        updateModelDraftActionState();
        setModelFeedbackKey("model.draftSaved", "info");
    } catch (error) {
        setModelFeedbackKey("model.draftStorageError", "error");
    }
}

function restoreModelDraft() {
    const snapshot = readStoredModelDraft();
    if (!snapshot) {
        updateModelDraftActionState();
        setModelFeedbackKey("model.draftUnavailable", "error");
        return;
    }

    restoreModelFormFromDraft(snapshot);
    setModelFeedbackKey("model.draftRestored", "info");
}

function exportModelJson() {
    clearModelFeedback();

    let payload;
    try {
        payload = buildModeledSchedulePayload();
    } catch (error) {
        setModelFeedbackText(error.message, "error");
        return;
    }

    downloadModelJsonFile(payload);
    setModelFeedbackKey("model.exportSuccess", "info");
}

async function exportModelTemplate() {
    clearModelFeedback();
    setModelPending(true);

    try {
        const blob = await requestBlob("/api/v1/model-import/template");
        downloadBlobFile(blob, "aps_model_import_template.xlsx");
        setModelFeedbackKey("model.templateExported", "info");
    } catch (error) {
        setModelFeedbackText(error.message || t("model.importInvalidStructure"), "error");
    } finally {
        setModelPending(false);
    }
}

async function importModelBatchSection(kind, file) {
    if (!file) {
        return;
    }

    clearModelFeedback();
    setModelPending(true);

    try {
        const normalizedFile = await normalizeCsvUploadFile(file);
        const formData = new FormData();
        formData.append("file", normalizedFile, normalizedFile.name);
        formData.append("dataVersion", ensureModelBatchDataVersion());

        const payload = await requestJson(`/api/v1/model-import/${kind}`, {
            method: "POST",
            body: formData,
        });
        const batch = createModelBatchImportRecord(payload, file.name);
        if (batch?.dataVersion) {
            elements.modelDataVersionInput.value = batch.dataVersion;
        }
        setModelBatchImport(kind, batch);
        setModelFeedbackText(t("model.batchImportedSuccess", {
            kind: t(MODEL_BATCH_IMPORT_DEFINITIONS[kind].titleKey),
            importId: batch?.importId || "-",
            dataVersion: batch?.dataVersion || "-",
        }), "info");
    } catch (error) {
        const batch = createModelBatchImportRecord(error.payload, file.name);
        if (batch?.dataVersion) {
            elements.modelDataVersionInput.value = batch.dataVersion;
        }
        if (batch) {
            setModelBatchImport(kind, batch);
        }
        setModelFeedbackText(t("model.batchImportFailed", {
            kind: t(MODEL_BATCH_IMPORT_DEFINITIONS[kind].titleKey),
            message: error.message || t("model.importInvalidStructure"),
        }), "error");
    } finally {
        setModelPending(false);
    }
}

async function importModelTabularSection(kind, file) {
    if (!file) {
        return;
    }

    clearModelFeedback();
    setModelPending(true);

    try {
        const normalizedFile = await normalizeCsvUploadFile(file);
        const formData = new FormData();
        formData.append("file", normalizedFile, normalizedFile.name);
        if (getModelDataVersion()) {
            formData.append("dataVersion", getModelDataVersion());
        }

        const payload = await requestJson(`/api/v1/model-import/${kind}`, {
            method: "POST",
            body: formData,
        });

        if (kind === "resources") {
            clearModelTable(elements.modelResourcesBody);
            for (const resource of payload.resources || []) {
                appendModelResourceRow(resource);
            }
            setModelFeedbackKey("model.resourcesImported", "info");
        } else if (kind === "tasks") {
            clearModelTable(elements.modelTasksBody);
            for (const task of payload.tasks || []) {
                appendModelTaskRow(task);
            }
            setModelFeedbackKey("model.tasksImported", "info");
        } else if (kind === "downtimes") {
            clearModelTable(elements.modelDowntimesBody);
            for (const downtime of payload.downtimes || []) {
                appendModelDowntimeRow(downtime);
            }
            setModelFeedbackKey("model.downtimesImported", "info");
        }
    } catch (error) {
        setModelFeedbackText(error.message || t("model.importInvalidStructure"), "error");
    } finally {
        setModelPending(false);
    }
}

async function importModelResourcesTabular(event) {
    const [file] = event.target.files || [];
    try {
        await importModelTabularSection("resources", file);
    } finally {
        elements.modelResourceImportInput.value = "";
    }
}

async function importModelTasksTabular(event) {
    const [file] = event.target.files || [];
    try {
        await importModelTabularSection("tasks", file);
    } finally {
        elements.modelTaskImportInput.value = "";
    }
}

async function importModelDowntimesTabular(event) {
    const [file] = event.target.files || [];
    try {
        await importModelTabularSection("downtimes", file);
    } finally {
        elements.modelDowntimeImportInput.value = "";
    }
}

async function handleModelBatchImport(kind, event) {
    const [file] = event.target.files || [];
    try {
        await importModelBatchSection(kind, file);
    } finally {
        event.target.value = "";
    }
}

async function importModelJson(event) {
    const [file] = event.target.files || [];
    if (!file) {
        return;
    }

    clearModelFeedback();
    try {
        const content = await file.text();
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (error) {
            throw new Error(t("model.importInvalidJson"));
        }

        const payload = normalizeImportedPayload(parsed);
        populateModelFormFromPayload(payload);
        setModelFeedbackKey("model.importSuccess", "info");
    } catch (error) {
        setModelFeedbackText(error.message || t("model.importInvalidStructure"), "error");
    } finally {
        elements.modelImportInput.value = "";
    }
}

function openModelDialog() {
    if (!canCreateSchedules()) {
        return;
    }
    state.modelDialogOpen = true;
    ensureModelFormSeeded();
    clearModelFeedback();
    renderModelBatchImports();
    renderApplicationState();
    updateModelDraftActionState();
    elements.modelScenarioNameInput.focus();
}

function closeModelDialog() {
    state.modelDialogOpen = false;
    clearModelFeedback();
    renderApplicationState();
}

function buildReadyModelBatchFlowRequest() {
    const dataVersion = getModelDataVersion();
    if (!dataVersion) {
        return null;
    }

    for (const kind of MODEL_BATCH_IMPORT_KEYS) {
        const definition = MODEL_BATCH_IMPORT_DEFINITIONS[kind];
        const batch = state.modelBatchImports[kind];
        if (!definition.required) {
            continue;
        }
        if (!batch || !isSuccessfulModelBatchStatus(batch.status) || batch.dataVersion !== dataVersion) {
            return null;
        }
    }

    const scenarioName = elements.modelScenarioNameInput.value.trim();
    if (!scenarioName) {
        throw new Error(t("model.validationScenarioRequired"));
    }

    const scheduleStartRaw = elements.modelScheduleStartInput.value;
    if (!scheduleStartRaw) {
        throw new Error(t("model.validationScheduleStartRequired"));
    }

    const scheduleStartAt = new Date(scheduleStartRaw);
    if (Number.isNaN(scheduleStartAt.getTime())) {
        throw new Error(t("model.validationScheduleStartInvalid"));
    }

    return {
        scenarioName,
        dataVersion,
        scheduleStartAt: scheduleStartAt.toISOString(),
        horizonMinutes: parsePositiveIntegerField(elements.modelHorizonInput.value, "model.horizonLabel"),
        objectiveWeights: {
            tardiness: parsePositiveIntegerField(elements.modelTardinessInput.value, "model.tardinessLabel"),
            earliness: parseNonNegativeIntegerField(elements.modelEarlinessInput.value, "model.earlinessLabel"),
            makespan: parseNonNegativeIntegerField(elements.modelMakespanInput.value, "model.makespanLabel"),
        },
        solverConfig: {
            timeLimitSeconds: parsePositiveIntegerField(elements.modelTimeLimitInput.value, "model.timeLimitLabel"),
            numSearchWorkers: parsePositiveIntegerField(elements.modelWorkersInput.value, "model.workersLabel"),
        },
    };
}

function markModelBatchImportsAsGenerated(sourceImportBatchIds = {}) {
    let changed = false;
    for (const kind of MODEL_BATCH_IMPORT_KEYS) {
        const definition = MODEL_BATCH_IMPORT_DEFINITIONS[kind];
        const importId = sourceImportBatchIds?.[definition.scenarioSourceKey];
        const current = state.modelBatchImports[kind];
        if (!importId || !current || current.importId !== importId || current.status === "SCENARIO_GENERATED") {
            continue;
        }
        state.modelBatchImports = {
            ...state.modelBatchImports,
            [kind]: {
                ...current,
                status: "SCENARIO_GENERATED",
            },
        };
        changed = true;
    }
    if (changed) {
        renderModelBatchImports();
    }
}

function finalizeSuccessfulModelSubmission(job, options = {}) {
    state.currentJob = job;
    state.modelDialogOpen = false;
    setModelPending(false);
    clearStoredModelDraft();
    clearModelFeedback();
    if (options.resetForm !== false) {
        applyModelTemplate(false);
    }
    renderApplicationState();
    setJobStatus("job.acceptedTitle", "job.acceptedDetail", { jobId: job.jobId });
}

async function submitModeledSchedule(event) {
    event.preventDefault();
    clearModelFeedback();

    let payload;
    let batchFlowRequest = null;
    try {
        batchFlowRequest = buildReadyModelBatchFlowRequest();
        payload = batchFlowRequest || buildModeledSchedulePayload();
    } catch (error) {
        setModelFeedbackText(error.message, "error");
        return;
    }

    setModelPending(true);
    setLoading(true);
    setJobStatus("job.modelSubmittingTitle", "job.modelSubmittingDetail");
    stopPolling();

    try {
        let job;
        if (batchFlowRequest) {
            setJobStatusWithText("job.modelSubmittingTitle", t("model.batchFlowSubmitting"));
            const generated = await requestJson("/api/v1/schedule/scenarios/from-import-batches", {
                method: "POST",
                body: JSON.stringify(batchFlowRequest),
            });
            const scheduleRequest = generated?.scenario?.scheduleRequest;
            if (!scheduleRequest || !Array.isArray(scheduleRequest.tasks) || scheduleRequest.tasks.length === 0) {
                setModelPending(false);
                setLoading(false);
                setModelFeedbackKey("model.batchFlowNoScheduleRequest", "info");
                renderApplicationState();
                return;
            }
            markModelBatchImportsAsGenerated(generated?.sourceImportBatchIds);
            job = await requestJson("/api/v1/schedule/jobs", {
                method: "POST",
                body: JSON.stringify(scheduleRequest),
            });
        } else {
            job = await requestJson("/api/v1/schedule/jobs", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }
        finalizeSuccessfulModelSubmission(job, { resetForm: !batchFlowRequest });
        await pollJob(job.jobId);
    } catch (error) {
        setModelPending(false);
        setModelFeedbackText(error.message || t("job.submissionFailedTitle"), "error");
        setJobStatusWithText("job.submissionFailedTitle", error.message);
        setLoading(false);
        renderApplicationState();
    }
}

function openAccountDialog() {
    closeAccountMenu();
    state.accountDialogOpen = true;
    elements.accountUsernameInput.value = state.currentUser || "";
    elements.accountCurrentPasswordInput.value = "";
    elements.accountNewPasswordInput.value = "";
    elements.accountConfirmPasswordInput.value = "";
    clearAccountFeedback();
    renderApplicationState();
    elements.accountUsernameInput.focus();
}

function closeAccountDialog() {
    state.accountDialogOpen = false;
    clearAccountFeedback();
    renderApplicationState();
}

function validateAccountForm() {
    const username = elements.accountUsernameInput.value.trim();
    const currentPassword = elements.accountCurrentPasswordInput.value;
    const newPassword = elements.accountNewPasswordInput.value;
    const confirmPassword = elements.accountConfirmPasswordInput.value;

    if (!username) {
        setAccountFeedbackKey("account.usernameRequired", "error");
        return null;
    }

    if (!currentPassword) {
        setAccountFeedbackKey("account.currentPasswordRequired", "error");
        return null;
    }

    if (newPassword && newPassword.length < 6) {
        setAccountFeedbackKey("account.passwordTooShort", "error");
        return null;
    }

    if (newPassword !== confirmPassword) {
        setAccountFeedbackKey("account.passwordMismatch", "error");
        return null;
    }

    return {
        username,
        currentPassword,
        newPassword: newPassword.trim() ? newPassword : null,
    };
}

async function updateCredentials(event) {
    event.preventDefault();
    clearAccountFeedback();

    const payload = validateAccountForm();
    if (!payload) {
        return;
    }

    setAccountPending(true);

    try {
        const session = await requestJson("/api/v1/auth/credentials", {
            method: "PUT",
            body: JSON.stringify(payload),
        });

        state.currentUser = session.username;
        state.currentRole = session.role;
        elements.accountCurrentPasswordInput.value = "";
        elements.accountNewPasswordInput.value = "";
        elements.accountConfirmPasswordInput.value = "";
        elements.accountUsernameInput.value = session.username;
        setAccountFeedbackKey("account.updateSuccess", "info");
        renderApplicationState();
    } catch (error) {
        if (error.message?.includes("Current password is incorrect")) {
            setAccountFeedbackKey("account.invalidCurrentPassword", "error");
        } else if (error.message?.includes("at least 6 characters")) {
            setAccountFeedbackKey("account.passwordTooShort", "error");
        } else {
            setAccountFeedbackText(error.message || t("account.genericError"), "error");
        }
    } finally {
        setAccountPending(false);
    }
}

function handleUnauthorized() {
    stopPolling();
    resetVersionInteractionState({ keepZoom: true });
    resetSelectedVersionGovernance();
    state.versionAuditHistory = [];
    state.versionAuditHistoryError = null;
    setLoading(false);
    setModelPending(false);
    state.isAuthenticated = false;
    state.currentUser = null;
    state.currentRole = null;
    state.versions = [];
    state.selectedDraftVersionIds.clear();
    state.isDeleteDraftVersionsPending = false;
    state.selectedVersionId = null;
    state.selectedVersion = null;
    state.modelDialogOpen = false;
    state.accountDialogOpen = false;
    state.accountMenuOpen = false;
    clearModelFeedback();
    clearAccountFeedback();
    clearAuthFeedback();
    setAuthFeedbackKey("auth.sessionExpired", "error");
    renderVersionList();
    renderSelectedVersion(null);
    updateSummary();
    renderApplicationState();
}

async function checkSession() {
    try {
        const session = await requestJson("/api/v1/auth/session", {}, { allowUnauthorized: true });
        state.isAuthenticated = session.authenticated;
        state.currentUser = session.username;
        state.currentRole = session.role;
        renderApplicationState();

        if (session.authenticated) {
            await refreshAll();
        }
    } catch (error) {
        state.isAuthenticated = false;
        state.currentUser = null;
        state.currentRole = null;
        renderApplicationState();
        setAuthFeedbackKey("auth.serviceUnavailable", "error");
    }
}

async function login(event) {
    event.preventDefault();
    clearAuthFeedback();
    setLoginPending(true);

    try {
        const session = await requestJson(
                "/api/v1/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        username: elements.usernameInput.value.trim(),
                        password: elements.passwordInput.value,
                    }),
                },
                { allowUnauthorized: true }
        );

        state.isAuthenticated = session.authenticated;
        state.currentUser = session.username;
        state.currentRole = session.role;
        elements.passwordInput.value = "";
        clearAuthFeedback();
        renderApplicationState();
        await refreshAll();
    } catch (error) {
        if (error.status === 401) {
            setAuthFeedbackKey("auth.invalidCredentials", "error");
        } else if (error instanceof TypeError) {
            setAuthFeedbackKey("auth.serviceUnavailable", "error");
        } else {
            setAuthFeedbackText(error.message || t("auth.genericError"), "error");
        }
    } finally {
        setLoginPending(false);
    }
}

async function logout() {
    stopPolling();
    resetVersionInteractionState({ keepZoom: true });
    resetSelectedVersionGovernance();
    state.versionAuditHistory = [];
    state.versionAuditHistoryError = null;
    closeAccountMenu();
    try {
        await requestJson("/api/v1/auth/logout", { method: "POST" }, { allowUnauthorized: true });
    } catch (error) {
        // Logout should still clear the local UI state even if the session is already gone.
    }

    state.isAuthenticated = false;
    state.currentUser = null;
    state.currentRole = null;
    state.currentJob = null;
    state.versions = [];
    state.selectedDraftVersionIds.clear();
    state.isDeleteDraftVersionsPending = false;
    state.selectedVersionId = null;
    state.selectedVersion = null;
    state.lastRefreshAt = null;
    state.modelDialogOpen = false;
    state.modelBatchImports = createEmptyModelBatchImports();
    state.accountDialogOpen = false;
    state.accountMenuOpen = false;
    setLoading(false);
    setModelPending(false);
    elements.accountCurrentPasswordInput.value = "";
    elements.accountNewPasswordInput.value = "";
    elements.accountConfirmPasswordInput.value = "";
    clearModelFeedback();
    clearAccountFeedback();
    clearAuthFeedback();
    setAuthFeedbackKey("auth.signedOut", "info");
    setJobStatus("job.idleTitle", "job.idleDetail");
    renderModelBatchImports();
    renderVersionList();
    renderSelectedVersion(null);
    updateSummary();
    renderApplicationState();
}

for (const button of elements.localeButtons) {
    button.addEventListener("click", () => {
        if (!state.isLoginPending) {
            setLocale(button.dataset.localeOption);
        }
    });
}
elements.loginForm.addEventListener("submit", login);
elements.openModelButton.addEventListener("click", openModelDialog);
elements.versionsOpenModelButton.addEventListener("click", openModelDialog);
elements.accountMenuButton.addEventListener("click", toggleAccountMenu);
elements.accountSettingsButton.addEventListener("click", openAccountDialog);
elements.logoutButton.addEventListener("click", logout);
elements.modelCloseButton.addEventListener("click", closeModelDialog);
elements.modelCancelButton.addEventListener("click", closeModelDialog);
elements.modelSaveDraftButton.addEventListener("click", saveModelDraft);
elements.modelRestoreDraftButton.addEventListener("click", restoreModelDraft);
elements.modelExportTemplateButton.addEventListener("click", exportModelTemplate);
elements.modelExportButton.addEventListener("click", exportModelJson);
elements.modelDataVersionInput.addEventListener("input", renderModelBatchImports);
elements.modelResourceImportButton.addEventListener("click", () => elements.modelResourceImportInput.click());
elements.modelResourceImportInput.addEventListener("change", importModelResourcesTabular);
elements.modelTaskImportButton.addEventListener("click", () => elements.modelTaskImportInput.click());
elements.modelTaskImportInput.addEventListener("change", importModelTasksTabular);
elements.modelDowntimeImportButton.addEventListener("click", () => elements.modelDowntimeImportInput.click());
elements.modelDowntimeImportInput.addEventListener("change", importModelDowntimesTabular);
elements.modelBatchResourcesButton.addEventListener("click", () => elements.modelBatchResourcesInput.click());
elements.modelBatchResourcesInput.addEventListener("change", (event) => handleModelBatchImport("resources", event));
elements.modelBatchRecipesButton.addEventListener("click", () => elements.modelBatchRecipesInput.click());
elements.modelBatchRecipesInput.addEventListener("change", (event) => handleModelBatchImport("recipes", event));
elements.modelBatchDemandsButton.addEventListener("click", () => elements.modelBatchDemandsInput.click());
elements.modelBatchDemandsInput.addEventListener("change", (event) => handleModelBatchImport("demands", event));
elements.modelBatchInventoryBalancesButton.addEventListener("click", () => elements.modelBatchInventoryBalancesInput.click());
elements.modelBatchInventoryBalancesInput.addEventListener("change", (event) => handleModelBatchImport("inventory-balances", event));
elements.modelBatchDowntimesButton.addEventListener("click", () => elements.modelBatchDowntimesInput.click());
elements.modelBatchDowntimesInput.addEventListener("change", (event) => handleModelBatchImport("downtimes", event));
elements.modelBatchSetupRulesButton.addEventListener("click", () => elements.modelBatchSetupRulesInput.click());
elements.modelBatchSetupRulesInput.addEventListener("change", (event) => handleModelBatchImport("setup-rules", event));
elements.modelImportButton.addEventListener("click", () => elements.modelImportInput.click());
elements.modelImportInput.addEventListener("change", importModelJson);
elements.modelTemplateButton.addEventListener("click", () => applyModelTemplate(true));
elements.modelAddResourceButton.addEventListener("click", () => addModelResourceRow());
elements.modelAddTaskButton.addEventListener("click", () => addModelTaskRow());
elements.modelAddDowntimeButton.addEventListener("click", () => addModelDowntimeRow());
elements.modelResourcesBody.addEventListener("click", removeModelRowFromEvent);
elements.modelTasksBody.addEventListener("click", removeModelRowFromEvent);
elements.modelDowntimesBody.addEventListener("click", removeModelRowFromEvent);
elements.modelForm.addEventListener("submit", submitModeledSchedule);
elements.accountCloseButton.addEventListener("click", closeAccountDialog);
elements.accountCancelButton.addEventListener("click", closeAccountDialog);
elements.accountForm.addEventListener("submit", updateCredentials);
elements.runSampleButton.addEventListener("click", runSampleSchedule);
elements.refreshButton.addEventListener("click", refreshAll);
elements.selectAllDraftVersionsButton.addEventListener("click", toggleSelectAllDraftVersions);
elements.deleteDraftVersionsButton.addEventListener("click", deleteSelectedDraftVersions);
elements.readyForReleaseButton.addEventListener("click", submitSelectedVersionForRelease);
elements.approveButton.addEventListener("click", approveSelectedVersion);
elements.rejectButton.addEventListener("click", rejectSelectedVersion);
elements.versionReleaseNoteSaveButton.addEventListener("click", saveSelectedVersionReleaseNote);
elements.rollbackButton.addEventListener("click", rollbackSelectedVersion);
elements.publishButton.addEventListener("click", publishSelectedVersion);
elements.jobCancelButton.addEventListener("click", cancelCurrentJob);
elements.jobRetryButton.addEventListener("click", retryCurrentJob);
elements.versionCompareSelect.addEventListener("change", handleVersionCompareSelection);
elements.versionCompareButton.addEventListener("click", compareSelectedVersion);
elements.versionHistoryFilterSelect.addEventListener("change", handleVersionHistoryFilterChange);
elements.versionHistorySearchInput.addEventListener("input", handleVersionHistorySearchInput);
elements.versionsPanelToggleButton.addEventListener("click", toggleVersionsPanel);
elements.kpiToggleButton.addEventListener("click", toggleKpiSection);
elements.ganttLegendToggleButton.addEventListener("click", toggleGanttLegend);
elements.ganttDetailToggleButton.addEventListener("click", toggleGanttDetail);
elements.ganttZoomOutButton.addEventListener("click", () => zoomGantt(1 / GANTT_ZOOM_STEP));
elements.ganttFitButton.addEventListener("click", fitGanttTimeline);
elements.ganttZoomInButton.addEventListener("click", () => zoomGantt(GANTT_ZOOM_STEP));
elements.ganttResetDraftButton.addEventListener("click", resetDraftBars);
elements.ganttTrialButton.addEventListener("click", runTrialSolve);
elements.ganttDetailPinButton.addEventListener("click", toggleSelectedTaskPinned);
elements.ganttLabelLockButton.addEventListener("click", toggleGanttLabelLock);
elements.modelOverlay.addEventListener("click", (event) => {
    if (event.target === elements.modelOverlay && !state.isModelPending) {
        closeModelDialog();
    }
});
elements.accountOverlay.addEventListener("click", (event) => {
    if (event.target === elements.accountOverlay && !state.isAccountPending) {
        closeAccountDialog();
    }
});
window.addEventListener("resize", () => {
    if (state.selectedVersion) {
        renderGantt(state.selectedVersion);
    }
});
window.addEventListener("keydown", handleDraftUndoKeyboard);
window.addEventListener("keydown", handleAccountMenuEscape);
document.addEventListener("pointerdown", handleAccountMenuPointerDown);

if (window.ResizeObserver) {
    const detailCardObserver = new ResizeObserver(([entry]) => {
        if (!entry || state.isGanttDetailCollapsed) {
            return;
        }

        const nextHeight = clamp(Math.round(entry.contentRect.height), 140, 520);
        if (Math.abs(nextHeight - state.ganttDetailHeight) < 2) {
            return;
        }

        state.ganttDetailHeight = nextHeight;
        window.localStorage.setItem(STORAGE_KEYS.ganttDetailHeight, String(nextHeight));
    });
    detailCardObserver.observe(elements.ganttDetailCard);
}

initializeModelTableInteractions();
setLocale(state.locale);
updateModelDraftActionState();
renderJobStatus();
renderSelectedVersion(null);
updateSummary();
checkSession();
