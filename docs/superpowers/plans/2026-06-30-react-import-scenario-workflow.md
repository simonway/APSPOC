# React Import Scenario Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native React formal batch import, scenario generation, and schedule submission workflow backed by the existing backend APIs.

**Architecture:** Extend the existing React API client with formal import/scenario functions, then add a focused workflow hook and panel. The left rail entries `数据导入` and `场景生成` both render the new panel, and successful schedule submission hands users to the existing React schedule jobs center.

**Tech Stack:** React 18, TypeScript, Ant Design, Vitest, Testing Library, existing Spring Boot model import/scenario/schedule APIs.

---

## File Structure

Modify:

- `frontend/src/lib/api.ts`  
  Add import batch/scenario response types, multipart upload support, scenario generation, schedule job submission, and error-report URL resolution.
- `frontend/src/lib/api.test.ts`  
  Add tests for multipart upload, validation-error payload preservation, scenario generation, schedule job submission, and error-report URL resolution.
- `frontend/src/App.tsx`  
  Route `import` and `scenario` left-rail keys to `ImportScenarioPanel`; pass an `onOpenJobs` callback.
- `frontend/src/App.test.tsx`  
  Add integration tests for opening the workflow, generating a scenario, submitting a schedule job, and switching to the jobs center.
- `frontend/src/styles.css`  
  Add compact operational styles for the import/scenario workflow.

Create:

- `frontend/src/features/workspace/useImportScenarioWorkflow.ts`  
  Owns active `dataVersion`, setup form state, batch upload state, scenario generation, job submission, derived readiness, and reset logic.
- `frontend/src/features/workspace/useImportScenarioWorkflow.test.ts`  
  Hook tests for defaults, upload readiness, validation failures, mismatch prevention, generation, and submit behavior.
- `frontend/src/features/workspace/ImportScenarioPanel.tsx`  
  Renders the native React workflow panel.

Do not modify backend APIs in this plan.

---

### Task 1: Frontend API Client for Import and Scenario Flow

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/api.test.ts`

- [ ] **Step 1: Add failing API client tests**

Append these tests to `frontend/src/lib/api.test.ts` inside the existing `describe("api helpers", ...)` block. If the file uses a different top-level `describe`, place them after the current URL helper tests.

```ts
  it("uploads a formal import batch as multipart form data", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        importBatch: {
          importId: "imp-1",
          dataVersion: "dv-20260630",
          importType: "RESOURCES",
          sourceFileName: "resources.csv",
          importedBy: "admin",
          createdAt: "2026-06-30T00:00:00Z",
          status: "SUCCEEDED",
          successCount: 3,
          failureCount: 0,
          payload: {},
          errors: [],
          errorsDownloadPath: null,
        },
      })),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { protocol: "http:", hostname: "127.0.0.1", port: "8080", origin: "http://127.0.0.1:8080" } });
    const file = new File(["resourceId,resourceName"], "resources.csv", { type: "text/csv" });

    const result = await uploadImportBatch("resources", file, "dv-20260630");

    expect(result.importBatch.importId).toBe("imp-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8081/api/v1/model-import/resources",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: expect.any(FormData),
      }),
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).has("Content-Type")).toBe(false);
  });

  it("preserves backend validation payload when import upload fails", async () => {
    const payload = {
      message: "Validation failed",
      importBatch: {
        importId: "imp-bad",
        dataVersion: "dv-20260630",
        importType: "DEMANDS",
        sourceFileName: "demands.csv",
        importedBy: "admin",
        createdAt: "2026-06-30T00:00:00Z",
        status: "VALIDATION_FAILED",
        successCount: 0,
        failureCount: 2,
        payload: {},
        errors: [{ rowNumber: 2, fieldName: "quantity", message: "must be positive" }],
        errorsDownloadPath: "/api/v1/model-import/batches/imp-bad/errors",
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify(payload)),
    }));
    vi.stubGlobal("window", { location: { protocol: "http:", hostname: "127.0.0.1", port: "8080", origin: "http://127.0.0.1:8080" } });

    await expect(uploadImportBatch("demands", new File(["bad"], "demands.csv"), "dv-20260630"))
      .rejects.toMatchObject({
        status: 400,
        message: "Validation failed",
        payload,
      });
  });

  it("generates a scenario from formal import batches", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        dataVersion: "dv-20260630",
        sourceImportBatchIds: { resources: "imp-res" },
        scenario: {
          scenarioId: "scn-1",
          scenarioName: "formal-import-dv-20260630",
          dataVersion: "dv-20260630",
          createdAt: "2026-06-30T00:00:00Z",
          scheduleStartAt: "2026-06-30T08:00:00Z",
          horizonMinutes: 1440,
          resourceCount: 2,
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
          scheduleRequest: { scenarioName: "formal-import-dv-20260630", resources: [], tasks: [] },
          sourceImportBatchIds: { resources: "imp-res" },
        },
      })),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { protocol: "http:", hostname: "127.0.0.1", port: "8080", origin: "http://127.0.0.1:8080" } });

    const result = await generateScenarioFromImportBatches({
      scenarioName: "formal-import-dv-20260630",
      dataVersion: "dv-20260630",
      scheduleStartAt: "2026-06-30T08:00:00.000Z",
      horizonMinutes: 1440,
      objectiveWeights: { tardiness: 10, earliness: 1, makespan: 1 },
      solverConfig: { timeLimitSeconds: 30, numSearchWorkers: 4 },
    });

    expect(result.scenario.operationCount).toBe(4);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8081/api/v1/schedule/scenarios/from-import-batches",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: expect.stringContaining("\"dataVersion\":\"dv-20260630\""),
      }),
    );
  });

  it("submits a generated schedule request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: () => Promise.resolve(JSON.stringify({
        jobId: "job-1",
        scenarioName: "formal-import-dv-20260630",
        actorUsername: "admin",
        status: "QUEUED",
        solverStatus: "QUEUED",
        versionId: null,
        failureReason: null,
        errorMessage: null,
        createdAt: "2026-06-30T00:00:00Z",
        completedAt: null,
      })),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { protocol: "http:", hostname: "127.0.0.1", port: "8080", origin: "http://127.0.0.1:8080" } });

    const result = await submitScheduleJob({ scenarioName: "formal-import-dv-20260630", resources: [], tasks: [] });

    expect(result.jobId).toBe("job-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8081/api/v1/schedule/jobs",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ scenarioName: "formal-import-dv-20260630", resources: [], tasks: [] }),
      }),
    );
  });

  it("resolves import batch error report URLs through the backend base URL", () => {
    expect(resolveImportBatchErrorsUrl("/api/v1/model-import/batches/imp-1/errors", {
      protocol: "http:",
      hostname: "127.0.0.1",
      port: "8080",
      origin: "http://127.0.0.1:8080",
    })).toBe("http://127.0.0.1:8081/api/v1/model-import/batches/imp-1/errors");
  });
