# React UI Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first APSPOC React workbench shell: a Vite + React + TypeScript app on port 8080 with a YonBIP-inspired enterprise dashboard, real backend health/session/version data, and recoverable access to the existing static UI.

**Architecture:** Add a new `frontend/` app without changing backend, solver, or scheduling logic. The React app calls the existing backend APIs directly with session cookies, renders a stable top nav + left rail + right tool rail, and derives dashboard KPIs from `/api/v1/health`, `/api/v1/auth/session`, and `/api/v1/versions`. Startup and verification scripts prefer the React app when available and keep the old Spring static UI reachable through backend port 8081 or the existing Python static fallback.

**Tech Stack:** React 18, Vite, TypeScript, Ant Design, Ant Design Icons, Vitest, Testing Library, existing Spring Boot backend APIs.

---

## File structure

Create:
- `frontend/package.json` — npm scripts and frontend dependencies.
- `frontend/index.html` — Vite HTML entry with `#root`.
- `frontend/vite.config.ts` — Vite React config, port 8080, Vitest jsdom config.
- `frontend/tsconfig.json` — strict TypeScript config for app and tests.
- `frontend/src/main.tsx` — React root bootstrap and Ant Design reset import.
- `frontend/src/App.tsx` — top-level data loading and composition.
- `frontend/src/App.test.tsx` — shell/dashboard integration test with mocked API calls.
- `frontend/src/test/setupTests.ts` — Testing Library jest-dom setup.
- `frontend/src/lib/api.ts` — existing backend API client, API base resolution, and DTO types.
- `frontend/src/lib/api.test.ts` — API base and request behavior tests.
- `frontend/src/features/workspace/dashboardModel.ts` — pure data-to-dashboard summary mapping.
- `frontend/src/features/workspace/dashboardModel.test.ts` — summary model tests.
- `frontend/src/features/workspace/useDashboardData.ts` — React hook for session/health/version loading.
- `frontend/src/components/AppShell.tsx` — enterprise shell layout boundary.
- `frontend/src/components/TopNav.tsx` — global nav, search, current user, legacy UI link.
- `frontend/src/components/LeftNavRail.tsx` — primary module navigation.
- `frontend/src/components/RightToolRail.tsx` — fixed auxiliary tool rail.
- `frontend/src/features/workspace/WorkspaceDashboard.tsx` — card dashboard content.
- `frontend/src/styles.css` — design tokens, shell, card, responsive, focus, and reduced-motion styling.

Modify:
- `.gitignore` — ignore `frontend/node_modules/`, `frontend/dist/`, and `frontend/coverage/`.
- `startup.sh` — start Vite dev server on 8080 when `frontend/package.json` and npm are available; otherwise use the old Python static server.
- `scripts/verify-release.sh` — run React tests/build and adjust smoke checks so both React root and legacy static UI are verified.
- `README.md` — document React frontend startup, fallback, and legacy UI URL.

Do not modify:
- Backend API contracts.
- Solver logic.
- Existing static UI files except through script/docs references.

---

### Task 1: Bootstrap React/Vite app and test harness

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/test/setupTests.ts`
- Create: `frontend/src/App.test.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`
- Modify: `.gitignore`

- [ ] **Step 1: Create npm/Vite config and the first failing smoke test**

Create `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "@ant-design/icons": "^5.6.1",
    "antd": "^5.22.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^6.0.1",
    "vitest": "^2.1.5"
  }
}
```

Create `frontend/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>APSPOC 智能排产工作台</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `frontend/vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setupTests.ts",
  },
});
```

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"]
}
```

Create `frontend/src/test/setupTests.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `frontend/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the React workbench entry", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "APSPOC 智能排产工作台" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Install frontend dependencies**

Run:

```bash
npm install --prefix frontend
```

Expected: `frontend/package-lock.json` is created and npm exits successfully.

- [ ] **Step 3: Run the smoke test and verify it fails before implementation**

Run:

```bash
npm test --prefix frontend -- --run
```

Expected: FAIL with an error that includes `Failed to resolve import "./App"` or `Cannot find module './App'`.

- [ ] **Step 4: Add minimal React entry code**

Create `frontend/src/App.tsx`:

```tsx
export default function App() {
  return (
    <main>
      <h1>APSPOC 智能排产工作台</h1>
    </main>
  );
}
```

Create `frontend/src/main.tsx`:

```tsx
import "antd/dist/reset.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Ignore frontend generated files**

Append to `.gitignore`:

```gitignore
frontend/node_modules/
frontend/dist/
frontend/coverage/
```

- [ ] **Step 6: Verify test and build pass**

Run:

```bash
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

Expected: both commands exit 0. Build output is written to ignored `frontend/dist/`.

- [ ] **Step 7: Check git state**

Run:

```bash
git status --short
```

Expected: new frontend config files, `frontend/package-lock.json`, and `.gitignore` are listed; `frontend/node_modules/` and `frontend/dist/` are not listed.

---

### Task 2: Add backend API client and dashboard summary model

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/api.test.ts`
- Create: `frontend/src/features/workspace/dashboardModel.ts`
- Create: `frontend/src/features/workspace/dashboardModel.test.ts`

- [ ] **Step 1: Write failing API client tests**

Create `frontend/src/lib/api.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson, resolveApiBaseUrlFromLocation, ApiError } from "./api";

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

    await expect(requestJson("/api/v1/versions", { baseUrl: "http://api.local" })).rejects.toMatchObject<ApiError>({
      status: 401,
      message: "Authentication required",
    });
  });
});
```

Create `frontend/src/features/workspace/dashboardModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createDashboardSummary } from "./dashboardModel";

const versions = [
  {
    versionId: "v1",
    versionName: "Snow Beer baseline",
    status: "PUBLISHED",
    triggerType: "SAMPLE",
    scenarioDescription: "Published Snow Beer sample",
    createdAt: "2026-06-10T08:00:00Z",
    createdBy: "admin",
    publishedAt: "2026-06-10T09:00:00Z",
    releaseNote: "release",
    totalWeightedTardiness: 0,
    totalMakespan: 480,
    lateTaskCount: 0,
    averageUtilization: 0.71,
  },
  {
    versionId: "v2",
    versionName: "Draft high-util run",
    status: "DRAFT",
    triggerType: "TRIAL_SOLVE",
    scenarioDescription: "Draft scenario",
    createdAt: "2026-06-11T08:00:00Z",
    createdBy: "planner",
    publishedAt: null,
    releaseNote: null,
    totalWeightedTardiness: 12,
    totalMakespan: 530,
    lateTaskCount: 2,
    averageUtilization: 0.83,
  },
];

describe("createDashboardSummary", () => {
  it("derives dashboard numbers from real API shapes", () => {
    const summary = createDashboardSummary({
      session: { authenticated: true, username: "admin", role: "ADMIN" },
      health: { service: "aps-poc-backend", status: "UP", timestamp: "2026-06-12T00:00:00Z" },
      versions,
      refreshedAt: new Date("2026-06-12T10:30:00Z"),
    });

    expect(summary.userName).toBe("admin");
    expect(summary.totalVersions).toBe(2);
    expect(summary.publishedVersions).toBe(1);
    expect(summary.draftVersions).toBe(1);
    expect(summary.alertVersionCount).toBe(1);
    expect(summary.totalLateTasks).toBe(2);
    expect(summary.latestVersionName).toBe("Draft high-util run");
    expect(summary.averageUtilizationPercent).toBe(77);
  });

  it("uses explicit empty states when APIs return no planning data", () => {
    const summary = createDashboardSummary({
      session: { authenticated: false, username: null, role: null },
      health: { service: "aps-poc-backend", status: "UP", timestamp: "2026-06-12T00:00:00Z" },
      versions: [],
      refreshedAt: new Date("2026-06-12T10:30:00Z"),
    });

    expect(summary.userName).toBe("未登录用户");
    expect(summary.latestVersionName).toBe("暂无版本");
    expect(summary.planningNotice).toBe("暂无版本数据，请先运行样例排程或生成场景。");
  });
});
```

- [ ] **Step 2: Run tests and verify they fail before implementation**

Run:

```bash
npm test --prefix frontend -- --run src/lib/api.test.ts src/features/workspace/dashboardModel.test.ts
```

Expected: FAIL with missing module errors for `./api` and `./dashboardModel`.

- [ ] **Step 3: Implement the API client**

Create `frontend/src/lib/api.ts`:

```ts
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

function buildUrl(path: string, baseUrl: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildHeaders(initHeaders: HeadersInit | undefined, hasBody: boolean) {
  const headers = new Headers(initHeaders);
  headers.set("Accept", "application/json");
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return Object.fromEntries(headers.entries());
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

export function fetchVersions() {
  return requestJson<VersionSummaryResponse[]>("/api/v1/versions");
}
```

- [ ] **Step 4: Implement the summary model**

Create `frontend/src/features/workspace/dashboardModel.ts`:

```ts
import type { AuthSessionResponse, BackendHealthResponse, VersionSummaryResponse } from "../../lib/api";

export interface DashboardModelInput {
  session: AuthSessionResponse;
  health: BackendHealthResponse;
  versions: VersionSummaryResponse[];
  refreshedAt: Date;
}

export interface DashboardSummary {
  userName: string;
  userRole: string;
  backendStatus: string;
  backendService: string;
  totalVersions: number;
  publishedVersions: number;
  draftVersions: number;
  releaseQueueVersions: number;
  alertVersionCount: number;
  totalLateTasks: number;
  averageUtilizationPercent: number;
  latestVersionName: string;
  latestVersionStatus: string;
  planningNotice: string;
  refreshedAtText: string;
}

function latestVersion(versions: VersionSummaryResponse[]) {
  return [...versions].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;
}

function averageUtilizationPercent(versions: VersionSummaryResponse[]) {
  if (versions.length === 0) {
    return 0;
  }

  const average = versions.reduce((sum, version) => sum + version.averageUtilization, 0) / versions.length;
  return Math.round(average * 100);
}

export function createDashboardSummary(input: DashboardModelInput): DashboardSummary {
  const latest = latestVersion(input.versions);
  const draftVersions = input.versions.filter((version) => version.status === "DRAFT").length;
  const releaseQueueVersions = input.versions.filter((version) => version.status === "READY_FOR_RELEASE").length;
  const alertVersionCount = input.versions.filter((version) => version.lateTaskCount > 0).length;
  const totalLateTasks = input.versions.reduce((sum, version) => sum + version.lateTaskCount, 0);

  return {
    userName: input.session.authenticated && input.session.username ? input.session.username : "未登录用户",
    userRole: input.session.role ?? "未授权",
    backendStatus: input.health.status,
    backendService: input.health.service,
    totalVersions: input.versions.length,
    publishedVersions: input.versions.filter((version) => version.status === "PUBLISHED").length,
    draftVersions,
    releaseQueueVersions,
    alertVersionCount,
    totalLateTasks,
    averageUtilizationPercent: averageUtilizationPercent(input.versions),
    latestVersionName: latest?.versionName ?? "暂无版本",
    latestVersionStatus: latest?.status ?? "无版本状态",
    planningNotice: latest
      ? `最新版本 ${latest.versionName} 处于 ${latest.status} 状态。`
      : "暂无版本数据，请先运行样例排程或生成场景。",
    refreshedAtText: input.refreshedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
  };
}
```

- [ ] **Step 5: Verify model/API tests pass**

Run:

```bash
npm test --prefix frontend -- --run src/lib/api.test.ts src/features/workspace/dashboardModel.test.ts
```

Expected: PASS.

---

### Task 3: Add dashboard data hook and full App integration test

**Files:**
- Create: `frontend/src/features/workspace/useDashboardData.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Replace the App test with the desired shell/data behavior**

Replace `frontend/src/App.test.tsx` with:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fetchBackendHealth, fetchSession, fetchVersions } from "./lib/api";

vi.mock("./lib/api", async () => {
  return {
    fetchBackendHealth: vi.fn(),
    fetchSession: vi.fn(),
    fetchVersions: vi.fn(),
    resolveLegacyUiUrl: vi.fn(() => "http://127.0.0.1:8081/"),
  };
});

const mockedFetchSession = vi.mocked(fetchSession);
const mockedFetchBackendHealth = vi.mocked(fetchBackendHealth);
const mockedFetchVersions = vi.mocked(fetchVersions);

beforeEach(() => {
  mockedFetchSession.mockResolvedValue({ authenticated: true, username: "admin", role: "ADMIN" });
  mockedFetchBackendHealth.mockResolvedValue({
    service: "aps-poc-backend",
    status: "UP",
    timestamp: "2026-06-12T00:00:00Z",
  });
  mockedFetchVersions.mockResolvedValue([
    {
      versionId: "v1",
      versionName: "Snow Beer dashboard baseline",
      status: "PUBLISHED",
      triggerType: "SAMPLE",
      scenarioDescription: "baseline",
      createdAt: "2026-06-11T08:00:00Z",
      createdBy: "admin",
      publishedAt: "2026-06-11T09:00:00Z",
      releaseNote: "published",
      totalWeightedTardiness: 0,
      totalMakespan: 480,
      lateTaskCount: 0,
      averageUtilization: 0.7,
    },
  ]);
});

describe("App", () => {
  it("renders the enterprise workbench shell with live backend summary data", async () => {
    render(<App />);

    expect(screen.getByText("正在连接 APS 后端...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "智能排产工作台" })).toBeInTheDocument();
    expect(screen.getByText("Snow Beer dashboard baseline")).toBeInTheDocument();
    expect(screen.getByText("后端 UP")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "旧版控制台" })).toHaveAttribute("href", "http://127.0.0.1:8081/");

    await waitFor(() => {
      expect(mockedFetchSession).toHaveBeenCalledTimes(1);
      expect(mockedFetchBackendHealth).toHaveBeenCalledTimes(1);
      expect(mockedFetchVersions).toHaveBeenCalledTimes(1);
    });
  });

  it("shows a clear unavailable state when dashboard APIs fail", async () => {
    mockedFetchVersions.mockRejectedValueOnce(new Error("Authentication required"));

    render(<App />);

    expect(await screen.findByText("工作台数据暂不可用")).toBeInTheDocument();
    expect(screen.getByText("Authentication required")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the App test and verify it fails before implementation**

Run:

```bash
npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: FAIL because `useDashboardData` and shell/dashboard content are not implemented.

