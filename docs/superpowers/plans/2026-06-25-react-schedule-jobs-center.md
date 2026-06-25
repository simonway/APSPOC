# React Schedule Jobs Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native React schedule jobs center backed by a persisted recent jobs API.

**Architecture:** Add a small backend read endpoint for recent schedule jobs, reusing the existing `ScheduleJob` domain object and `ScheduleJobResponse` DTO. Extend the React API client and workspace routing so the left rail `排程任务` opens an operational jobs panel with list, submit sample, cancel, retry, and legacy review actions.

**Tech Stack:** Spring Boot 3, Spring Data JPA, JUnit 5, Mockito, React 18, TypeScript, Ant Design, Vitest, Testing Library.

---

## File Structure

Modify:

- `backend/src/main/java/com/apspoc/backend/persistence/repository/ScheduleJobRepository.java`  
  Adds a Spring Data method for recent jobs ordered by `createdAt desc`.
- `backend/src/main/java/com/apspoc/backend/service/ScheduleStore.java`  
  Adds the persistence boundary method `listRecentJobs(int limit)`.
- `backend/src/main/java/com/apspoc/backend/persistence/PostgresScheduleStore.java`  
  Implements `listRecentJobs` using `PageRequest`.
- `backend/src/main/java/com/apspoc/backend/service/SchedulingJobService.java`  
  Adds `listRecentJobs(int requestedLimit)` with `1..50` clamping.
- `backend/src/main/java/com/apspoc/backend/api/ScheduleJobController.java`  
  Adds `GET /api/v1/schedule/jobs?limit=20`.
- `backend/src/test/java/com/apspoc/backend/persistence/PostgresScheduleStoreTest.java`  
  Adds a store unit test for recent job listing.
- `frontend/src/lib/api.ts`  
  Adds `fetchScheduleJobs`, `cancelScheduleJob`, and `retryScheduleJob`.
- `frontend/src/lib/api.test.ts`  
  Adds API client tests for the three new functions.
- `frontend/src/App.tsx`  
  Routes `activeWorkspaceKey === "jobs"` to the jobs center panel.
- `frontend/src/App.test.tsx`  
  Adds integration coverage for opening the jobs center and basic actions.
- `frontend/src/styles.css`  
  Adds compact operational jobs center styles.

Create:

- `backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java`  
  Tests job list limit normalization.
- `backend/src/test/java/com/apspoc/backend/api/ScheduleJobControllerTest.java`  
  Tests controller authorization and response mapping via mocked services.
- `frontend/src/features/workspace/useScheduleJobs.ts`  
  Owns recent jobs loading, sample submit, polling, cancel, retry, pending state, and errors.
- `frontend/src/features/workspace/useScheduleJobs.test.ts`  
  Hook-level tests for loading, polling, cancel, retry, and error handling.
- `frontend/src/features/workspace/ScheduleJobsPanel.tsx`  
  Renders the native jobs center view.

---

### Task 1: Backend Recent Jobs Store Path

**Files:**
- Modify: `backend/src/test/java/com/apspoc/backend/persistence/PostgresScheduleStoreTest.java`
- Modify: `backend/src/main/java/com/apspoc/backend/persistence/repository/ScheduleJobRepository.java`
- Modify: `backend/src/main/java/com/apspoc/backend/service/ScheduleStore.java`
- Modify: `backend/src/main/java/com/apspoc/backend/persistence/PostgresScheduleStore.java`

- [ ] **Step 1: Write the failing store test**

Add imports to `PostgresScheduleStoreTest.java`:

```java
import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import org.springframework.data.domain.PageRequest;
```

Add this test method before the helper methods:

