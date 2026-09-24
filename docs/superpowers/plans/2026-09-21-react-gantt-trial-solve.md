# React Gantt Trial-Solve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete React Gantt local-draft → existing trial-solve endpoint → inline ScheduleJob polling → automatically display the generated version, without modifying the source version.

**Architecture:** `App` passes the authenticated role and a jobs-center navigation callback; `GanttReviewPanel` owns its current version, draft bars, one trial job and one polling timer. Reuse the existing `submitTrialSolve`, `fetchScheduleJob`, `fetchVersions`, and `fetchGanttData` clients and the existing backend contract. Keep the source draft until both the generated version list and Gantt result load successfully. No backend changes or new generalized hook.

**Tech Stack:** React 18, TypeScript, Ant Design, Vitest, Testing Library, Spring Boot backend (existing endpoints only).

**Approved spec:** `docs/superpowers/specs/2026-09-21-react-gantt-trial-solve-design.md`

---

## Starting state and file map

The working tree already contains user changes: `frontend/src/features/workspace/GanttReviewPanel.tsx` has 25–400% zoom plus unused trial state/imports; `frontend/src/lib/api.ts` and `api.test.ts` already include the trial POST contract; `frontend/src/App.test.tsx` and `styles.css` include zoom changes. `restart.sh` and the local runbook are also uncommitted. **Do not reset, overwrite, reformat, or accidentally stage any of these pre-existing changes.** Before implementation, inspect `git diff` for touched paths; commits, if explicitly requested, must stage only reviewed hunks/files and never silently absorb unrelated changes.

| File | Responsibility |
|---|---|
| `frontend/src/App.tsx` | Pass authenticated role and `onOpenJobs` callback to Gantt. |
| `frontend/src/App.test.tsx` | App-level role and internal navigation integration; add the trial API mock export to the existing module mock. |
| `frontend/src/features/workspace/GanttReviewPanel.tsx` | Draft validation, payload, submit action, one job's lifecycle, successful result loading, UI/status; retain existing zoom and drag behavior. |
| `frontend/src/features/workspace/GanttReviewPanel.test.tsx` (new) | Focused, direct component tests for permissions, payload, conflicts, polling, stale requests, failure/draft preservation, success, and retry. |
| `frontend/src/lib/api.test.ts` | Assert the already-existing job GET path encodes IDs; keep existing trial POST test. No product API change expected. |
| `frontend/src/styles.css` | Add only a compact wrapping job-status row below the Gantt header, reusing semantic tokens. |

**Commands:** Run frontend commands from the repo root as `npm --prefix frontend ...`; use `npm --prefix frontend test -- --run <path>` for Vitest and `npm --prefix frontend run build` for typecheck/build. On this project, run `graphify update .` **after code edits**. Project root `CLAUDE.md` and the approved spec govern the rest.

## Task 1: Role wiring, task-center navigation and API mock hygiene

**Files:** Modify `frontend/src/App.test.tsx`, `frontend/src/App.tsx`, `frontend/src/features/workspace/GanttReviewPanel.tsx`. Do not change the version/job backends.

- [ ] **Step 1: Write a failing App integration test and complete the existing API mock.** In the import list and `vi.mock('./lib/api', ...)` object of `App.test.tsx`, add `submitTrialSolve` and `submitTrialSolve: vi.fn()` respectively; this avoids an unrelated missing-export error when the Gantt test imports the existing client. Add this test to the `describe('App')` block:

```tsx
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
```

- [ ] **Step 2: Run the new test to confirm RED.** Run `npm --prefix frontend test -- --run src/App.test.tsx -t 'Gantt trial solve|trial submission'`. Expected: the authorized-role case fails because neither new button/navigation control exists (not because of a missing API mock export).

- [ ] **Step 3: Implement the minimal wiring.** In `App.tsx` replace `<GanttReviewPanel />` with:

```tsx
<GanttReviewPanel
  role={dashboardData.summary.userRole}
  onOpenJobs={() => setActiveWorkspaceKey("jobs")}
/>
```

In `GanttReviewPanel.tsx`, extend props and normalize the role:

```tsx
interface GanttReviewPanelProps {
  role?: string;
  onOpenJobs?: () => void;
}

export function GanttReviewPanel({ role = "VIEWER", onOpenJobs }: GanttReviewPanelProps) {
  // Existing state stays as-is.
  const canRunTrialSolve = ["ADMIN", "PLANNER", "APPROVER"].includes(role.toUpperCase());
```

