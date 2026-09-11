# React Schedule Jobs Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the React schedule jobs center with five-second active-job polling, role-aware actions, in-page version review, and verified backend/frontend behavior.

**Architecture:** Extend the existing `ScheduleJobsPanel` and `useScheduleJobs` incrementally. Keep HTTP calls in `frontend/src/lib/api.ts`, use the existing authenticated session flow, and reuse the existing version summary endpoint for on-demand version details. Keep backend authorization authoritative and isolate this work from the unrelated Phase 4/UAT working-tree changes.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, Ant Design, Spring Boot 3.4, Java 21, Spring Data JPA, JUnit 5, Mockito.

---

## File map

- Modify `frontend/src/lib/api.ts`: add authenticated version-summary retrieval and reuse the existing response types.
- Modify `frontend/src/lib/api.test.ts`: verify the version-detail GET contract and preserve task API coverage.
- Modify `frontend/src/features/workspace/useScheduleJobs.ts`: set the five-second default, preserve stale rows during refresh failures, and expose non-destructive polling warnings.
- Modify `frontend/src/features/workspace/useScheduleJobs.test.ts`: test five-second polling, terminal cleanup, refresh behavior, and action state.
- Modify `frontend/src/features/workspace/ScheduleJobsPanel.tsx`: render the dense table, role-aware controls, status/error states, and expandable version review.
- Modify `frontend/src/App.tsx`: pass the authenticated session role to the jobs panel without changing the existing login/dashboard flow.
- Modify `frontend/src/App.test.tsx`: cover navigation, role-specific controls, and the in-page version review continuation path.
- Modify `frontend/src/styles.css`: add only the focused table/detail styles required by the existing workbench visual language.
- Modify `backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java`: cover default, upper-bound, and positive limit normalization.
- Modify `backend/src/test/java/com/apspoc/backend/api/ScheduleJobControllerTest.java`: cover list response mapping and read-role authorization.
- Modify `backend/src/test/java/com/apspoc/backend/persistence/PostgresScheduleStoreTest.java`: assert descending creation-order mapping and the bounded `PageRequest`.
- No backend production-file changes are planned: the list endpoint, service normalization, repository ordering, version-summary endpoint, and role authorization already exist in the current tree.

## Task 1: Establish failing frontend behavior tests

**Files:**
- Modify: `frontend/src/features/workspace/useScheduleJobs.test.ts`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Add a failing five-second polling test.**

Add a test case that mounts `useScheduleJobs` with its default interval, resolves an active job, advances fake timers by 4,999 ms and asserts no status fetch, then advances 1 ms and asserts `fetchScheduleJob("job-1")` was called. Use the existing `beforeEach` fake-timer setup and mocked `fetchScheduleJobs` response.

```ts
it("polls active jobs every five seconds by default", async () => {
  mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
  mockedFetchScheduleJob.mockResolvedValue({ ...queuedJob, status: "RUNNING" });
  const { result } = renderHook(() => useScheduleJobs());

  await act(async () => {
    await Promise.resolve();
  });
  expect(result.current.jobs).toHaveLength(1);
  expect(mockedFetchScheduleJob).not.toHaveBeenCalled();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(4999);
  });
  expect(mockedFetchScheduleJob).not.toHaveBeenCalled();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();
  });
  expect(mockedFetchScheduleJob).toHaveBeenCalledWith("job-1");
});
```

- [ ] **Step 2: Add failing role and detail interaction tests.**

Extend the App test fixtures with a version-detail response and add tests that click `排程任务`, assert the `ADMIN` view has cancel/retry controls, click `查看版本 ver-1`, assert the version summary fields appear, and assert the legacy link is present only as an explicit detail action. Add a second test with `fetchSession` returning `APPROVER` and assert cancel/retry controls are absent while the read-only version action remains.