- [ ] **Step 3: Add the data loading hook**

Create `frontend/src/features/workspace/useDashboardData.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { fetchBackendHealth, fetchSession, fetchVersions } from "../../lib/api";
import { createDashboardSummary, type DashboardSummary } from "./dashboardModel";

export interface DashboardDataState {
  loading: boolean;
  summary: DashboardSummary | null;
  error: string | null;
  reload: () => void;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "无法加载工作台数据";
}

export function useDashboardData(): DashboardDataState {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [session, health, versions] = await Promise.all([fetchSession(), fetchBackendHealth(), fetchVersions()]);
        if (cancelled) {
          return;
        }
        setSummary(createDashboardSummary({ session, health, versions, refreshedAt: new Date() }));
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setSummary(null);
        setError(errorMessage(loadError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { loading, summary, error, reload };
}
```

- [ ] **Step 4: Replace App with data-aware composition**

Replace `frontend/src/App.tsx` with:

```tsx
import { Alert, Button, ConfigProvider, Spin } from "antd";
import zhCN from "antd/locale/zh_CN";
import { AppShell } from "./components/AppShell";
import { WorkspaceDashboard } from "./features/workspace/WorkspaceDashboard";
import { useDashboardData } from "./features/workspace/useDashboardData";
import "./styles.css";

export default function App() {
  const dashboardData = useDashboardData();

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: "#2563EB", borderRadius: 14 } }}>
      <AppShell summary={dashboardData.summary} onRefresh={dashboardData.reload}>
        {dashboardData.loading && (
          <div className="workspace-loading" role="status">
            <Spin size="large" />
            <span>正在连接 APS 后端...</span>
          </div>
        )}

        {!dashboardData.loading && dashboardData.error && (
          <Alert
            type="error"
            showIcon
            message="工作台数据暂不可用"
            description={
              <div className="dashboard-error-body">
                <span>{dashboardData.error}</span>
                <Button type="primary" onClick={dashboardData.reload}>重新加载</Button>
              </div>
            }
          />
        )}

        {!dashboardData.loading && dashboardData.summary && <WorkspaceDashboard summary={dashboardData.summary} />}
      </AppShell>
    </ConfigProvider>
  );
}
```

The imports for `AppShell`, `WorkspaceDashboard`, and `styles.css` will fail until Tasks 4 and 5 create those files.

- [ ] **Step 5: Keep the test failing for the right reason**

Run:

```bash
npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: FAIL with missing module errors for `./components/AppShell`, `./features/workspace/WorkspaceDashboard`, or `./styles.css`.

---

### Task 4: Implement enterprise shell navigation

**Files:**
- Create: `frontend/src/components/AppShell.tsx`
- Create: `frontend/src/components/TopNav.tsx`
- Create: `frontend/src/components/LeftNavRail.tsx`
- Create: `frontend/src/components/RightToolRail.tsx`

- [ ] **Step 1: Add shell components**

Create `frontend/src/components/AppShell.tsx`:

```tsx
import type { ReactNode } from "react";
import type { DashboardSummary } from "../features/workspace/dashboardModel";
import { LeftNavRail } from "./LeftNavRail";
import { RightToolRail } from "./RightToolRail";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: ReactNode;
  summary: DashboardSummary | null;
  onRefresh: () => void;
}

export function AppShell({ children, summary, onRefresh }: AppShellProps) {
  return (
    <div className="app-shell">
      <TopNav summary={summary} onRefresh={onRefresh} />
      <div className="app-body">
        <LeftNavRail />
        <main className="workspace-main" aria-label="APS 工作区">
          {children}
        </main>
        <RightToolRail />
      </div>
    </div>
  );
}
```

Create `frontend/src/components/TopNav.tsx`:

```tsx
import { BellOutlined, QuestionCircleOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Avatar, Badge, Button, Input, Space, Tag } from "antd";
import type { DashboardSummary } from "../features/workspace/dashboardModel";
import { resolveLegacyUiUrl } from "../lib/api";

interface TopNavProps {
  summary: DashboardSummary | null;
  onRefresh: () => void;
}