```java
    @Test
    void listRecentJobsReturnsJobsByCreatedAtDescending() {
        ScheduleJobEntity newest = jobEntity("job-new", "scenario-new", JobStatus.SUCCEEDED, "OPTIMAL", "ver-new", "2026-06-18T10:00:00Z");
        ScheduleJobEntity older = jobEntity("job-old", "scenario-old", JobStatus.FAILED, "FAILED", null, "2026-06-18T09:00:00Z");
        ScheduleJob newestDomain = domainJob("job-new", "scenario-new", JobStatus.SUCCEEDED, "OPTIMAL", "ver-new", "2026-06-18T10:00:00Z");
        ScheduleJob olderDomain = domainJob("job-old", "scenario-old", JobStatus.FAILED, "FAILED", null, "2026-06-18T09:00:00Z");

        when(jobRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 2))).thenReturn(List.of(newest, older));
        when(mapper.toDomain(newest)).thenReturn(newestDomain);
        when(mapper.toDomain(older)).thenReturn(olderDomain);

        List<ScheduleJob> result = store.listRecentJobs(2);

        assertThat(result).extracting(ScheduleJob::id).containsExactly("job-new", "job-old");
    }
```

Add helper methods near the existing `versionEntity` and `domainVersion` helpers:

```java
    private ScheduleJobEntity jobEntity(String id, String scenarioName, JobStatus status, String solverStatus, String versionId, String createdAt) {
        ScheduleJobEntity entity = new ScheduleJobEntity(id);
        entity.setScenarioName(scenarioName);
        entity.setActorUsername("planner-admin");
        entity.setStatus(status);
        entity.setSolverStatus(solverStatus);
        entity.setVersionId(versionId);
        entity.setFailureReason(null);
        entity.setErrorMessage(null);
        entity.setSourceRequestJson("{}");
        entity.setCreatedAt(Instant.parse(createdAt));
        entity.setCompletedAt(status.isTerminal() ? Instant.parse(createdAt).plusSeconds(60) : null);
        return entity;
    }

    private ScheduleJob domainJob(String id, String scenarioName, JobStatus status, String solverStatus, String versionId, String createdAt) {
        return new ScheduleJob(
                id,
                scenarioName,
                "planner-admin",
                "{}",
                Instant.parse(createdAt),
                status,
                solverStatus,
                versionId,
                null,
                null,
                status.isTerminal() ? Instant.parse(createdAt).plusSeconds(60) : null
        );
    }
```

- [ ] **Step 2: Run the store test and verify RED**

Run:

```bash
rtk mvn -f backend/pom.xml -Dtest=PostgresScheduleStoreTest#listRecentJobsReturnsJobsByCreatedAtDescending test
```

Expected: compile failure because `ScheduleStore.listRecentJobs` and `ScheduleJobRepository.findAllByOrderByCreatedAtDesc` do not exist.

- [ ] **Step 3: Add repository and store implementation**

Update `ScheduleJobRepository.java`:

```java
package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ScheduleJobRepository extends JpaRepository<ScheduleJobEntity, String> {

    List<ScheduleJobEntity> findAllByStatusIn(Collection<JobStatus> statuses);

    List<ScheduleJobEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
```

Update `ScheduleStore.java`:

```java
    List<ScheduleJob> listRecentJobs(int limit);
```

Place it after `listJobsByStatuses(List<JobStatus> statuses);`.

Update `PostgresScheduleStore.java` imports:

```java
import org.springframework.data.domain.PageRequest;
```

Add this method after `listJobsByStatuses`:

```java
    @Override
    @Transactional(readOnly = true)
    public List<ScheduleJob> listRecentJobs(int limit) {
        return jobRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)).stream()
                .map(mapper::toDomain)
                .toList();
    }
```

- [ ] **Step 4: Run the store test and verify GREEN**

Run:

```bash
rtk mvn -f backend/pom.xml -Dtest=PostgresScheduleStoreTest#listRecentJobsReturnsJobsByCreatedAtDescending test
```

Expected: test passes.

- [ ] **Step 5: Commit backend store path**

Run:

```bash
rtk git add backend/src/main/java/com/apspoc/backend/persistence/repository/ScheduleJobRepository.java backend/src/main/java/com/apspoc/backend/service/ScheduleStore.java backend/src/main/java/com/apspoc/backend/persistence/PostgresScheduleStore.java backend/src/test/java/com/apspoc/backend/persistence/PostgresScheduleStoreTest.java
rtk git commit -m "feat: add recent schedule job store query"
```