```

Add these imports at the top of `frontend/src/lib/api.test.ts`:

```ts
import {
  generateScenarioFromImportBatches,
  resolveImportBatchErrorsUrl,
  submitScheduleJob,
  uploadImportBatch,
} from "./api";
```

If the file already imports from `./api`, merge these names into the existing import list.

- [ ] **Step 2: Run API client tests and verify RED**

Run:

```bash
rtk npm test --prefix frontend -- --run src/lib/api.test.ts
```

Expected: compile failure because `uploadImportBatch`, `generateScenarioFromImportBatches`, `submitScheduleJob`, and `resolveImportBatchErrorsUrl` do not exist.

- [ ] **Step 3: Add API types and multipart-safe request handling**

Update `frontend/src/lib/api.ts`.

Add these types after `ScheduleJobResponse`:

```ts
export type ImportBatchKind =
  | "resources"
  | "recipes"
  | "demands"
  | "inventory-balances"
  | "downtimes"
  | "setup-rules";

export interface ImportBatchResponse {
  importId: string;
  dataVersion: string;
  importType: string;
  sourceFileName: string | null;
  importedBy: string | null;
  createdAt: string;
  status: string;
  successCount: number;
  failureCount: number;
  payload: unknown;
  errors: unknown;
  errorsDownloadPath: string | null;
}

export interface ImportBatchUploadResponse {
  importBatch: ImportBatchResponse;
  [key: string]: unknown;
}

export interface GenerateScenarioFromImportBatchesRequest {
  scenarioName: string;
  dataVersion: string;
  scheduleStartAt: string;
  horizonMinutes: number;
  objectiveWeights: {
    tardiness: number;
    earliness: number;
    makespan: number;
  };
  solverConfig: {
    timeLimitSeconds: number;
    numSearchWorkers: number;
  };
}

export interface GeneratedScenarioResponse {
  scenarioId: string;
  scenarioName: string;
  dataVersion: string;
  createdAt: string;
  scheduleStartAt: string;
  horizonMinutes: number;
  resourceCount: number;
  demandCount: number;
  requestedDemandQuantity: number;
  plannedDemandQuantity: number;
  inventoryBalanceCount: number;
  inventoryCoveredQuantity: number;
  operationCount: number;
  downtimeCount: number;
  setupRuleCount: number;
  precedencePairCount: number;
  bridgeAdjustmentCount: number;
  demandCoverages: Array<Record<string, unknown>>;
  operations: Array<Record<string, unknown>>;
  precedencePairs: Array<Record<string, unknown>>;
  setupRules: Array<Record<string, unknown>>;
  bridgeAdjustments: Array<Record<string, unknown>>;
  scheduleRequest: Record<string, unknown> | null;
  sourceImportBatchIds: Record<string, string>;
}

