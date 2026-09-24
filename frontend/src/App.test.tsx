import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  cancelScheduleJob,
  fetchBackendHealth,
  fetchGanttData,
  fetchScheduleJob,
  fetchScheduleJobs,
  fetchSession,
  fetchVersion,
  fetchVersions,
  generateScenarioFromImportBatches,
  login,
  resolveModelImportTemplateUrl,
  retryScheduleJob,
  submitScheduleJob,
  submitSampleSchedule,
  submitTrialSolve,
  uploadImportBatch,
} from "./lib/api";

vi.mock("./lib/api", async () => {
  return {
    cancelScheduleJob: vi.fn(),
    fetchBackendHealth: vi.fn(),
    fetchGanttData: vi.fn(),
    fetchScheduleJob: vi.fn(),
    fetchScheduleJobs: vi.fn(),
    fetchSession: vi.fn(),
    fetchVersion: vi.fn(),
    fetchVersions: vi.fn(),
    generateScenarioFromImportBatches: vi.fn(),
    login: vi.fn(),
    resolveLegacyUiUrl: vi.fn(() => "http://127.0.0.1:8081/"),
    resolveImportBatchErrorsUrl: vi.fn((path: string) => `http://127.0.0.1:8081${path}`),
    resolveModelImportTemplateUrl: vi.fn(() => "http://127.0.0.1:8081/api/v1/model-import/template"),
    retryScheduleJob: vi.fn(),
    submitScheduleJob: vi.fn(),
    submitSampleSchedule: vi.fn(),
    submitTrialSolve: vi.fn(),
    uploadImportBatch: vi.fn(),
  };
});

const mockedFetchSession = vi.mocked(fetchSession);
const mockedFetchBackendHealth = vi.mocked(fetchBackendHealth);
const mockedFetchGanttData = vi.mocked(fetchGanttData);
const mockedFetchVersions = vi.mocked(fetchVersions);
const mockedLogin = vi.mocked(login);
const mockedSubmitSampleSchedule = vi.mocked(submitSampleSchedule);
const mockedFetchScheduleJob = vi.mocked(fetchScheduleJob);
const mockedFetchScheduleJobs = vi.mocked(fetchScheduleJobs);
const mockedFetchVersion = vi.mocked(fetchVersion);
const mockedCancelScheduleJob = vi.mocked(cancelScheduleJob);
const mockedRetryScheduleJob = vi.mocked(retryScheduleJob);
const mockedResolveModelImportTemplateUrl = vi.mocked(resolveModelImportTemplateUrl);
const mockedUploadImportBatch = vi.mocked(uploadImportBatch);
const mockedGenerateScenarioFromImportBatches = vi.mocked(generateScenarioFromImportBatches);
const mockedSubmitScheduleJob = vi.mocked(submitScheduleJob);

const version = {
  versionId: "v1",
  versionName: "Snow Beer dashboard baseline",
  status: "RELEASED",
  triggerType: "SAMPLE",
  scenarioDescription: "baseline",
  createdAt: "2026-06-11T08:00:00Z",
  createdBy: "admin",
  publishedAt: "2026-06-11T09:00:00Z",
  releaseNote: "published",
  totalWeightedTardiness: 0,
  totalMakespan: 480,
  lateTaskCount: 0,
  averageUtilization: 0.7,
};

const jobVersion = {
  ...version,
  versionId: "ver-1",
  versionName: "Snow Beer v18",
  scenarioDescription: "Snow Beer released sample",
  createdAt: "2026-06-18T00:20:00Z",
  createdBy: "planner",
  totalMakespan: 480,
};

const ganttData = {
  versionId: "v1",
  versionName: "Snow Beer dashboard baseline",
  status: "RELEASED",
  createdBy: "admin",
  releaseNote: "published",
  kpis: { totalWeightedTardiness: 0, totalMakespan: 480, lateTaskCount: 1, averageUtilization: 0.7 },
  rows: [{ id: "line-1", label: "包装一线", resourceType: "PACKAGING_LINE", sortOrder: 1 }],
  bars: [{ id: "task-1", rowId: "line-1", startMs: 1_800_000_000_000, endMs: 1_800_003_600_000, label: "灌装批次 A", productCode: "SKU-A", priority: 1, dueDateMs: 1_800_003_000_000, late: true, tardinessMinutes: 10, pinned: false }],
  downtimes: [{ id: "down-1", rowId: "line-1", startMs: 1_800_004_000_000, endMs: 1_800_004_600_000, downtimeType: "MAINTENANCE", source: "sample", description: "计划检修" }],
  changeovers: [],
  inventoryCoverages: [],
};