---

### Task 2: Backend Service and Controller Endpoint

**Files:**
- Create: `backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java`
- Create: `backend/src/test/java/com/apspoc/backend/api/ScheduleJobControllerTest.java`
- Modify: `backend/src/main/java/com/apspoc/backend/service/SchedulingJobService.java`
- Modify: `backend/src/main/java/com/apspoc/backend/api/ScheduleJobController.java`

- [ ] **Step 1: Write the failing service limit test**

Create `backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java`:

```java
package com.apspoc.backend.service;

import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SchedulingJobServiceTest {

    @Mock
    private ScheduleStore store;

    @Mock
    private SolverGateway solverGateway;

    @Mock
    private ThreadPoolTaskExecutor taskExecutor;

    private SchedulingJobService service;

    @BeforeEach
    void setUp() {
        service = new SchedulingJobService(store, solverGateway, taskExecutor, new ObjectMapper());
    }

    @Test
    void listRecentJobsClampsRequestedLimitToSupportedRange() {
        ScheduleJob job = job("job-1");
        when(store.listRecentJobs(20)).thenReturn(List.of(job));
        when(store.listRecentJobs(50)).thenReturn(List.of(job));
        when(store.listRecentJobs(1)).thenReturn(List.of(job));

        assertThat(service.listRecentJobs(0)).containsExactly(job);
        assertThat(service.listRecentJobs(100)).containsExactly(job);
        assertThat(service.listRecentJobs(1)).containsExactly(job);
    }

    private ScheduleJob job(String id) {
        return new ScheduleJob(
                id,
                "sample",
                "planner-admin",
                "{}",
                Instant.parse("2026-06-18T10:00:00Z"),
                JobStatus.QUEUED,
                "QUEUED",
                null,
                null,
                null,
                null
        );
    }
}
```

- [ ] **Step 2: Run the service test and verify RED**

Run:

```bash
rtk mvn -f backend/pom.xml -Dtest=SchedulingJobServiceTest#listRecentJobsClampsRequestedLimitToSupportedRange test
```

Expected: compile failure because `SchedulingJobService.listRecentJobs` does not exist.

- [ ] **Step 3: Implement service method**

Add a constant in `SchedulingJobService` near the existing constants:

```java
    private static final int DEFAULT_RECENT_JOB_LIMIT = 20;
    private static final int MAX_RECENT_JOB_LIMIT = 50;
```

Add this public method after `getJob`:

```java
    public List<ScheduleJob> listRecentJobs(int requestedLimit) {
        int normalizedLimit = requestedLimit <= 0
                ? DEFAULT_RECENT_JOB_LIMIT
                : Math.min(requestedLimit, MAX_RECENT_JOB_LIMIT);
        return store.listRecentJobs(normalizedLimit);
    }
```

- [ ] **Step 4: Run the service test and verify GREEN**

Run:

```bash
rtk mvn -f backend/pom.xml -Dtest=SchedulingJobServiceTest#listRecentJobsClampsRequestedLimitToSupportedRange test
```

Expected: test passes.

- [ ] **Step 5: Write the failing controller test**

Create `backend/src/test/java/com/apspoc/backend/api/ScheduleJobControllerTest.java`:

