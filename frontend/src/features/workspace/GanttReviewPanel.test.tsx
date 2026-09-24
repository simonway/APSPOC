import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GanttReviewPanel } from "./GanttReviewPanel";
import { fetchGanttData, fetchScheduleJob, fetchVersions, submitTrialSolve, type ScheduleJobResponse } from "../../lib/api";

vi.mock("../../lib/api", () => ({
  fetchGanttData: vi.fn(),
  fetchScheduleJob: vi.fn(),
  fetchVersions: vi.fn(),
  submitTrialSolve: vi.fn(),
}));

const versions = vi.mocked(fetchVersions);
const gantt = vi.mocked(fetchGanttData);
const job = vi.mocked(fetchScheduleJob);
const submit = vi.mocked(submitTrialSolve);
const startMs = 1_800_000_000_000;
const sourceVersion = {
  versionId: "v1", versionName: "原版本", status: "DRAFT", triggerType: "MANUAL",
  scenarioDescription: null, createdAt: "2026-09-20T08:00:00Z", createdBy: "planner",
  publishedAt: null, releaseNote: null, totalWeightedTardiness: 0,
  totalMakespan: 60, lateTaskCount: 0, averageUtilization: 0.5,
};
const sourceGantt = {
  versionId: "v1", versionName: "原版本", status: "DRAFT", createdBy: "planner", releaseNote: null,
  kpis: { totalWeightedTardiness: 0, totalMakespan: 60, lateTaskCount: 0, averageUtilization: 0.5 },
  rows: [{ id: "line-1", label: "包装一线", resourceType: "PACKAGING_LINE", sortOrder: 1 }],
  bars: [{ id: "task-1", rowId: "line-1", startMs, endMs: startMs + 3_600_000,
    label: "任务 A", productCode: "SKU-A", priority: 1, dueDateMs: startMs + 7_200_000,
    late: false, tardinessMinutes: 0, pinned: false }],
  downtimes: [],
  changeovers: [{ id: "co-1", rowId: "line-1", fromTaskId: "task-1", toTaskId: "task-next",
    startMs: startMs + 28_800_000, endMs: startMs + 29_400_000, durationMinutes: 10 }],
  inventoryCoverages: [],
};
const acceptedJob = {
  jobId: "trial-1", scenarioName: "试排", actorUsername: "planner", status: "QUEUED",
  solverStatus: "QUEUED", versionId: null, failureReason: null, errorMessage: null,
  createdAt: "2026-09-21T08:00:00Z", completedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  versions.mockResolvedValue([sourceVersion]);
  gantt.mockResolvedValue(sourceGantt);
  submit.mockResolvedValue(acceptedJob);
  job.mockResolvedValue({ ...acceptedJob, status: "RUNNING" });
});
afterEach(() => vi.useRealTimers());

async function openDraft() {
  const bar = await screen.findByRole("button", { name: "任务 任务 A" });
  fireEvent.keyDown(bar, { key: "ArrowRight" });
  await screen.findByText(/已在本地调整 1 个任务/);
}