export interface GeneratedScenarioFromImportBatchesResponse {
  dataVersion: string;
  sourceImportBatchIds: Record<string, string>;
  scenario: GeneratedScenarioResponse;
}
```

Replace `buildHeaders` with this multipart-safe version:

```ts
function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function buildHeaders(initHeaders: HeadersInit | undefined, hasJsonBody: boolean): HeadersInit {
  if (!initHeaders) {
    if (hasJsonBody) {
      return { Accept: "application/json", "Content-Type": "application/json" };
    }
    return { Accept: "application/json" };
  }

  const headers = new Headers(initHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}
```

Update `requestJson` to compute `hasJsonBody`:

```ts
  const hasJsonBody = init.body !== undefined && !isFormDataBody(init.body as BodyInit);
  const response = await fetch(buildUrl(path, baseUrl), {
    ...init,
    credentials: "include",
    headers: buildHeaders(headers, hasJsonBody),
  });
```

Add these functions near the schedule job API functions:

```ts
export function uploadImportBatch(kind: ImportBatchKind, file: File, dataVersion: string, baseUrl?: string) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("dataVersion", dataVersion);
  return requestJson<ImportBatchUploadResponse>(`/api/v1/model-import/${kind}`, {
    method: "POST",
    body: formData,
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function generateScenarioFromImportBatches(request: GenerateScenarioFromImportBatchesRequest, baseUrl?: string) {
  return requestJson<GeneratedScenarioFromImportBatchesResponse>("/api/v1/schedule/scenarios/from-import-batches", {
    method: "POST",
    body: JSON.stringify(request),
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function submitScheduleJob(request: Record<string, unknown>, baseUrl?: string) {
  return requestJson<ScheduleJobResponse>("/api/v1/schedule/jobs", {
    method: "POST",
    body: JSON.stringify(request),
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function resolveImportBatchErrorsUrl(path: string, location: LocationLike = window.location) {
  return resolveApiUrl(path, location);
}
```

- [ ] **Step 4: Run API client tests and verify GREEN**

Run:

```bash
rtk npm test --prefix frontend -- --run src/lib/api.test.ts
```

Expected: all `api.test.ts` tests pass.

- [ ] **Step 5: Commit API client changes**

Run:

```bash
rtk git add frontend/src/lib/api.ts frontend/src/lib/api.test.ts
rtk git commit -m "feat: add import scenario api client"
```

---

### Task 2: Import Scenario Workflow Hook

**Files:**
- Create: `frontend/src/features/workspace/useImportScenarioWorkflow.ts`
- Create: `frontend/src/features/workspace/useImportScenarioWorkflow.test.ts`

- [ ] **Step 1: Write failing hook tests**

Create `frontend/src/features/workspace/useImportScenarioWorkflow.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateScenarioFromImportBatches,
  submitScheduleJob,
  uploadImportBatch,
} from "../../lib/api";
import { useImportScenarioWorkflow } from "./useImportScenarioWorkflow";

vi.mock("../../lib/api", () => ({
  generateScenarioFromImportBatches: vi.fn(),
  submitScheduleJob: vi.fn(),
  uploadImportBatch: vi.fn(),
}));

const mockedUploadImportBatch = vi.mocked(uploadImportBatch);
const mockedGenerateScenarioFromImportBatches = vi.mocked(generateScenarioFromImportBatches);
const mockedSubmitScheduleJob = vi.mocked(submitScheduleJob);

const batch = {
  importId: "imp-res",
  dataVersion: "dv-20260630",
  importType: "RESOURCES",
  sourceFileName: "resources.csv",
  importedBy: "admin",
  createdAt: "2026-06-30T00:00:00Z",
  status: "SUCCEEDED",
  successCount: 3,
  failureCount: 0,
  payload: {},
  errors: [],
  errorsDownloadPath: null,
};

const generated = {
  dataVersion: "dv-20260630",
  sourceImportBatchIds: {
    resources: "imp-res",
    recipes: "imp-rec",
    demands: "imp-dem",
  },
  scenario: {
    scenarioId: "scn-1",
    scenarioName: "formal-import-dv-20260630",
    dataVersion: "dv-20260630",
    createdAt: "2026-06-30T00:00:00Z",
    scheduleStartAt: "2026-06-30T08:00:00Z",
    horizonMinutes: 1440,
    resourceCount: 2,
    demandCount: 1,
    requestedDemandQuantity: 10,
    plannedDemandQuantity: 8,
    inventoryBalanceCount: 1,
    inventoryCoveredQuantity: 2,
    operationCount: 4,
    downtimeCount: 1,
    setupRuleCount: 2,
    precedencePairCount: 3,
    bridgeAdjustmentCount: 0,
    demandCoverages: [],
    operations: [{ operationId: "op-1", operationName: "包装" }],
    precedencePairs: [],
    setupRules: [],
    bridgeAdjustments: [],
    scheduleRequest: { scenarioName: "formal-import-dv-20260630", resources: [], tasks: [{ id: "task-1" }] },
    sourceImportBatchIds: {},
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(new Date("2026-06-30T08:30:00+08:00"));
  mockedUploadImportBatch.mockImplementation(async (kind, file, dataVersion) => ({
    importBatch: {
      ...batch,
      importId: `imp-${kind}`,
      importType: kind.toUpperCase(),
      sourceFileName: file.name,
      dataVersion,
    },
  }));
  mockedGenerateScenarioFromImportBatches.mockResolvedValue(generated);
  mockedSubmitScheduleJob.mockResolvedValue({
    jobId: "job-1",
    scenarioName: "formal-import-dv-20260630",
    actorUsername: "admin",
    status: "QUEUED",
    solverStatus: "QUEUED",
    versionId: null,
    failureReason: null,
    errorMessage: null,
    createdAt: "2026-06-30T00:00:00Z",
    completedAt: null,
  });
});

describe("useImportScenarioWorkflow", () => {
  it("creates usable defaults from the current time", () => {
    const { result } = renderHook(() => useImportScenarioWorkflow());

    expect(result.current.dataVersion).toBe("dv-20260630-0030");
    expect(result.current.setup.scenarioName).toBe("formal-import-dv-20260630-0030");
    expect(result.current.setup.horizonMinutes).toBe(1440);
    expect(result.current.setup.objectiveWeights).toEqual({ tardiness: 10, earliness: 1, makespan: 1 });
    expect(result.current.setup.solverConfig).toEqual({ timeLimitSeconds: 30, numSearchWorkers: 4 });
    expect(result.current.canGenerate).toBe(false);
  });

  it("makes generation ready after required successful uploads", async () => {
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
    });

    expect(result.current.canGenerate).toBe(true);
    expect(result.current.requiredReadyCount).toBe(3);
    expect(mockedUploadImportBatch).toHaveBeenCalledWith("resources", expect.any(File), "dv-20260630-0030");
  });

  it("stores failed batch metadata from validation errors", async () => {
    mockedUploadImportBatch.mockRejectedValueOnce(Object.assign(new Error("Validation failed"), {
      payload: {
        importBatch: {
          ...batch,
          importId: "imp-bad",
          status: "VALIDATION_FAILED",
          failureCount: 2,
          errorsDownloadPath: "/api/v1/model-import/batches/imp-bad/errors",
        },
      },
    }));
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("demands", new File(["bad"], "demands.csv"));
    });

    expect(result.current.batches.demands?.importId).toBe("imp-bad");
    expect(result.current.batches.demands?.status).toBe("VALIDATION_FAILED");
    expect(result.current.actionError).toBe("Validation failed");
    expect(result.current.canGenerate).toBe(false);
  });

  it("prevents generation when a required batch has a different data version", async () => {
    mockedUploadImportBatch.mockImplementation(async (kind, file, dataVersion) => ({
      importBatch: {
        ...batch,
        importId: `imp-${kind}`,
        importType: kind.toUpperCase(),
        sourceFileName: file.name,
        dataVersion: kind === "demands" ? "dv-other" : dataVersion,
      },
    }));
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
    });

    expect(result.current.canGenerate).toBe(false);
    expect(result.current.readinessMessage).toContain("dataVersion");
  });

  it("generates a scenario and submits its schedule request", async () => {
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
      await result.current.generateScenario();
      await result.current.submitGeneratedSchedule();
    });

    expect(mockedGenerateScenarioFromImportBatches).toHaveBeenCalledWith(expect.objectContaining({
      scenarioName: "formal-import-dv-20260630-0030",
      dataVersion: "dv-20260630-0030",
      horizonMinutes: 1440,
    }));
    expect(mockedSubmitScheduleJob).toHaveBeenCalledWith({ scenarioName: "formal-import-dv-20260630", resources: [], tasks: [{ id: "task-1" }] });
    expect(result.current.generatedScenario?.scenario.operationCount).toBe(4);
    expect(result.current.submittedJob?.jobId).toBe("job-1");
  });
});
```

- [ ] **Step 2: Run hook tests and verify RED**

Run:

```bash
rtk npm test --prefix frontend -- --run src/features/workspace/useImportScenarioWorkflow.test.ts
```

Expected: compile failure because `useImportScenarioWorkflow.ts` does not exist.

- [ ] **Step 3: Implement the workflow hook**

Create `frontend/src/features/workspace/useImportScenarioWorkflow.ts`:

```ts
import { useMemo, useState } from "react";
import {
  generateScenarioFromImportBatches,
  submitScheduleJob,
  uploadImportBatch,
  type GeneratedScenarioFromImportBatchesResponse,
  type GenerateScenarioFromImportBatchesRequest,
  type ImportBatchKind,
  type ImportBatchResponse,
  type ScheduleJobResponse,
} from "../../lib/api";