```tsx
it("expands a successful job into an in-page version review", async () => {
  mockedFetchScheduleJob.mockResolvedValueOnce({
    ...mockedFetchScheduleJobs.mock.results[0],
  } as never);
  render(<App />);
  await screen.findByRole("heading", { name: "智能排产工作台" });
  await userEvent.click(screen.getByRole("button", { name: "排程任务" }));
  await userEvent.click(await screen.findByRole("button", { name: "查看版本 ver-1" }));

  expect(await screen.findByText("版本状态：RELEASED")).toBeInTheDocument();
  expect(screen.getByText("总加权延期：0")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "进入旧版控制台 / Gantt" })).toHaveAttribute(
    "href",
    "http://127.0.0.1:8081/",
  );
});
```

Use an explicit `mockedFetchVersion` function in the actual test implementation; the snippet shows the expected assertion shape, not a new API name.

- [ ] **Step 3: Run the focused tests and verify they fail for the missing behavior.**

Run:

```bash
cd frontend && npm test -- --run src/features/workspace/useScheduleJobs.test.ts src/App.test.tsx
```

Expected: FAIL because the default polling interval is currently 1,500 ms, the panel does not receive/use the role, and the version detail interaction is not implemented.

- [ ] **Step 4: Commit the failing tests.**

```bash
git add frontend/src/features/workspace/useScheduleJobs.test.ts frontend/src/App.test.tsx
git commit -m "test: specify schedule jobs center behavior"
```

## Task 2: Complete the API contract for version review

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/api.test.ts`
- Test: `frontend/src/App.test.tsx`

- [ ] **Step 1: Add the API test before implementation.**

Add a `fetchVersion("ver-1", "http://api.local")` test that expects a GET to `/api/v1/versions/ver-1`, includes credentials, and returns a `VersionSummaryResponse` containing KPI fields.

```ts
it("fetches a version summary by id", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({
      versionId: "ver-1",
      versionName: "Snow Beer v18",
      status: "RELEASED",
      triggerType: "MANUAL",
      scenarioDescription: "Snow Beer",
      createdAt: "2026-06-18T00:00:00Z",
      createdBy: "planner",
      publishedAt: "2026-06-18T00:10:00Z",
      releaseNote: null,
      totalWeightedTardiness: 0,
      totalMakespan: 480,
      lateTaskCount: 0,
      averageUtilization: 0.7,
    }), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(fetchVersion("ver-1", "http://api.local")).resolves.toMatchObject({ versionId: "ver-1" });
  expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/versions/ver-1", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
});
```

- [ ] **Step 2: Implement the minimal API function.**

Export `fetchVersion(versionId: string, baseUrl?: string)` beside `fetchVersions`, using `requestJson<VersionSummaryResponse>(`/api/v1/versions/${encodeURIComponent(versionId)}`, ...)`. Do not introduce a second request helper or change credential behavior.

- [ ] **Step 3: Run the API test.**

Run:

```bash
cd frontend && npm test -- --run src/lib/api.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the API slice.**

```bash
git add frontend/src/lib/api.ts frontend/src/lib/api.test.ts
git commit -m "feat: fetch schedule version summaries"
```

## Task 3: Implement hook polling and safe refresh behavior

**Files:**
- Modify: `frontend/src/features/workspace/useScheduleJobs.ts`
- Modify: `frontend/src/features/workspace/useScheduleJobs.test.ts`

- [ ] **Step 1: Change the default polling interval to five seconds.**

Change the hook signature default from `pollIntervalMs = 1500` to `pollIntervalMs = 5000`. Keep the optional parameter so tests and future callers can use short intervals.

- [ ] **Step 2: Preserve the last known list on refresh failure.**

In `reload`, clear `error` and set `loading`, but do not call `setJobs([])` on failure. Leave the current rows visible, set `error`, and always clear loading in `finally` when mounted. Keep active timers from the existing list unless a successful reload replaces them; on successful reload, clear timers for jobs no longer active before starting timers for current active jobs.

- [ ] **Step 3: Make polling warnings non-destructive and terminal-safe.**

