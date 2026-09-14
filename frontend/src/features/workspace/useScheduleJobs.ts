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
  actionPendingKeys: string[];
  error: string | null;
  actionError: string | null;
  pollingError: string | null;
  pollingErrors: Record<string, string>;
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

export function useScheduleJobs({ limit = 20, pollIntervalMs = 5000 }: UseScheduleJobsOptions = {}): ScheduleJobsState {
  const [jobs, setJobs] = useState<ScheduleJobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPendingKeys, setActionPendingKeys] = useState<string[]>([]);
  const pendingActionsRef = useRef<Set<string>>(new Set());
  const reloadGenerationRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pollingErrors, setPollingErrors] = useState<Record<string, string>>({});
  const timersRef = useRef<Map<string, number>>(new Map());
  const generationsRef = useRef<Map<string, number>>(new Map());
  const mountedRef = useRef(true);

  const invalidateJob = useCallback((jobId: string) => {
    generationsRef.current.set(jobId, (generationsRef.current.get(jobId) ?? 0) + 1);
  }, []);

  const beginAction = useCallback((key: string) => {
    if (pendingActionsRef.current.has(key)) return false;
    pendingActionsRef.current.add(key);
    setActionPendingKeys([...pendingActionsRef.current]);
    return true;
  }, []);

  const endAction = useCallback((key: string) => {
    pendingActionsRef.current.delete(key);
    setActionPendingKeys([...pendingActionsRef.current]);
  }, []);

  const clearTimer = useCallback((jobId: string) => {
    const timer = timersRef.current.get(jobId);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(jobId);
    }
  }, []);

  const pollJob = useCallback((jobId: string) => {
    clearTimer(jobId);
    const generation = generationsRef.current.get(jobId) ?? 0;
    generationsRef.current.set(jobId, generation);
    const timer = window.setTimeout(async () => {
      timersRef.current.delete(jobId);
      try {
        const nextJob = await fetchScheduleJob(jobId);
        if (!mountedRef.current || generationsRef.current.get(jobId) !== generation) {
          return;
        }
        setPollingErrors((current) => {
          if (!(jobId in current)) return current;
          const next = { ...current };
          delete next[jobId];
          return next;
        });
        setJobs((current) => upsertJob(current, nextJob));
        if (!terminalStatuses.has(nextJob.status)) {
          pollJob(jobId);
        }
      } catch (pollError) {
        if (mountedRef.current && generationsRef.current.get(jobId) === generation) {
          setPollingErrors((current) => ({ ...current, [jobId]: errorMessage(pollError, "无法刷新排程任务状态") }));
          pollJob(jobId);
        }
      }
    }, pollIntervalMs);
    timersRef.current.set(jobId, timer);
  }, [clearTimer, pollIntervalMs]);

  const reload = useCallback(async () => {
    const reloadGeneration = reloadGenerationRef.current + 1;
    reloadGenerationRef.current = reloadGeneration;
    setLoading(true);
    setError(null);
    try {
      const nextJobs = await fetchScheduleJobs(limit);
      if (!mountedRef.current || reloadGenerationRef.current !== reloadGeneration) {
        return;
      }
      const activeJobIds = new Set(nextJobs.filter((job) => !terminalStatuses.has(job.status)).map((job) => job.jobId));
      const knownJobIds = new Set([...generationsRef.current.keys(), ...nextJobs.map((job) => job.jobId)]);
      knownJobIds.forEach((jobId) => {
        invalidateJob(jobId);
        if (!activeJobIds.has(jobId)) clearTimer(jobId);
      });
      setPollingErrors({});
      setJobs(nextJobs);
      nextJobs.filter((job) => activeJobIds.has(job.jobId)).forEach((job) => pollJob(job.jobId));
    } catch (loadError) {
      if (mountedRef.current && reloadGenerationRef.current === reloadGeneration) {
        setError(errorMessage(loadError, "无法加载排程任务"));
      }
    } finally {
      if (mountedRef.current && reloadGenerationRef.current === reloadGeneration) {
        setLoading(false);
      }
    }
  }, [clearTimer, invalidateJob, limit, pollJob]);

  const runSample = useCallback(async () => {
    const actionKey = "sample";
    if (!beginAction(actionKey)) return;
    reloadGenerationRef.current += 1;
    setLoading(false);
    setError(null);
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
      if (mountedRef.current) endAction(actionKey);
    }
  }, [beginAction, endAction, pollJob]);

  const cancelJob = useCallback(async (jobId: string) => {
    const actionKey = `cancel:${jobId}`;
    if (!beginAction(actionKey)) return;
    reloadGenerationRef.current += 1;
    setLoading(false);
    setError(null);
    setActionError(null);
    try {
      const cancelledJob = await cancelScheduleJob(jobId);
      if (!mountedRef.current) {
        return;
      }
      invalidateJob(jobId);
      clearTimer(jobId);
      setJobs((current) => upsertJob(current, cancelledJob));
    } catch (cancelError) {
      if (mountedRef.current) {
        setActionError(errorMessage(cancelError, "无法取消排程任务"));
      }
    } finally {
      if (mountedRef.current) endAction(actionKey);
    }
  }, [beginAction, clearTimer, endAction, invalidateJob]);

  const retryJob = useCallback(async (jobId: string) => {
    const actionKey = `retry:${jobId}`;
    if (!beginAction(actionKey)) return;
    reloadGenerationRef.current += 1;
    setLoading(false);
    setError(null);
    setActionError(null);
    try {
      const retriedJob = await retryScheduleJob(jobId);
      if (!mountedRef.current) {
        return;
      }
      invalidateJob(jobId);
      setJobs((current) => upsertJob(current, retriedJob));
      pollJob(retriedJob.jobId);
    } catch (retryError) {
      if (mountedRef.current) {
        setActionError(errorMessage(retryError, "无法重试排程任务"));
      }
    } finally {
      if (mountedRef.current) endAction(actionKey);
    }
  }, [beginAction, endAction, invalidateJob, pollJob]);

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
    actionPendingKey: actionPendingKeys[0] ?? null,
    actionPendingKeys,
    error,
    actionError,
    pollingError: Object.values(pollingErrors)[0] ?? null,
    pollingErrors,
    ...counts,
    reload,
    runSample,
    cancelJob,
    retryJob,
  };
}
