const STORAGE_KEYS = {
    locale: "aps.ui.locale",
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
            accountSettings: "账号设置",
            logout: "退出登录",
            runSample: "运行样例排程",
            trialSolve: "排程试算",
            refresh: "刷新数据",
            publish: "发布版本",
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
        session: {
            signedInAs: "当前用户",
        },
        job: {
            latestJobLabel: "最新任务",
            idleTitle: "空闲",
            idleDetail: "当前没有正在跟踪的后台任务。",
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
            publishSuccessTitle: "版本已发布",
            publishSuccessDetail: "当前选中版本已标记为生效计划。",
            publishFailedTitle: "发布失败",
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
            publishedVersionsLabel: "已发布",
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
            collapse: "收起版本快照",
            expand: "展开版本快照",
        },
        viewer: {
            eyebrow: "版本详情",
            emptyTitle: "未选择版本",
            emptySubtitle: "先运行样例场景，或从左侧面板选择已有版本。",
            statusLine: "{status}版本",
            createdAt: "创建于 {value}",
            publishedAt: "发布于 {value}",
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
                PUBLISHED: "已发布",
                ARCHIVED: "已归档",
            },
            jobStatus: {
                PENDING: "待处理",
                RUNNING: "运行中",
                DONE: "已完成",
                FAILED: "失败",
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
            accountSettings: "Account Settings",
            logout: "Sign Out",
            runSample: "Run Sample Schedule",
            trialSolve: "Trial Solve",
            refresh: "Refresh Data",
            publish: "Publish Version",
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
        session: {
            signedInAs: "Signed in as",
        },
        job: {
            latestJobLabel: "Latest Job",
            idleTitle: "Idle",
            idleDetail: "No background job is being tracked.",
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
            publishSuccessTitle: "Version Published",
            publishSuccessDetail: "The selected version is now marked as the active plan.",
            publishFailedTitle: "Publish Failed",
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
            publishedVersionsLabel: "Published",
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
            collapse: "Collapse version snapshots",
            expand: "Expand version snapshots",
        },
        viewer: {
            eyebrow: "Version Detail",
            emptyTitle: "No version selected",
            emptySubtitle: "Generate the sample scenario or pick an existing version from the left panel.",
            statusLine: "{status} version",
            createdAt: "Created {value}",
            publishedAt: "Published {value}",
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
                PUBLISHED: "Published",
                ARCHIVED: "Archived",
            },
            jobStatus: {
                PENDING: "Pending",
                RUNNING: "Running",
                DONE: "Done",
                FAILED: "Failed",
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
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const state = {
    locale: loadLocale(),
    versions: [],
    selectedVersionId: null,
    selectedVersion: null,
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
    hasDraftChanges: false,
    ganttViewModel: null,
    ganttColumnWidths: loadGanttColumnWidths(),
    ganttRowHeights: loadGanttRowHeights(),
    ganttLabelsLocked: loadGanttLabelsLocked(),
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
    isAuthenticated: false,
    pollTimer: null,
    lastRefreshAt: null,
    isLoginPending: false,
    isAccountPending: false,
    accountDialogOpen: false,
    jobStatus: {
        titleKey: "job.idleTitle",
        detailKey: "job.idleDetail",
        params: {},
        detailText: null,
    },
    authFeedback: null,
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
    sessionUser: document.getElementById("session-user"),
    accountSettingsButton: document.getElementById("account-settings-button"),
    logoutButton: document.getElementById("logout-button"),
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
    publishButton: document.getElementById("publish-button"),
    versionList: document.getElementById("version-list"),
    workspaceGrid: document.getElementById("workspace-grid"),
    versionsPanel: document.getElementById("versions-panel"),
    versionsPanelToggleButton: document.getElementById("versions-panel-toggle-button"),
    versionsPanelToggleIcon: document.getElementById("versions-panel-toggle-icon"),
    versionsPanelRail: document.getElementById("versions-panel-rail"),
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
        let message = `${response.status} ${response.statusText}`;

        try {
            const payload = await response.json();
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

        throw new ApiError(response.status, message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function applyStaticTranslations() {
    document.title = t("meta.title");

    for (const element of document.querySelectorAll("[data-i18n]")) {
        element.textContent = t(element.dataset.i18n);
    }

    for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
        element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
    }
}

function renderApplicationState() {
    elements.authShell.classList.toggle("hidden", state.isAuthenticated);
    elements.appShell.classList.toggle("hidden", !state.isAuthenticated);
    elements.sessionUser.textContent = state.currentUser || "-";
    renderWorkspaceLayout();
    renderViewerWidgetState();
    renderAuthFeedback();
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

function renderAccountDialog() {
    const showDialog = state.isAuthenticated && state.accountDialogOpen;
    elements.accountOverlay.classList.toggle("hidden", !showDialog);
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

function syncDraftState() {
    state.hasDraftChanges = Object.keys(state.draftBars).length > 0;
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
        rowElement.classList.toggle("is-selected", isSelected);
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
        lane.classList.toggle("is-selected", isSelected);
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
    lane.title = buildTaskTitle(bar, row, isConflict);
    lane.classList.toggle("is-late", Boolean(bar.late));
    lane.classList.toggle("is-pinned", Boolean(bar.pinned));
    lane.classList.toggle("is-draft", Boolean(bar.isDraft));
    lane.classList.toggle("is-selected", isSelected);
    lane.classList.toggle("is-conflict", isConflict);
    lane.classList.toggle("is-draggable", !bar.pinned);
    lane.classList.toggle("is-dragging", isDragging);
    lane.classList.toggle("is-resizing", isResizing);
    lane.classList.toggle("is-drag-source-muted", isMoveDragging);
    lane.classList.toggle("is-compact", widthPx < 180);
    lane.classList.toggle("is-tight", widthPx < 128);
    lane.setAttribute("aria-pressed", String(isSelected));

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
    state.selectedBarId = null;
    state.selectedRowId = null;
    state.draftBars = {};
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
    const nextDraftBars = { ...state.draftBars };
    const nextDraft = {};

    if (startMs !== baseBar.startMs) {
        nextDraft.startMs = startMs;
    }
    if (endMs !== baseBar.endMs) {
        nextDraft.endMs = endMs;
    }
    if (normalizedRowId !== baseBar.rowId) {
        nextDraft.rowId = normalizedRowId;
    }

    if (Object.keys(nextDraft).length === 0) {
        delete nextDraftBars[barId];
    } else {
        nextDraftBars[barId] = nextDraft;
    }

    state.draftBars = nextDraftBars;
    syncDraftState();
}

function resetDraftBars() {
    stopTaskDrag();
    state.draftBars = {};
    syncDraftState();

    if (state.selectedVersion) {
        renderGantt(state.selectedVersion);
    }
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
            };
        })
        .filter(Boolean);

    return draftBars.length > 0 ? { draftBars } : null;
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

    armTaskClickGuard();
    queueTaskFocusRestore(state.selectedBarId);
    if (state.selectedVersion) {
        refreshGanttTaskInteractionView(state.selectedVersion);
        scheduleGanttFocusRestore({ type: "task", id: state.selectedBarId }, state.selectedVersion);
        restoreWindowScrollPosition(session.windowScrollPosition);
    }
}

function setLoading(isLoading) {
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

function getStatusClass(status) {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "PUBLISHED") {
        return "status-published";
    }
    if (normalized === "ARCHIVED") {
        return "status-archived";
    }
    return "status-draft";
}

function updateSummary() {
    const publishedCount = state.versions.filter((version) => version.status === "PUBLISHED").length;
    const selectedSummary = state.versions.find((version) => version.versionId === state.selectedVersionId);

    elements.summaryTotalVersions.textContent = String(state.versions.length);
    elements.summaryPublishedVersions.textContent = String(publishedCount);
    elements.summarySelectedStatus.textContent = selectedSummary ? translateEnum("versionStatus", selectedSummary.status) : t("summary.none");
    elements.summarySelectedName.textContent = selectedSummary ? selectedSummary.versionName : t("summary.chooseVersion");
    elements.summaryLastRefresh.textContent = state.lastRefreshAt ? formatDateTime(state.lastRefreshAt) : t("summary.waiting");
    renderVersionsPanelRail(publishedCount, selectedSummary);
}

function renderVersionList() {
    elements.versionList.innerHTML = "";

    if (state.versions.length === 0) {
        elements.versionList.innerHTML = `<div class="empty-state">${t("versions.empty")}</div>`;
        return;
    }

    for (const version of state.versions) {
        const fragment = elements.versionItemTemplate.content.cloneNode(true);
        const button = fragment.querySelector(".version-item");
        const chip = fragment.querySelector(".version-status-chip");
        const name = fragment.querySelector(".version-name");
        const meta = fragment.querySelector(".version-meta");
        const kpi = fragment.querySelector(".version-kpi");

        chip.textContent = translateEnum("versionStatus", version.status);
        chip.classList.add(getStatusClass(version.status));
        name.textContent = version.versionName;
        meta.textContent = `${translateEnum("triggerType", version.triggerType)} · ${formatDateTime(version.createdAt)}`;
        kpi.textContent = `${formatMinutes(version.totalMakespan)} · ${t("misc.lateCount", { count: version.lateTaskCount })}`;

        button.classList.toggle("is-active", version.versionId === state.selectedVersionId);
        button.addEventListener("click", () => {
            loadVersion(version.versionId);
        });

        elements.versionList.appendChild(fragment);
    }
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
    if (items.length === 0) {
        const now = Date.now();
        return { min: now, max: now + 60 * 60 * 1000 };
    }

    const starts = items.map((item) => item.startMs);
    const ends = items.map((item) => item.endMs);
    return { min: Math.min(...starts), max: Math.max(...ends) };
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

    version.rows.forEach((row, rowIndex) => {
        const rowElement = document.createElement("div");
        rowElement.className = "gantt-row";
        rowElement.dataset.rowId = row.id;
        rowElement.tabIndex = -1;
        rowElement.setAttribute("aria-selected", String(row.id === state.selectedRowId));
        rowElement.classList.toggle("is-selected", row.id === state.selectedRowId);
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
        setPublishEnabled(false);
        renderGantt(null);
        updateSummary();
        return;
    }

    elements.viewerTitle.textContent = version.versionName;
    elements.viewerSubtitle.textContent = [
        t("viewer.statusLine", { status: translateEnum("versionStatus", version.status) }),
        t("viewer.createdAt", { value: formatDateTime(findVersionSummary(version.versionId)?.createdAt) }),
        t("viewer.publishedAt", { value: formatDateTime(findVersionSummary(version.versionId)?.publishedAt) }),
    ].join(" · ");

    setPublishEnabled(version.status !== "PUBLISHED");
    renderGantt(version);
    updateSummary();
}

function findVersionSummary(versionId) {
    return state.versions.find((version) => version.versionId === versionId) || null;
}

async function loadVersions(preferredVersionId = state.selectedVersionId) {
    state.versions = await requestJson("/api/v1/versions");
    state.lastRefreshAt = new Date().toISOString();
    renderVersionList();
    updateSummary();

    if (state.versions.length === 0) {
        state.selectedVersionId = null;
        renderSelectedVersion(null);
        return;
    }

    const selected = state.versions.find((version) => version.versionId === preferredVersionId) || state.versions[0];
    await loadVersion(selected.versionId);
}

async function loadVersion(versionId) {
    stopTaskDrag();
    state.selectedVersionId = versionId;
    renderVersionList();
    const payload = await requestJson(`/api/v1/versions/${versionId}/gantt-data`);
    resetVersionInteractionState({ keepZoom: true });
    renderSelectedVersion(payload);
}

async function publishSelectedVersion() {
    if (!state.selectedVersionId) {
        return;
    }

    elements.publishButton.disabled = true;
    try {
        await requestJson(`/api/v1/versions/${state.selectedVersionId}/publish`, { method: "POST" });
        setJobStatus("job.publishSuccessTitle", "job.publishSuccessDetail");
        await loadVersions(state.selectedVersionId);
    } catch (error) {
        setJobStatusWithText("job.publishFailedTitle", error.message);
        setPublishEnabled(Boolean(state.selectedVersion && state.selectedVersion.status !== "PUBLISHED"));
    }
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

        if (job.status === "DONE") {
            setJobStatus("job.finishedTitle", "job.finishedDetail", { versionId: job.versionId });
            stopPolling();
            await loadVersions(job.versionId);
            setLoading(false);
            return;
        }

        if (job.status === "FAILED") {
            setJobStatusWithText("job.failedTitle", job.errorMessage || t("job.failedFallback"));
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
    if (!state.selectedVersionId || !state.hasDraftChanges) {
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

function openAccountDialog() {
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
    state.isAuthenticated = false;
    state.currentUser = null;
    state.versions = [];
    state.selectedVersionId = null;
    state.selectedVersion = null;
    state.accountDialogOpen = false;
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
        renderApplicationState();

        if (session.authenticated) {
            await refreshAll();
        }
    } catch (error) {
        state.isAuthenticated = false;
        state.currentUser = null;
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
    try {
        await requestJson("/api/v1/auth/logout", { method: "POST" }, { allowUnauthorized: true });
    } catch (error) {
        // Logout should still clear the local UI state even if the session is already gone.
    }

    state.isAuthenticated = false;
    state.currentUser = null;
    state.currentJob = null;
    state.versions = [];
    state.selectedVersionId = null;
    state.selectedVersion = null;
    state.lastRefreshAt = null;
    state.accountDialogOpen = false;
    elements.accountCurrentPasswordInput.value = "";
    elements.accountNewPasswordInput.value = "";
    elements.accountConfirmPasswordInput.value = "";
    clearAccountFeedback();
    clearAuthFeedback();
    setAuthFeedbackKey("auth.signedOut", "info");
    setJobStatus("job.idleTitle", "job.idleDetail");
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
elements.accountSettingsButton.addEventListener("click", openAccountDialog);
elements.logoutButton.addEventListener("click", logout);
elements.accountCloseButton.addEventListener("click", closeAccountDialog);
elements.accountCancelButton.addEventListener("click", closeAccountDialog);
elements.accountForm.addEventListener("submit", updateCredentials);
elements.runSampleButton.addEventListener("click", runSampleSchedule);
elements.refreshButton.addEventListener("click", refreshAll);
elements.publishButton.addEventListener("click", publishSelectedVersion);
elements.versionsPanelToggleButton.addEventListener("click", toggleVersionsPanel);
elements.kpiToggleButton.addEventListener("click", toggleKpiSection);
elements.ganttLegendToggleButton.addEventListener("click", toggleGanttLegend);
elements.ganttDetailToggleButton.addEventListener("click", toggleGanttDetail);
elements.ganttZoomOutButton.addEventListener("click", () => zoomGantt(1 / GANTT_ZOOM_STEP));
elements.ganttFitButton.addEventListener("click", fitGanttTimeline);
elements.ganttZoomInButton.addEventListener("click", () => zoomGantt(GANTT_ZOOM_STEP));
elements.ganttResetDraftButton.addEventListener("click", resetDraftBars);
elements.ganttTrialButton.addEventListener("click", runTrialSolve);
elements.ganttLabelLockButton.addEventListener("click", toggleGanttLabelLock);
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

setLocale(state.locale);
renderJobStatus();
renderSelectedVersion(null);
updateSummary();
checkSession();