describe("Gantt trial solve", () => {
  it("submits only changed bars with merged row, time and pinned fields", async () => {
    render(<GanttReviewPanel role="PLANNER" />);
    const submitButton = await screen.findByRole("button", { name: "提交试排" });
    expect(submitButton).toBeDisabled();
    await openDraft();
    await userEvent.click(submitButton);
    expect(submit).toHaveBeenCalledWith("v1", [{
      barId: "task-1", rowId: "line-1", startMs: startMs + 900_000,
      endMs: startMs + 4_500_000, pinned: false,
    }]);
    expect(await screen.findByText(/trial-1/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置调整" })).toBeDisabled();
  });

  it("drags a bar into another swimlane and submits the new row", async () => {
    gantt.mockResolvedValue({ ...sourceGantt, rows: [
      sourceGantt.rows[0],
      { id: "line-2", label: "包装二线", resourceType: "PACKAGING_LINE", sortOrder: 2 },
    ] });
    render(<GanttReviewPanel role="PLANNER" />);
    const bar = await screen.findByRole("button", { name: "任务 任务 A" });
    // The row elements must expose their id so moveDrag's elementFromPoint lookup can resolve the target lane.
    expect(document.querySelectorAll("[data-gantt-row-id]")).toHaveLength(2);
    const targetRow = document.createElement("div");
    targetRow.dataset.ganttRowId = "line-2";
    targetRow.closest = () => targetRow;
    Object.defineProperty(document, "elementFromPoint", {
      value: vi.fn(() => targetRow), configurable: true, writable: true,
    });

    bar.setPointerCapture = vi.fn();
    bar.releasePointerCapture = vi.fn();
    fireEvent(bar, new MouseEvent("pointerdown", { bubbles: true, button: 0, clientX: 10 }));
    expect(bar).toHaveAttribute("aria-grabbed", "true");
    fireEvent(bar, new MouseEvent("pointermove", { bubbles: true, clientX: 40, shiftKey: false }));
    fireEvent(bar, new MouseEvent("pointerup", { bubbles: true }));
    await screen.findByText(/已在本地调整 1 个任务/);
    const movedBar = screen.getByRole("button", { name: "任务 任务 A" });
    expect(movedBar).not.toBe(bar);
    expect(movedBar.className).toContain("is-draft");

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "提交试排" }));
    await act(async () => { await Promise.resolve(); });
    expect(submit).toHaveBeenCalledWith("v1", [expect.objectContaining({
      barId: "task-1", rowId: "line-2",
    })]);
  });

  it("keeps trial submission disabled when the draft overlaps another bar", async () => {
    gantt.mockResolvedValue({ ...sourceGantt, bars: [
      sourceGantt.bars[0],
      { ...sourceGantt.bars[0], id: "task-2", label: "任务 B",
        startMs: startMs + 4_200_000, endMs: startMs + 7_800_000 },
    ] });
    render(<GanttReviewPanel role="ADMIN" />);
    await openDraft();
    expect(screen.getByRole("button", { name: "提交试排" })).toBeDisabled();
    expect(screen.getByText(/其中 1 个存在冲突/)).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("polls nonterminal status then selects and displays the generated version", async () => {
    const resultVersion = { ...sourceVersion, versionId: "v2", versionName: "试排版本", createdAt: "2026-09-21T09:00:00Z" };
    const resultGantt = { ...sourceGantt, versionId: "v2", versionName: "试排版本" };
    versions.mockResolvedValueOnce([sourceVersion]).mockResolvedValueOnce([resultVersion, sourceVersion]);
    gantt.mockImplementation(async (id) => id === "v2" ? resultGantt : sourceGantt);
    job.mockResolvedValueOnce({ ...acceptedJob, status: "RUNNING" })
      .mockResolvedValueOnce({ ...acceptedJob, status: "SUCCEEDED", versionId: "v2" });
    render(<GanttReviewPanel role="PLANNER" />);
    await openDraft();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "提交试排" }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(/trial-1/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(job).toHaveBeenCalledWith("trial-1");
    expect(screen.getByRole("status")).toHaveTextContent("RUNNING");
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(screen.getByRole("heading", { name: "试排版本" })).toBeInTheDocument();
    expect(gantt).toHaveBeenCalledWith("v2");
    expect(screen.getByText(/v2 · DRAFT/)).toBeInTheDocument();
    expect(screen.queryByText(/已在本地调整/)).not.toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("keeps the source draft if opening a successfully generated version fails", async () => {
    versions.mockResolvedValueOnce([sourceVersion]).mockResolvedValueOnce([
      { ...sourceVersion, versionId: "v2", versionName: "试排版本" }, sourceVersion,
    ]);
    gantt.mockImplementation(async (id) => {
      if (id === "v2") throw new Error("新版本加载失败");
      return sourceGantt;
    });
    job.mockResolvedValue({ ...acceptedJob, status: "SUCCEEDED", versionId: "v2" });
    render(<GanttReviewPanel role="PLANNER" />);
    await openDraft();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "提交试排" }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(/trial-1/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(screen.getByText(/已在本地调整 1 个任务/)).toBeInTheDocument();
    expect(screen.getByText(/新版本加载失败/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试打开结果" })).toBeInTheDocument();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("never submits pinned bars and hides the action from VIEWER", async () => {
    gantt.mockResolvedValue({ ...sourceGantt, bars: [{ ...sourceGantt.bars[0], pinned: true }] });
    render(<GanttReviewPanel role="VIEWER" />);
    const bar = await screen.findByRole("button", { name: "任务 任务 A" });
    fireEvent.keyDown(bar, { key: "ArrowRight" });
    expect(screen.queryByRole("button", { name: "提交试排" })).not.toBeInTheDocument();
    expect(screen.queryByText(/已在本地调整/)).not.toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it.each([
    ["FAILED", "求解失败"], ["TIMEOUT", "执行超时"], ["CANCELLED", "已取消"],
  ])("preserves the draft for %s", async (status, errorMessage) => {
    job.mockResolvedValue({ ...acceptedJob, status, errorMessage });
    render(<GanttReviewPanel role="APPROVER" />);
    await openDraft();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "提交试排" }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(/trial-1/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(/已在本地调整 1 个任务/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交试排" })).toBeEnabled();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("retries a failed GET without a second POST", async () => {
    job.mockRejectedValueOnce(new Error("网络中断"))
      .mockResolvedValueOnce({ ...acceptedJob, status: "FAILED", failureReason: "求解无可行解" });
    render(<GanttReviewPanel role="PLANNER" />);
    await openDraft();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "提交试排" }));
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(/trial-1/)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(screen.getByText("网络中断")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "重试查询" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(screen.getByText("求解无可行解")).toBeInTheDocument();
    expect(job).toHaveBeenCalledTimes(2);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale job response after switching version", async () => {
    const olderVersion = { ...sourceVersion, versionId: "v0", versionName: "历史版本", createdAt: "2026-09-19T08:00:00Z" };
    versions.mockResolvedValue([sourceVersion, olderVersion]);
    let resolveStale: (value: ScheduleJobResponse) => void = () => {};
    const stalePromise = new Promise<ScheduleJobResponse>((resolve) => { resolveStale = resolve; });
    job.mockReturnValueOnce(stalePromise);
    render(<GanttReviewPanel role="PLANNER" />);
    await openDraft();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "提交试排" }));
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    expect(job).toHaveBeenCalledWith("trial-1");
    // User abandons the trial by switching to the older version.
    vi.useRealTimers();
    fireEvent.mouseDown(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: /历史版本/ }));
    await act(async () => { resolveStale({ ...acceptedJob, status: "SUCCEEDED", versionId: "v2" }); });
    expect(screen.queryByRole("heading", { name: "试排版本" })).not.toBeInTheDocument();
    expect(job).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale job response after unmount", async () => {
    let resolveStale: (value: ScheduleJobResponse) => void = () => {};
    const stalePromise = new Promise<ScheduleJobResponse>((resolve) => { resolveStale = resolve; });
    job.mockReturnValueOnce(stalePromise);
    const { unmount } = render(<GanttReviewPanel role="PLANNER" />);
    await openDraft();
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "提交试排" }));
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    unmount();
    await act(async () => { resolveStale({ ...acceptedJob, status: "SUCCEEDED", versionId: "v2" }); });
    expect(job).toHaveBeenCalledTimes(1);
  });
});
