# React Schedule Jobs Center Design

## 1. Purpose

This design defines the next React migration slice after the first workbench shell: a native React schedule jobs center.

The current React UI can authenticate, load backend health and versions, run a sample schedule job, and poll an individual submitted job. The legacy static UI still owns most operational scheduling workflow details. This slice makes React the primary place to inspect recent schedule jobs, submit a sample job, follow job state, cancel live jobs, retry retryable jobs, and review the version produced by a successful job before continuing to the legacy console.

This slice intentionally does not rewrite the Gantt chart, import model editor, scenario generation form, approval workflow, or Snow Beer Phase 4 scheduling rules.

## 2. Current Constraints

The backend exposes these schedule job endpoints:

- `POST /api/v1/schedule/jobs`
- `POST /api/v1/schedule/jobs/sample`
- `GET /api/v1/schedule/jobs/{jobId}`
- `POST /api/v1/schedule/jobs/{jobId}/cancel`
- `POST /api/v1/schedule/jobs/{jobId}/retry`
- `GET /api/v1/schedule/jobs?limit=20`

The persistence layer stores `schedule_job` rows and supports listing recent jobs. The React implementation already has a task API client, `useScheduleJobs` hook, and an initial `ScheduleJobsPanel`; this design completes that implementation incrementally rather than replacing it with a new global state architecture.

## 3. Product Goal

The jobs center should answer these operator questions without opening the legacy console first:

- What schedule jobs were created recently?
- Which jobs are still running or queued?
- Which jobs succeeded and generated versions?
- Why did a job fail or time out?
- Can I cancel a live job?
- Can I retry a failed, timed-out, or cancelled job?
- What version summary resulted from a successful job?
- Where do I continue review after inspecting that summary?

The first version focuses on operational clarity and continuity, not full workflow replacement.

## 4. Scope

### 4.1 Included

- Complete the backend recent-jobs list path with bounded `limit` handling and focused tests.
- Complete the React API client for listing, cancelling, retrying, and loading version details as required.
- Render `ScheduleJobsPanel` when the left rail selection is `排程任务`.
- Use a compact enterprise table rather than task cards.
- Show recent jobs with scenario, job ID, status, solver status, actor, timestamps, version ID, and failure information.
- Keep the dashboard quick action for running a sample schedule job and update the jobs list after submission.
- Poll only active jobs (`CREATED`, `QUEUED`, `RUNNING`) every five seconds; stop polling each job when it reaches a terminal state and do not create timers when no active job exists.
- Show cancel and retry actions only for `ADMIN` and `PLANNER` users. `APPROVER` and `VIEWER` remain read-only.
- Allow cancellation of active jobs and retry of `FAILED`, `TIMEOUT`, and `CANCELLED` jobs, subject to the existing backend authorization and state validation.
- Let a successful job expand an in-page version review summary before offering an explicit link to the legacy console/Gantt.
- Provide loading, empty, list-error, action-pending, polling-warning, and version-detail-error states.

### 4.2 Excluded

- Full Gantt rewrite or embedded Gantt preview.
- Full version governance rewrite.
- Custom schedule request form migration.
- Model import batch UI migration.
- Scenario generation UI migration.
- Snow Beer Phase 4 samples or solver rule work.
- New queueing infrastructure or Redis execution wiring.
- A reusable cross-domain asynchronous-job framework.

## 5. Architecture and Data Flow

Use the existing incremental boundaries:

- `App` keeps authentication, shell navigation, and workspace selection. It renders `ScheduleJobsPanel` for `activeWorkspaceKey === "jobs"`.
- `ScheduleJobsPanel` owns page layout, role-based action visibility, expanded version detail state, and presentation. It does not issue requests directly.
- `useScheduleJobs` owns the task list, loading/error/action state, five-second active-job polling, and sample/cancel/retry/reload commands.
- `api.ts` keeps all HTTP calls behind `requestJson`, session credentials, and existing response types.
- The backend list and version read paths return persisted data without mutating job state.

The primary flow is:

```text
Open 排程任务
  -> load session-visible recent jobs
  -> derive action visibility from session role
  -> poll active jobs every five seconds
  -> stop each timer at terminal state
  -> successful job with versionId
  -> expand in-page version summary
  -> user chooses whether to enter legacy console/Gantt
```

Version details should reuse already-loaded version summaries when they contain the needed fields. If the existing response does not provide the required detail for a `versionId`, load that detail only when the user expands the row. Initial jobs-center loading must not fetch every version individually.

## 6. Backend Design

### 6.1 Store and Repository

`ScheduleJobRepository.findAllByOrderByCreatedAtDesc(Pageable)` supplies persisted jobs in descending creation order. `PostgresScheduleStore.listRecentJobs(int limit)` maps the bounded page to domain jobs.

### 6.2 Service

`SchedulingJobService.listRecentJobs(int requestedLimit)` normalizes the requested limit:

- values less than or equal to zero use the default of 20;
- positive values are capped at 50;
- the store receives only the normalized value.

The method must not alter job state or enqueue work.

### 6.3 Controller and Authorization

