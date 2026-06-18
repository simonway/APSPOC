import { describe, expect, it } from "vitest";
import { createDashboardSummary } from "./dashboardModel";

const versions = [
  {
    versionId: "v1",
    versionName: "Snow Beer baseline",
    status: "RELEASED",
    triggerType: "SAMPLE",
    scenarioDescription: "Released Snow Beer sample",
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
