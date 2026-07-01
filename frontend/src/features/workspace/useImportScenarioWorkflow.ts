import { useCallback, useMemo, useRef, useState } from "react";
import {
  generateScenarioFromImportBatches,
  submitScheduleJob,
  uploadImportBatch,
  type GenerateScenarioFromImportBatchesRequest,
  type GeneratedScenarioFromImportBatchesResponse,
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
] as const satisfies readonly ImportBatchKind[];

export const requiredImportBatchKinds = [
  "resources",
  "recipes",
  "demands",
] as const satisfies readonly ImportBatchKind[];

const successfulImportBatchStatuses = new Set(["SUCCEEDED", "SCENARIO_GENERATED"]);

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
  generatedScenario: GeneratedScenarioFromImportBatchesResponse | null;
  submittedJob: ScheduleJobResponse | null;
  uploadPendingKind: ImportBatchKind | null;
  generating: boolean;
  submitting: boolean;
  actionError: string | null;
  canGenerate: boolean;
  canSubmit: boolean;
  requiredReadyCount: number;
  readinessMessage: string;
  updateSetup: (setup: Partial<ScenarioSetupState>) => void;
  updateDataVersion: (dataVersion: string) => void;
  uploadBatch: (kind: ImportBatchKind, file: File) => Promise<void>;
  generateScenario: () => Promise<void>;
  submitGeneratedSchedule: () => Promise<void>;
  resetWorkflow: () => void;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function buildDefaultDataVersion(now = new Date()) {
  return [
    "dv",
    `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}`,
    `${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}`,
  ].join("-");
}

function buildLocalDateTimeValue(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function buildDefaultSetup(dataVersion: string, now = new Date()): ScenarioSetupState {
  return {
    scenarioName: `formal-import-${dataVersion}`,
    scheduleStartAt: buildLocalDateTimeValue(now),
    horizonMinutes: 1440,
    objectiveWeights: {
      tardiness: 10,
      earliness: 1,
      makespan: 1,
    },
    solverConfig: {
      timeLimitSeconds: 30,
      numSearchWorkers: 4,
    },
  };
}

function toIsoDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("请输入有效的排程开始时间。");
  }
  return parsed.toISOString();
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function importBatchFromError(error: unknown) {
  if (!error || typeof error !== "object" || !("payload" in error)) {
    return null;
  }
  const payload = (error as { payload?: unknown }).payload;
  if (!payload || typeof payload !== "object" || !("importBatch" in payload)) {
    return null;
  }
  const importBatch = (payload as { importBatch?: unknown }).importBatch;
  return importBatch && typeof importBatch === "object" ? importBatch as ImportBatchResponse : null;
}

function isSuccessfulBatch(batch: ImportBatchResponse | undefined) {
  return Boolean(batch && successfulImportBatchStatuses.has(batch.status));
}

function buildReadiness(batches: ImportBatchRecords, dataVersion: string) {
  let requiredReadyCount = 0;
  const missingKinds: ImportBatchKind[] = [];
  const failedKinds: ImportBatchKind[] = [];
  const mismatchedKinds: ImportBatchKind[] = [];

  requiredImportBatchKinds.forEach((kind) => {
    const batch = batches[kind];
    if (!batch) {
      missingKinds.push(kind);
      return;
    }
    if (!isSuccessfulBatch(batch)) {
      failedKinds.push(kind);
      return;
    }
    if (batch.dataVersion !== dataVersion) {
      mismatchedKinds.push(kind);
      return;
    }
    requiredReadyCount += 1;
  });

  if (requiredReadyCount === requiredImportBatchKinds.length) {
    return {
      canGenerate: true,
      requiredReadyCount,
      readinessMessage: "Ready to generate scenario.",
    };
  }

  if (mismatchedKinds.length > 0) {
    return {
      canGenerate: false,
      requiredReadyCount,
      readinessMessage: `Required batches must match dataVersion ${dataVersion}: ${mismatchedKinds.join(", ")}`,
    };
  }

  if (failedKinds.length > 0) {
    return {
      canGenerate: false,
      requiredReadyCount,
      readinessMessage: `Required batches are not successful: ${failedKinds.join(", ")}`,
    };
  }

  return {
    canGenerate: false,
    requiredReadyCount,
    readinessMessage: `Upload required batches: ${missingKinds.join(", ")}`,
  };
}

