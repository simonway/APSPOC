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
    publishedVersions: input.versions.filter((version) => version.status === "RELEASED").length,
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