Render the first minimal controls in the Gantt header. The disabled submit button is a deliberate placeholder for Task 2's enabled behavior; the jobs-center control is available to all authenticated users:

```tsx
{canRunTrialSolve && <Button type="primary" disabled>提交试排</Button>}
{onOpenJobs && <Button onClick={onOpenJobs}>打开排程任务中心</Button>}
```

- [ ] **Step 4: Re-run the App test.** Run `npm --prefix frontend test -- --run src/App.test.tsx -t 'Gantt trial solve|trial submission'`. Expected: PASS for all four cases.

- [ ] **Step 5: Check working tree; do not commit unapproved user hunks.** Run `git diff -- frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/features/workspace/GanttReviewPanel.tsx` and confirm the existing zoom edits are intact. If the user explicitly requests commits, stage only independently reviewed changes; otherwise do not commit.

## Task 2: Submit a validated local draft, never overwrite its source

**Files:** Create `frontend/src/features/workspace/GanttReviewPanel.test.tsx`; modify `frontend/src/features/workspace/GanttReviewPanel.tsx`.

- [ ] **Step 1: Add a focused test fixture and initial RED tests.** Create the new test file with `vi.mock('../../lib/api', ...)` exposing the four existing Gantt/job clients, typed `vi.mocked(...)` bindings, and the following reusable fixtures. Use a synthetic timestamp without downtime in the successful case and add a second row/bar only in conflict tests. The existing App test uses an overlapping downtime window, so it must *not* be used for happy-path submission.

```tsx
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GanttReviewPanel } from "./GanttReviewPanel";
import { fetchGanttData, fetchScheduleJob, fetchVersions, submitTrialSolve } from "../../lib/api";

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
  downtimes: [], changeovers: [], inventoryCoverages: [],
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

  it("never submits pinned bars and hides the action from VIEWER", async () => {
    gantt.mockResolvedValue({ ...sourceGantt, bars: [{ ...sourceGantt.bars[0], pinned: true }] });
    render(<GanttReviewPanel role="VIEWER" />);
    const bar = await screen.findByRole("button", { name: "任务 任务 A" });
    fireEvent.keyDown(bar, { key: "ArrowRight" });
    expect(screen.queryByRole("button", { name: "提交试排" })).not.toBeInTheDocument();
    expect(screen.queryByText(/已在本地调整/)).not.toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Confirm RED.** Run `npm --prefix frontend test -- --run src/features/workspace/GanttReviewPanel.test.tsx -t 'submits only|disabled when|never submits'`. Expected: payload/status test FAILS because submit action is still disabled; conflict/pinned tests establish baseline.

- [ ] **Step 3: Implement the minimal submit action and payload.** Reuse existing `data`, `versionId`, `draftBars`, `conflicts`, `trialJob`, `trialSubmitting`, `trialError`, and `TrialSolveDraftBar` type. Task 3 adds `trialResultError` and `activeTrialSourceId` for result loading; until then the submit code may omit the result-error guard and add it with Task 3. Use a synchronous ref guard for double clicks and a generation ref that polling later shares. The key fragments to add inside `GanttReviewPanel` are:

```tsx
const trialGeneration = useRef(0);
const trialSubmittingRef = useRef(false);
const trialActive = trialSubmitting || (trialJob !== null && !terminalJobStatuses.has(trialJob.status) && !trialError);