```java
package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.ScheduleJobResponse;
import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.service.AuthService;
import com.apspoc.backend.service.SampleScenarioFactory;
import com.apspoc.backend.service.SchedulingJobService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleJobControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private SchedulingJobService schedulingJobService;

    @Mock
    private SampleScenarioFactory sampleScenarioFactory;

    @Mock
    private HttpSession session;

    private ScheduleJobController controller;

    @BeforeEach
    void setUp() {
        controller = new ScheduleJobController(authService, schedulingJobService, sampleScenarioFactory);
    }

    @Test
    void listJobsAllowsReadRolesAndMapsResponses() {
        ScheduleJob job = new ScheduleJob(
                "job-1",
                "snow-beer-sample",
                "planner-admin",
                "{}",
                Instant.parse("2026-06-18T10:00:00Z"),
                JobStatus.SUCCEEDED,
                "OPTIMAL",
                "ver-1",
                null,
                null,
                Instant.parse("2026-06-18T10:01:00Z")
        );
        when(schedulingJobService.listRecentJobs(20)).thenReturn(List.of(job));

        List<ScheduleJobResponse> result = controller.listJobs(20, session);

        verify(authService).requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().jobId()).isEqualTo("job-1");
        assertThat(result.getFirst().scenarioName()).isEqualTo("snow-beer-sample");
        assertThat(result.getFirst().status()).isEqualTo("SUCCEEDED");
        assertThat(result.getFirst().solverStatus()).isEqualTo("OPTIMAL");
        assertThat(result.getFirst().versionId()).isEqualTo("ver-1");
    }
}
```

- [ ] **Step 6: Run the controller test and verify RED**

Run:

```bash
rtk mvn -f backend/pom.xml -Dtest=ScheduleJobControllerTest#listJobsAllowsReadRolesAndMapsResponses test
```

Expected: compile failure because `ScheduleJobController.listJobs` does not exist.

- [ ] **Step 7: Implement controller endpoint**

Update imports in `ScheduleJobController.java`:

```java
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
```

Add this method before `@GetMapping("/{jobId}")`:

```java
    @GetMapping
    public List<ScheduleJobResponse> listJobs(
            @RequestParam(name = "limit", defaultValue = "20") int limit,
            HttpSession session
    ) {
        authService.requireAnyRole(session, UserRole.ADMIN, UserRole.PLANNER, UserRole.APPROVER, UserRole.VIEWER);
        return schedulingJobService.listRecentJobs(limit).stream()
                .map(ScheduleJobResponse::from)
                .toList();
    }
```

- [ ] **Step 8: Run backend endpoint tests and verify GREEN**

Run:

```bash
rtk mvn -f backend/pom.xml -Dtest=SchedulingJobServiceTest,ScheduleJobControllerTest,PostgresScheduleStoreTest test
```

Expected: tests pass.

- [ ] **Step 9: Commit backend endpoint**

Run:

```bash
rtk git add backend/src/main/java/com/apspoc/backend/service/SchedulingJobService.java backend/src/main/java/com/apspoc/backend/api/ScheduleJobController.java backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java backend/src/test/java/com/apspoc/backend/api/ScheduleJobControllerTest.java
rtk git commit -m "feat: expose recent schedule jobs api"
```

---

### Task 3: Frontend API Client

**Files:**
- Modify: `frontend/src/lib/api.test.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Write failing API client tests**

Update the import list in `frontend/src/lib/api.test.ts`:

```ts
  cancelScheduleJob,
  fetchScheduleJobs,
  retryScheduleJob,