export const importBatchKinds = [
  "resources",
  "recipes",
  "demands",
  "inventory-balances",
  "downtimes",
  "setup-rules",
] as const satisfies ImportBatchKind[];

export const requiredImportBatchKinds = ["resources", "recipes", "demands"] as const satisfies ImportBatchKind[];

const successfulStatuses = new Set(["SUCCEEDED", "SCENARIO_GENERATED"]);

export interface ScenarioSetupState {
  scenarioName: string;
  scheduleStartAt: string;
  horizonMinutes: number;
  objectiveWeights: {
    tardiness: number;
    earliness: number;
    makespan: number;
  };
  solverConfig: {
    timeLimitSeconds: number;
    numSearchWorkers: number;
  };
}

export type ImportBatchRecords = Partial<Record<ImportBatchKind, ImportBatchResponse>>;

export interface ImportScenarioWorkflowState {
  dataVersion: string;
  setup: ScenarioSetupState;
  batches: ImportBatchRecords;
  uploadPendingKind: ImportBatchKind | null;
  generating: boolean;
  submitting: boolean;
  actionError: string | null;
  generatedScenario: GeneratedScenarioFromImportBatchesResponse | null;
  submittedJob: ScheduleJobResponse | null;
  canGenerate: boolean;
  canSubmit: boolean;
  requiredReadyCount: number;
  readinessMessage: string;
  resetWorkflow: () => void;
  updateDataVersion: (dataVersion: string) => void;
  updateSetup: (nextSetup: Partial<ScenarioSetupState>) => void;
  uploadBatch: (kind: ImportBatchKind, file: File) => Promise<void>;
  generateScenario: () => Promise<void>;
  submitGeneratedSchedule: () => Promise<void>;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function buildDefaultDataVersion(now = new Date()) {
  return `dv-${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
}

function buildLocalDateTimeValue(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function buildDefaultSetup(dataVersion: string): ScenarioSetupState {
  return {
    scenarioName: `formal-import-${dataVersion}`,
    scheduleStartAt: buildLocalDateTimeValue(),
    horizonMinutes: 1440,
    objectiveWeights: { tardiness: 10, earliness: 1, makespan: 1 },
    solverConfig: { timeLimitSeconds: 30, numSearchWorkers: 4 },
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function importBatchFromError(error: unknown): ImportBatchResponse | null {
  if (!error || typeof error !== "object" || !("payload" in error)) {
    return null;
  }
  const payload = (error as { payload?: unknown }).payload;
  if (!payload || typeof payload !== "object" || !("importBatch" in payload)) {
    return null;
  }
  return (payload as { importBatch?: ImportBatchResponse }).importBatch ?? null;
}

function isSuccessfulBatch(batch: ImportBatchResponse | undefined, dataVersion: string) {
  return Boolean(batch && successfulStatuses.has(batch.status) && batch.dataVersion === dataVersion);
}

function toIsoDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("请输入有效的排程开始时间。");
  }
  return parsed.toISOString();
}

export function useImportScenarioWorkflow(): ImportScenarioWorkflowState {
  const initialDataVersion = useMemo(() => buildDefaultDataVersion(), []);
  const [dataVersion, setDataVersion] = useState(initialDataVersion);
  const [setup, setSetup] = useState<ScenarioSetupState>(() => buildDefaultSetup(initialDataVersion));
  const [batches, setBatches] = useState<ImportBatchRecords>({});
  const [uploadPendingKind, setUploadPendingKind] = useState<ImportBatchKind | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [generatedScenario, setGeneratedScenario] = useState<GeneratedScenarioFromImportBatchesResponse | null>(null);
  const [submittedJob, setSubmittedJob] = useState<ScheduleJobResponse | null>(null);

  const requiredReadyCount = requiredImportBatchKinds.filter((kind) => isSuccessfulBatch(batches[kind], dataVersion)).length;
  const requiredMismatch = requiredImportBatchKinds.some((kind) => batches[kind] && batches[kind]?.dataVersion !== dataVersion);
  const canGenerate = requiredReadyCount === requiredImportBatchKinds.length && !requiredMismatch && !generating;
  const canSubmit = Boolean(generatedScenario?.scenario.scheduleRequest && Array.isArray(generatedScenario.scenario.scheduleRequest.tasks) && generatedScenario.scenario.scheduleRequest.tasks.length > 0 && !submitting);
  const readinessMessage = canGenerate
    ? "必需批次已就绪，可以生成场景。"
    : requiredMismatch
      ? "必需批次的 dataVersion 必须与当前 dataVersion 一致。"
      : `还需要成功上传 ${requiredImportBatchKinds.length - requiredReadyCount} 个必需批次。`;

  function resetWorkflow() {
    const nextDataVersion = buildDefaultDataVersion();
    setDataVersion(nextDataVersion);
    setSetup(buildDefaultSetup(nextDataVersion));
    setBatches({});
    setGeneratedScenario(null);
    setSubmittedJob(null);
    setActionError(null);
  }

  function updateDataVersion(nextDataVersion: string) {
    setDataVersion(nextDataVersion);
    setSetup((current) => ({
      ...current,
      scenarioName: current.scenarioName.startsWith("formal-import-") ? `formal-import-${nextDataVersion}` : current.scenarioName,
    }));
    setGeneratedScenario(null);
    setSubmittedJob(null);
  }

  function updateSetup(nextSetup: Partial<ScenarioSetupState>) {
    setSetup((current) => ({ ...current, ...nextSetup }));
    setGeneratedScenario(null);
    setSubmittedJob(null);
  }

  async function uploadBatch(kind: ImportBatchKind, file: File) {
    setUploadPendingKind(kind);
    setActionError(null);
    try {
      const response = await uploadImportBatch(kind, file, dataVersion);
      setBatches((current) => ({ ...current, [kind]: response.importBatch }));
      setGeneratedScenario(null);
      setSubmittedJob(null);
    } catch (error) {
      const failedBatch = importBatchFromError(error);
      if (failedBatch) {
        setBatches((current) => ({ ...current, [kind]: failedBatch }));
      }
      setActionError(errorMessage(error, "导入批次失败"));
    } finally {
      setUploadPendingKind(null);
    }
  }

  async function generateScenario() {
    if (!canGenerate) {
      setActionError(readinessMessage);
      return;
    }
    setGenerating(true);
    setActionError(null);
    try {
      const request: GenerateScenarioFromImportBatchesRequest = {
        scenarioName: setup.scenarioName,
        dataVersion,
        scheduleStartAt: toIsoDateTime(setup.scheduleStartAt),
        horizonMinutes: Number(setup.horizonMinutes),
        objectiveWeights: {
          tardiness: Number(setup.objectiveWeights.tardiness),
          earliness: Number(setup.objectiveWeights.earliness),
          makespan: Number(setup.objectiveWeights.makespan),
        },
        solverConfig: {
          timeLimitSeconds: Number(setup.solverConfig.timeLimitSeconds),
          numSearchWorkers: Number(setup.solverConfig.numSearchWorkers),
        },
      };
      const response = await generateScenarioFromImportBatches(request);
      setGeneratedScenario(response);
      setSubmittedJob(null);
      setBatches((current) => {
        const next = { ...current };
        Object.values(response.sourceImportBatchIds).forEach((importId) => {
          importBatchKinds.forEach((kind) => {
            if (next[kind]?.importId === importId) {
              next[kind] = { ...next[kind]!, status: "SCENARIO_GENERATED" };
            }
          });
        });
        return next;
      });
    } catch (error) {
      setActionError(errorMessage(error, "生成场景失败"));
    } finally {
      setGenerating(false);
    }
  }

  async function submitGeneratedSchedule() {
    const scheduleRequest = generatedScenario?.scenario.scheduleRequest;
    if (!scheduleRequest) {
      setActionError("当前没有可提交的排程请求。");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const job = await submitScheduleJob(scheduleRequest);
      setSubmittedJob(job);
    } catch (error) {
      setActionError(errorMessage(error, "提交排程任务失败"));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    dataVersion,
    setup,
    batches,
    uploadPendingKind,
    generating,
    submitting,
    actionError,
    generatedScenario,
    submittedJob,
    canGenerate,
    canSubmit,
    requiredReadyCount,
    readinessMessage,
    resetWorkflow,
    updateDataVersion,
    updateSetup,
    uploadBatch,
    generateScenario,
    submitGeneratedSchedule,
  };
}
```

- [ ] **Step 4: Run hook tests and verify GREEN**

Run:

```bash
rtk npm test --prefix frontend -- --run src/features/workspace/useImportScenarioWorkflow.test.ts
```

Expected: all hook tests pass.

- [ ] **Step 5: Commit hook changes**

Run:

```bash
rtk git add frontend/src/features/workspace/useImportScenarioWorkflow.ts frontend/src/features/workspace/useImportScenarioWorkflow.test.ts
rtk git commit -m "feat: add import scenario workflow hook"
```

---

### Task 3: React Panel and Workspace Routing

**Files:**
- Create: `frontend/src/features/workspace/ImportScenarioPanel.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Add failing App integration tests**

Update the mock import list in `frontend/src/App.test.tsx` to include:

```ts
  generateScenarioFromImportBatches,
  submitScheduleJob,
  uploadImportBatch,
```

Update the `vi.mock("./lib/api", ...)` return object to include:

```ts
    generateScenarioFromImportBatches: vi.fn(),
    submitScheduleJob: vi.fn(),
    uploadImportBatch: vi.fn(),
```

Add mocked constants near the existing mocked API constants:

```ts
const mockedUploadImportBatch = vi.mocked(uploadImportBatch);
const mockedGenerateScenarioFromImportBatches = vi.mocked(generateScenarioFromImportBatches);
const mockedSubmitScheduleJob = vi.mocked(submitScheduleJob);
```

Add this setup inside `beforeEach`:

```ts
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
    dataVersion: "dv-20260630-0030",
    sourceImportBatchIds: { resources: "imp-resources", recipes: "imp-recipes", demands: "imp-demands" },
    scenario: {
      scenarioId: "scn-1",
      scenarioName: "formal-import-dv-20260630-0030",
      dataVersion: "dv-20260630-0030",
      createdAt: "2026-06-30T00:00:00Z",
      scheduleStartAt: "2026-06-30T08:00:00Z",
      horizonMinutes: 1440,
      resourceCount: 2,
      demandCount: 1,
      requestedDemandQuantity: 10,
      plannedDemandQuantity: 8,
      inventoryBalanceCount: 1,
      inventoryCoveredQuantity: 2,
      operationCount: 4,
      downtimeCount: 1,
      setupRuleCount: 2,
      precedencePairCount: 3,
      bridgeAdjustmentCount: 0,
      demandCoverages: [],
      operations: [{ operationId: "op-1", operationName: "包装" }],
      precedencePairs: [],
      setupRules: [],
      bridgeAdjustments: [],
      scheduleRequest: { scenarioName: "formal-import-dv-20260630-0030", resources: [], tasks: [{ id: "task-1" }] },
      sourceImportBatchIds: {},
    },
  });
  mockedSubmitScheduleJob.mockResolvedValue({
    jobId: "job-import",
    scenarioName: "formal-import-dv-20260630-0030",
    actorUsername: "admin",
    status: "QUEUED",
    solverStatus: "QUEUED",
    versionId: null,
    failureReason: null,
    errorMessage: null,
    createdAt: "2026-06-30T00:00:00Z",
    completedAt: null,
  });
