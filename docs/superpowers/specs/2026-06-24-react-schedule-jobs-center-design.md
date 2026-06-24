# React Schedule Jobs Center Design

## 1. Purpose

This design defines the next React migration slice after the first workbench shell: a native React schedule jobs center.

The current React UI can log in, load backend health and versions, run one sample schedule job, and poll that submitted job. The legacy static UI still owns most operational scheduling workflow details. The next migration should make React the primary place to inspect recent schedule jobs, submit a sample job, follow job state, cancel running jobs, retry failed jobs, and jump from a succeeded job to version or Gantt review.

This slice intentionally does not rewrite the Gantt chart, import model editor, scenario generation form, approval workflow, or Snow Beer Phase 4 scheduling rules.

## 2. Current Constraints

The backend currently exposes these schedule job endpoints:

- `POST /api/v1/schedule/jobs`
- `POST /api/v1/schedule/jobs/sample`
- `GET /api/v1/schedule/jobs/{jobId}`
- `POST /api/v1/schedule/jobs/{jobId}/cancel`
- `POST /api/v1/schedule/jobs/{jobId}/retry`

There is no HTTP endpoint for listing recent jobs. The persistence layer already has `schedule_job` rows and mapper support, but `ScheduleStore` only lists jobs by status for restart-time resume. A real React jobs center should not invent client-only history that disappears on refresh. It should add a small backend list endpoint.

## 3. Product Goal

The jobs center should answer these operator questions without opening the legacy console first:

- What schedule jobs were created recently?
- Which jobs are still running or queued?
- Which jobs succeeded and generated versions?
- Why did a job fail or time out?
- Can I cancel a live job?
- Can I retry a failed, timed-out, or cancelled job?
- Where do I continue review after a job succeeds?

The first version should focus on clarity and continuity, not on full workflow replacement.

## 4. Scope

### 4.1 Included

- Add a backend recent jobs list endpoint.
- Add React API client functions for listing, cancelling, and retrying jobs.
- Add a React `ScheduleJobsPanel` rendered when the left rail selection is `排程任务`.
- Show recent jobs in a table or dense list with status, scenario, actor, solver status, version id, timestamps, and failure message.
- Keep the dashboard quick action for running a sample schedule job, but refresh the jobs center data after submission.
- Allow job cancel for non-terminal jobs when the current user has job management authority.
- Allow retry for `FAILED`, `TIMEOUT`, and `CANCELLED` jobs when the current user has job management authority.
- Link succeeded jobs to the legacy console for Gantt/version review until React owns those pages.
- Provide loading, empty, failed, and action-pending states.

### 4.2 Excluded

- Full Gantt rewrite.
- Full version governance rewrite.
- Custom schedule request form migration.
- Model import batch UI migration.
- Scenario generation UI migration.
- Snow Beer Phase 4 samples or solver rule work.
- New queueing infrastructure or Redis execution wiring.

## 5. Backend Design

### 5.1 Store and Repository

Add a recent job listing path that returns persisted jobs in descending creation order.

Recommended shape:

```text
ScheduleJobRepository
└─ findAllByOrderByCreatedAtDesc(Pageable pageable)

ScheduleStore
└─ listRecentJobs(int limit)

PostgresScheduleStore
└─ maps repository rows to ScheduleJob domain objects
```

The service should clamp `limit` to a small maximum, such as 50, and default to 20 when the query parameter is absent or invalid.

### 5.2 Service

Add `SchedulingJobService.listRecentJobs(int limit)`.

The method should:

- accept a requested limit from the controller,
- normalize it to `1..50`,
- delegate to `ScheduleStore.listRecentJobs(normalizedLimit)`,
- return the domain jobs without altering job state.

### 5.3 Controller

Add:

```http
GET /api/v1/schedule/jobs?limit=20
```

Authorization should match read-only job inspection:

- `ADMIN`
- `PLANNER`
- `APPROVER`
- `VIEWER`

The endpoint returns `List<ScheduleJobResponse>`.

Existing mutation endpoints keep their current authorization:

- submit, cancel, retry: `ADMIN` or `PLANNER`
- get/list: `ADMIN`, `PLANNER`, `APPROVER`, or `VIEWER`

## 6. React Design

### 6.1 API Client