```

Add these tests inside `describe("requestJson", () => { ... })` after the existing `fetches a schedule job by id` test:

```ts
  it("fetches recent schedule jobs with a limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ jobId: "job-1", status: "QUEUED", solverStatus: "QUEUED" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchScheduleJobs(10, "http://api.local")).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs?limit=10", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("cancels a schedule job with session credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jobId: "job-1", status: "CANCELLED", solverStatus: "CANCELLED" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(cancelScheduleJob("job-1", "http://api.local")).resolves.toMatchObject({ status: "CANCELLED" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs/job-1/cancel", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });

  it("retries a schedule job with session credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jobId: "job-2", status: "QUEUED", solverStatus: "QUEUED" }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(retryScheduleJob("job-1", "http://api.local")).resolves.toMatchObject({ jobId: "job-2" });
    expect(fetchMock).toHaveBeenCalledWith("http://api.local/api/v1/schedule/jobs/job-1/retry", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  });
```

- [ ] **Step 2: Run API client tests and verify RED**

Run:

```bash
rtk npm test --prefix frontend -- src/lib/api.test.ts --run
```

Expected: compile failure because the three exported functions do not exist.

- [ ] **Step 3: Implement API functions**

Add to `frontend/src/lib/api.ts` after `fetchScheduleJob`:

```ts
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
```

- [ ] **Step 4: Run API client tests and verify GREEN**

Run:

```bash
rtk npm test --prefix frontend -- src/lib/api.test.ts --run
```

Expected: API client tests pass.

- [ ] **Step 5: Commit frontend API client**

Run:

```bash
rtk git add frontend/src/lib/api.ts frontend/src/lib/api.test.ts
rtk git commit -m "feat: add schedule job action api client"
```

---

### Task 4: Frontend Jobs Hook

**Files:**
- Create: `frontend/src/features/workspace/useScheduleJobs.test.ts`
- Create: `frontend/src/features/workspace/useScheduleJobs.ts`

- [ ] **Step 1: Write failing hook tests**

Create `frontend/src/features/workspace/useScheduleJobs.test.ts`:

```ts
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
```

- [ ] **Step 2: Run hook tests and verify RED**

Run:

```bash
rtk npm test --prefix frontend -- src/features/workspace/useScheduleJobs.test.ts --run
```

Expected: compile failure because `useScheduleJobs` does not exist.

- [ ] **Step 3: Implement jobs hook**

Create `frontend/src/features/workspace/useScheduleJobs.ts`:

```ts
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
```

- [ ] **Step 4: Run hook tests and verify GREEN**

Run:

```bash
rtk npm test --prefix frontend -- src/features/workspace/useScheduleJobs.test.ts --run
```

Expected: hook tests pass.

- [ ] **Step 5: Commit jobs hook**

Run:

```bash
rtk git add frontend/src/features/workspace/useScheduleJobs.ts frontend/src/features/workspace/useScheduleJobs.test.ts
rtk git commit -m "feat: add schedule jobs hook"
```

---

### Task 5: React Jobs Panel and Navigation

**Files:**
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/features/workspace/ScheduleJobsPanel.tsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Write failing App integration tests**

Update the mocked API import list in `frontend/src/App.test.tsx`:

```ts
  cancelScheduleJob,
  fetchScheduleJobs,
  retryScheduleJob,
```

Update the `vi.mock("./lib/api"...` object:

```ts
    cancelScheduleJob: vi.fn(),
    fetchScheduleJobs: vi.fn(),
    retryScheduleJob: vi.fn(),
```

Add mocked constants:

```ts
const mockedFetchScheduleJobs = vi.mocked(fetchScheduleJobs);
const mockedCancelScheduleJob = vi.mocked(cancelScheduleJob);
const mockedRetryScheduleJob = vi.mocked(retryScheduleJob);
```

Add default mock setup in `beforeEach`:

```ts
  mockedFetchScheduleJobs.mockResolvedValue([
    {
      jobId: "job-running",
      scenarioName: "Snow Beer running sample",
      actorUsername: "planner",
      status: "RUNNING",
      solverStatus: "RUNNING",
      versionId: null,
      failureReason: null,
      errorMessage: null,
      createdAt: "2026-06-18T00:00:00Z",
      completedAt: null,
    },
    {
      jobId: "job-failed",
      scenarioName: "Snow Beer failed sample",
      actorUsername: "planner",
      status: "FAILED",
      solverStatus: "FAILED",
      versionId: null,
      failureReason: "SOLVER_NO_FEASIBLE_SCHEDULE",
      errorMessage: "No feasible schedule",
      createdAt: "2026-06-18T00:10:00Z",
      completedAt: "2026-06-18T00:11:00Z",
    },
    {
      jobId: "job-succeeded",
      scenarioName: "Snow Beer released sample",
      actorUsername: "planner",
      status: "SUCCEEDED",
      solverStatus: "OPTIMAL",
      versionId: "ver-1",
      failureReason: null,
      errorMessage: null,
      createdAt: "2026-06-18T00:20:00Z",
      completedAt: "2026-06-18T00:21:00Z",
    },
  ]);
  mockedCancelScheduleJob.mockResolvedValue({
    jobId: "job-running",
    scenarioName: "Snow Beer running sample",
    actorUsername: "planner",
    status: "CANCELLED",
    solverStatus: "CANCELLED",
    versionId: null,
    failureReason: "JOB_CANCELLED",
    errorMessage: "Cancelled by planner",
    createdAt: "2026-06-18T00:00:00Z",
    completedAt: "2026-06-18T00:12:00Z",
  });
  mockedRetryScheduleJob.mockResolvedValue({
    jobId: "job-retry",
    scenarioName: "Snow Beer failed sample",
    actorUsername: "planner",
    status: "QUEUED",
    solverStatus: "QUEUED",
    versionId: null,
    failureReason: null,
    errorMessage: null,
    createdAt: "2026-06-18T00:30:00Z",
    completedAt: null,
  });
```

Add this test in `describe("App", () => { ... })`:

```ts
  it("opens the native schedule jobs center from the left rail", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));

    expect(await screen.findByRole("heading", { name: "排程任务中心" })).toBeInTheDocument();
    expect(mockedFetchScheduleJobs).toHaveBeenCalledWith(20);
    expect(screen.getByText("Snow Beer running sample")).toBeInTheDocument();
    expect(screen.getByText("Snow Beer failed sample")).toBeInTheDocument();
    expect(screen.getByText("No feasible schedule")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看版本 ver-1" })).toHaveAttribute("href", "http://127.0.0.1:8081/");
  });

  it("cancels and retries jobs from the native schedule jobs center", async () => {
    render(<App />);

    await screen.findByRole("heading", { name: "智能排产工作台" });
    await userEvent.click(screen.getByRole("button", { name: "排程任务" }));
    await userEvent.click(await screen.findByRole("button", { name: "取消 job-running" }));
    await userEvent.click(await screen.findByRole("button", { name: "重试 job-failed" }));

    expect(mockedCancelScheduleJob).toHaveBeenCalledWith("job-running");
    expect(mockedRetryScheduleJob).toHaveBeenCalledWith("job-failed");
    expect(await screen.findByText("job-retry")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run App tests and verify RED**

Run:

```bash
rtk npm test --prefix frontend -- src/App.test.tsx --run
```

Expected: compile failure because new API exports or `ScheduleJobsPanel` are not wired into the app.

- [ ] **Step 3: Add the jobs panel component**

Create `frontend/src/features/workspace/ScheduleJobsPanel.tsx`:

```tsx
import { PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Space, Spin, Tag } from "antd";
import { resolveLegacyUiUrl, type ScheduleJobResponse } from "../../lib/api";
import { useScheduleJobs } from "./useScheduleJobs";

const activeStatuses = new Set(["CREATED", "QUEUED", "RUNNING"]);
const retryableStatuses = new Set(["FAILED", "TIMEOUT", "CANCELLED"]);

function statusColor(status: string) {
  if (status === "SUCCEEDED") {
    return "green";
  }
  if (retryableStatuses.has(status)) {
    return "red";
  }
  if (activeStatuses.has(status)) {
    return "blue";
  }
  return "default";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "未完成";
  }
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function JobRow({
  actionPendingKey,
  job,
  onCancel,
  onRetry,
}: {
  actionPendingKey: string | null;
  job: ScheduleJobResponse;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
}) {
  const canCancel = activeStatuses.has(job.status);
  const canRetry = retryableStatuses.has(job.status);

  return (
    <article className="jobs-table-row" aria-label={`任务 ${job.jobId}`}>
      <div className="jobs-cell jobs-cell-main">
        <strong>{job.scenarioName ?? "未命名场景"}</strong>
        <span>{job.jobId}</span>
      </div>
      <div className="jobs-cell">
        <Tag color={statusColor(job.status)}>{job.status}</Tag>
        <span>{job.solverStatus ?? "无 solver 状态"}</span>
      </div>
      <div className="jobs-cell">
        <span>{job.actorUsername ?? "未知用户"}</span>
        <span>{formatDateTime(job.createdAt)}</span>
      </div>
      <div className="jobs-cell">
        <span>{job.versionId ?? "暂无版本"}</span>
        <span>{job.errorMessage ?? job.failureReason ?? "无异常信息"}</span>
      </div>
      <div className="jobs-cell jobs-actions">
        {canCancel && (
          <Button
            aria-label={`取消 ${job.jobId}`}
            loading={actionPendingKey === `cancel:${job.jobId}`}
            onClick={() => onCancel(job.jobId)}
            size="small"
          >
            取消
          </Button>
        )}
        {canRetry && (
          <Button
            aria-label={`重试 ${job.jobId}`}
            loading={actionPendingKey === `retry:${job.jobId}`}
            onClick={() => onRetry(job.jobId)}
            size="small"
          >
            重试
          </Button>
        )}
        {job.status === "SUCCEEDED" && job.versionId && (
          <Button href={resolveLegacyUiUrl()} size="small" target="_blank" rel="noreferrer">
            查看版本 {job.versionId}
          </Button>
        )}
      </div>
    </article>
  );
}

export function ScheduleJobsPanel() {
  const jobsState = useScheduleJobs();

  return (
    <section className="schedule-jobs-panel" aria-label="排程任务中心">
      <div className="jobs-header dashboard-card">
        <div>
          <p className="eyebrow">调度执行</p>
          <h1>排程任务中心</h1>
          <span>查看最近排程任务，跟踪求解状态，并处理取消或重试。</span>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void jobsState.reload()}>
            刷新
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            loading={jobsState.actionPendingKey === "sample"}
            onClick={() => void jobsState.runSample()}
            type="primary"
          >
            运行样例排程
          </Button>
        </Space>
      </div>

      <div className="jobs-summary-row" aria-label="任务状态摘要">
        <div className="dashboard-card jobs-summary-card">
          <strong>{jobsState.activeJobCount}</strong>
          <span>运行中</span>
        </div>
        <div className="dashboard-card jobs-summary-card">
          <strong>{jobsState.succeededJobCount}</strong>
          <span>已成功</span>
        </div>
        <div className="dashboard-card jobs-summary-card">
          <strong>{jobsState.failedJobCount}</strong>
          <span>需处理</span>
        </div>
      </div>

      {jobsState.error && (
        <Alert
          action={<Button onClick={() => void jobsState.reload()} size="small">重试</Button>}
          message="排程任务暂不可用"
          description={jobsState.error}
          showIcon
          type="error"
        />
      )}
      {jobsState.actionError && <Alert message={jobsState.actionError} showIcon type="warning" />}

      <div className="dashboard-card jobs-table-card">
        {jobsState.loading && (
          <div className="workspace-loading" role="status">
            <Spin />
            <span>正在加载排程任务...</span>
          </div>
        )}
        {!jobsState.loading && jobsState.jobs.length === 0 && (
          <Empty description="暂无排程任务">
            <Button onClick={() => void jobsState.runSample()} type="primary">运行样例排程</Button>
          </Empty>
        )}
        {!jobsState.loading && jobsState.jobs.length > 0 && (
          <div className="jobs-table" role="table" aria-label="最近排程任务">
            <div className="jobs-table-head" role="row">
              <span>场景 / 任务</span>
              <span>状态</span>
              <span>提交人 / 时间</span>
              <span>版本 / 异常</span>
              <span>操作</span>
            </div>
            {jobsState.jobs.map((job) => (
              <JobRow
                actionPendingKey={jobsState.actionPendingKey}
                job={job}
                key={job.jobId}
                onCancel={(jobId) => void jobsState.cancelJob(jobId)}
                onRetry={(jobId) => void jobsState.retryJob(jobId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire App navigation**

Update imports in `frontend/src/App.tsx`:

```ts
import { ScheduleJobsPanel } from "./features/workspace/ScheduleJobsPanel";
```

Replace the authenticated render block with:

```tsx
        {!dashboardData.loading && dashboardData.authenticated && dashboardData.summary && (
          activeWorkspaceKey === "jobs" ? (
            <ScheduleJobsPanel />
          ) : (
            <WorkspaceDashboard
              activeToolLabel={activeToolLabel}
              activeWorkspaceLabel={activeWorkspaceLabel}
              summary={dashboardData.summary}
              onRefresh={dashboardData.reload}
            />
          )
        )}
```

- [ ] **Step 5: Add focused jobs panel styles**

Append to `frontend/src/styles.css`:

```css
.schedule-jobs-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.jobs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.jobs-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  line-height: 1.2;
}

.jobs-header span {
  color: var(--color-text-secondary);
}

.jobs-summary-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.jobs-summary-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 88px;
}

.jobs-summary-card strong {
  color: var(--color-text-primary);
  font-size: 28px;
  line-height: 1;
}

.jobs-summary-card span {
  color: var(--color-text-secondary);
}

.jobs-table-card {
  overflow: hidden;
}

.jobs-table {
  display: flex;
  flex-direction: column;
}

.jobs-table-head,
.jobs-table-row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr 1.2fr 1fr;
  gap: 12px;
  align-items: center;
}