```

Append these tests to `describe("App", ...)`:

```ts
  it("opens the native import scenario workflow from data import", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "数据导入" }));

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
    await userEvent.click(screen.getByRole("button", { name: "数据导入" }));

    await userEvent.upload(await screen.findByLabelText("上传 Resources"), new File(["res"], "resources.csv", { type: "text/csv" }));
    await userEvent.upload(screen.getByLabelText("上传 Recipes"), new File(["rec"], "recipes.csv", { type: "text/csv" }));
    await userEvent.upload(screen.getByLabelText("上传 Demands"), new File(["dem"], "demands.csv", { type: "text/csv" }));

    expect(await screen.findByText("imp-resources")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成场景" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "生成场景" }));

    expect(await screen.findByText("Operation 4")).toBeInTheDocument();
    expect(screen.getByText("Precedence 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "提交排程任务" }));

    expect(await screen.findByText("job-import")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "查看排程任务" }));

    expect(await screen.findByRole("heading", { name: "排程任务中心" })).toBeInTheDocument();
    expect(mockedFetchScheduleJobs).toHaveBeenCalledWith(20);
  });

  it("opens the same workflow from scenario generation", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "场景生成" }));

    expect(await screen.findByRole("heading", { name: "数据导入与场景生成" })).toBeInTheDocument();
    expect(screen.getByText("场景参数")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run App tests and verify RED**

Run:

```bash
rtk npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: compile failure because `ImportScenarioPanel` does not exist and the new mocked API functions do not exist until Task 1 is complete; if Task 1 is complete, expected runtime failure because `App` does not route import/scenario to the new panel.

- [ ] **Step 3: Implement the panel**

Create `frontend/src/features/workspace/ImportScenarioPanel.tsx`:

```tsx
import { CloudUploadOutlined, DownloadOutlined, PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Input, InputNumber, Space, Tag } from "antd";
import {
  resolveImportBatchErrorsUrl,
  resolveModelImportTemplateUrl,
  type ImportBatchKind,
  type ImportBatchResponse,
} from "../../lib/api";
import {
  importBatchKinds,
  requiredImportBatchKinds,
  useImportScenarioWorkflow,
  type ScenarioSetupState,
} from "./useImportScenarioWorkflow";

const labels: Record<ImportBatchKind, string> = {
  resources: "Resources",
  recipes: "Recipes",
  demands: "Demands",
  "inventory-balances": "Inventory Balances",
  downtimes: "Downtimes",
  "setup-rules": "Setup Rules",
};

function statusColor(status: string | undefined) {
  if (status === "SUCCEEDED" || status === "SCENARIO_GENERATED") {
    return "green";
  }
  if (status === "VALIDATION_FAILED" || status === "FAILED") {
    return "red";
  }
  return "default";
}

function BatchCard({
  batch,
  kind,
  pending,
  onUpload,
}: {
  batch: ImportBatchResponse | undefined;
  kind: ImportBatchKind;
  pending: boolean;
  onUpload: (kind: ImportBatchKind, file: File) => void;
}) {
  const required = requiredImportBatchKinds.includes(kind as (typeof requiredImportBatchKinds)[number]);

  return (
    <article className="import-batch-card" aria-label={`${labels[kind]} 批次`}>
      <div className="import-batch-card-head">
        <strong>{labels[kind]}</strong>
        <Tag color={required ? "blue" : "default"}>{required ? "必需" : "可选"}</Tag>
      </div>
      <label className="import-upload-button">
        <CloudUploadOutlined />
        <span>{pending ? "上传中..." : `上传 ${labels[kind]}`}</span>
        <input
          aria-label={`上传 ${labels[kind]}`}
          disabled={pending}
          type="file"
          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onUpload(kind, file);
            }
            event.currentTarget.value = "";
          }}
        />
      </label>
      <div className="import-batch-meta">
        <span>文件：{batch?.sourceFileName ?? "未上传"}</span>
        <span>批次：{batch?.importId ?? "-"}</span>
        <span>版本：{batch?.dataVersion ?? "-"}</span>
        <span>结果：<Tag color={statusColor(batch?.status)}>{batch?.status ?? "PENDING"}</Tag></span>
        <span>成功 / 失败：{batch ? `${batch.successCount} / ${batch.failureCount}` : "-"}</span>
        {batch?.errorsDownloadPath && (
          <a href={resolveImportBatchErrorsUrl(batch.errorsDownloadPath)} target="_blank" rel="noreferrer">
            下载错误报告
          </a>
        )}
      </div>
    </article>
  );
}

