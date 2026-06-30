export interface AuthSessionResponse {
  authenticated: boolean;
  username: string | null;
  role: string | null;
}

export interface BackendHealthResponse {
  service: string;
  status: string;
  timestamp: string;
}

export interface VersionSummaryResponse {
  versionId: string;
  versionName: string;
  status: string;
  triggerType: string;
  scenarioDescription: string | null;
  createdAt: string;
  createdBy: string | null;
  publishedAt: string | null;
  releaseNote: string | null;
  totalWeightedTardiness: number;
  totalMakespan: number;
  lateTaskCount: number;
  averageUtilization: number;
}

export interface ScheduleJobResponse {
  jobId: string;
  scenarioName: string | null;
  actorUsername: string | null;
  status: string;
  solverStatus: string | null;
  versionId: string | null;
  failureReason: string | null;
  errorMessage: string | null;
  createdAt: string | null;
  completedAt: string | null;
}

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

export interface LocationLike {
  protocol: string;
  hostname: string;
  port: string;
  origin: string;
}

export interface RequestJsonOptions extends RequestInit {
  baseUrl?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly payload: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function resolveApiBaseUrlFromLocation(
  location: LocationLike,
  configuredBaseUrl: string | undefined = import.meta.env.VITE_APS_API_BASE_URL,
) {
  if (configuredBaseUrl && configuredBaseUrl.trim()) {
    return configuredBaseUrl.trim().replace(/\/$/, "");
  }

  if (location.port === "8080") {
    return `${location.protocol}//${location.hostname}:8081`;
  }

  if (location.port) {
    return `${location.protocol}//${location.hostname}:${location.port}`;
  }

  return location.origin;
}

export function resolveLegacyUiUrl(location: LocationLike = window.location) {
  if (location.port === "8080") {
    return `${location.protocol}//${location.hostname}:8081/`;
  }

  return "/";
}

export function resolveApiUrl(path: string, location: LocationLike = window.location) {
  return buildUrl(path, resolveApiBaseUrlFromLocation(location));
}

export function resolveModelImportTemplateUrl(location: LocationLike = window.location) {
  return resolveApiUrl("/api/v1/model-import/template", location);
}

function buildUrl(path: string, baseUrl: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

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

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function responseMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function requestJson<T>(path: string, options: RequestJsonOptions = {}): Promise<T> {
  const { baseUrl = resolveApiBaseUrlFromLocation(window.location), headers, ...init } = options;
  const hasJsonBody = init.body !== undefined && !isFormDataBody(init.body as BodyInit);
  const response = await fetch(buildUrl(path, baseUrl), {
    ...init,
    credentials: "include",
    headers: buildHeaders(headers, hasJsonBody),
  });
  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, responseMessage(payload, `Request failed with status ${response.status}`), payload);
  }

  return payload as T;
}

export function fetchSession() {
  return requestJson<AuthSessionResponse>("/api/v1/auth/session");
}

export function fetchBackendHealth() {
  return requestJson<BackendHealthResponse>("/api/v1/health");
}

export function login(username: string, password: string, baseUrl?: string) {
  return requestJson<AuthSessionResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function submitSampleSchedule(baseUrl?: string) {
  return requestJson<ScheduleJobResponse>("/api/v1/schedule/jobs/sample", {
    method: "POST",
    ...(baseUrl ? { baseUrl } : {}),
  });
}

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

export function fetchScheduleJob(jobId: string, baseUrl?: string) {
  return requestJson<ScheduleJobResponse>(`/api/v1/schedule/jobs/${encodeURIComponent(jobId)}`, {
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function fetchScheduleJobs(limit = 20, baseUrl?: string) {
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
  return requestJson<ScheduleJobResponse[]>(`/api/v1/schedule/jobs?limit=${encodeURIComponent(String(normalizedLimit))}`, {
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function cancelScheduleJob(jobId: string, baseUrl?: string) {
  return requestJson<ScheduleJobResponse>(`/api/v1/schedule/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: "POST",
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function retryScheduleJob(jobId: string, baseUrl?: string) {
  return requestJson<ScheduleJobResponse>(`/api/v1/schedule/jobs/${encodeURIComponent(jobId)}/retry`, {
    method: "POST",
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function fetchVersions() {
  return requestJson<VersionSummaryResponse[]>("/api/v1/versions");
}
