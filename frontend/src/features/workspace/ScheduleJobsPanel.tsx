import { useRef, useState } from "react";
import { PlayCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Space, Spin, Tag } from "antd";
import { fetchVersion, resolveLegacyUiUrl, type ScheduleJobResponse, type VersionSummaryResponse } from "../../lib/api";
import { useScheduleJobs } from "./useScheduleJobs";

const activeStatuses = new Set(["CREATED", "QUEUED", "RUNNING"]);
const retryableStatuses = new Set(["FAILED", "TIMEOUT", "CANCELLED"]);
const statusColors: Record<string, string> = { CREATED: "default", QUEUED: "blue", RUNNING: "processing", SUCCEEDED: "green", FAILED: "red", TIMEOUT: "orange", CANCELLED: "default" };

function formatDateTime(value: string | null) {
  if (!value) return "未完成";
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function VersionDetail({ detail, detailError, detailLoading, job, onRetry }: { detail: VersionSummaryResponse | null; detailError: string | null; detailLoading: boolean; job: ScheduleJobResponse; onRetry: () => void }) {
  return <div className="jobs-version-detail" aria-label={`版本详情 ${job.versionId}`}>
    {detailLoading && <div className="jobs-detail-loading" role="status"><Spin size="small" /><span>正在加载版本详情...</span></div>}
    {detailError && <Alert action={<Button onClick={onRetry} size="small">重试</Button>} description={detailError} message="版本详情暂不可用" showIcon type="error" />}
    {detail && <>
      <div className="jobs-detail-header"><div><p className="eyebrow">版本评审</p><h2>{detail.versionName}</h2><span>{detail.versionId} · {detail.scenarioDescription ?? "暂无场景说明"}</span></div><Tag color={statusColors[detail.status] ?? "default"}>{detail.status}</Tag></div>
      <dl className="jobs-detail-grid">
        <div><dt>版本 ID</dt><dd>{detail.versionId}</dd></div><div><dt>版本名称</dt><dd>{detail.versionName}</dd></div><div><dt>版本状态</dt><dd>版本状态：{detail.status}</dd></div><div><dt>场景</dt><dd>{detail.scenarioDescription ?? "暂无场景说明"}</dd></div>
        <div><dt>创建人 / 时间</dt><dd>{detail.createdBy ?? "未知用户"} · {formatDateTime(detail.createdAt)}</dd></div><div><dt>Solver 状态</dt><dd>{job.solverStatus ?? "无 solver 状态"}</dd></div><div><dt>总加权延期</dt><dd>总加权延期：{detail.totalWeightedTardiness}</dd></div><div><dt>总完工时间</dt><dd>总完工时间：{detail.totalMakespan}</dd></div><div><dt>延期任务数</dt><dd>延期任务数：{detail.lateTaskCount}</dd></div><div><dt>平均利用率</dt><dd>平均利用率：{Math.round(detail.averageUtilization * 100)}%</dd></div>
      </dl>
      {detail.releaseNote && <p className="jobs-release-note">发布说明：{detail.releaseNote}</p>}
      <a className="legacy-inline-link" href={resolveLegacyUiUrl()} target="_blank" rel="noreferrer">进入旧版控制台 / Gantt</a>
    </>}
  </div>;
}

function JobRow({ actionPendingKeys, canManageJobs, expanded, job, onCancel, onRetry, onShowVersion }: { actionPendingKeys: string[]; canManageJobs: boolean; expanded: boolean; job: ScheduleJobResponse; onCancel: (jobId: string) => void; onRetry: (jobId: string) => void; onShowVersion: (job: ScheduleJobResponse) => void }) {
  return <article className="jobs-table-row" aria-label={`任务 ${job.jobId}`} role="row">
    <div className="jobs-cell jobs-cell-main"><strong>{job.scenarioName ?? "未命名场景"}</strong><span>{job.jobId}</span></div><div className="jobs-cell"><Tag color={statusColors[job.status] ?? "default"}>{job.status}</Tag><span>{job.solverStatus ?? "无 solver 状态"}</span></div><div className="jobs-cell"><span>{job.actorUsername ?? "未知用户"}</span><span>{formatDateTime(job.createdAt)}</span></div><div className="jobs-cell"><span>{job.versionId ?? "暂无版本"}</span><span>{job.errorMessage ?? job.failureReason ?? "无异常信息"}</span></div>
    <div className="jobs-cell jobs-actions">{canManageJobs && activeStatuses.has(job.status) && <Button aria-label={`取消 ${job.jobId}`} loading={actionPendingKeys.includes(`cancel:${job.jobId}`)} onClick={() => onCancel(job.jobId)} size="small">取消</Button>}{canManageJobs && retryableStatuses.has(job.status) && <Button aria-label={`重试 ${job.jobId}`} loading={actionPendingKeys.includes(`retry:${job.jobId}`)} onClick={() => onRetry(job.jobId)} size="small">重试</Button>}{job.status === "SUCCEEDED" && job.versionId && <Button aria-expanded={expanded} onClick={() => onShowVersion(job)} size="small">{expanded ? "收起版本" : `查看版本 ${job.versionId}`}</Button>}</div>
  </article>;
}

export function ScheduleJobsPanel({ role }: { role: string }) {
  const jobsState = useScheduleJobs();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VersionSummaryResponse | null>(null);
  const [detailJob, setDetailJob] = useState<ScheduleJobResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestRef = useRef(0);
  const canManageJobs = ["ADMIN", "PLANNER"].includes(role.toUpperCase());
  async function loadVersion(job: ScheduleJobResponse) {
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setDetailJob(job); setDetail(null); setDetailError(null); setDetailLoading(true);
    try {
      const nextDetail = await fetchVersion(job.versionId as string);
      if (detailRequestRef.current === requestId) setDetail(nextDetail);
    } catch (error) {
      if (detailRequestRef.current === requestId) setDetailError(error instanceof Error ? error.message : "无法加载版本详情");
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  }

  function showVersion(job: ScheduleJobResponse) {
    if (expandedJobId === job.jobId) { setExpandedJobId(null); return; }
    setExpandedJobId(job.jobId);
    void loadVersion(job);
  }

  return <section className="schedule-jobs-panel" aria-label="排程任务中心">
    <div className="jobs-header dashboard-card"><div><p className="eyebrow">调度执行</p><h1>排程任务中心</h1><span>查看最近排程任务，跟踪求解状态，并处理取消或重试。</span></div><Space wrap><Button icon={<ReloadOutlined />} onClick={() => void jobsState.reload()}>刷新</Button>{canManageJobs && <Button icon={<PlayCircleOutlined />} loading={jobsState.actionPendingKeys.includes("sample")} onClick={() => void jobsState.runSample()} type="primary">运行样例排程</Button>}</Space></div>
    <div className="jobs-summary-row" aria-label="任务状态摘要"><div className="dashboard-card jobs-summary-card"><strong>{jobsState.activeJobCount}</strong><span>运行中</span></div><div className="dashboard-card jobs-summary-card"><strong>{jobsState.succeededJobCount}</strong><span>已成功</span></div><div className="dashboard-card jobs-summary-card"><strong>{jobsState.failedJobCount}</strong><span>需处理</span></div></div>
    {jobsState.error && <Alert action={<Button onClick={() => void jobsState.reload()} size="small">重试</Button>} message="排程任务暂不可用" description={jobsState.error} showIcon type="error" />}{jobsState.actionError && <Alert message={jobsState.actionError} showIcon type="warning" />}{jobsState.pollingError && <Alert action={<Button aria-label="刷新任务状态" onClick={() => void jobsState.reload()} size="small">刷新</Button>} message={jobsState.pollingError} showIcon type="warning" />}
    <div className="dashboard-card jobs-table-card">{jobsState.loading && <div className="workspace-loading" role="status"><Spin /><span>正在加载排程任务...</span></div>}{!jobsState.loading && !jobsState.error && jobsState.jobs.length === 0 && <Empty description="暂无排程任务">{canManageJobs && <Button onClick={() => void jobsState.runSample()} type="primary">运行样例排程</Button>}</Empty>}{!jobsState.loading && jobsState.jobs.length > 0 && <div className="jobs-table" role="table" aria-label="最近排程任务"><div className="jobs-table-head" role="row"><span>场景 / 任务</span><span>状态 / Solver</span><span>提交人 / 时间</span><span>版本 / 异常</span><span>操作</span></div>{jobsState.jobs.map((job) => <JobRow actionPendingKeys={jobsState.actionPendingKeys} canManageJobs={canManageJobs} expanded={expandedJobId === job.jobId} job={job} key={job.jobId} onCancel={(jobId) => void jobsState.cancelJob(jobId)} onRetry={(jobId) => void jobsState.retryJob(jobId)} onShowVersion={(nextJob) => void showVersion(nextJob)} />)}{expandedJobId && detailJob && <VersionDetail detail={detail} detailError={detailError} detailLoading={detailLoading} job={detailJob} onRetry={() => void loadVersion(detailJob)} />}</div>}</div>
  </section>;
}