const runTrialSolve = async () => {
  if (!data || !versionId || !canRunTrialSolve || trialSubmittingRef.current ||
      Object.keys(draftBars).length === 0 || conflicts.size > 0 || trialActive) return;
  const changed: TrialSolveDraftBar[] = data.bars
    .filter((bar) => draftBars[bar.id] && !bar.pinned)
    .map((bar) => {
      const effective = { ...bar, ...draftBars[bar.id] };
      return { barId: bar.id, rowId: effective.rowId, startMs: effective.startMs,
        endMs: effective.endMs, pinned: effective.pinned };
    });
  if (!changed.length) return;
  const generation = ++trialGeneration.current;
  // Task 3 also stores versionId in activeTrialSourceId for stale-response guards.
  trialSubmittingRef.current = true;
  setTrialSubmitting(true);
  setTrialError(null);
  setTrialJob(null);
  try {
    const accepted = await submitTrialSolve(versionId, changed);
    if (trialGeneration.current !== generation) return;
    setTrialJob(accepted);
    // Task 3 wires polling here; one accepted job must never trigger a second POST.
  } catch (reason) {
    if (trialGeneration.current === generation) {
      // Task 3 also clears activeTrialSourceId on submission failure.
      setTrialError(reason instanceof Error ? reason.message : "无法提交试排");
    }
  } finally {
    if (trialGeneration.current === generation) {
      trialSubmittingRef.current = false;
      setTrialSubmitting(false);
    }
  }
};
```

Do not clear `draftBars` in this action. Replace the temporary disabled button with:

```tsx
{canRunTrialSolve && (
  <Button type="primary" loading={trialSubmitting}
    disabled={!data || !versionId || !Object.keys(draftBars).length || conflicts.size > 0 || trialActive}
    onClick={() => void runTrialSolve()}>提交试排</Button>
)}
<Button disabled={Object.keys(draftBars).length === 0 || trialActive} onClick={resetDraft}>重置调整</Button>
```

Render a minimal accessible status row (Task 3 expands it) and show the error separately:

```tsx
{trialJob && <div role="status" aria-live="polite">试排任务 {trialJob.jobId} · {trialJob.status}</div>}
{trialError && <Alert showIcon type="error" message="试排暂不可用" description={trialError} />}
```

- [ ] **Step 4: Re-run the targeted test.** Run `npm --prefix frontend test -- --run src/features/workspace/GanttReviewPanel.test.tsx -t 'submits only|disabled when|never submits'`. Expected: all three PASS. The current existing `App.test.tsx` zoom test must still pass.

- [ ] **Step 5: Inspect the mixed diff.** Run `git diff -- frontend/src/features/workspace/GanttReviewPanel.tsx`; preserve pre-existing zoom modifications. Do not commit unless explicitly asked.

## Task 3: Poll the accepted job and load the generated version without losing the draft

**Files:** Modify `frontend/src/features/workspace/GanttReviewPanel.test.tsx`, `frontend/src/features/workspace/GanttReviewPanel.tsx`. `frontend/src/App.tsx` navigation is already wired by Task 1.

- [ ] **Step 1: Add RED tests for nonterminal polling, success, and result-loading failure.** Use the fixtures from Task 2. To avoid a real 1.5-second wait per case, switch to fake timers **after** `openDraft()`/`userEvent.click()` have completed, and use `await act(async () => { await vi.advanceTimersByTimeAsync(1500); });` for each tick. The status row text should be asserted via `getByRole('status')`, not raw status elsewhere:

```tsx
it("polls nonterminal status then selects and displays the generated version", async () => {
  const resultVersion = { ...sourceVersion, versionId: "v2", versionName: "试排版本", createdAt: "2026-09-21T09:00:00Z" };
  const resultGantt = { ...sourceGantt, versionId: "v2", versionName: "试排版本" };
  versions.mockResolvedValueOnce([sourceVersion]).mockResolvedValueOnce([resultVersion, sourceVersion]);
  gantt.mockImplementation(async (id) => id === "v2" ? resultGantt : sourceGantt);
  job.mockResolvedValueOnce({ ...acceptedJob, status: "RUNNING" })
    .mockResolvedValueOnce({ ...acceptedJob, status: "SUCCEEDED", versionId: "v2" });
  render(<GanttReviewPanel role="PLANNER" />);
  await openDraft();
  await userEvent.click(screen.getByRole("button", { name: "提交试排" }));
  expect(await screen.findByText(/trial-1/)).toBeInTheDocument();
  vi.useFakeTimers();
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
  await userEvent.click(screen.getByRole("button", { name: "提交试排" }));
  await screen.findByText(/trial-1/);
  vi.useFakeTimers();
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(screen.getByText(/已在本地调整 1 个任务/)).toBeInTheDocument();
  expect(screen.getByText(/新版本加载失败/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "重试打开结果" })).toBeInTheDocument();
  expect(submit).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Confirm RED.** Run `npm --prefix frontend test -- --run src/features/workspace/GanttReviewPanel.test.tsx -t 'polls nonterminal|opening a successfully'`. Expected: FAIL because no job polling/result transition exists.

- [ ] **Step 3: Implement timer lifecycle and version-selection safety.** Add these refs/functions inside `GanttReviewPanel`; keep the existing refs for version-list and Gantt GET request generations:

```tsx
const preloadedTrialVersionId = useRef<string | null>(null);
const activeTrialSourceId = useRef<string | null>(null);
const [trialResultError, setTrialResultError] = useState<string | null>(null);
const [trialSuccessVersionId, setTrialSuccessVersionId] = useState<string | null>(null);

const stopTrialPolling = () => {
  if (trialTimer.current !== null) window.clearTimeout(trialTimer.current);
  trialTimer.current = null;
};

const invalidateTrial = () => {
  ++trialGeneration.current;
  stopTrialPolling();
  trialSubmittingRef.current = false;
  setTrialSubmitting(false);
  setTrialJob(null);
  setTrialError(null);
  setTrialResultError(null);
  activeTrialSourceId.current = null;
};
```

At the start of the existing Gantt loading effect (`[versionId, ganttRefreshKey]`), do not invalidate a generated-result selection that was preloaded by `openTrialResult`. Keep this effect's existing `versionsRequestId`/`ganttRequestId` cleanup. For a real version switch or manual reload, call `invalidateTrial()` and reset the draft; skip all loading/reset when the generated data was already fetched:

```tsx
if (preloadedTrialVersionId.current === versionId) {
  preloadedTrialVersionId.current = null;
  return () => { ganttRequestId.current += 1; };
}
// Keep the existing fetchGanttData effect focused on loading data. Move the
// draft reset/invalidation into explicit version-change and reload handlers.
setSelectedBarId(null);
setDraftBars({});
// existing fetchGanttData(versionId) logic follows
```

**React effect caveat:** keep `invalidateTrial()` and state setters out of effect cleanup. The initial Gantt loading effect may keep its existing `setDraftBars({})` for initial loads and explicit version changes, but do not trigger that effect merely because a job tick or result-prefetch error occurred. Only the explicit version-select/reload handlers invalidate active trials; result success bypasses the loading effect via `preloadedTrialVersionId`. A result-prefetch failure leaves `versionId` unchanged and therefore preserves the source draft. While `trialActive`, block `startDrag` and `moveBarByKeyboard` so the visible draft cannot diverge from the submitted snapshot; this guard becomes inactive on a terminal job or a paused polling error.

Before changing version via the Select, call `invalidateTrial()`, clear the success hint, then `setVersionId(nextId)`; on manual reload, do the same before incrementing `ganttRefreshKey` or `versionsRefreshKey`. For the existing version-list effect (`[versionsRefreshKey]`), keep its ordinary behavior for initial/manual loads; result success uses `openTrialResult`'s direct `fetchVersions()` and must not increment `versionsRefreshKey`, because a stale list request could otherwise reselect the source. Do not let in-flight POST/GET responses overwrite the newly selected version; each async continuation compares the captured `trialGeneration.current` and `activeTrialSourceId.current` (source id captured at submission) before mutating state. On unmount, increment the generation and clear the timer in the existing cleanup effect. Keep `ganttRequestId` increments so an outstanding source-version fetch cannot overwrite a prefetched result.

- [ ] **Step 4: Implement one in-panel job poll and a staged successful-result loader.** In `runTrialSolve`, save `activeTrialSourceId.current = versionId` immediately after incrementing `trialGeneration` (before the POST), clear it in the POST catch branch, and after accepting the job schedule polling with `pollTrialJob(accepted.jobId, generation, versionId)`. Block both the submit handler and submit button whenever `trialJob?.status === "SUCCEEDED"`, including when result loading failed, so a retry cannot accidentally POST twice; users should use “重试打开结果” instead. Write functions as follows (Task 4 adds precise errors/retry controls):

```tsx
const openTrialResult = async (nextJob: ScheduleJobResponse, generation: number) => {
  if (!nextJob.versionId) {
    setTrialResultError("试排任务已完成，但未返回新版本编号");
    return;
  }
  try {
    const [nextVersions, nextGantt] = await Promise.all([
      fetchVersions(), fetchGanttData(nextJob.versionId),
    ]);
    if (trialGeneration.current !== generation || !activeTrialSourceId.current) return;
    if (!nextVersions.some((item) => item.versionId === nextJob.versionId)) {
      setTrialResultError(`新版本 ${nextJob.versionId} 尚未出现在版本列表，请重试打开结果`);
      return;
    }
    if (nextGantt.versionId !== nextJob.versionId) {
      setTrialResultError(`新版本 ${nextJob.versionId} 的甘特数据尚未就绪，请重试打开结果`);
      return;
    }
    // Invalidate outstanding source-version/list GETs before committing the preloaded result.
    ++ganttRequestId.current;
    ++versionsRequestId.current;
    preloadedTrialVersionId.current = nextJob.versionId;
    setVersions([...nextVersions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    setData(nextGantt);
    setVersionId(nextJob.versionId);
    setLoading(false);
    setError(null);
    setDraftBars({});
    setSelectedBarId(null);
    setTrialJob(null);
    setTrialError(null);
    setTrialResultError(null);
    setTrialSuccessVersionId(nextJob.versionId);
    activeTrialSourceId.current = null;
  } catch (reason) {
    if (trialGeneration.current === generation) {
      setTrialResultError(reason instanceof Error ? reason.message : "无法打开试排新版本");
    }
  }
};

const pollTrialJob = (jobId: string, generation: number, sourceId: string) => {
  stopTrialPolling();
  trialTimer.current = window.setTimeout(async () => {
    trialTimer.current = null;
    try {
      const nextJob = await fetchScheduleJob(jobId);
      if (trialGeneration.current !== generation || activeTrialSourceId.current !== sourceId) return;
      setTrialJob(nextJob);
      setTrialError(null);
      if (nextJob.status === "SUCCEEDED") {
        await openTrialResult(nextJob, generation);
      } else if (!terminalJobStatuses.has(nextJob.status)) {
        pollTrialJob(jobId, generation, sourceId);
      }
    } catch (reason) {
      if (trialGeneration.current === generation) {
        setTrialError(reason instanceof Error ? reason.message : "无法刷新试排任务状态");
      }
    }
  }, 1500);
};
```

**Closure detail:** `pollTrialJob` takes the source version explicitly. In `runTrialSolve`, the current `versionId` is captured when the POST starts: set `activeTrialSourceId.current = versionId` before the POST, then call `pollTrialJob(accepted.jobId, generation, versionId)` on an accepted nonterminal job. `openTrialResult` compares the generation and non-null active source before committing the prefetched result; no stale render closure may override a newer selected version. Do not put `trialJob` or `trialError` in the Gantt loading-effect dependency list. If a POST immediately returns a terminal status, process it without a 1.5-second delay.

Render the success hint outside the version-specific draft alert so it remains visible after the old draft is cleared:

```tsx
{trialSuccessVersionId && <Alert type="success" showIcon message={`试排完成，已打开版本 ${trialSuccessVersionId}`} />}
{trialResultError && <Alert type="warning" showIcon message="试排成功，但无法打开新版本"
  description={trialResultError}
  action={<Button onClick={() => trialJob && void openTrialResult(trialJob, trialGeneration.current)}>重试打开结果</Button>} />}
```

- [ ] **Step 5: Re-run tests.** Run `npm --prefix frontend test -- --run src/features/workspace/GanttReviewPanel.test.tsx -t 'polls nonterminal|opening a successfully'` and `npm --prefix frontend run build`. Expected: targeted tests PASS and TypeScript/build PASS. If effect invalidation causes an already-loaded result to refetch, fix the `preloadedTrialVersionId` early return before moving on.

## Task 4: Terminal failures, polling retry and stale-response protection

**Files:** Modify `frontend/src/features/workspace/GanttReviewPanel.test.tsx` and `frontend/src/features/workspace/GanttReviewPanel.tsx`; optionally `frontend/src/styles.css` only for status-row wrapping.

- [ ] **Step 1: Add RED failure/retry tests.** Use `openDraft()` and the Task 3 fake-timer pattern. For each terminal state, assert the draft stays visible and POST occurs only once. Use a separate test for GET failure/retry and an unresolved GET for version-switch/unmount:

```tsx
it.each([
  ["FAILED", "求解失败"], ["TIMEOUT", "执行超时"], ["CANCELLED", "已取消"],
])("preserves the draft for %s", async (status, errorMessage) => {
  job.mockResolvedValue({ ...acceptedJob, status, errorMessage });
  render(<GanttReviewPanel role="APPROVER" />);
  await openDraft();
  await userEvent.click(screen.getByRole("button", { name: "提交试排" }));
  await screen.findByText(/trial-1/);
  vi.useFakeTimers();
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
  await userEvent.click(screen.getByRole("button", { name: "提交试排" }));
  await screen.findByText(/trial-1/);
  vi.useFakeTimers();
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(screen.getByText("网络中断")).toBeInTheDocument();
  vi.useRealTimers();
  await userEvent.click(screen.getByRole("button", { name: "重试查询" }));
  vi.useFakeTimers();
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(screen.getByText("求解无可行解")).toBeInTheDocument();
  expect(job).toHaveBeenCalledTimes(2);
  expect(submit).toHaveBeenCalledTimes(1);
});
```

Add a pending-promise test: submit, start GET with `vi.advanceTimersByTimeAsync(1500)` (advance until the GET has been called without awaiting the unresolved promise), switch version via the existing Select or unmount, resolve the old GET, and assert it cannot select its `versionId`, clear the new draft, or schedule another poll. If Ant Design Select is brittle in jsdom, use `rerender(<GanttReviewPanel ... />)` and `unmount()` for the unmount path plus a separate user-facing version-switch test using `fireEvent.mouseDown` and `userEvent.click` on the option. No arbitrary sleeps.

- [ ] **Step 2: Confirm RED.** Run `npm --prefix frontend test -- --run src/features/workspace/GanttReviewPanel.test.tsx -t 'preserves the draft|retries a failed GET|stale'`. Expected: FAIL for missing explicit errors/retry controls and stale protection tests.

- [ ] **Step 3: Add precise error rendering and retry controls.** The status block is rendered while `trialJob` exists; reuse its ID/status for all four terminal values. Prefer backend `errorMessage`, then `failureReason`, then a Chinese fallback. Clear only `trialError` on a GET retry, never `draftBars` or `trialJob`:

```tsx
const terminalFailure = trialJob && ["FAILED", "TIMEOUT", "CANCELLED"].includes(trialJob.status);
const terminalMessage = trialJob?.errorMessage || trialJob?.failureReason || "试排任务未成功，请检查调整后重试";
const retryTrialQuery = () => {
  if (!trialJob || !activeTrialSourceId.current) return;
  setTrialError(null);
  pollTrialJob(trialJob.jobId, trialGeneration.current, activeTrialSourceId.current);
};

{trialJob && (
  <div className="gantt-trial-status" role="status" aria-live="polite">
    <span>试排任务 {trialJob.jobId}</span><Tag color={
      trialJob.status === "SUCCEEDED" ? "green" : terminalFailure ? "red" : "processing"
    }>{trialJob.status}</Tag>
    {onOpenJobs && <Button size="small" onClick={onOpenJobs}>打开排程任务中心</Button>}
  </div>
)}
{terminalFailure && <Alert showIcon type="error" message="试排任务未完成" description={terminalMessage} />}
{trialError && <Alert showIcon type="warning" message="无法刷新试排任务状态"
  description={trialError}
  action={<Button onClick={retryTrialQuery}>重试查询</Button>} />}
```

For submit errors, use `ApiError` imported from `../../lib/api` (include the real `ApiError` in the test mock when needed) and map 403 to `当前角色无权提交试排`; other responses retain the backend's `message` (especially 400/409). If `ApiError` mocking is unnecessary, test role-based visibility plus a rejected `Error('版本不可试排')` as the message-preservation contract. Change the draft alert description to say the adjustment remains local until a generated version is successfully loaded; do not imply accepted jobs already modified the original version. Block drag/keyboard changes while `trialActive` if changing the draft during an in-flight job would make the submitted payload differ from the visible draft; otherwise allow editing only after a terminal outcome.

- [ ] **Step 4: Handle stale requests and terminal retry precisely.** The submitted-generation guard, explicit `invalidateTrial()` on version changes/reload and unmount cleanup must prevent old `fetchScheduleJob` or `fetchVersions` responses mutating state. A failed/cancelled/timed-out job is terminal, so `trialActive` is false; the next submit must replace `trialJob` but preserve the draft. `retryTrialQuery` performs GET only. Check that a successful job with missing `versionId` leaves `trialJob` and draft in place with `trialResultError`, and a second result-open attempt never POSTs.

- [ ] **Step 5: Add only the necessary CSS.** Adjacent to existing `.gantt-review-controls` and `.gantt-draft-alert` rules in `styles.css`, add a wrapping status row using existing semantic colors:

```css
.gantt-trial-status { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
.gantt-trial-status span { overflow-wrap: anywhere; }
```

Do not change existing zoom-token declarations or unrelated dashboard CSS.

- [ ] **Step 6: Run the Gantt tests and build.** Run `npm --prefix frontend test -- --run src/features/workspace/GanttReviewPanel.test.tsx` then `npm --prefix frontend run build`. Expected: PASS. If fake timers starve Testing Library promises, switch back to real timers before `findBy...` or use `act` to flush the specific mocked response; never increase waits blindly.

## Task 5: Verify API encoding and full frontend regression

**Files:** Modify `frontend/src/lib/api.test.ts` only if needed; no product API change.

- [ ] **Step 1: Extend the existing GET test to prove job ID encoding.** Update the current `fetches a schedule job by id` test to call `fetchScheduleJob("job/1", "http://api.local")` and expect:

```ts
expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs/job%2F1", {
  credentials: "include", headers: { Accept: "application/json" },
});
```

Leave the already-present POST `submitTrialSolve('version/1', ...)` test unchanged.

- [ ] **Step 2: Run API test, App test, focused Gantt test, then full suite.** Run:

```bash
npm --prefix frontend test -- --run src/lib/api.test.ts
npm --prefix frontend test -- --run src/App.test.tsx src/features/workspace/GanttReviewPanel.test.tsx
npm --prefix frontend test -- --run
npm --prefix frontend run build
```

Expected: zero failed tests, zero TypeScript errors, Vite production build succeeds. If the full suite reveals a regression, diagnose and fix it before considering the task done. Re-run `graphify update .` after any subsequent code fix. Do not overwrite unrelated working-tree edits.

- [ ] **Step 3: Update the graph after code edits.** Run `graphify update .` (AST-only, no API cost), then `git status --short` and `git diff --check`. Expect graph update to finish without error and whitespace check to be clean. Inspect graphify-generated changes, if any; avoid staging unrelated generated artifacts.

## Task 6: Observe the real user flow and report outcomes

**Files:** No product file required. Use existing `startup.sh`, `stop.sh`, `restart.sh` (already untracked/user-authored), and `docs/runbooks/本地运行_重启_验收_排障.md` as operational guidance, without editing them.

- [ ] **Step 1: Check the runtime prerequisites without destructive startup.** Inspect the runbook and currently-running services before invoking any stop/restart script. If `restart.sh` would interrupt unrelated work, ask the user first; otherwise use the project startup pattern to launch frontend, backend, solver and PostgreSQL. Never run a destructive data cleanup. Document any missing solver/database prerequisites.

- [ ] **Step 2: Drive the browser/API flow, not just unit tests.** With an authorized test account and a version with a movable bar: open React Gantt, drag a bar so it has no resource/downtime conflict, submit a trial job, watch `CREATED/QUEUED/RUNNING → SUCCEEDED`, verify the new version is selected and its Gantt is displayed, then return to the original version to confirm it is unchanged. Also check one safe failure scenario (backend rejects a deliberately invalid draft request or a test-only mocked rejection) and verify the local draft remains visible. If a visual companion screen exists, it is not a substitute for observing this actual app flow.

- [ ] **Step 3: Record concrete evidence and limitations.** Record the observed job ID, generated version ID and UI behavior **without leaking credentials**. If backend/solver setup prevents a live trial, report the precise failed command/error instead of claiming end-to-end verification. Run `git diff --check` and inspect `git status --short` once more. Do not commit or push unless the user explicitly asks.

## Plan self-check

- Spec §2–5: permission, local-only changed bars, no-conflict guard, async submit, terminal status and result switching are covered by Tasks 1–4.
- Spec §5.3: result data/list are prefetched before `versionId` changes; draft persists if either fetch fails. `preloadedTrialVersionId` prevents the existing load effect from erasing the successfully loaded result.
- Spec §5.4–6: terminal and network failures preserve drafts and separate GET retry from POST; task-center callback and accessible status are covered by Tasks 1 and 4.
- Spec §7–9: role/API/UI tests, full build, graphify update, actual runtime observation and scope check are covered by Tasks 1–6.
- No new backend endpoint, general-purpose hook, version comparison or Phase 4 rule work is part of this plan.