.jobs-table-head {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  padding: 0 0 10px;
}

.jobs-table-row {
  border-top: 1px solid var(--color-border);
  min-height: 76px;
  padding: 12px 0;
}

.jobs-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.jobs-cell span,
.jobs-cell strong {
  overflow-wrap: anywhere;
}

.jobs-cell-main strong {
  color: var(--color-text-primary);
}

.jobs-cell-main span,
.jobs-cell span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.jobs-actions {
  align-items: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
}

@media (max-width: 900px) {
  .jobs-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .jobs-summary-row {
    grid-template-columns: 1fr;
  }

  .jobs-table-head {
    display: none;
  }

  .jobs-table-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run App tests and verify GREEN**

Run:

```bash
rtk npm test --prefix frontend -- src/App.test.tsx --run
```

Expected: App tests pass.

- [ ] **Step 7: Commit jobs panel**

Run:

```bash
rtk git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/features/workspace/ScheduleJobsPanel.tsx frontend/src/styles.css
rtk git commit -m "feat: add React schedule jobs center"
```

---

### Task 6: Regression Verification and Graph Update

**Files:**
- No new source files.
- Graphify output may update under `graphify-out/`.

- [ ] **Step 1: Run frontend tests**

Run:

```bash
rtk npm test --prefix frontend -- --run
```

Expected: all frontend tests pass.

- [ ] **Step 2: Run frontend build**

Run:

```bash
rtk npm run build --prefix frontend
```

Expected: TypeScript and Vite build pass. A Vite chunk-size warning is acceptable if the build exits 0.

- [ ] **Step 3: Run focused backend tests**

Run:

```bash
rtk mvn -f backend/pom.xml -Dtest=PostgresScheduleStoreTest,SchedulingJobServiceTest,ScheduleJobControllerTest test
```

Expected: focused backend tests pass.

- [ ] **Step 4: Run backend full test suite**

Run:

```bash
rtk mvn -f backend/pom.xml test
```

Expected: backend test suite passes.

- [ ] **Step 5: Run graphify update after code changes**

Run:

```bash
rtk graphify update .
```

Expected: graphify completes and refreshes `graphify-out/` without API cost.

- [ ] **Step 6: Inspect final status and diff**

Run:

```bash
rtk git status --short
rtk git diff --check
```

Expected: only intended graphify output remains unstaged if graphify changed tracked files; `git diff --check` exits 0.

- [ ] **Step 7: Commit graph update if tracked graph files changed**

If `rtk git status --short` shows tracked changes under `graphify-out/`, run:

```bash
rtk git add graphify-out
rtk git commit -m "chore: update graphify after jobs center"
```

Expected: graph update is committed separately from product code.
