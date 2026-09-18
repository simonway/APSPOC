import { BarChartOutlined, BellOutlined, CloudUploadOutlined, DeploymentUnitOutlined, FileSearchOutlined, PlayCircleOutlined, RocketOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Space, Tag } from "antd";
import { resolveLegacyUiUrl, resolveModelImportTemplateUrl } from "../../lib/api";
import type { DashboardSummary } from "./dashboardModel";
import { useSampleScheduleAction } from "./useSampleScheduleAction";

interface WorkspaceDashboardProps {
  activeWorkspaceLabel: string;
  activeToolLabel: string;
  summary: DashboardSummary;
  onRefresh: () => void;
  onOpenImport: () => void;
  onOpenScenario: () => void;
  onOpenJobs: () => void;
}

export function WorkspaceDashboard({ activeToolLabel, activeWorkspaceLabel, summary, onRefresh, onOpenImport, onOpenScenario, onOpenJobs }: WorkspaceDashboardProps) {
  const sampleSchedule = useSampleScheduleAction({ onCompleted: onRefresh });

  return (
    <div className="workspace-dashboard-shell">
      <div className="tabs-line" role="tablist" aria-label="工作台页面">
        <button className="home-tab" role="tab" aria-selected="true" type="button">首页</button>
      </div>

      <section className="workspace-dashboard" aria-label="工作台首页">
        <div className="dashboard-main-column">
          <section className="dashboard-card workspace-page-header" aria-label="工作台页面标题">
            <div className="workspace-context-row" aria-label="当前工作台上下文">
              <Tag color="blue">当前模块：{activeWorkspaceLabel}</Tag>
              <Tag color="geekblue">当前工具：{activeToolLabel}</Tag>
            </div>
            <div className="workspace-page-header-content">
              <div>
                <p className="eyebrow">欢迎回来，{summary.userName}</p>
                <h1>智能排产工作台</h1>
                <p className="workspace-page-description">统一查看排程版本、业务状态和下一步计划动作。</p>
                <span className="workspace-page-meta">{summary.userRole} · 最近更新 {summary.refreshedAtText}</span>
                <span className="health-pill" aria-label={`后端 ${summary.backendStatus}`}>后端 {summary.backendStatus}</span>
              </div>
              <div className="workspace-page-actions">
                <Button type="primary" icon={<span aria-hidden="true"><PlayCircleOutlined /></span>} loading={sampleSchedule.pending} onClick={sampleSchedule.runSample}>
                  运行排程
                </Button>
                <Button aria-label="刷新工作台" onClick={onRefresh}>刷新</Button>
              </div>
            </div>
          </section>

          <section className="dashboard-card dashboard-section" aria-label="核心指标">
            <h2>核心指标</h2>
            <div className="message-metrics">
              <div><strong>{summary.totalVersions}</strong><span>排程版本</span></div>
              <div><strong>{summary.publishedVersions}</strong><span>已发布</span></div>
              <div><strong>{summary.draftVersions}</strong><span>草稿</span></div>
              <div><strong>{summary.averageUtilizationPercent}%</strong><span>平均利用率</span></div>
            </div>
          </section>

          <section className="dashboard-card dashboard-section" aria-label="业务状态">
            <div className="section-heading-row"><h2>业务状态</h2><Button type="link" onClick={onOpenJobs}>查看排程任务</Button></div>
            <div className="status-overview-grid">
              <article className="status-overview-card status-info"><FileSearchOutlined aria-hidden="true" /><div><span>待排程任务</span><strong>{summary.draftVersions}</strong><p>草稿版本待处理</p></div></article>
              <article className="status-overview-card status-warning"><BellOutlined aria-hidden="true" /><div><span>排程通知</span><strong>{summary.releaseQueueVersions}</strong><p>等待审批发布</p></div></article>
              <article className="status-overview-card status-danger"><WarningOutlined aria-hidden="true" /><div><span>预警 / 冲突</span><strong>{summary.alertVersionCount}</strong><p>{summary.totalLateTasks} 个延期任务</p></div></article>
            </div>
          </section>

          <section className="dashboard-card quick-app-card" aria-label="快捷应用">
            <h2>快捷应用</h2>
            <div className="quick-action-grid">
              <Button
                className="quick-action-button"
                href={resolveModelImportTemplateUrl()}
                icon={<span aria-hidden="true"><CloudUploadOutlined /></span>}
              >
                下载导入模板
              </Button>
              <Button className="quick-action-button" icon={<span aria-hidden="true"><DeploymentUnitOutlined /></span>} onClick={onOpenImport}>数据导入</Button>
              <Button className="quick-action-button" icon={<span aria-hidden="true"><DeploymentUnitOutlined /></span>} onClick={onOpenScenario}>场景生成</Button>
              <Button className="quick-action-button" icon={<span aria-hidden="true"><BarChartOutlined /></span>} onClick={onOpenJobs}>查看排程任务</Button>
              <Button className="quick-action-button" href={resolveLegacyUiUrl()} icon={<span aria-hidden="true"><RocketOutlined /></span>} rel="noreferrer" target="_blank">版本发布（旧版控制台）</Button>
            </div>
            {sampleSchedule.job && (
              <Alert
                className="sample-job-feedback"
                type={sampleSchedule.job.status === "FAILED" ? "error" : "info"}
                showIcon
                message={`任务 ${sampleSchedule.job.jobId} 已受理，状态 ${sampleSchedule.job.status}`}
                description={sampleSchedule.job.versionId ? `生成版本：${sampleSchedule.job.versionId}` : undefined}
              />
            )}
            {sampleSchedule.error && <Alert className="sample-job-feedback" type="error" showIcon message={sampleSchedule.error} />}
          </section>
        </div>

        <aside className="dashboard-side-column" aria-label="工作台右侧信息栏">
          <section className="dashboard-card value-banner-card">
            <p>APS 智能排产</p>
            <h2>当前排程状态</h2>
            <Space wrap>
              <Tag color="processing">{summary.latestVersionStatus}</Tag>
            </Space>
            <span className="side-summary-hint">{summary.planningNotice}</span>
          </section>
          <section className="dashboard-card compact-info-card">
            <h2>排程任务</h2>
            <strong>{summary.latestVersionName}</strong>
            <span>最新版本状态：{summary.latestVersionStatus}</span>
            <span>{summary.sampleJobHint}</span>
          </section>
          <section className="dashboard-card compact-info-card">
            <h2>发布队列</h2>
            <strong>{summary.latestReleaseCandidateName}</strong>
            <span>{summary.releaseQueueNotice}</span>
            <span>最新已发布：{summary.latestPublishedVersionName}</span>
          </section>
          <section className="dashboard-card compact-info-card">
            <h2>审计与治理</h2>
            <strong>{summary.backendService} · 后端 {summary.backendStatus}</strong>
            <span>{summary.auditNotice}</span>
            <a className="legacy-inline-link" href={resolveLegacyUiUrl()} target="_blank" rel="noreferrer">进入旧版治理控制台</a>
          </section>
        </aside>
      </section>
    </div>
  );
}
