import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelScheduleJob,
  fetchScheduleJob,
  fetchScheduleJobs,
  retryScheduleJob,
  submitSampleSchedule,
  type ScheduleJobResponse,
} from "../../lib/api";
import { useScheduleJobs } from "./useScheduleJobs";

vi.mock("../../lib/api", () => ({
  cancelScheduleJob: vi.fn(),
  fetchScheduleJob: vi.fn(),
  fetchScheduleJobs: vi.fn(),
  retryScheduleJob: vi.fn(),
  submitSampleSchedule: vi.fn(),
}));

const mockedCancelScheduleJob = vi.mocked(cancelScheduleJob);
const mockedFetchScheduleJob = vi.mocked(fetchScheduleJob);
const mockedFetchScheduleJobs = vi.mocked(fetchScheduleJobs);
const mockedRetryScheduleJob = vi.mocked(retryScheduleJob);
const mockedSubmitSampleSchedule = vi.mocked(submitSampleSchedule);

const queuedJob = {
  jobId: "job-1",
  scenarioName: "sample",
  actorUsername: "planner",
  status: "QUEUED",
  solverStatus: "QUEUED",
  versionId: null,
  failureReason: null,
  errorMessage: null,
  createdAt: "2026-06-18T00:00:00Z",
  completedAt: null,
};

