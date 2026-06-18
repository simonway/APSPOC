import { BarChartOutlined, CloudUploadOutlined, DeploymentUnitOutlined, PlayCircleOutlined, RocketOutlined } from "@ant-design/icons";
import { Button, Space, Tag } from "antd";
import { resolveLegacyUiUrl } from "../../lib/api";
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
    <div className="workspace-dashboard-shell">
      <div className="tabs-line" role="tablist" aria-label="工作台页面">
        <button className="home-tab" role="tab" aria-selected="true" type="button">首页</button>
      </div>

      <section className="workspace-dashboard" aria-label="工作台首页">
        <div className="dashboard-main-column">
          <section className="message-card message-card-compact dashboard-card" aria-label="用户消息和计划概览">
            <div className="message-card-summary">
              <div className="profile-block">
                <div className="profile-avatar" aria-hidden="true">{summary.userName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <p className="eyebrow">欢迎回来，{summary.userName}</p>
                  <h1 className="workspace-title-compact">智能排产工作台</h1>
                  <span>{summary.userRole} · {summary.refreshedAtText}</span>
                  <div className="health-pill" aria-label={`后端 ${summary.backendStatus}`}>
                    后端 {summary.backendStatus}
                  </div>
                </div>
              </div>
              <div className="message-metrics">
                <div>
                  <strong>{summary.totalVersions}</strong>
                  <span>排程版本</span>
                </div>
                <div>
                  <strong>{summary.publishedVersions}</strong>
                  <span>已发布</span>
                </div>
                <div>
                  <strong>{summary.draftVersions}</strong>
                  <span>草稿</span>
                </div>
                <div>
                  <strong>{summary.averageUtilizationPercent}%</strong>
                  <span>平均利用率</span>
                </div>
              </div>
            </div>

            <section className="kpi-card-row" aria-label="排程状态指标">
              <article className="kpi-card kpi-card-blue">
                <span>待排程任务</span>
                <strong>{summary.draftVersions}</strong>
                <p>草稿版本待处理</p>
              </article>
              <article className="kpi-card kpi-card-amber">
                <span>排程通知</span>
                <strong>{summary.releaseQueueVersions}</strong>
                <p>等待审批发布</p>
              </article>
              <article className="kpi-card kpi-card-red">
                <span>预警 / 冲突</span>
                <strong>{summary.alertVersionCount}</strong>
                <p>{summary.totalLateTasks} 个延期任务</p>
              </article>
            </section>
          </section>

          <section className="dashboard-card quick-app-card">
            <h2>快捷应用</h2>
            <div className="quick-action-grid">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  className="quick-action-button"
                  href={resolveLegacyUiUrl()}
                  icon={<span aria-hidden="true">{action.icon}</span>}
                  rel="noreferrer"
                  target="_blank"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-side-column" aria-label="工作台右侧信息栏">
          <section className="dashboard-card value-banner-card">
            <p>APS 智能排产</p>
            <h2>让计划可视、可算、可追溯</h2>
            <Space wrap>
              {["需求", "库存", "产能", "约束", "排程", "版本", "审批", "发布"].map((keyword) => (
                <Tag key={keyword}>{keyword}</Tag>
              ))}
            </Space>
          </section>
          <section className="dashboard-card compact-info-card">
            <h2>排程任务</h2>
            <strong>{summary.latestVersionName}</strong>
            <span>最新版本状态：{summary.latestVersionStatus}</span>
            <span>平均利用率：{summary.averageUtilizationPercent}%</span>
          </section>
          <section className="dashboard-card compact-info-card">
            <h2>公告与发布状态</h2>
            <strong>{summary.backendService} · 后端 {summary.backendStatus}</strong>
            <span>{summary.planningNotice}</span>
          </section>
        </aside>
      </section>
    </div>
  );
}