function NumberField({
  label,
  min,
  onChange,
  value,
}: {
  label: string;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="scenario-number-field">
      <span>{label}</span>
      <InputNumber min={min} value={value} onChange={(next) => onChange(Number(next ?? min))} />
    </label>
  );
}

function ScenarioSetup({
  canGenerate,
  generating,
  readinessMessage,
  setup,
  updateSetup,
  onGenerate,
}: {
  canGenerate: boolean;
  generating: boolean;
  readinessMessage: string;
  setup: ScenarioSetupState;
  updateSetup: (nextSetup: Partial<ScenarioSetupState>) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="dashboard-card scenario-setup-card" aria-label="场景参数">
      <div>
        <p className="eyebrow">场景参数</p>
        <h2>场景参数</h2>
        <span>{readinessMessage}</span>
      </div>
      <div className="scenario-form-grid">
        <label>
          <span>场景名称</span>
          <Input value={setup.scenarioName} onChange={(event) => updateSetup({ scenarioName: event.target.value })} />
        </label>
        <label>
          <span>开始时间</span>
          <Input type="datetime-local" value={setup.scheduleStartAt} onChange={(event) => updateSetup({ scheduleStartAt: event.target.value })} />
        </label>
        <NumberField label="Horizon 分钟" min={1} value={setup.horizonMinutes} onChange={(horizonMinutes) => updateSetup({ horizonMinutes })} />
        <NumberField label="Tardiness" min={1} value={setup.objectiveWeights.tardiness} onChange={(tardiness) => updateSetup({ objectiveWeights: { ...setup.objectiveWeights, tardiness } })} />
        <NumberField label="Earliness" min={0} value={setup.objectiveWeights.earliness} onChange={(earliness) => updateSetup({ objectiveWeights: { ...setup.objectiveWeights, earliness } })} />
        <NumberField label="Makespan" min={0} value={setup.objectiveWeights.makespan} onChange={(makespan) => updateSetup({ objectiveWeights: { ...setup.objectiveWeights, makespan } })} />
        <NumberField label="Time Limit 秒" min={1} value={setup.solverConfig.timeLimitSeconds} onChange={(timeLimitSeconds) => updateSetup({ solverConfig: { ...setup.solverConfig, timeLimitSeconds } })} />
        <NumberField label="Workers" min={1} value={setup.solverConfig.numSearchWorkers} onChange={(numSearchWorkers) => updateSetup({ solverConfig: { ...setup.solverConfig, numSearchWorkers } })} />
      </div>
      <Button type="primary" loading={generating} disabled={!canGenerate} onClick={onGenerate}>
        生成场景
      </Button>
    </section>
  );
}