When `fetchScheduleJob` fails, set `actionError` (or a dedicated `pollingError` if the panel needs to distinguish it) and do not remove or mutate the last known row. When a fetched job reaches a terminal status, call `clearTimer(jobId)` so no stale timer remains in the map. Retain the existing mounted guard and unmount cleanup.

- [ ] **Step 4: Add tests for terminal cleanup and stale-row retention.**

Add tests that (a) resolve an active job as `SUCCEEDED`, advance the timer twice, and assert only one status request occurred; and (b) load a row, reject the next `fetchScheduleJobs`, then assert the row remains and `error` contains the backend message.

- [ ] **Step 5: Run focused hook tests.**

Run:

```bash
cd frontend && npm test -- --run src/features/workspace/useScheduleJobs.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the hook slice.**

```bash
git add frontend/src/features/workspace/useScheduleJobs.ts frontend/src/features/workspace/useScheduleJobs.test.ts
git commit -m "feat: poll active schedule jobs every five seconds"
```

## Task 4: Add role-aware dense table and in-page version detail

**Files:**
- Modify: `frontend/src/features/workspace/ScheduleJobsPanel.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Pass the session role to the panel.**

In `App`, preserve `dashboardData.summary` rendering and pass `dashboardData.summary.userRole` (or add the raw session role to the dashboard state if that is the established source) as a `role` prop. Normalize role comparison to uppercase, and treat only `ADMIN` and `PLANNER` as mutation-capable. Do not infer permissions from button presence.

- [ ] **Step 2: Add version detail state and on-demand loading.**

In `ScheduleJobsPanel`, track the expanded `jobId`, the loaded `VersionSummaryResponse | null`, a detail loading flag, and a detail error. On clicking a successful job’s “查看版本” button, fetch `fetchVersion(job.versionId)` and show a loading state. If the same row is clicked again, collapse it. Do not request version details during initial jobs-list load.

- [ ] **Step 3: Render the dense operational table.**

Keep the existing table structure and render columns for scenario/job, status plus solver status, actor/time, version/error, and actions. Use status tags for all seven statuses. Format null timestamps and null values with the existing Chinese fallback style. Render cancel only when `canManageJobs && activeStatuses.has(job.status)`; render retry only when `canManageJobs && retryableStatuses.has(job.status)`; render version review for successful rows with a version ID regardless of read role.

- [ ] **Step 4: Render the expanded version summary.**

Place an accessible detail region below the selected row or table. Show version ID/name, status, scenario, creator/time, solver status (from the job or explicit detail context), total weighted tardiness, total makespan, late-task count, average utilization as a readable percentage, release note/warning when present, a retry button on detail load failure, and the explicit legacy link:

```tsx
<a href={resolveLegacyUiUrl()} target="_blank" rel="noreferrer">
  进入旧版控制台 / Gantt
</a>
```

The link must be user-activated; no automatic navigation or new request is allowed when detail loads.

- [ ] **Step 5: Render all required recovery states.**

Keep the list loading spinner and empty state. Show list errors with a retry button, action errors with backend messages, polling warnings without removing rows, and version-detail errors with an in-detail retry button. Keep unrelated row actions usable while another row action is pending.

- [ ] **Step 6: Add focused styles only.**

Add table/detail styles matching existing variables and compact enterprise density: horizontal overflow for narrow viewports, readable header contrast, status/detail spacing, and a visually distinct expanded summary. Do not add marketing cards, gradients, or a new design system.

- [ ] **Step 7: Run frontend typecheck and focused tests.**

Run:

```bash
cd frontend && npm test -- --run src/App.test.tsx src/features/workspace/ScheduleJobsPanel.test.tsx src/features/workspace/useScheduleJobs.test.tsx src/lib/api.test.ts
cd frontend && npm run build
```

Expected: PASS and a successful Vite build. If no separate panel test exists, keep the App integration coverage as the panel test surface rather than inventing redundant tests.

