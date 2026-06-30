# React Import Scenario Workflow Design

## 1. Purpose

This design defines the next React migration slice after the native schedule jobs center: a React workflow for formal model batch import, scenario generation, and schedule job submission.

The current React UI owns the workbench shell and schedule jobs center. The legacy static UI still owns the operational flow for importing formal batches, generating a scenario from a shared `dataVersion`, and submitting the generated `scheduleRequest` as a scheduling job. This slice moves that formal batch workflow into React so Snow Beer sample work can start from the preferred frontend.

This slice intentionally does not migrate the legacy manual table editor. It focuses on the persisted formal batch path because that is the path used by UAT sample packages and Snow Beer scenario work.

## 2. Current Backend Surface

The backend already exposes the APIs needed for this slice:

- `GET /api/v1/model-import/template`
- `POST /api/v1/model-import/resources`
- `POST /api/v1/model-import/recipes`
- `POST /api/v1/model-import/demands`
- `POST /api/v1/model-import/inventory-balances`
- `POST /api/v1/model-import/downtimes`
- `POST /api/v1/model-import/setup-rules`
- `GET /api/v1/model-import/batches/{importId}`
- `GET /api/v1/model-import/batches/{importId}/errors`
- `POST /api/v1/schedule/scenarios/from-import-batches`
- `POST /api/v1/schedule/jobs`

The React implementation should reuse these endpoints through `frontend/src/lib/api.ts`. No backend endpoint is required for the first React migration slice.

## 3. Product Goal

The React workflow should let a planner complete the formal path without opening the legacy console:

1. Download the import template.
2. Upload formal batch files for resources, recipes, demands, inventory balances, downtimes, and setup rules.
3. See whether each uploaded batch succeeded, failed validation, or produced an error report.
4. Confirm that required batches share one `dataVersion`.
5. Generate a scenario from the imported batches.
6. Review the generated scenario summary before scheduling.
7. Submit the generated schedule request.
8. Continue job tracking in the existing React schedule jobs center.

The first version should be operational and direct. It should not attempt to become a full master-data maintenance UI.

## 4. Scope

### 4.1 Included

- Add React API client functions for formal model import batch upload.
- Add React API client functions for scenario generation from import batches.
- Add React API client function for submitting a generated schedule request.
- Add a focused data hook for workflow state and derived readiness.
- Add a React `ImportScenarioPanel` rendered when the left rail selection is `数据导入` or `场景生成`.
- Show six batch slots:
  - Resources
  - Recipes
  - Demands
  - Inventory balances
  - Downtimes
  - Setup rules
- Treat resources, recipes, and demands as required for scenario generation.
- Treat inventory balances, downtimes, and setup rules as optional but first-class inputs.
- Keep a single `dataVersion` field and send it with every upload.
- Generate a default `dataVersion` when the panel first opens, using a readable timestamp format.
- Display each batch's `importId`, status, success count, failure count, source file, and error report link when available.
- Prevent scenario generation until required batches are successful and share the active `dataVersion`.
- Show a scenario setup form with scenario name, start time, horizon, objective weights, and solver config.
- Display generated scenario metrics: resources, demands, requested/planned quantity, inventory coverage, operations, downtimes, setup rules, precedence pairs, and bridge adjustments.
- Submit the generated `scheduleRequest` via the existing schedule job API.
- After submit succeeds, show the accepted job id and provide a clear button that switches to the React schedule jobs center.
- Keep the legacy static UI reachable through the existing top-nav link.

### 4.2 Excluded

- Legacy manual resource/task/downtime table editor migration.
- Inline editing of imported row payloads.
- Import batch search or historical batch list by `dataVersion`.
- New backend list endpoints for import batches or scenarios.
- Full Gantt rewrite.
- Full version governance rewrite.
- Snow Beer Phase 4 samples or solver rule work.

## 5. UX Model

### 5.1 Navigation

The left rail entries `数据导入` and `场景生成` should both render the same `ImportScenarioPanel`.

The panel title and supporting copy can adapt to the active key:

- `数据导入`: emphasize batch upload and validation.
- `场景生成`: emphasize scenario readiness and generated result review.

The top workspace nav can continue to select dashboard context. This slice only changes the left rail workflow entry.

### 5.2 Layout

Use a dense operational layout consistent with the existing React workbench:

- header band with template download, active `dataVersion`, and refresh/reset controls,
- batch grid with one compact card per import kind,
- scenario setup panel with form fields and readiness summary,
- generated scenario summary panel,
- schedule submission result panel.

The panel should avoid marketing copy and decorative sections. It should be optimized for repeated planner use and quick validation.

### 5.3 Batch Cards

Each batch card should show:

- import kind label,
- required/optional marker,
- upload button,
- uploaded file name,
- `importId`,
- `dataVersion`,
- status tag,
- success/failure counts,
- error report link when `errorsDownloadPath` exists.

Cards should keep stable dimensions so status updates do not shift the layout.

### 5.4 Scenario Setup Defaults

Defaults should make the workflow immediately usable:

- `scenarioName`: `formal-import-<dataVersion>`
- `scheduleStartAt`: current local date/time rounded to the minute
- `horizonMinutes`: `1440`
- objective weights:
  - tardiness: `10`
  - earliness: `1`
  - makespan: `1`
- solver config:
  - timeLimitSeconds: `30`
  - numSearchWorkers: `4`

Users can edit these values before generation.

## 6. Data Flow

### 6.1 Upload

When a user uploads a batch:

1. Build a `FormData` payload with `file` and active `dataVersion`.
2. POST to the matching `/api/v1/model-import/{kind}` endpoint.
3. Store the returned batch response in panel state.
4. If the backend returns a validation error payload that still contains `importBatch`, store that failed batch response and expose the error link.
5. Show the backend error message in the panel action alert.

