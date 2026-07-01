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
    expect(result.current.setup.scheduleStartAt).not.toContain("Z");
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
      scheduleStartAt: "2026-06-30T00:30:00.000Z",
      horizonMinutes: 1440,
    }));
    expect(mockedSubmitScheduleJob).toHaveBeenCalledWith({ scenarioName: "formal-import-dv-20260630", resources: [], tasks: [{ id: "task-1" }] });
    expect(result.current.generatedScenario?.scenario.operationCount).toBe(4);
    expect(result.current.submittedJob?.jobId).toBe("job-1");
  });

  it("clears stale generated results when a later upload fails validation", async () => {
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
      await result.current.generateScenario();
      await result.current.submitGeneratedSchedule();
    });

    expect(result.current.generatedScenario).not.toBeNull();
    expect(result.current.submittedJob?.jobId).toBe("job-1");

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

    await act(async () => {
      await result.current.uploadBatch("demands", new File(["bad"], "demands.csv"));
    });

    expect(result.current.generatedScenario).toBeNull();
    expect(result.current.submittedJob).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  it("drops stale scenario generation results after setup changes", async () => {
    let resolveGeneration: (value: typeof generated) => void = () => undefined;
    mockedGenerateScenarioFromImportBatches.mockReturnValueOnce(new Promise((resolve) => {
      resolveGeneration = resolve;
    }));
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
    });

    let generationPromise: Promise<void>;
    await act(async () => {
      generationPromise = result.current.generateScenario();
      await Promise.resolve();
    });

    expect(result.current.generating).toBe(true);

    act(() => {
      result.current.updateDataVersion("dv-new");
    });

    await act(async () => {
      resolveGeneration(generated);
      await generationPromise;
    });

    expect(result.current.generatedScenario).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  it("drops stale upload results after reset changes the workflow revision", async () => {
    let resolveUpload: (value: Awaited<ReturnType<typeof uploadImportBatch>>) => void = () => undefined;
    mockedUploadImportBatch.mockReturnValueOnce(new Promise((resolve) => {
      resolveUpload = resolve;
    }));
    const { result } = renderHook(() => useImportScenarioWorkflow());

    let uploadPromise: Promise<void>;
    await act(async () => {
      uploadPromise = result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await Promise.resolve();
    });

    act(() => {
      result.current.resetWorkflow();
    });

    await act(async () => {
      resolveUpload({
        importBatch: {
          ...batch,
          importId: "imp-stale",
          dataVersion: "dv-20260630-0030",
        },
      });
      await uploadPromise;
    });

    expect(result.current.batches.resources).toBeUndefined();
    expect(result.current.uploadPendingKind).toBeNull();
    expect(result.current.actionError).toBeNull();
  });

  it("drops stale submitted jobs after setup changes", async () => {
    let resolveSubmit: (value: Awaited<ReturnType<typeof submitScheduleJob>>) => void = () => undefined;
    mockedSubmitScheduleJob.mockReturnValueOnce(new Promise((resolve) => {
      resolveSubmit = resolve;
    }));
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
      await result.current.generateScenario();
    });

    let submitPromise: Promise<void>;
    await act(async () => {
      submitPromise = result.current.submitGeneratedSchedule();
      await Promise.resolve();
    });

    act(() => {
      result.current.updateDataVersion("dv-new");
    });

    await act(async () => {
      resolveSubmit({
        jobId: "job-stale",
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
      await submitPromise;
    });

    expect(result.current.submittedJob).toBeNull();
    expect(result.current.actionError).toBeNull();
  });

  it("does not generate while a replacement upload is pending", async () => {
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
    });

    let resolveUpload: (value: Awaited<ReturnType<typeof uploadImportBatch>>) => void = () => undefined;
    mockedUploadImportBatch.mockReturnValueOnce(new Promise((resolve) => {
      resolveUpload = resolve;
    }));

    let uploadPromise: Promise<void>;
    await act(async () => {
      uploadPromise = result.current.uploadBatch("demands", new File(["replacement"], "demands.csv"));
      await Promise.resolve();
    });

    expect(result.current.uploadPendingKind).toBe("demands");
    expect(result.current.canGenerate).toBe(false);

    await act(async () => {
      await result.current.generateScenario();
    });

    expect(mockedGenerateScenarioFromImportBatches).not.toHaveBeenCalled();
    expect(result.current.actionError).toContain("上传完成");

    await act(async () => {
      resolveUpload({ importBatch: { ...batch, importId: "imp-demands-new", dataVersion: result.current.dataVersion } });
      await uploadPromise;
    });
  });

  it("blocks stale generate callbacks while a replacement upload is pending", async () => {
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
    });

    const staleGenerate = result.current.generateScenario;
    let resolveUpload: (value: Awaited<ReturnType<typeof uploadImportBatch>>) => void = () => undefined;
    mockedUploadImportBatch.mockReturnValueOnce(new Promise((resolve) => {
      resolveUpload = resolve;
    }));

    let uploadPromise: Promise<void>;
    await act(async () => {
      uploadPromise = result.current.uploadBatch("demands", new File(["replacement"], "demands.csv"));
      await staleGenerate();
    });

    expect(mockedGenerateScenarioFromImportBatches).not.toHaveBeenCalled();

    await act(async () => {
      resolveUpload({ importBatch: { ...batch, importId: "imp-demands-new", dataVersion: result.current.dataVersion } });
      await uploadPromise;
    });
  });

  it("drops stale scenario generation results after a batch replacement succeeds", async () => {
    let resolveGeneration: (value: typeof generated) => void = () => undefined;
    mockedGenerateScenarioFromImportBatches.mockReturnValueOnce(new Promise((resolve) => {
      resolveGeneration = resolve;
    }));
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
    });

    let generationPromise: Promise<void>;
    await act(async () => {
      generationPromise = result.current.generateScenario();
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.uploadBatch("demands", new File(["replacement"], "demands.csv"));
    });

    await act(async () => {
      resolveGeneration(generated);
      await generationPromise;
    });

    expect(result.current.batches.demands?.importId).toBe("imp-demands");
    expect(result.current.generatedScenario).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  it("clears a generated scenario when a batch replacement succeeds", async () => {
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
      await result.current.generateScenario();
    });

    expect(result.current.generatedScenario).not.toBeNull();

    await act(async () => {
      await result.current.uploadBatch("demands", new File(["replacement"], "demands.csv"));
    });

    expect(result.current.generatedScenario).toBeNull();
    expect(result.current.canSubmit).toBe(false);
  });

  it("drops stale generation errors after setup changes", async () => {
    let rejectGeneration: (reason: Error) => void = () => undefined;
    mockedGenerateScenarioFromImportBatches.mockReturnValueOnce(new Promise((_, reject) => {
      rejectGeneration = reject;
    }));
    const { result } = renderHook(() => useImportScenarioWorkflow());

    await act(async () => {
      await result.current.uploadBatch("resources", new File(["res"], "resources.csv"));
      await result.current.uploadBatch("recipes", new File(["rec"], "recipes.csv"));
      await result.current.uploadBatch("demands", new File(["dem"], "demands.csv"));
    });

    let generationPromise!: Promise<void>;
    await act(async () => {
      generationPromise = result.current.generateScenario();
      result.current.updateDataVersion("dv-new");
      rejectGeneration(new Error("Backend failed"));
      await generationPromise;
    });

    expect(result.current.actionError).toBeNull();
  });
});