`GET /api/v1/schedule/jobs?limit=20` returns `List<ScheduleJobResponse>` and permits `ADMIN`, `PLANNER`, `APPROVER`, and `VIEWER`.

Mutation authorization remains unchanged:

- submit, cancel, retry: `ADMIN` or `PLANNER`;
- get/list: `ADMIN`, `PLANNER`, `APPROVER`, or `VIEWER`.

The controller continues to use `AuthService.requireAnyRole`; the frontend role check is a presentation convenience, not a security boundary.

## 7. React Design

### 7.1 API and Hook

Use the existing `ScheduleJobResponse` and `VersionSummaryResponse` types. The hook exposes:

- `jobs`, loading and error state;
- active, failed, and succeeded counts;
- `reload`, `runSample`, `cancelJob`, and `retryJob`;
- action-pending state keyed by sample or job/action;
- polling warnings while retaining the last known job state.

The hook starts polling active jobs after initial load, sample submission, and retry. It clears timers on terminal state and unmount. The default interval is 5,000 milliseconds.

### 7.2 Table Layout

The panel uses a dense operational table with:

- compact header containing title, refresh, and run-sample controls;
- summary strip for active, succeeded, and attention-needed jobs;
- columns for scenario/job, status/solver status, actor/time, version/error, and actions;
- status tags for `CREATED`, `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `TIMEOUT`, and `CANCELLED`;
- row-level pending indicators without disabling unrelated rows unnecessarily.

For `ADMIN` and `PLANNER`, active rows show “取消” and retryable terminal rows show “重试”. For `APPROVER` and `VIEWER`, those controls are absent. A successful row with a `versionId` shows “查看版本” for all authorized read roles.

### 7.3 In-Page Version Review

“查看版本” expands a review section in the jobs center; it does not open a new tab automatically. The summary includes, when available:

- version ID and version name;
- version status;
- scenario;
- creator and creation time;
- solver status;
- total weighted tardiness;
- total makespan;
- late-task count;
- average utilization;
- failure or warning information.

The expanded section includes an explicit “进入旧版控制台 / Gantt” link using the existing legacy URL resolver. The legacy UI remains reachable independently.

## 8. Error Handling

- List load failure shows a panel alert and retry action. Existing successfully loaded rows remain visible if a later refresh fails.
- Sample submission failure shows the backend `ApiError.message` near the header and restores the button.
- Cancel/retry failure shows the backend message, restores the row action, and preserves the prior row state.
- Polling failure retains the last known state and shows a refreshable warning; it does not remove the row or collapse the whole panel.
- Version detail failure shows an error inside the expanded detail area with a retry action and does not affect other rows.
- Unauthorized sessions continue through the existing app-level session/login handling.
- Backend authorization remains authoritative even when the frontend hides mutation controls.

## 9. Testing Plan

Use TDD for the React slice: add behavior-focused failing tests before implementation changes.

### 9.1 Backend

Test:

- repository/store ordering by descending `createdAt`;
- service default and maximum limit normalization;
- list endpoint response mapping;
- read-role authorization and unauthorized rejection;
- unchanged cancel/retry authorization and terminal-state behavior.

### 9.2 Frontend

Test:

- selecting `排程任务` renders the jobs center and loads recent jobs;
- the dense table displays scenario, job ID, status, solver status, actor, version, and failure message;
- active jobs poll after five seconds and stop polling at terminal state;
- no active jobs means no continued polling;
- `ADMIN`/`PLANNER` see cancel/retry while `APPROVER`/`VIEWER` do not;
- cancel and retry call the correct API and update the list;
- sample submission inserts or refreshes the resulting job;
- successful jobs expand an in-page version summary and expose the explicit legacy-console link;
- list, action, polling, and version-detail failures render retryable feedback;
- unmount clears timers.

Existing dashboard, login, import/scenario, and API tests must continue to pass.

## 10. Acceptance Criteria

The slice is complete when:

1. `GET /api/v1/schedule/jobs?limit=20` returns persisted recent jobs for authenticated read roles.
2. React `排程任务` opens a native dense-table jobs center.
3. Jobs remain visible after browser refresh because the list comes from backend persistence.
4. React can run a sample schedule and show its resulting job.
5. Active jobs refresh every five seconds and polling stops when no active job remains.
6. Mutation controls are visible only to `ADMIN` and `PLANNER` while backend authorization remains enforced.
7. Users can cancel active jobs and retry retryable terminal jobs.
8. Successful jobs show an in-page version review summary before offering legacy continuation.
9. Loading, empty, action, polling, and detail errors have clear recovery actions.
10. Relevant backend tests, frontend tests, and the React build pass.
11. The legacy static UI remains reachable.
12. Existing unrelated Phase 4/UAT working-tree changes are not mixed into the jobs-center implementation commit.

## 11. Migration Follow-Up

After this slice is stable, evaluate React migrations in this order:

1. model import batch list and upload;
2. scenario generation result review;
3. version list and release queue;
4. Gantt review.

Snow Beer Phase 4 samples and solver rule work remain independent of this UI slice.