const failedJob = {
  ...queuedJob,
  jobId: "job-failed",
  status: "FAILED",
  solverStatus: "FAILED",
  failureReason: "SOLVER_NO_FEASIBLE_SCHEDULE",
  errorMessage: "No feasible schedule",
  completedAt: "2026-06-18T00:02:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockedFetchScheduleJobs.mockResolvedValue([queuedJob, failedJob]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useScheduleJobs", () => {
  it("loads recent jobs on mount", async () => {
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedFetchScheduleJobs).toHaveBeenCalledWith(20);
    expect(result.current.jobs.map((job) => job.jobId)).toEqual(["job-1", "job-failed"]);
    expect(result.current.loading).toBe(false);
  });

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

  it("clears timers for jobs no longer active and schedules refreshed active jobs", async () => {
    const refreshedActiveJob = { ...queuedJob, jobId: "job-active", status: "RUNNING", solverStatus: "RUNNING" };
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]).mockResolvedValueOnce([failedJob, refreshedActiveJob]);
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));
    mockedFetchScheduleJob.mockResolvedValue(refreshedActiveJob);

    await act(async () => {
      await Promise.resolve();
      await result.current.reload();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(mockedFetchScheduleJob).toHaveBeenCalledWith("job-active");
    expect(mockedFetchScheduleJob).not.toHaveBeenCalledWith("job-1");
  });

  it("cleans up polling timers when unmounted", async () => {
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
    });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("stops polling after a terminal status", async () => {
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockResolvedValueOnce({ ...queuedJob, status: "SUCCEEDED" });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(10);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.jobs[0].status).toBe("SUCCEEDED");
    expect(mockedFetchScheduleJob).toHaveBeenCalledTimes(1);
  });

  it("retains the existing row and exposes a warning when polling fails", async () => {
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockRejectedValueOnce(new Error("Polling failed"));
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.jobs).toEqual([queuedJob]);
    expect(result.current.pollingError).toBe("Polling failed");
  });

  it("retries polling after a transient failure", async () => {
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockRejectedValueOnce(new Error("Polling failed")).mockResolvedValueOnce({ ...queuedJob, status: "SUCCEEDED" });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.pollingError).toBe("Polling failed");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(mockedFetchScheduleJob).toHaveBeenCalledTimes(2);
    expect(result.current.jobs[0].status).toBe("SUCCEEDED");
  });

  it("exposes a reload action after polling fails", async () => {
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockRejectedValueOnce(new Error("Polling failed"));
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(result.current.pollingError).toBe("Polling failed");
    expect(result.current.reload).toEqual(expect.any(Function));
  });

  it("does not let an in-flight poll overwrite a newer cancellation or restart polling", async () => {
    let resolvePoll: (job: ScheduleJobResponse) => void = () => {};
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockImplementationOnce(() => new Promise((resolve) => { resolvePoll = resolve; }));
    mockedCancelScheduleJob.mockResolvedValueOnce({ ...queuedJob, status: "CANCELLED", solverStatus: "CANCELLED" });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(10); await Promise.resolve(); });
    await act(async () => { await result.current.cancelJob("job-1"); });
    await act(async () => { resolvePoll({ ...queuedJob, status: "RUNNING", solverStatus: "RUNNING" }); await Promise.resolve(); await vi.advanceTimersByTimeAsync(10); });

    expect(result.current.jobs[0].status).toBe("CANCELLED");
    expect(mockedFetchScheduleJob).toHaveBeenCalledTimes(1);
  });

  it("does not let an in-flight poll overwrite a newer retry result", async () => {
    let resolvePoll: (job: ScheduleJobResponse) => void = () => {};
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockImplementationOnce(() => new Promise((resolve) => { resolvePoll = resolve; }));
    mockedRetryScheduleJob.mockResolvedValueOnce({ ...queuedJob, status: "QUEUED", solverStatus: "RETRY_QUEUED" });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(10); await Promise.resolve(); });
    await act(async () => { await result.current.retryJob("job-1"); });
    await act(async () => { resolvePoll({ ...queuedJob, status: "RUNNING", solverStatus: "RUNNING" }); await Promise.resolve(); });

    expect(result.current.jobs[0].solverStatus).toBe("RETRY_QUEUED");
  });

  it("does not let an in-flight poll overwrite a newer reload result", async () => {
    let resolvePoll: (job: ScheduleJobResponse) => void = () => {};
    const succeededJob = { ...queuedJob, status: "SUCCEEDED", solverStatus: "OPTIMAL" };
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]).mockResolvedValueOnce([succeededJob]);
    mockedFetchScheduleJob.mockImplementationOnce(() => new Promise((resolve) => { resolvePoll = resolve; }));
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(10); await Promise.resolve(); });
    await act(async () => { await result.current.reload(); });
    await act(async () => { resolvePoll({ ...queuedJob, status: "RUNNING", solverStatus: "RUNNING" }); await Promise.resolve(); await vi.advanceTimersByTimeAsync(10); });

    expect(result.current.jobs[0].status).toBe("SUCCEEDED");
    expect(mockedFetchScheduleJob).toHaveBeenCalledTimes(1);
  });

  it("clears a polling warning after the next successful poll", async () => {
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockRejectedValueOnce(new Error("Polling failed")).mockResolvedValueOnce({ ...queuedJob, status: "RUNNING" });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.pollingError).toBe("Polling failed");
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.pollingError).toBeNull();
  });

  it("clears a polling warning after a successful manual reload", async () => {
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    mockedFetchScheduleJob.mockRejectedValueOnce(new Error("Polling failed"));
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));
    await act(async () => { await Promise.resolve(); await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.pollingError).toBe("Polling failed");
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]);
    await act(async () => { await result.current.reload(); });
    expect(result.current.pollingError).toBeNull();
  });

  it("ignores an older overlapping reload response and error", async () => {
    let resolveOlder: (jobs: ScheduleJobResponse[]) => void = () => {};
    let rejectOlder: (error: Error) => void = () => {};
    const newerJob = { ...queuedJob, jobId: "job-newer", status: "SUCCEEDED" };
    mockedFetchScheduleJobs
      .mockResolvedValueOnce([queuedJob])
      .mockImplementationOnce(() => new Promise((resolve, reject) => { resolveOlder = resolve; rejectOlder = reject; }))
      .mockResolvedValueOnce([newerJob]);
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));
    await act(async () => { await Promise.resolve(); });

    let olderReload: Promise<void> = Promise.resolve();
    await act(async () => {
      olderReload = result.current.reload();
      await Promise.resolve();
      await result.current.reload();
    });
    expect(result.current.jobs).toEqual([newerJob]);

    await act(async () => {
      resolveOlder([failedJob]);
      rejectOlder(new Error("Older reload failed"));
      await olderReload;
    });
    expect(result.current.jobs).toEqual([newerJob]);
    expect(result.current.error).toBeNull();
  });

  it("does not let a pending reload overwrite a later cancellation", async () => {
    let resolveReload: (jobs: ScheduleJobResponse[]) => void = () => {};
    mockedFetchScheduleJobs.mockResolvedValueOnce([queuedJob]).mockImplementationOnce(() => new Promise((resolve) => { resolveReload = resolve; }));
    mockedCancelScheduleJob.mockResolvedValueOnce({ ...queuedJob, status: "CANCELLED", solverStatus: "CANCELLED" });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));
    await act(async () => { await Promise.resolve(); });

    let pendingReload: Promise<void> = Promise.resolve();
    await act(async () => {
      pendingReload = result.current.reload();
      await Promise.resolve();
      await result.current.cancelJob("job-1");
    });
    await act(async () => {
      resolveReload([{ ...queuedJob, status: "RUNNING" }]);
      await pendingReload;
    });

    expect(result.current.jobs[0].status).toBe("CANCELLED");
    expect(result.current.loading).toBe(false);
  });

  it("tracks concurrent row actions independently and suppresses duplicate submission", async () => {
    let resolveCancel: (job: ScheduleJobResponse) => void = () => {};
    let resolveRetry: (job: ScheduleJobResponse) => void = () => {};
    mockedCancelScheduleJob.mockImplementationOnce(() => new Promise((resolve) => { resolveCancel = resolve; }));
    mockedRetryScheduleJob.mockImplementationOnce(() => new Promise((resolve) => { resolveRetry = resolve; }));
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));
    await act(async () => { await Promise.resolve(); });

    let cancelPromise: Promise<void> = Promise.resolve();
    let retryPromise: Promise<void> = Promise.resolve();
    await act(async () => {
      cancelPromise = result.current.cancelJob("job-1");
      retryPromise = result.current.retryJob("job-failed");
      void result.current.cancelJob("job-1");
      await Promise.resolve();
    });
    expect(result.current.actionPendingKeys).toEqual(expect.arrayContaining(["cancel:job-1", "retry:job-failed"]));
    expect(mockedCancelScheduleJob).toHaveBeenCalledTimes(1);
    expect(mockedRetryScheduleJob).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCancel({ ...queuedJob, status: "CANCELLED" });
      await cancelPromise;
    });
    expect(result.current.actionPendingKeys).toEqual(["retry:job-failed"]);

    await act(async () => {
      resolveRetry({ ...failedJob, jobId: "job-retry", status: "QUEUED" });
      await retryPromise;
    });
    expect(result.current.actionPendingKeys).toEqual([]);
  });

  it("retains existing rows when a reload fails", async () => {
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
    });
    mockedFetchScheduleJobs.mockRejectedValueOnce(new Error("Refresh failed"));

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.jobs).toEqual([queuedJob, failedJob]);
    expect(result.current.error).toBe("Refresh failed");
    expect(result.current.loading).toBe(false);
  });

  it("submits a sample job and updates the list when polling succeeds", async () => {
    mockedSubmitSampleSchedule.mockResolvedValue(queuedJob);
    mockedFetchScheduleJob.mockResolvedValue({
      ...queuedJob,
      status: "SUCCEEDED",
      solverStatus: "OPTIMAL",
      versionId: "ver-1",
      completedAt: "2026-06-18T00:03:00Z",
    });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
      await result.current.runSample();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
      await Promise.resolve();
    });

    expect(mockedSubmitSampleSchedule).toHaveBeenCalledTimes(1);
    expect(result.current.jobs[0]).toMatchObject({ jobId: "job-1", status: "SUCCEEDED", versionId: "ver-1" });
  });

  it("cancels and retries jobs with pending action state", async () => {
    mockedCancelScheduleJob.mockResolvedValue({ ...queuedJob, status: "CANCELLED", solverStatus: "CANCELLED" });
    mockedRetryScheduleJob.mockResolvedValue({ ...queuedJob, jobId: "job-retry", status: "QUEUED", solverStatus: "QUEUED" });
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
      await result.current.cancelJob("job-1");
      await result.current.retryJob("job-failed");
    });

    expect(mockedCancelScheduleJob).toHaveBeenCalledWith("job-1");
    expect(mockedRetryScheduleJob).toHaveBeenCalledWith("job-failed");
    expect(result.current.jobs.map((job) => job.jobId)).toContain("job-retry");
  });

  it("stores list and action errors", async () => {
    mockedFetchScheduleJobs.mockRejectedValueOnce(new Error("Authentication required"));
    const { result } = renderHook(() => useScheduleJobs({ pollIntervalMs: 10 }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("Authentication required");

    mockedCancelScheduleJob.mockRejectedValueOnce(new Error("Only running jobs can be cancelled"));
    await act(async () => {
      await result.current.cancelJob("job-1");
    });

    expect(result.current.actionError).toBe("Only running jobs can be cancelled");
  });
});