export function useImportScenarioWorkflow(): ImportScenarioWorkflowState {
  const [setup, setSetupState] = useState<ScenarioSetupState>(() => {
    const now = new Date();
    return buildDefaultSetup(buildDefaultDataVersion(now), now);
  });
  const [batches, setBatches] = useState<ImportBatchRecords>({});
  const [generatedScenario, setGeneratedScenario] = useState<GeneratedScenarioFromImportBatchesResponse | null>(null);
  const [submittedJob, setSubmittedJob] = useState<ScheduleJobResponse | null>(null);
  const [actionPendingKey, setActionPendingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const setupRef = useRef(setup);
  const batchesRef = useRef(batches);
  const generatedScenarioRef = useRef(generatedScenario);
  const revisionRef = useRef(0);
  const actionPendingKeyRef = useRef<string | null>(null);

  const [dataVersion, setDataVersionState] = useState(() => setup.scenarioName.replace(/^formal-import-/, ""));
  const dataVersionRef = useRef(dataVersion);

  const readiness = useMemo(() => buildReadiness(batches, dataVersion), [batches, dataVersion]);

  const updateActionPendingKey = useCallback((nextPendingKey: string | null) => {
    actionPendingKeyRef.current = nextPendingKey;
    setActionPendingKey(nextPendingKey);
  }, []);

  const updateSetup = useCallback((nextSetup: Partial<ScenarioSetupState>) => {
    const resolvedSetup = {
      ...setupRef.current,
      ...nextSetup,
    };
    setupRef.current = resolvedSetup;
    setSetupState(resolvedSetup);
    generatedScenarioRef.current = null;
    revisionRef.current += 1;
    setGeneratedScenario(null);
    setSubmittedJob(null);
  }, []);

  const updateDataVersion = useCallback((nextDataVersion: string) => {
    const nextSetup = {
      ...setupRef.current,
      scenarioName: setupRef.current.scenarioName === `formal-import-${dataVersionRef.current}`
        ? `formal-import-${nextDataVersion}`
        : setupRef.current.scenarioName,
    };
    dataVersionRef.current = nextDataVersion;
    setupRef.current = nextSetup;
    setDataVersionState(nextDataVersion);
    setSetupState(nextSetup);
    generatedScenarioRef.current = null;
    revisionRef.current += 1;
    setGeneratedScenario(null);
    setSubmittedJob(null);
  }, []);

  const resetWorkflow = useCallback(() => {
    const now = new Date();
    const nextDataVersion = buildDefaultDataVersion(now);
    const nextSetup = buildDefaultSetup(nextDataVersion, now);
    dataVersionRef.current = nextDataVersion;
    setupRef.current = nextSetup;
    batchesRef.current = {};
    generatedScenarioRef.current = null;
    revisionRef.current += 1;
    setDataVersionState(nextDataVersion);
    setSetupState(nextSetup);
    setBatches({});
    setGeneratedScenario(null);
    setSubmittedJob(null);
    setActionError(null);
    updateActionPendingKey(null);
  }, [updateActionPendingKey]);

  const uploadBatch = useCallback(async (kind: ImportBatchKind, file: File) => {
    const pendingKey = `upload:${kind}`;
    const currentRevision = revisionRef.current;
    const currentDataVersion = dataVersionRef.current;
    updateActionPendingKey(pendingKey);
    setActionError(null);
    generatedScenarioRef.current = null;
    revisionRef.current += 1;
    setGeneratedScenario(null);
    setSubmittedJob(null);
    try {
      const response = await uploadImportBatch(kind, file, currentDataVersion);
      if (revisionRef.current !== currentRevision + 1 || dataVersionRef.current !== currentDataVersion) {
        return;
      }
      batchesRef.current = {
        ...batchesRef.current,
        [kind]: response.importBatch,
      };
      revisionRef.current += 1;
      generatedScenarioRef.current = null;
      setBatches(batchesRef.current);
      setGeneratedScenario(null);
      setSubmittedJob(null);
    } catch (uploadError) {
      if (revisionRef.current !== currentRevision + 1 || dataVersionRef.current !== currentDataVersion) {
        return;
      }
      const failedBatch = importBatchFromError(uploadError);
      if (failedBatch) {
        batchesRef.current = {
          ...batchesRef.current,
          [kind]: failedBatch,
        };
        setBatches(batchesRef.current);
      }
      setActionError(errorMessage(uploadError, "Unable to upload import batch."));
    } finally {
      if (actionPendingKeyRef.current === pendingKey) {
        updateActionPendingKey(null);
      }
    }
  }, [updateActionPendingKey]);

  const generateScenario = useCallback(async () => {
    const currentSetup = setupRef.current;
    const currentDataVersion = dataVersionRef.current;
    const currentRevision = revisionRef.current;
    const currentReadiness = buildReadiness(batchesRef.current, currentDataVersion);
    if (!currentReadiness.canGenerate) {
      setActionError(currentReadiness.readinessMessage);
      return;
    }

    if (actionPendingKeyRef.current?.startsWith("upload:")) {
      setActionError("请等待批次上传完成后再生成场景。");
      return;
    }

    updateActionPendingKey("generate");
    setActionError(null);
    try {
      const request: GenerateScenarioFromImportBatchesRequest = {
        ...currentSetup,
        dataVersion: currentDataVersion,
        scheduleStartAt: toIsoDateTime(currentSetup.scheduleStartAt),
      };
      const generated = await generateScenarioFromImportBatches(request);
      if (revisionRef.current !== currentRevision || dataVersionRef.current !== currentDataVersion) {
        return;
      }
      generatedScenarioRef.current = generated;
      setGeneratedScenario(generated);
      setSubmittedJob(null);
    } catch (generateError) {
      if (revisionRef.current === currentRevision && dataVersionRef.current === currentDataVersion) {
        setActionError(errorMessage(generateError, "Unable to generate scenario."));
      }
    } finally {
      if (actionPendingKeyRef.current === "generate") {
        updateActionPendingKey(null);
      }
    }
  }, [updateActionPendingKey]);

  const submitGeneratedSchedule = useCallback(async () => {
    const scheduleRequest = generatedScenarioRef.current?.scenario.scheduleRequest;
    if (!scheduleRequest || !Array.isArray(scheduleRequest.tasks) || scheduleRequest.tasks.length === 0) {
      setActionError("Generated scenario does not include a schedule request.");
      return;
    }

    const currentRevision = revisionRef.current;
    const currentDataVersion = dataVersionRef.current;
    updateActionPendingKey("submit");
    setActionError(null);
    try {
      const job = await submitScheduleJob(scheduleRequest);
      if (revisionRef.current !== currentRevision || dataVersionRef.current !== currentDataVersion) {
        return;
      }
      setSubmittedJob(job);
    } catch (submitError) {
      if (revisionRef.current === currentRevision && dataVersionRef.current === currentDataVersion) {
        setActionError(errorMessage(submitError, "Unable to submit generated schedule."));
      }
    } finally {
      if (actionPendingKeyRef.current === "submit") {
        updateActionPendingKey(null);
      }
    }
  }, [updateActionPendingKey]);

  return {
    dataVersion,
    setup,
    batches,
    generatedScenario,
    submittedJob,
    uploadPendingKind: actionPendingKey?.startsWith("upload:")
      ? actionPendingKey.replace("upload:", "") as ImportBatchKind
      : null,
    generating: actionPendingKey === "generate",
    submitting: actionPendingKey === "submit",
    actionError,
    canGenerate: readiness.canGenerate && actionPendingKey === null,
    canSubmit: Boolean(
      generatedScenario?.scenario.scheduleRequest
        && Array.isArray(generatedScenario.scenario.scheduleRequest.tasks)
        && generatedScenario.scenario.scheduleRequest.tasks.length > 0
        && actionPendingKey !== "submit",
    ),
    requiredReadyCount: readiness.requiredReadyCount,
    readinessMessage: readiness.readinessMessage,
    updateSetup,
    updateDataVersion,
    uploadBatch,
    generateScenario,
    submitGeneratedSchedule,
    resetWorkflow,
  };
}