const generatedScheduleRequest = {
  scenarioName: "formal-import-dv-test",
  tasks: [{ taskId: "task-1", durationMinutes: 30 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchSession.mockResolvedValue({ authenticated: true, username: "admin", role: "ADMIN" });
  mockedFetchBackendHealth.mockResolvedValue({
    service: "aps-poc-backend",
    status: "UP",
    timestamp: "2026-06-12T00:00:00Z",
  });
  mockedFetchVersions.mockResolvedValue([version]);
  mockedFetchGanttData.mockResolvedValue(ganttData);
  mockedFetchVersion.mockResolvedValue(jobVersion);
  mockedLogin.mockResolvedValue({ authenticated: true, username: "admin", role: "ADMIN" });
  mockedSubmitSampleSchedule.mockResolvedValue({
    jobId: "job-1",
    scenarioName: "plant-scale-control-deck",
    actorUsername: "planner",
    status: "QUEUED",
    solverStatus: "QUEUED",
    versionId: null,
    failureReason: null,
    errorMessage: null,
    createdAt: "2026-06-18T00:00:00Z",
    completedAt: null,
  });
  mockedFetchScheduleJob.mockResolvedValue({
    jobId: "job-1",
    scenarioName: "plant-scale-control-deck",
    actorUsername: "planner",
    status: "SUCCEEDED",
    solverStatus: "OPTIMAL",
    versionId: "ver-1",
    failureReason: null,
    errorMessage: null,
    createdAt: "2026-06-18T00:00:00Z",
    completedAt: "2026-06-18T00:01:00Z",
  });
  mockedFetchScheduleJobs.mockResolvedValue([
    {
      jobId: "job-running",
      scenarioName: "Snow Beer running sample",
      actorUsername: "planner",
      status: "RUNNING",
      solverStatus: "RUNNING",
      versionId: null,
      failureReason: null,
      errorMessage: null,
      createdAt: "2026-06-18T00:00:00Z",
      completedAt: null,
    },
    {
      jobId: "job-failed",
      scenarioName: "Snow Beer failed sample",
      actorUsername: "planner",
      status: "FAILED",
      solverStatus: "FAILED",
      versionId: null,
      failureReason: "SOLVER_NO_FEASIBLE_SCHEDULE",
      errorMessage: "No feasible schedule",
      createdAt: "2026-06-18T00:10:00Z",
      completedAt: "2026-06-18T00:11:00Z",
    },
    {
      jobId: "job-succeeded",
      scenarioName: "Snow Beer released sample",
      actorUsername: "planner",
      status: "SUCCEEDED",
      solverStatus: "OPTIMAL",
      versionId: "ver-1",
      failureReason: null,
      errorMessage: null,
      createdAt: "2026-06-18T00:20:00Z",
      completedAt: "2026-06-18T00:21:00Z",
    },
    {
      jobId: "job-succeeded-2",
      scenarioName: "Snow Beer released sample 2",
      actorUsername: "planner",
      status: "SUCCEEDED",
      solverStatus: "OPTIMAL",
      versionId: "ver-2",
      failureReason: null,
      errorMessage: null,
      createdAt: "2026-06-18T00:22:00Z",
      completedAt: "2026-06-18T00:23:00Z",
    },
  ]);
  mockedCancelScheduleJob.mockResolvedValue({
    jobId: "job-running",
    scenarioName: "Snow Beer running sample",
    actorUsername: "planner",
    status: "CANCELLED",
    solverStatus: "CANCELLED",
    versionId: null,
    failureReason: "JOB_CANCELLED",
    errorMessage: "Cancelled by planner",
    createdAt: "2026-06-18T00:00:00Z",
    completedAt: "2026-06-18T00:12:00Z",
  });
  mockedRetryScheduleJob.mockResolvedValue({
    jobId: "job-retry",
    scenarioName: "Snow Beer failed sample",
    actorUsername: "planner",
    status: "QUEUED",
    solverStatus: "QUEUED",
    versionId: null,
    failureReason: null,
    errorMessage: null,
    createdAt: "2026-06-18T00:30:00Z",
    completedAt: null,
  });
  mockedUploadImportBatch.mockImplementation(async (kind, file, dataVersion) => ({
    importBatch: {
      importId: `imp-${kind}`,
      dataVersion,
      importType: kind.toUpperCase(),
      sourceFileName: file.name,
      importedBy: "admin",
      createdAt: "2026-06-30T00:00:00Z",
      status: "SUCCEEDED",
      successCount: 1,
      failureCount: 0,
      payload: {},
      errors: [],
      errorsDownloadPath: null,
    },
  }));
  mockedGenerateScenarioFromImportBatches.mockResolvedValue({
    dataVersion: "dv-test",
    sourceImportBatchIds: {
      resources: "imp-resources",
      recipes: "imp-recipes",
      demands: "imp-demands",
    },
    scenario: {
      scenarioId: "scenario-import",
      scenarioName: "formal-import-dv-test",
      dataVersion: "dv-test",
      createdAt: "2026-06-30T00:05:00Z",
      scheduleStartAt: "2026-06-30T08:00:00Z",
      horizonMinutes: 1440,
      resourceCount: 1,
      demandCount: 1,
      requestedDemandQuantity: 10,
      plannedDemandQuantity: 10,
      inventoryBalanceCount: 0,
      inventoryCoveredQuantity: 0,
      operationCount: 4,
      downtimeCount: 0,
      setupRuleCount: 0,
      precedencePairCount: 3,
      bridgeAdjustmentCount: 0,
      demandCoverages: [],
      operations: [],
      precedencePairs: [],
      setupRules: [],
      bridgeAdjustments: [],
      scheduleRequest: generatedScheduleRequest,
      sourceImportBatchIds: {
        resources: "imp-resources",
        recipes: "imp-recipes",
        demands: "imp-demands",
      },
    },
  });
  mockedSubmitScheduleJob.mockResolvedValue({
    jobId: "job-import",
    scenarioName: "formal-import-dv-test",
    actorUsername: "planner",
    status: "QUEUED",
    solverStatus: "QUEUED",
    versionId: null,
    failureReason: null,
    errorMessage: null,
    createdAt: "2026-06-30T00:06:00Z",
    completedAt: null,
  });
});

describe("App", () => {
  it("renders the enterprise workbench shell with live backend summary data", async () => {
    render(<App />);

    expect(screen.getByText("正在连接 APS 后端...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "智能排产工作台" })).toBeInTheDocument();
    expect(screen.getByText("Snow Beer dashboard baseline")).toBeInTheDocument();
    expect(screen.getByText("后端 UP")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "旧版控制台" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(screen.getByRole("navigation", { name: "顶部模块导航" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "首页" })).toBeInTheDocument();
    expect(screen.getByLabelText("主模块导航")).toHaveClass("left-nav-rail");
    expect(screen.getByLabelText("工作台页面标题")).toBeInTheDocument();
    expect(screen.getByText("统一查看排程版本、业务状态和下一步计划动作。")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "运行排程" })).toHaveLength(1);
    expect(screen.getByLabelText("核心指标")).toContainElement(screen.getByText("排程版本"));
    expect(screen.getByLabelText("业务状态")).toContainElement(screen.getByText("待排程任务"));
    expect(screen.getByRole("link", { name: "下载导入模板" })).toHaveAttribute(
      "href",
      "http://127.0.0.1:8081/api/v1/model-import/template",
    );
    expect(screen.getByRole("button", { name: "运行排程" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "场景生成" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "查看排程任务" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "版本发布（旧版控制台）" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
    expect(mockedResolveModelImportTemplateUrl).toHaveBeenCalled();
    expect(screen.getByLabelText("工作台右侧信息栏")).toHaveClass("dashboard-side-column");

    await userEvent.click(screen.getByRole("button", { name: "版本管理" }));
    expect(screen.getByText("当前模块：版本管理")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "版本管理" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "计划" }));
    expect(screen.getByText("当前模块：计划")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "计划" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "发布检查" }));
    expect(screen.getByText("当前工具：发布检查")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布检查" })).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => {
      expect(mockedFetchSession).toHaveBeenCalledTimes(1);
      expect(mockedFetchBackendHealth).toHaveBeenCalledTimes(1);
      expect(mockedFetchVersions).toHaveBeenCalledTimes(1);
    });
  });

  it("shows login form and does not request protected version data when no session exists", async () => {
    mockedFetchSession.mockResolvedValueOnce({ authenticated: false, username: null, role: null });

    render(<App />);

    expect(await screen.findByRole("heading", { name: "登录 APS高级排程工作台" })).toBeInTheDocument();
    expect(screen.getByLabelText("APS高级排程")).toBeInTheDocument();
    expect(screen.getByLabelText("用户名")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(mockedFetchVersions).not.toHaveBeenCalled();
  });

  it("loads dashboard data after successful login", async () => {
    mockedFetchSession.mockResolvedValueOnce({ authenticated: false, username: null, role: null });

    render(<App />);

    await userEvent.type(await screen.findByLabelText("用户名"), "admin");
    await userEvent.type(screen.getByLabelText("密码"), "admin123");
    await userEvent.click(screen.getByRole("button", { name: "进入工作台" }));

    expect(mockedLogin).toHaveBeenCalledWith("admin", "admin123");
    expect(await screen.findByRole("heading", { name: "智能排产工作台" })).toBeInTheDocument();
    expect(screen.getByText("Snow Beer dashboard baseline")).toBeInTheDocument();
  });

  it("runs a native sample schedule quick action and refreshes dashboard data", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "运行排程" }));

    expect(mockedSubmitSampleSchedule).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("任务 job-1 已受理，状态 QUEUED")).toBeInTheDocument();
  });

  it("opens the native schedule jobs center from the left rail", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));

    expect(await screen.findByRole("heading", { name: "排程任务中心" })).toBeInTheDocument();
    expect(mockedFetchScheduleJobs).toHaveBeenCalledWith(20);
    expect(screen.getByText("Snow Beer running sample")).toBeInTheDocument();
    expect(screen.getByText("Snow Beer failed sample")).toBeInTheDocument();
    expect(screen.getByText("No feasible schedule")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看版本 ver-1" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "最近排程任务" });
    expect(table).toContainElement(screen.getByRole("rowgroup"));
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(screen.getAllByRole("cell").length).toBeGreaterThan(0);
  });

  it("opens the native Gantt review from the left rail", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "Gantt 评审" }));

    expect(await screen.findByRole("heading", { name: "Gantt 评审" })).toBeInTheDocument();
    expect(mockedFetchGanttData).toHaveBeenCalledWith("v1");
    const taskBar = await screen.findByRole("button", { name: "任务 灌装批次 A" });
    expect(taskBar).toBeInTheDocument();
    const originalLeft = taskBar.style.left;
    fireEvent.keyDown(taskBar, { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByRole("button", { name: "任务 灌装批次 A" }).style.left).not.toBe(originalLeft));
    expect(screen.getByText(/已在本地调整 1 个任务/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "任务 灌装批次 A" }));
    expect(screen.getByLabelText("任务详情 灌装批次 A")).toBeInTheDocument();
  });

  it("shows the current Gantt zoom and supports the extended zoom levels", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "Gantt 评审" }));
    await screen.findByRole("button", { name: "任务 灌装批次 A" });

    const zoomValue = screen.getByLabelText("当前缩放比例");
    expect(zoomValue).toHaveTextContent("100%");

    const zoomIn = screen.getByRole("button", { name: "放大甘特图" });
    for (let index = 0; index < 9; index += 1) await userEvent.click(zoomIn);
    expect(zoomValue).toHaveTextContent("400%");
    expect(zoomIn).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "适配甘特图" }));
    expect(zoomValue).toHaveTextContent("100%");
  });

  it.each(["ADMIN", "PLANNER", "APPROVER"])("allows %s to access Gantt trial solve and the jobs center", async (role) => {
    mockedFetchSession.mockResolvedValueOnce({ authenticated: true, username: "planner", role });
    render(<App />);
    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "Gantt 评审" }));
    expect(await screen.findByRole("button", { name: "提交试排" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "打开排程任务中心" }));
    expect(await screen.findByRole("heading", { name: "排程任务中心" })).toBeInTheDocument();
  });

  it("hides trial submission from a viewer", async () => {
    mockedFetchSession.mockResolvedValueOnce({ authenticated: true, username: "viewer", role: "VIEWER" });
    render(<App />);
    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "Gantt 评审" }));
    await screen.findByRole("button", { name: "任务 灌装批次 A" });
    expect(screen.queryByRole("button", { name: "提交试排" })).not.toBeInTheDocument();
  });

  it("expands a successful job into an in-page version review", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));
    await userEvent.click(await screen.findByRole("button", { name: "查看版本 ver-1" }));

    expect(mockedFetchVersion).toHaveBeenCalledWith("ver-1");
    expect(await screen.findByText("版本状态：RELEASED")).toBeInTheDocument();
    expect(screen.getByText("总加权延期：0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入旧版控制台 / Gantt" })).toHaveAttribute(
      "href",
      "http://127.0.0.1:8081/",
    );
  });

  it("hides schedule mutations from read-only roles", async () => {
    mockedFetchSession.mockResolvedValueOnce({ authenticated: true, username: "approver", role: "APPROVER" });
    render(<App />);
    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));

    expect(await screen.findByRole("heading", { name: "排程任务中心" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "取消 job-running" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "重试 job-failed" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看版本 ver-1" })).toBeInTheDocument();
  });

  it("keeps the latest selected version detail when requests resolve out of order", async () => {
    let resolveFirst: (value: typeof jobVersion) => void = () => {};
    let resolveSecond: (value: typeof jobVersion) => void = () => {};
    mockedFetchVersion.mockImplementation((versionId) => new Promise((resolve) => {
      if (versionId === "ver-1") resolveFirst = resolve;
      else resolveSecond = resolve;
    }));
    render(<App />);
    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));
    await userEvent.click(await screen.findByRole("button", { name: "查看版本 ver-1" }));
    await userEvent.click(screen.getByRole("button", { name: "查看版本 ver-2" }));
    resolveFirst({ ...jobVersion, versionId: "ver-1" });
    resolveSecond({ ...jobVersion, versionId: "ver-2", versionName: "Snow Beer v19" });
    expect(await screen.findByRole("heading", { name: "Snow Beer v19" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Snow Beer v18" })).not.toBeInTheDocument();
  });

  it("offers a reload action for polling warnings", async () => {
    mockedFetchScheduleJob.mockRejectedValueOnce(new Error("Polling failed"));
    render(<App />);
    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5200));
    });
    expect(screen.getByText("Polling failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新任务状态" })).toBeInTheDocument();
  }, 10000);

  it("does not show the empty state when the initial jobs request fails", async () => {
    mockedFetchScheduleJobs.mockRejectedValueOnce(new Error("Jobs unavailable"));
    render(<App />);
    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));
    expect(await screen.findByText("Jobs unavailable")).toBeInTheDocument();
    expect(screen.queryByText("暂无排程任务")).not.toBeInTheDocument();
  });

  it("opens the native import scenario workflow from data import", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getAllByRole("button", { name: "数据导入" }).at(-1)!);

    expect(await screen.findByRole("heading", { name: "数据导入与场景生成" })).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Recipes")).toBeInTheDocument();
    expect(screen.getByText("Demands")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载导入模板" })).toHaveAttribute(
      "href",
      "http://127.0.0.1:8081/api/v1/model-import/template",
    );
  });

  it("uploads required batches, generates a scenario, submits it, and opens jobs center", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getAllByRole("button", { name: "数据导入" }).at(-1)!);

    const dataVersion = (screen.getByLabelText("dataVersion") as HTMLInputElement).value;
    const resourcesFile = new File(["res"], "resources.csv", { type: "text/csv" });
    const recipesFile = new File(["rec"], "recipes.csv", { type: "text/csv" });
    const demandsFile = new File(["dem"], "demands.csv", { type: "text/csv" });

    await userEvent.upload(await screen.findByLabelText("上传 Resources"), resourcesFile);
    await userEvent.upload(screen.getByLabelText("上传 Recipes"), recipesFile);
    await userEvent.upload(screen.getByLabelText("上传 Demands"), demandsFile);

    expect(await screen.findByText("imp-resources")).toBeInTheDocument();
    expect(mockedUploadImportBatch).toHaveBeenNthCalledWith(1, "resources", resourcesFile, dataVersion);
    expect(mockedUploadImportBatch).toHaveBeenNthCalledWith(2, "recipes", recipesFile, dataVersion);
    expect(mockedUploadImportBatch).toHaveBeenNthCalledWith(3, "demands", demandsFile, dataVersion);
    expect(screen.getByRole("button", { name: "生成场景" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "生成场景" }));

    expect(await screen.findByText("Operation 4")).toBeInTheDocument();
    expect(mockedGenerateScenarioFromImportBatches).toHaveBeenCalledWith(
      expect.objectContaining({
        dataVersion,
        horizonMinutes: 1440,
        scenarioName: `formal-import-${dataVersion}`,
      }),
    );
    expect(screen.getByText("Precedence 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "提交排程任务" }));

    expect(await screen.findByText("job-import")).toBeInTheDocument();
    expect(mockedSubmitScheduleJob).toHaveBeenCalledWith(generatedScheduleRequest);
    await userEvent.click(screen.getByRole("button", { name: "查看排程任务" }));

    expect(await screen.findByRole("heading", { name: "排程任务中心" })).toBeInTheDocument();
    expect(mockedFetchScheduleJobs).toHaveBeenCalledWith(20);
  });

  it("disables all batch uploads while any import batch upload is pending", async () => {
    let resolveUpload: () => void = () => {};
    mockedUploadImportBatch.mockImplementationOnce((kind, file, dataVersion) => new Promise((resolve) => {
      resolveUpload = () => resolve({
        importBatch: {
          importId: `imp-${kind}`,
          dataVersion,
          importType: kind.toUpperCase(),
          sourceFileName: file.name,
          importedBy: "admin",
          createdAt: "2026-06-30T00:00:00Z",
          status: "SUCCEEDED",
          successCount: 1,
          failureCount: 0,
          payload: {},
          errors: [],
          errorsDownloadPath: null,
        },
      });
    }));

    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getAllByRole("button", { name: "数据导入" }).at(-1)!);

    const resourcesInput = await screen.findByLabelText("上传 Resources");
    const recipesInput = screen.getByLabelText("上传 Recipes");
    const demandsInput = screen.getByLabelText("上传 Demands");
    const inventoryInput = screen.getByLabelText("上传 Inventory Balances");
    const downtimesInput = screen.getByLabelText("上传 Downtimes");
    const setupRulesInput = screen.getByLabelText("上传 Setup Rules");

    await userEvent.upload(resourcesInput, new File(["res"], "resources.csv", { type: "text/csv" }));

    await waitFor(() => {
      expect(resourcesInput).toBeDisabled();
      expect(recipesInput).toBeDisabled();
      expect(demandsInput).toBeDisabled();
      expect(inventoryInput).toBeDisabled();
      expect(downtimesInput).toBeDisabled();
      expect(setupRulesInput).toBeDisabled();
    });
    expect(screen.getAllByText("上传中...")).toHaveLength(1);

    resolveUpload();
    expect(await screen.findByText("imp-resources")).toBeInTheDocument();
  });

  it("opens the same workflow from scenario generation", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getAllByRole("button", { name: "场景生成" }).at(-1)!);

    expect(await screen.findByRole("heading", { name: "数据导入与场景生成" })).toBeInTheDocument();
    expect(screen.getByText("场景参数")).toBeInTheDocument();
  });

  it("cancels and retries jobs from the native schedule jobs center", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));
    await userEvent.click(await screen.findByRole("button", { name: "取消 job-running" }));
    await userEvent.click(await screen.findByRole("button", { name: "重试 job-failed" }));

    expect(mockedCancelScheduleJob).toHaveBeenCalledWith("job-running");
    expect(mockedRetryScheduleJob).toHaveBeenCalledWith("job-failed");
    expect(await screen.findByText("job-retry")).toBeInTheDocument();
  });

  it("shows a clear unavailable state when dashboard APIs fail", async () => {
    mockedFetchVersions.mockRejectedValueOnce(new Error("Authentication required"));

    render(<App />);

    expect(await screen.findByText("工作台数据暂不可用")).toBeInTheDocument();
    expect(screen.getByText("Authentication required")).toBeInTheDocument();
  });
});
