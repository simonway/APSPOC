import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelScheduleJob,
  fetchScheduleJob,
  fetchScheduleJobs,
  retryScheduleJob,
  submitSampleSchedule,
  type ScheduleJobResponse,
} from "../../lib/api";

const terminalStatuses = new Set(["SUCCEEDED", "FAILED", "CANCELLED", "TIMEOUT"]);

interface UseScheduleJobsOptions {
  limit?: number;
  pollIntervalMs?: number;
}

export interface ScheduleJobsState {
  jobs: ScheduleJobResponse[];
  loading: boolean;
  actionPendingKey: string | null;
  error: string | null;
  actionError: string | null;
  activeJobCount: number;
  failedJobCount: number;
  succeededJobCount: number;
  reload: () => Promise<void>;
  runSample: () => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function upsertJob(jobs: ScheduleJobResponse[], nextJob: ScheduleJobResponse) {
  const existingIndex = jobs.findIndex((job) => job.jobId === nextJob.jobId);
  if (existingIndex === -1) {
    return [nextJob, ...jobs];
  }
  return jobs.map((job) => job.jobId === nextJob.jobId ? nextJob : job);
}

export function useScheduleJobs({ limit = 20, pollIntervalMs = 1500 }: UseScheduleJobsOptions = {}): ScheduleJobsState {
  const [jobs, setJobs] = useState<ScheduleJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPendingKey, setActionPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const timersRef = useRef<Map<string, number>>(new Map());
  const mountedRef = useRef(true);

  const clearTimer = useCallback((jobId: string) => {
    const timer = timersRef.current.get(jobId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(jobId);
    }
  }, []);

  const pollJob = useCallback((jobId: string) => {
    clearTimer(jobId);
    const timer = window.setTimeout(async () => {
      try {
        const nextJob = await fetchScheduleJob(jobId);
        if (!mountedRef.current) {
          return;
        }
        setJobs((current) => upsertJob(current, nextJob));
        if (!terminalStatuses.has(nextJob.status)) {
          pollJob(jobId);
        }
      } catch (pollError) {
        if (mountedRef.current) {
          setActionError(errorMessage(pollError, "无法刷新排程任务状态"));
        }
      }
    }, pollIntervalMs);
    timersRef.current.set(jobId, timer);
  }, [clearTimer, pollIntervalMs]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextJobs = await fetchScheduleJobs(limit);
      if (!mountedRef.current) {
        return;
      }
      setJobs(nextJobs);
      nextJobs.filter((job) => !terminalStatuses.has(job.status)).forEach((job) => pollJob(job.jobId));
    } catch (loadError) {
      if (mountedRef.current) {
        setError(errorMessage(loadError, "无法加载排程任务"));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [limit, pollJob]);

  const runSample = useCallback(async () => {
    setActionPendingKey("sample");
    setActionError(null);
    try {
      const submittedJob = await submitSampleSchedule();
      if (!mountedRef.current) {
        return;
      }
      setJobs((current) => upsertJob(current, submittedJob));
      pollJob(submittedJob.jobId);
    } catch (submitError) {
      if (mountedRef.current) {
        setActionError(errorMessage(submitError, "无法提交样例排程"));
      }
    } finally {
      if (mountedRef.current) {
        setActionPendingKey(null);
      }
    }
  }, [pollJob]);

  const cancelJob = useCallback(async (jobId: string) => {
    setActionPendingKey(`cancel:${jobId}`);
    setActionError(null);
    try {
      const cancelledJob = await cancelScheduleJob(jobId);
      if (!mountedRef.current) {
        return;
      }
      clearTimer(jobId);
      setJobs((current) => upsertJob(current, cancelledJob));
    } catch (cancelError) {
      if (mountedRef.current) {
        setActionError(errorMessage(cancelError, "无法取消排程任务"));
      }
    } finally {
      if (mountedRef.current) {
        setActionPendingKey(null);
      }
    }
  }, [clearTimer]);

  const retryJob = useCallback(async (jobId: string) => {
    setActionPendingKey(`retry:${jobId}`);
    setActionError(null);
    try {
      const retriedJob = await retryScheduleJob(jobId);
      if (!mountedRef.current) {
        return;
      }
      setJobs((current) => upsertJob(current, retriedJob));
      pollJob(retriedJob.jobId);
    } catch (retryError) {
      if (mountedRef.current) {
        setActionError(errorMessage(retryError, "无法重试排程任务"));
      }
    } finally {
      if (mountedRef.current) {
        setActionPendingKey(null);
      }
    }
  }, [pollJob]);

  useEffect(() => {
    mountedRef.current = true;
    void reload();
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
    };
  }, [reload]);

  const counts = useMemo(() => ({
    activeJobCount: jobs.filter((job) => !terminalStatuses.has(job.status)).length,
    failedJobCount: jobs.filter((job) => ["FAILED", "TIMEOUT", "CANCELLED"].includes(job.status)).length,
    succeededJobCount: jobs.filter((job) => job.status === "SUCCEEDED").length,
  }), [jobs]);

  return {
    jobs,
    loading,
    actionPendingKey,
    error,
    actionError,
    ...counts,
    reload,
    runSample,
    cancelJob,
    retryJob,
  };
}