### 6.2 Readiness

The panel is ready to generate when:

- resources batch status is successful,
- recipes batch status is successful,
- demands batch status is successful,
- all required batch `dataVersion` values equal the active `dataVersion`.

Optional batches should be included automatically when they were uploaded successfully with the active `dataVersion`.

Successful statuses should include the current backend success statuses used by `ImportBatchStatus`, and `SCENARIO_GENERATED` should be treated as a successful imported batch state for repeated submission or review.

### 6.3 Scenario Generation

When the user clicks generate:

1. Validate scenario setup fields locally.
2. POST to `/api/v1/schedule/scenarios/from-import-batches`.
3. Store `GeneratedScenarioFromImportBatchesResponse`.
4. Mark source batches returned by `sourceImportBatchIds` as scenario-generated in local panel state.
5. Show generated scenario metrics and a compact operation/coverage preview.

If the generated scenario has no schedulable tasks, the panel should show a non-error empty scheduling state and should not enable job submission.

### 6.4 Schedule Submission

When the user submits the generated scenario:

1. Read `generated.scenario.scheduleRequest`.
2. POST it to `/api/v1/schedule/jobs`.
3. Store the accepted `ScheduleJobResponse`.
4. Show job id, status, and scenario name.
5. Provide a button to switch the workspace key to `jobs`.

The jobs center remains responsible for polling, cancel, retry, and version review.

## 7. Frontend Architecture

### 7.1 API Client

Extend `frontend/src/lib/api.ts` with:

- `ImportBatchResponse`
- `GeneratedScenarioResponse`
- `GeneratedScenarioFromImportBatchesResponse`
- `GenerateScenarioFromImportBatchesRequest`
- `uploadImportBatch(kind, file, dataVersion, baseUrl?)`
- `generateScenarioFromImportBatches(request, baseUrl?)`
- `submitScheduleJob(request, baseUrl?)`
- `resolveImportBatchErrorsUrl(path, location?)`

`uploadImportBatch` should use `FormData`. `requestJson` must not force JSON `Content-Type` for `FormData`; the browser must set the multipart boundary.

### 7.2 Hook

Create `frontend/src/features/workspace/useImportScenarioWorkflow.ts`.

The hook owns:

- active `dataVersion`,
- scenario setup fields,
- batch records by kind,
- upload pending key,
- generation pending state,
- submission pending state,
- generated scenario,
- submitted job,
- panel-level and action-level errors,
- derived readiness and status counts,
- handlers for reset, field updates, upload, generate, and submit.

### 7.3 Panel

Create `frontend/src/features/workspace/ImportScenarioPanel.tsx`.

The component should be mostly presentational:

- render header/actions,
- render batch cards,
- render scenario setup form,
- render generated scenario summary,
- render submitted job result,
- call hook handlers.

`App.tsx` should pass an `onOpenJobs` callback that selects the `jobs` workspace key after job submission.

## 8. Error Handling

The UI should distinguish:

- template download: link-only action, browser handles download failure,
- upload failure: batch-level error if an import batch response exists, otherwise panel action alert,
- validation failure: show failed status and error report link when available,
- dataVersion mismatch: readiness warning, not a backend error,
- scenario generation failure: panel action alert with backend message,
- generated scenario without tasks: informational state, submit disabled,
- job submission failure: panel action alert with backend message,
- unauthorized session: reuse the existing app-level login/session behavior.

Backend messages from `ApiError.message` should be shown directly.

## 9. Testing Plan

### 9.1 API Client Tests

Add tests for:

- `uploadImportBatch` posts `FormData` to the correct endpoint with credentials.
- `uploadImportBatch` preserves backend validation payload in `ApiError.payload`.
- `generateScenarioFromImportBatches` posts JSON to the scenario endpoint.
- `submitScheduleJob` posts JSON to the schedule jobs endpoint.
- `resolveImportBatchErrorsUrl` converts backend-relative error paths to frontend-resolved backend URLs.

### 9.2 Hook Tests

Add tests for:

- default dataVersion and scenario setup creation,
- successful required batch uploads make generation ready,
- failed batch upload stores failed batch metadata and action error,
- dataVersion mismatch prevents generation,
- generation stores scenario metrics,
- submit posts generated schedule request and stores accepted job.

### 9.3 App/Panel Tests

Add tests for:

- clicking `数据导入` renders the native import/scenario workflow,
- uploading required batch files enables scenario generation,
- generated scenario summary shows operation and precedence counts,
- submitting the generated scenario calls the schedule job API,
- clicking the job tracking button opens the existing schedule jobs center,
- clicking `场景生成` also opens the same workflow panel.

Existing dashboard, login, and schedule jobs center tests must continue to pass.

## 10. Acceptance Criteria

This slice is complete when:

1. `数据导入` opens a native React formal batch workflow.
2. `场景生成` opens the same native React workflow in scenario-focused mode.
3. Users can download the backend import template from React.
4. Users can upload resources, recipes, demands, inventory balances, downtimes, and setup rules.
5. Required successful batches with one `dataVersion` enable scenario generation.
6. React displays validation failures and error report links when the backend returns them.
7. React can generate a scenario from import batches and show scenario metrics.
8. React can submit the generated schedule request as a schedule job.
9. React hands job tracking off to the existing schedule jobs center.
10. Frontend tests and build pass; backend tests remain green.
11. The legacy static UI remains reachable.

## 11. Migration Follow-Up

After this slice, the next React workflow migrations should be evaluated in this order:

1. version list and release queue,
2. Gantt review,
3. approval and release governance,
4. optional manual scenario editor, if still needed after formal batch flows mature.

Snow Beer Phase 4 sample and rule modeling should start after this slice is stable enough to use as the sample entry workflow.