Extend `frontend/src/lib/api.ts` with:

- `fetchScheduleJobs(limit?: number)`
- `cancelScheduleJob(jobId: string)`
- `retryScheduleJob(jobId: string)`

All functions should use `requestJson`, session credentials, and the existing `ScheduleJobResponse` type.

### 6.2 Data Hook

Add a focused hook for the jobs panel, for example `useScheduleJobs`.

Responsibilities:

- load recent jobs on panel mount,
- expose `reload`,
- expose `runSample`,
- expose `cancelJob`,
- expose `retryJob`,
- track pending action by job id or by action key,
- poll active jobs after sample submit or retry,
- stop polling on unmount.

The existing `useSampleScheduleAction` may be folded into this hook or kept as a small wrapper only if that avoids duplication. The important boundary is that the panel owns the job list and action state.

### 6.3 Panel UI

Add `frontend/src/features/workspace/ScheduleJobsPanel.tsx`.

The panel should fit the existing workbench shell and use a work-focused layout:

- compact page header with title, refresh, and run sample actions,
- summary strip for active jobs, failed jobs, and succeeded jobs,
- table or dense list for recent jobs,
- inline status tags for `CREATED`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `TIMEOUT`, and `CANCELLED`,
- row actions for cancel, retry, and review,
- error alert for failed list/action calls,
- empty state that points users to run a sample schedule or use the legacy console for custom requests.

The panel should not use marketing copy or decorative sections. It is an operational screen.

### 6.4 Navigation

When `activeWorkspaceKey === "jobs"`, `App` should render `ScheduleJobsPanel` instead of `WorkspaceDashboard`.

The top workspace nav `排程` can continue to select the current dashboard context unless a later migration gives it a dedicated page. The left rail `排程任务` is the authoritative entry for this slice.

### 6.5 Legacy Continuity

For succeeded jobs with `versionId`, show a review action that opens the legacy console. If a stable deep link exists later, the review action can point directly to the version or Gantt. For this slice, linking to the legacy root is acceptable and should be explicit in button text or accessible label.

## 7. Error Handling

The jobs center should distinguish these cases:

- list load failed: panel-level alert with retry button,
- submit sample failed: action alert near the header,
- cancel/retry failed: row-level or panel-level action error that includes the backend message,
- polling failed: keep the last known job state and show a refreshable warning,
- unauthorized session: reuse the existing app-level login/session behavior.

Backend errors should not be swallowed. The React UI should display the `ApiError.message` returned by `requestJson`.

## 8. Testing Plan

### 8.1 Backend

Add focused tests for:

- repository/store listing recent jobs in descending `createdAt` order,
- service limit clamping,
- controller list endpoint authorization and response mapping,
- existing cancel/retry behavior remains available after the list endpoint is added.

### 8.2 Frontend

Use TDD for the React slice.

Add tests that first fail because the behavior is missing:

- clicking `排程任务` renders the jobs center and calls `fetchScheduleJobs`,
- the panel displays recent job status, scenario, actor, version id, and failure message,
- a non-terminal job exposes cancel and calls `cancelScheduleJob`,
- a failed job exposes retry and calls `retryScheduleJob`,
- running a sample job refreshes or updates the jobs list,
- list load failure shows a retryable error state.

Existing dashboard and login tests must continue to pass.

## 9. Acceptance Criteria

The slice is complete when:

1. `GET /api/v1/schedule/jobs?limit=20` returns recent jobs for authenticated read roles.
2. React `排程任务` opens a native jobs center instead of only changing a label.
3. Recent jobs persist across browser refresh because they come from backend persistence.
4. Users can run a sample schedule from React and see the resulting job in the jobs center.
5. Users can cancel live jobs and retry retryable terminal jobs from React.
6. Succeeded jobs provide a clear continuation path to legacy Gantt/version review.
7. Frontend tests, backend tests touched by this slice, and React build pass.
8. The legacy static UI remains reachable.

## 10. Migration Follow-Up

After this slice, the next React workflow migrations should be evaluated in this order:

1. model import batch list and upload,
2. scenario generation result review,
3. version list and release queue,
4. Gantt review.

Snow Beer Phase 4 samples and solver rule work should start after the React jobs center slice is stable.
