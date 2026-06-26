import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelScheduleJob,
  fetchScheduleJob,
  fetchScheduleJobs,
  retryScheduleJob,
  submitSampleSchedule,
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
