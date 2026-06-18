import { useCallback, useEffect, useRef, useState } from "react";
import { fetchScheduleJob, submitSampleSchedule, type ScheduleJobResponse } from "../../lib/api";

const terminalStatuses = new Set(["SUCCEEDED", "FAILED", "CANCELLED", "TIMEOUT"]);

interface UseSampleScheduleActionOptions {
  onCompleted: () => void;
  pollIntervalMs?: number;
}

export function useSampleScheduleAction({ onCompleted, pollIntervalMs = 1500 }: UseSampleScheduleActionOptions) {
  const [pending, setPending] = useState(false);
  const [job, setJob] = useState<ScheduleJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pollJob = useCallback((jobId: string) => {
    timerRef.current = window.setTimeout(async () => {
      try {
        const nextJob = await fetchScheduleJob(jobId);
        if (!mountedRef.current) {
          return;
        }
        setJob(nextJob);
        if (terminalStatuses.has(nextJob.status)) {
          setPending(false);
          if (nextJob.status === "SUCCEEDED") {
            onCompleted();
          }
          return;
        }
        pollJob(jobId);
      } catch (pollError) {
        if (!mountedRef.current) {
          return;
        }
        setPending(false);
        setError(pollError instanceof Error ? pollError.message : "无法刷新样例排程任务状态");
      }
    }, pollIntervalMs);
  }, [onCompleted, pollIntervalMs]);

  const runSample = useCallback(async () => {
    clearTimer();
    setPending(true);
    setError(null);
    try {
      const submittedJob = await submitSampleSchedule();
      setJob(submittedJob);
      pollJob(submittedJob.jobId);
    } catch (submitError) {
      setPending(false);
      setError(submitError instanceof Error ? submitError.message : "无法提交样例排程");
    }
  }, [clearTimer, pollJob]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  return { pending, job, error, runSample };
}
