import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchScheduleJob, submitSampleSchedule } from "../../lib/api";
import { useSampleScheduleAction } from "./useSampleScheduleAction";

vi.mock("../../lib/api", () => ({
  submitSampleSchedule: vi.fn(),
  fetchScheduleJob: vi.fn(),
}));

const mockedSubmitSampleSchedule = vi.mocked(submitSampleSchedule);
const mockedFetchScheduleJob = vi.mocked(fetchScheduleJob);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSampleScheduleAction", () => {
  it("submits a sample schedule and refreshes when the job succeeds", async () => {
    const onCompleted = vi.fn();
    mockedSubmitSampleSchedule.mockResolvedValue({
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
    });
    mockedFetchScheduleJob.mockResolvedValue({
      jobId: "job-1",
      scenarioName: "sample",
      actorUsername: "planner",
      status: "SUCCEEDED",
      solverStatus: "OPTIMAL",
      versionId: "ver-1",
      failureReason: null,
      errorMessage: null,
      createdAt: "2026-06-18T00:00:00Z",
      completedAt: "2026-06-18T00:01:00Z",
    });

    const { result } = renderHook(() => useSampleScheduleAction({ onCompleted, pollIntervalMs: 10 }));

    await act(async () => {
      await result.current.runSample();
    });

    expect(mockedSubmitSampleSchedule).toHaveBeenCalledTimes(1);
    expect(result.current.job?.jobId).toBe("job-1");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
      await Promise.resolve();
    });

    expect(onCompleted).toHaveBeenCalledTimes(1);
    expect(result.current.job?.versionId).toBe("ver-1");
  });

  it("does not reschedule polling after unmount", async () => {
    const onCompleted = vi.fn();
    let resolvePoll: (value: Awaited<ReturnType<typeof fetchScheduleJob>>) => void = () => {};
    mockedSubmitSampleSchedule.mockResolvedValue({
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
    });
    mockedFetchScheduleJob.mockReturnValue(new Promise((resolve) => {
      resolvePoll = resolve;
    }));

    const { result, unmount } = renderHook(() => useSampleScheduleAction({ onCompleted, pollIntervalMs: 10 }));

    await act(async () => {
      await result.current.runSample();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    unmount();

    await act(async () => {
      resolvePoll({
        jobId: "job-1",
        scenarioName: "sample",
        actorUsername: "planner",
        status: "RUNNING",
        solverStatus: "RUNNING",
        versionId: null,
        failureReason: null,
        errorMessage: null,
        createdAt: "2026-06-18T00:00:00Z",
        completedAt: null,
      });
      await Promise.resolve();
    });

    expect(vi.getTimerCount()).toBe(0);
    expect(onCompleted).not.toHaveBeenCalled();
  });

  it("stores an error when sample submission fails", async () => {
    mockedSubmitSampleSchedule.mockRejectedValue(new Error("Authentication required"));
    const { result } = renderHook(() => useSampleScheduleAction({ onCompleted: vi.fn(), pollIntervalMs: 10 }));

    await act(async () => {
      await result.current.runSample();
    });

    expect(result.current.error).toBe("Authentication required");
    expect(result.current.pending).toBe(false);
  });
});
