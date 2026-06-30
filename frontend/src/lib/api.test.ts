import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  cancelScheduleJob,
  fetchScheduleJob,
  fetchScheduleJobs,
  generateScenarioFromImportBatches,
  login,
  requestJson,
  resolveImportBatchErrorsUrl,
  resolveApiBaseUrlFromLocation,
  resolveModelImportTemplateUrl,
  retryScheduleJob,
  submitScheduleJob,
  submitSampleSchedule,
  uploadImportBatch,
} from "./api";

describe("resolveApiBaseUrlFromLocation", () => {
  it("uses backend port 8081 when the frontend is served from 8080", () => {
    expect(
      resolveApiBaseUrlFromLocation({
        protocol: "http:",
        hostname: "127.0.0.1",
        port: "8080",
        origin: "http://127.0.0.1:8080",
      }),
    ).toBe("http://127.0.0.1:8081");
  });

  it("uses an explicit configured base URL without a trailing slash", () => {
    expect(
      resolveApiBaseUrlFromLocation(
        {
          protocol: "http:",
          hostname: "127.0.0.1",
          port: "8080",
          origin: "http://127.0.0.1:8080",
        },
        "http://localhost:9000/",
      ),
    ).toBe("http://localhost:9000");
  });
});

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends credentials and parses JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "UP" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson("/api/v1/health", { baseUrl: "http://api.local" })).resolves.toEqual({ status: "UP" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/health", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("throws ApiError with the backend message on failed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Authentication required" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    try {
      await requestJson("/api/v1/versions", { baseUrl: "http://api.local" });
      throw new Error("Expected requestJson to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({
        status: 401,
        message: "Authentication required",
      });
    }
  });

  it("posts credentials to the existing login endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true, username: "admin", role: "ADMIN" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(login("admin", "admin123", "http://api.local")).resolves.toEqual({
      authenticated: true,
      username: "admin",
      role: "ADMIN",
    });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "admin123" }),
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
  });

  it("submits a sample schedule job with session credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jobId: "job-1", status: "QUEUED", solverStatus: "QUEUED" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitSampleSchedule("http://api.local")).resolves.toMatchObject({ jobId: "job-1" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs/sample", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("fetches a schedule job by id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jobId: "job-1", status: "SUCCEEDED", solverStatus: "OPTIMAL" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchScheduleJob("job-1", "http://api.local")).resolves.toMatchObject({ status: "SUCCEEDED" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs/job-1", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("fetches recent schedule jobs with a limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ jobId: "job-1", status: "QUEUED", solverStatus: "QUEUED" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchScheduleJobs(10, "http://api.local")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs?limit=10", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("cancels a schedule job with session credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jobId: "job-1", status: "CANCELLED", solverStatus: "CANCELLED" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(cancelScheduleJob("job-1", "http://api.local")).resolves.toMatchObject({ status: "CANCELLED" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs/job-1/cancel", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("retries a schedule job with session credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jobId: "job-2", status: "QUEUED", solverStatus: "QUEUED" }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(retryScheduleJob("job-1", "http://api.local")).resolves.toMatchObject({ jobId: "job-2" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs/job-1/retry", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });
});

describe("resolveModelImportTemplateUrl", () => {
  it("points to the backend template endpoint when React is served from 8080", () => {
    expect(
      resolveModelImportTemplateUrl({
        protocol: "http:",
        hostname: "127.0.0.1",
        port: "8080",
        origin: "http://127.0.0.1:8080",
      }),
    ).toBe("http://127.0.0.1:8081/api/v1/model-import/template");
  });

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
});
