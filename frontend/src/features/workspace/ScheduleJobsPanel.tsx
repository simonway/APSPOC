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