export function ImportScenarioPanel({ onOpenJobs }: { onOpenJobs: () => void }) {
  const workflow = useImportScenarioWorkflow();
  const scenario = workflow.generatedScenario?.scenario;

  return (
    <section className="import-scenario-panel" aria-label="数据导入与场景生成">
      <div className="dashboard-card import-scenario-header">
        <div>
          <p className="eyebrow">正式批次流</p>
          <h1>数据导入与场景生成</h1>
          <span>上传正式批次，生成可排程场景，并提交到排程任务中心。</span>
        </div>
        <Space wrap>
          <Button icon={<DownloadOutlined />} href={resolveModelImportTemplateUrl()} target="_blank" rel="noreferrer">
            下载导入模板
          </Button>
          <Button icon={<ReloadOutlined />} onClick={workflow.resetWorkflow}>重置</Button>
        </Space>
      </div>

      <div className="dashboard-card import-version-card">
        <label>
          <span>dataVersion</span>
          <Input value={workflow.dataVersion} onChange={(event) => workflow.updateDataVersion(event.target.value)} />
        </label>
        <span>{workflow.requiredReadyCount} / {requiredImportBatchKinds.length} 必需批次就绪</span>
      </div>

      {workflow.actionError && <Alert message={workflow.actionError} showIcon type="warning" />}

      <div className="import-batch-grid">
        {importBatchKinds.map((kind) => (
          <BatchCard
            batch={workflow.batches[kind]}
            kind={kind}
            key={kind}
            pending={workflow.uploadPendingKind === kind}
            onUpload={(nextKind, file) => void workflow.uploadBatch(nextKind, file)}
          />
        ))}
      </div>

      <ScenarioSetup
        canGenerate={workflow.canGenerate}
        generating={workflow.generating}
        readinessMessage={workflow.readinessMessage}
        setup={workflow.setup}
        updateSetup={workflow.updateSetup}
        onGenerate={() => void workflow.generateScenario()}
      />

      {scenario && (
        <section className="dashboard-card scenario-summary-card" aria-label="场景生成结果">
          <div>
            <p className="eyebrow">生成结果</p>
            <h2>{scenario.scenarioName}</h2>
            <span>{scenario.scenarioId}</span>
          </div>
          <div className="scenario-metric-grid">
            <strong>Resource {scenario.resourceCount}</strong>
            <strong>Demand {scenario.demandCount}</strong>
            <strong>Operation {scenario.operationCount}</strong>
            <strong>Precedence {scenario.precedencePairCount}</strong>
            <strong>Setup {scenario.setupRuleCount}</strong>
            <strong>Bridge {scenario.bridgeAdjustmentCount}</strong>
          </div>
          <p>请求 {scenario.requestedDemandQuantity}，计划 {scenario.plannedDemandQuantity}，库存覆盖 {scenario.inventoryCoveredQuantity}。</p>
          <Button
            icon={<PlayCircleOutlined />}
            loading={workflow.submitting}
            disabled={!workflow.canSubmit}
            type="primary"
            onClick={() => void workflow.submitGeneratedSchedule()}
          >
            提交排程任务
          </Button>
        </section>
      )}

      {workflow.submittedJob && (
        <section className="dashboard-card submitted-job-card" aria-label="已提交排程任务">
          <div>
            <p className="eyebrow">排程任务</p>
            <h2>{workflow.submittedJob.jobId}</h2>
            <span>{workflow.submittedJob.scenarioName} / {workflow.submittedJob.status}</span>
          </div>
          <Button type="primary" onClick={onOpenJobs}>查看排程任务</Button>
        </section>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Route import and scenario keys in App**

Update `frontend/src/App.tsx`.

Add the import:

```ts
import { ImportScenarioPanel } from "./features/workspace/ImportScenarioPanel";
```

Add this helper inside `App` before `return`:

```ts
  const showImportScenarioPanel = activeWorkspaceKey === "import" || activeWorkspaceKey === "scenario";
```

Replace the authenticated content branch with:

```tsx
        {!dashboardData.loading && dashboardData.authenticated && dashboardData.summary && (
          activeWorkspaceKey === "jobs" ? (
            <ScheduleJobsPanel />
          ) : showImportScenarioPanel ? (
            <ImportScenarioPanel onOpenJobs={() => setActiveWorkspaceKey("jobs")} />
          ) : (
            <WorkspaceDashboard
              activeToolLabel={activeToolLabel}
              activeWorkspaceLabel={activeWorkspaceLabel}
              summary={dashboardData.summary}
              onRefresh={dashboardData.reload}
            />
          )
        )}
```

- [ ] **Step 5: Run App tests and verify GREEN**

Run:

```bash
rtk npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: all App tests pass.

- [ ] **Step 6: Commit panel and routing**

Run:

```bash
rtk git add frontend/src/features/workspace/ImportScenarioPanel.tsx frontend/src/App.tsx frontend/src/App.test.tsx
rtk git commit -m "feat: add React import scenario workflow panel"
```

---

### Task 4: Workflow Styling, Full Frontend Verification, and Graph Update

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Add focused workflow styles**

Append this CSS to `frontend/src/styles.css`:

```css
.import-scenario-panel {
  display: grid;
  gap: 16px;
}

.import-scenario-header,
.import-version-card,
.scenario-setup-card,
.scenario-summary-card,
.submitted-job-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.import-version-card label,
.scenario-form-grid label,
.scenario-number-field {
  display: grid;
  gap: 6px;
  min-width: 0;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.import-version-card label {
  flex: 1;
  max-width: 420px;
}

.import-batch-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.import-batch-card {
  display: grid;
  gap: 12px;
  min-height: 230px;
  padding: 16px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #fff;
}

.import-batch-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.import-upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
  border: 1px dashed #94a3b8;
  border-radius: 6px;
  color: #2563eb;
  cursor: pointer;
  font-weight: 600;
}

.import-upload-button input {
  display: none;
}

.import-batch-meta {
  display: grid;
  gap: 6px;
  color: #475569;
  font-size: 12px;
  line-height: 1.4;
}

.scenario-form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.scenario-setup-card {
  flex-direction: column;
}

.scenario-metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
}

.scenario-metric-grid strong {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 10px;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  background: #f8fafc;
  color: #0f172a;
}

@media (max-width: 1180px) {
  .import-batch-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scenario-form-grid,
  .scenario-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .import-scenario-header,
  .import-version-card,
  .scenario-summary-card,
  .submitted-job-card {
    flex-direction: column;
  }

  .import-batch-grid,
  .scenario-form-grid,
  .scenario-metric-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Run full frontend tests**

Run:

```bash
rtk npm test --prefix frontend -- --run
```

Expected: all frontend tests pass. If `App.test.tsx` times out once, rerun the same command once in isolation before changing code; prior baseline showed this suite can be timing-sensitive.

- [ ] **Step 3: Run frontend production build**

Run:

```bash
rtk npm run build --prefix frontend
```

Expected: TypeScript and Vite build pass. The existing Vite chunk-size warning is acceptable.

- [ ] **Step 4: Run backend regression tests**

Run:

```bash
rtk mvn -f backend/pom.xml test
```

Expected: backend tests pass. Backend code should be unchanged, but this verifies the full product baseline.

- [ ] **Step 5: Update graphify after code changes**

Run:

```bash
rtk graphify update .
```

Expected: graphify rebuilds `graphify-out` in the worktree.

- [ ] **Step 6: Run whitespace and status checks**

Run:

```bash
rtk git diff --check
rtk git status --short --branch
```

Expected: `git diff --check` exits 0. `git status` shows only intended tracked changes before commit.

- [ ] **Step 7: Commit styling and verification-support changes**

Run:

```bash
rtk git add frontend/src/styles.css graphify-out
rtk git commit -m "style: polish import scenario workflow"
```

If `graphify-out` is ignored or absent, commit only `frontend/src/styles.css`:

```bash
rtk git add frontend/src/styles.css
rtk git commit -m "style: polish import scenario workflow"
```

---

## Final Verification

After all tasks are complete, run:

```bash
rtk npm test --prefix frontend -- --run
rtk npm run build --prefix frontend
rtk mvn -f backend/pom.xml test
rtk git diff --check
rtk git status --short --branch
```

Expected:

- frontend tests pass,
- frontend build passes with only the existing chunk-size warning,
- backend tests pass,
- whitespace check passes,
- worktree is clean after commits.

Then use the finishing branch workflow to decide whether to merge `react-import-scenario-workflow` back to `master`, push for review, keep the branch, or discard it.