export function TopNav({ summary, onRefresh }: TopNavProps) {
  const userInitial = summary?.userName?.slice(0, 1).toUpperCase() ?? "A";

  return (
    <header className="top-nav">
      <div className="top-nav-brand" aria-label="APSPOC 智能排产">
        <span className="brand-mark" aria-hidden="true">APS</span>
        <div>
          <strong>APSPOC</strong>
          <span>智能排产</span>
        </div>
      </div>

      <div className="top-nav-context">
        <Tag color="blue">华润雪花 · 包装计划</Tag>
        <Input
          className="global-search"
          prefix={<SearchOutlined />}
          aria-label="全局搜索订单、产品、版本和任务"
          placeholder="搜索订单、产品、版本和任务"
        />
      </div>

      <Space className="top-nav-actions" size="middle">
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>刷新</Button>
        <a className="legacy-link" href={resolveLegacyUiUrl()} target="_blank" rel="noreferrer">旧版控制台</a>
        <Button aria-label="帮助" icon={<QuestionCircleOutlined />} />
        <Badge dot>
          <Button aria-label="通知" icon={<BellOutlined />} />
        </Badge>
        <div className="user-chip" aria-label="当前用户">
          <Avatar>{userInitial}</Avatar>
          <span>{summary?.userName ?? "未登录用户"}</span>
          <Tag>{summary?.userRole ?? "未授权"}</Tag>
        </div>
      </Space>
    </header>
  );
}
```

Create `frontend/src/components/LeftNavRail.tsx`:

```tsx
import {
  AuditOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";

const items = [
  { key: "workspace", icon: <DashboardOutlined />, label: "工作台" },
  { key: "import", icon: <CloudUploadOutlined />, label: "数据导入" },
  { key: "scenario", icon: <PartitionOutlined />, label: "场景生成" },
  { key: "jobs", icon: <DeploymentUnitOutlined />, label: "排程任务" },
  { key: "gantt", icon: <BarChartOutlined />, label: "Gantt 评审" },
  { key: "versions", icon: <DatabaseOutlined />, label: "版本管理" },
  { key: "approval", icon: <CheckCircleOutlined />, label: "审批发布" },
  { key: "audit", icon: <AuditOutlined />, label: "审计 / 设置" },
];

export function LeftNavRail() {
  return (
    <aside className="left-nav-rail" aria-label="主模块导航">
      <Menu mode="inline" selectedKeys={["workspace"]} items={items} />
    </aside>
  );
}
```

Create `frontend/src/components/RightToolRail.tsx`:

```tsx
import { AlertOutlined, CheckSquareOutlined, CommentOutlined, CustomerServiceOutlined, ExperimentOutlined, RobotOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

const tools = [
  { label: "排程解释", icon: <RobotOutlined /> },
  { label: "预警", icon: <AlertOutlined /> },
  { label: "帮助", icon: <CustomerServiceOutlined /> },
  { label: "回归状态", icon: <ExperimentOutlined /> },
  { label: "发布检查", icon: <CheckSquareOutlined /> },
  { label: "快速反馈", icon: <CommentOutlined /> },
];

export function RightToolRail() {
  return (
    <aside className="right-tool-rail" aria-label="快捷工具">
      {tools.map((tool) => (
        <Tooltip key={tool.label} title={tool.label} placement="left">
          <button className="right-tool-button" type="button" aria-label={tool.label}>
            {tool.icon}
          </button>
        </Tooltip>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: Run the App test and verify only dashboard/style modules remain missing**

Run:

```bash
npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: FAIL with missing module errors for `WorkspaceDashboard` or `styles.css`, not for shell components.

---

### Task 5: Implement dashboard cards and visual styling

**Files:**
- Create: `frontend/src/features/workspace/WorkspaceDashboard.tsx`
- Create: `frontend/src/styles.css`

- [ ] **Step 1: Add dashboard card implementation**

Create `frontend/src/features/workspace/WorkspaceDashboard.tsx`:

```tsx
import {
  AlertOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  FileSearchOutlined,
  PlayCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Empty, Row, Space, Tabs, Tag } from "antd";
import type { DashboardSummary } from "./dashboardModel";

interface WorkspaceDashboardProps {
  summary: DashboardSummary;
}

const quickActions = [
  { label: "导入样本", icon: <CloudUploadOutlined /> },
  { label: "生成场景", icon: <DeploymentUnitOutlined /> },
  { label: "运行排程", icon: <PlayCircleOutlined /> },
  { label: "查看 Gantt", icon: <BarChartOutlined /> },
  { label: "版本发布", icon: <RocketOutlined /> },
];

export function WorkspaceDashboard({ summary }: WorkspaceDashboardProps) {
  return (
    <div className="workspace-dashboard">
      <section className="welcome-card" aria-label="用户消息">
        <div>
          <p className="eyebrow">欢迎回来，{summary.userName}</p>
          <h1>智能排产工作台</h1>
          <p>{summary.planningNotice}</p>
        </div>
        <div className="health-pill" aria-label={`后端 ${summary.backendStatus}`}>
          后端 {summary.backendStatus}
        </div>
      </section>

      <Row gutter={[16, 16]} className="kpi-row">
        <Col xs={24} md={8}>
          <Card className="kpi-card kpi-card-blue">
            <span>待排程任务</span>
            <strong>{summary.draftVersions}</strong>
            <p>基于草稿版本推导，任务列表 API 暂未开放。</p>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="kpi-card kpi-card-amber">
            <span>排程通知</span>
            <strong>{summary.releaseQueueVersions}</strong>
            <p>等待审批或发布处理的版本。</p>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="kpi-card kpi-card-red">
            <span>预警 / 冲突</span>
            <strong>{summary.alertVersionCount}</strong>
            <p>{summary.totalLateTasks} 个延期任务来自版本 KPI。</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="快捷应用" className="dashboard-card">
            <div className="quick-action-grid">
              {quickActions.map((action) => (
                <Button key={action.label} className="quick-action-button" icon={action.icon}>
                  {action.label}
                </Button>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="value-banner-card">
            <p>APS 智能排产</p>
            <h2>让计划可视、可算、可追溯</h2>
            <Space wrap>
              {['需求', '库存', '产能', '约束', '排程', '版本', '审批', '发布'].map((keyword) => (
                <Tag key={keyword}>{keyword}</Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="我关注的计划对象" className="dashboard-card">
            <Tabs
              items={[
                {
                  key: "followed",
                  label: "我关注的",
                  children: (
                    <div className="object-summary-card">
                      <DatabaseOutlined />
                      <div>
                        <strong>{summary.totalVersions} 个排程版本</strong>
                        <span>{summary.publishedVersions} 个已发布，{summary.draftVersions} 个草稿。</span>
                      </div>
                    </div>
                  ),
                },
                { key: "running", label: "进行中", children: <Empty description="当前 API 暂未提供进行中对象列表" /> },
                { key: "delayed", label: "已延期", children: <Empty description="延期明细请进入旧版 Gantt 评审" /> },
                { key: "notStarted", label: "未开始", children: <Empty description="未开始任务列表将在任务 API 开放后展示" /> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="排程任务" className="dashboard-card">
            <div className="schedule-task-card">
              <FileSearchOutlined />
              <div>
                <strong>{summary.latestVersionName}</strong>
                <span>最新版本状态：{summary.latestVersionStatus}</span>
                <span>平均利用率：{summary.averageUtilizationPercent}%</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="公告与发布状态" className="dashboard-card announcement-card">
        <div className="announcement-content">
          <CheckCircleOutlined />
          <div>
            <strong>{summary.backendService} 已连接</strong>
            <span>刷新时间：{summary.refreshedAtText}。首期 React 工作台只展示已有 API 可证明的数据。</span>
          </div>
          <AlertOutlined className="announcement-secondary-icon" />
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Add design-token CSS**

Create `frontend/src/styles.css`:

```css
:root {
  --color-primary: #2563eb;
  --color-primary-strong: #0b5cff;
  --color-background: #f3f8ff;
  --color-surface: #ffffff;
  --color-rail: #10233f;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-border: #e4ecfc;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-success: #059669;
  color: var(--color-text-primary);
  background: var(--color-background);
  font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
  margin: 0;
}

button,
a,
input {
  outline-color: var(--color-primary-strong);
}

.app-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top left, #dbeafe 0, rgba(219, 234, 254, 0) 36%), var(--color-background);
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 64px;
  padding: 0 24px;
  color: #fff;
  background: linear-gradient(90deg, #0756d6 0%, #0b73ff 52%, #2f8cff 100%);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
}

.top-nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.top-nav-brand strong,
.top-nav-brand span {
  display: block;
}

.brand-mark {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 13px;
  font-weight: 800;
}

.top-nav-context {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 16px;
}

.global-search {
  max-width: 420px;
}

.top-nav-actions {
  color: var(--color-text-primary);
}

.legacy-link {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  border-radius: 999px;
  padding: 0 14px;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  text-decoration: none;
}

.legacy-link:focus-visible,
.legacy-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.28);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border-radius: 999px;
  padding: 4px 8px;
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
}

.app-body {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr) 56px;
  min-height: calc(100vh - 64px);
}

.left-nav-rail {
  background: var(--color-rail);
  padding: 16px 8px;
}

.left-nav-rail .ant-menu {
  color: rgba(255, 255, 255, 0.82);
  background: transparent;
  border-inline-end: 0;
}

.left-nav-rail .ant-menu-item {
  min-height: 44px;
  border-radius: 12px;
}

.left-nav-rail .ant-menu-item-selected {
  color: #fff;
  background: rgba(37, 99, 235, 0.82);
}

.workspace-main {
  min-width: 0;
  padding: 24px;
}

.right-tool-rail {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12px;
  padding: 20px 8px;
  background: rgba(255, 255, 255, 0.72);
  border-left: 1px solid var(--color-border);
}

.right-tool-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  color: var(--color-primary);
  background: var(--color-surface);
  cursor: pointer;
}

.right-tool-button:hover,
.right-tool-button:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}

.workspace-loading {
  display: grid;
  min-height: 420px;
  place-items: center;
  gap: 16px;
  color: var(--color-text-secondary);
}

.dashboard-error-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.workspace-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-card,
.dashboard-card,
.value-banner-card,
.announcement-card {
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-surface);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-weight: 700;
}

.welcome-card h1,
.value-banner-card h2 {
  margin: 0 0 8px;
}

.welcome-card p {
  margin: 0;
  color: var(--color-text-secondary);
}

.health-pill {
  min-width: 120px;
  border-radius: 999px;
  padding: 10px 16px;
  color: #064e3b;
  background: #d1fae5;
  font-weight: 700;
  text-align: center;
}

.kpi-card {
  min-height: 156px;
  overflow: hidden;
  border: 0;
  border-radius: 20px;
  color: #fff;
}

.kpi-card span,
.kpi-card p,
.kpi-card strong {
  display: block;
  color: #fff;
}

.kpi-card strong {
  margin: 10px 0 8px;
  font-size: 40px;
  line-height: 1;
}

.kpi-card p {
  margin: 0;
  opacity: 0.88;
}

.kpi-card-blue {
  background: linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%);
}

.kpi-card-amber {
  background: linear-gradient(135deg, #d97706 0%, #fbbf24 100%);
}

.kpi-card-red {
  background: linear-gradient(135deg, #dc2626 0%, #fb7185 100%);
}

.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.quick-action-button {
  min-height: 76px;
  border-radius: 16px;
}

.value-banner-card {
  min-height: 100%;
  padding: 4px;
  background: linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%);
}

.value-banner-card p {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-weight: 700;
}

.object-summary-card,
.schedule-task-card,
.announcement-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.object-summary-card > span,
.schedule-task-card > span,
.announcement-content > span:first-child {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 16px;
  color: var(--color-primary);
  background: #eff6ff;
  font-size: 24px;
}

.object-summary-card strong,
.object-summary-card span,
.schedule-task-card strong,
.schedule-task-card span,
.announcement-content strong,
.announcement-content span {
  display: block;
}

.object-summary-card span,
.schedule-task-card span,
.announcement-content span {
  color: var(--color-text-secondary);
}

.announcement-content {
  justify-content: space-between;
}

.announcement-secondary-icon {
  color: var(--color-warning);
}

@media (max-width: 1080px) {
  .app-body {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .left-nav-rail .ant-menu-title-content,
  .right-tool-rail {
    display: none;
  }

  .top-nav {
    flex-wrap: wrap;
    padding: 12px 16px;
  }

  .quick-action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Verify App integration test passes**

Run:

```bash
npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Verify all frontend tests and build pass**

Run:

```bash
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

Expected: PASS and successful Vite production build.

---

### Task 6: Wire startup, release verification, and docs

**Files:**
- Modify: `startup.sh:204-238`
- Modify: `scripts/verify-release.sh:53-99`
- Modify: `README.md:57-116`

- [ ] **Step 1: Update startup script to prefer React and preserve old static fallback**

Modify `startup.sh` after `require_local_tools()` and before the existing frontend `start_service` call.

Replace the existing frontend `start_service` block at lines 231-238 with this function and call:

```bash
start_frontend() {
    if [[ -f "$ROOT_DIR/frontend/package.json" ]] && has_command npm; then
        start_service \
            "frontend" \
            "$FRONTEND_PID_FILE" \
            "$FRONTEND_PORT" \
            "$ROOT_DIR/frontend" \
            "http://127.0.0.1:${FRONTEND_PORT}/" \
            60 \
            env VITE_APS_API_BASE_URL="http://127.0.0.1:${BACKEND_PORT}" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
        return 0
    fi

    warn "未检测到 React frontend 或 npm，使用旧版静态前端。"
    start_service \
        "frontend" \
        "$FRONTEND_PID_FILE" \
        "$FRONTEND_PORT" \
        "$ROOT_DIR" \
        "http://127.0.0.1:${FRONTEND_PORT}/" \
        30 \
        python3 -m http.server "$FRONTEND_PORT" -d "$ROOT_DIR/backend/src/main/resources/static" --bind 127.0.0.1
}

start_frontend
```

The backend and solver `start_service` blocks remain unchanged.

- [ ] **Step 2: Update release verification for React tests/build and legacy UI check**

In `scripts/verify-release.sh`, replace the frontend static syntax check block at lines 71-75 with:

```bash
    if [[ -f "$ROOT_DIR/frontend/package.json" ]]; then
        require_command npm
        log "运行 React frontend 单元测试 ..."
        (
            cd "$ROOT_DIR/frontend"
            npm test -- --run
        )

        log "运行 React frontend 构建检查 ..."
        (
            cd "$ROOT_DIR/frontend"
            npm run build
        )
    fi

    log "运行旧版 frontend 静态语法检查 ..."
    (
        cd "$ROOT_DIR"
        node --check backend/src/main/resources/static/app.js
    )
```

In the smoke section, replace lines 94-98 with:

```bash
    log "检查 frontend / backend / solver 健康状态 ..."
    curl -fsS -I http://127.0.0.1:8080/ >/dev/null
    curl -fsS -I http://127.0.0.1:8081/app.js >/dev/null
    curl -fsS http://127.0.0.1:8081/actuator/health >/dev/null
    curl -fsS http://127.0.0.1:8000/health >/dev/null
```

- [ ] **Step 3: Update README local frontend docs**

In `README.md`, replace the current `## Start Frontend` section with:

```markdown
## Start Frontend

The preferred local frontend is the React workbench in `frontend/`:

```bash
cd frontend
npm install
VITE_APS_API_BASE_URL=http://127.0.0.1:8081 npm run dev -- --host 127.0.0.1 --port 8080
```

The React app runs at:

```text
http://localhost:8080/
```

The previous static UI remains recoverable from the Spring Boot backend while the React migration is in progress:

```text
http://localhost:8081/
```

If npm is not available, `./startup.sh` falls back to serving `backend/src/main/resources/static` on port `8080` with Python.
```

Keep the existing `## Start Backend` section immediately after this replacement.

- [ ] **Step 4: Verify scripts parse**

Run:

```bash
bash -n startup.sh
bash -n scripts/verify-release.sh
```

Expected: both commands exit 0.

---

### Task 7: Run full verification and update graphify

**Files:**
- Code files modified in previous tasks.
- Generated: updated `graphify-out/` files from graphify, ignored by git.

- [ ] **Step 1: Run frontend verification**

Run:

```bash
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

Expected: frontend unit tests pass and Vite build succeeds.

- [ ] **Step 2: Run existing backend and solver tests**

Run:

```bash
(cd backend && mvn test)
(cd solver && python3 -m unittest discover -s tests -p 'test_*.py')
```

Expected: backend Maven tests and solver unittest suite pass.

- [ ] **Step 3: Run release test-only verification**

Run:

```bash
./scripts/verify-release.sh --tests-only
```

Expected: backend tests, solver tests, React frontend tests/build, legacy `app.js` syntax check, and `git diff --check` pass.

- [ ] **Step 4: Start the local stack for browser verification**

Run:

```bash
./startup.sh
```

Expected: logs show solver on 8000, backend on 8081, frontend on 8080. If npm is available and `frontend/package.json` exists, frontend log should show Vite startup.

- [ ] **Step 5: Verify the UI in a browser**

Open:

```text
http://127.0.0.1:8080/
```

Expected visual checks:
- Blue top navigation is visible.
- Dark left module rail is visible.
- Right quick-tool rail is visible on desktop width.
- Dashboard shows user card, three gradient KPI cards, quick actions, value banner, object/task cards, and announcement card.
- Backend status shows `后端 UP` when the backend is healthy.
- `旧版控制台` opens `http://127.0.0.1:8081/` in a new tab.
- Keyboard focus is visible on top nav buttons, quick actions, and right rail buttons.

- [ ] **Step 6: Run smoke verification if the local stack is healthy**

Run:

```bash
./scripts/verify-release.sh --smoke-only
```

Expected: local port checks, frontend root check, legacy static UI check, backend actuator health, solver health, release smoke, and UAT package smoke pass.

- [ ] **Step 7: Update graphify after code modifications**

Run:

```bash
graphify update .
```

Expected: graphify completes without API cost and updates ignored `graphify-out/` state.

- [ ] **Step 8: Inspect final git status and diff**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected:
- Tracked/untracked changes are limited to React frontend, startup/verification docs/scripts, and this implementation plan.
- `frontend/node_modules/`, `frontend/dist/`, and `graphify-out/` are not listed.
- `git diff --check` exits 0.

---

## Self-review

Spec coverage:
- React + Vite + TypeScript: Task 1.
- Ant Design and SVG icons without emoji structural icons: Tasks 1, 4, 5.
- AppShell with top nav, left rail, right rail, workspace content: Task 4.
- Dashboard card layout, KPI gradients, quick actions, value banner, object/task/announcement cards: Task 5.
- Real backend health, session, and versions data: Tasks 2 and 3.
- Explicit unavailable states when data is missing or API calls fail: Tasks 2, 3, and 5.
- Existing backend/solver/Gantt logic unchanged: file structure and task boundaries exclude those areas.
- Old UI recoverable: Tasks 4 and 6.
- Verification, browser checks, release checks, graphify update: Task 7.

Placeholder scan:
- No incomplete requirement markers are intentionally left in the plan.
- Any unavailable data in the UI is explicitly labeled as not yet backed by an API.

Type consistency:
- `AuthSessionResponse`, `BackendHealthResponse`, and `VersionSummaryResponse` match the current Java DTO/controller shapes.
- `DashboardSummary` is created by `createDashboardSummary`, loaded by `useDashboardData`, passed through `AppShell`, and rendered by `WorkspaceDashboard`.