- [ ] **Step 8: Commit the panel slice.**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/features/workspace/ScheduleJobsPanel.tsx frontend/src/styles.css
git commit -m "feat: add role-aware schedule jobs review panel"
```

## Task 5: Strengthen backend list contract tests

**Files:**
- Modify: `backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java`
- Modify: `backend/src/test/java/com/apspoc/backend/api/ScheduleJobControllerTest.java`
- Modify: `backend/src/test/java/com/apspoc/backend/persistence/PostgresScheduleStoreTest.java`

- [ ] **Step 1: Add service boundary tests.**

Verify `listRecentJobs(0)` delegates to `store.listRecentJobs(20)`, a request over 50 delegates to 50, and a positive value such as 7 delegates unchanged. Use Mockito `verify` or stubbing that makes the delegated argument observable.

```java
@Test
void listRecentJobsNormalizesDefaultMaximumAndPositiveLimits() {
    when(store.listRecentJobs(20)).thenReturn(List.of());
    when(store.listRecentJobs(50)).thenReturn(List.of());
    when(store.listRecentJobs(7)).thenReturn(List.of());

    service.listRecentJobs(0);
    service.listRecentJobs(100);
    service.listRecentJobs(7);

    verify(store).listRecentJobs(20);
    verify(store).listRecentJobs(50);
    verify(store).listRecentJobs(7);
}
```

- [ ] **Step 2: Add controller authorization/mapping assertions.**

Keep the existing `listJobsAllowsReadRolesAndMapsResponses` test and add assertions for actor, failure reason, error message, createdAt, and completedAt. Verify `requireAnyRole(session, ADMIN, PLANNER, APPROVER, VIEWER)` remains the only read authorization call for the endpoint. Add an unauthorized-path test if the controller test style supports throwing from the mocked auth service.

- [ ] **Step 3: Verify repository ordering and bounded PageRequest.**

Keep the existing `listRecentJobsReturnsJobsByCreatedAtDescending` test and add an assertion that `PageRequest.of(0, requestedLimit)` is passed. The repository method must remain `findAllByOrderByCreatedAtDesc(Pageable)`; do not load all rows and sort in memory.

- [ ] **Step 4: Run backend tests.**

Run:

```bash
cd backend && ./mvnw -q -Dtest=SchedulingJobServiceTest,ScheduleJobControllerTest,PostgresScheduleStoreTest test
```

Expected: PASS. If the repository has no Maven wrapper, run `mvn -q -Dtest=... test` from `backend`.

- [ ] **Step 5: Commit backend verification changes.**

```bash
git add backend/src/main backend/src/test
 git commit -m "test: verify schedule jobs list contract"
```

Do not stage or commit the unrelated Phase 4/UAT files.

## Task 6: Run complete verification and update the graph

**Files:**
- No intended source changes; only modify files if a verification failure identifies a defect.

- [ ] **Step 1: Run the complete frontend suite and build.**

```bash
cd frontend && npm test -- --run
cd frontend && npm run build
```

Expected: all Vitest tests pass and TypeScript/Vite build succeeds.

- [ ] **Step 2: Run the complete backend suite.**

```bash
cd backend && ./mvnw -q test
```

Expected: all backend tests pass. Use `mvn -q test` if no wrapper exists.

- [ ] **Step 3: Inspect the final diff and protect unrelated work.**

```bash
git status --short
git diff --check master
```

Expected: only jobs-center implementation commits are present in the commit history; the pre-existing Phase 4/UAT files remain unstaged/uncommitted and are not altered by this plan.

- [ ] **Step 4: Update graphify after source changes.**

```bash
graphify update .
```

Expected: graphify completes without changing unrelated source behavior.

- [ ] **Step 5: Review the final diff for correctness and scope.**

Confirm these acceptance points manually from the code/tests: five-second active polling, no polling with no active jobs, role-hidden mutation controls, in-page version details, explicit legacy continuation, recovery states, preserved existing rows on refresh failure, and backend authorization.

- [ ] **Step 6: Commit any final source-only fix, then report evidence.**

If a final source fix is required, add only its directly related files and commit it with a focused message. Report exact test commands and outcomes; do not claim completion if any suite or build fails.
