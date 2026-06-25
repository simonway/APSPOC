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

function buildHeaders(initHeaders: HeadersInit | undefined, hasBody: boolean): HeadersInit {
  if (!initHeaders) {
    if (hasBody) {
      return { Accept: "application/json", "Content-Type": "application/json" };
    }
    return { Accept: "application/json" };
  }

  const headers = new Headers(initHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (hasBody && !headers.has("Content-Type")) {
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
  const hasBody = init.body !== undefined;
  const response = await fetch(buildUrl(path, baseUrl), {
    ...init,
    credentials: "include",
    headers: buildHeaders(headers, hasBody),
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
