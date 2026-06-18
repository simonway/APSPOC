import { useState } from "react";
import { Alert, Button, ConfigProvider, Spin } from "antd";
import zhCN from "antd/locale/zh_CN";
import { AppShell } from "./components/AppShell";
import { LoginPanel } from "./features/workspace/LoginPanel";
import { WorkspaceDashboard } from "./features/workspace/WorkspaceDashboard";
import { useDashboardData } from "./features/workspace/useDashboardData";
import { leftRailItems, rightToolItems, workspaceNavItems, type RightToolKey, type WorkspaceNavKey } from "./features/workspace/workspaceNavigation";
import "./styles.css";

export default function App() {
  const dashboardData = useDashboardData();
  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<WorkspaceNavKey>("workspace");
  const [activeToolKey, setActiveToolKey] = useState<RightToolKey>("release-check");
  const activeWorkspaceLabel =
    leftRailItems.find((item) => item.key === activeWorkspaceKey)?.label
    ?? workspaceNavItems.find((item) => item.key === activeWorkspaceKey)?.label
    ?? "工作台";
  const activeToolLabel = rightToolItems.find((item) => item.key === activeToolKey)?.label ?? "发布检查";

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: "#2563EB", borderRadius: 14 } }}>
      <AppShell
        activeToolKey={activeToolKey}
        activeWorkspaceKey={activeWorkspaceKey}
        summary={dashboardData.summary}
        onRefresh={dashboardData.reload}
        onToolSelect={setActiveToolKey}
        onWorkspaceSelect={setActiveWorkspaceKey}
      >
        {dashboardData.loading && (
          <div className="workspace-loading" role="status">
            <Spin size="large" />
            <span>正在连接 APS 后端...</span>
          </div>
        )}

        {!dashboardData.loading && !dashboardData.authenticated && !dashboardData.error && (
          <LoginPanel pending={dashboardData.loginPending} error={dashboardData.loginError} onLogin={dashboardData.login} />
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

        {!dashboardData.loading && dashboardData.authenticated && dashboardData.summary && (
          <WorkspaceDashboard
            activeToolLabel={activeToolLabel}
            activeWorkspaceLabel={activeWorkspaceLabel}
            summary={dashboardData.summary}
            onRefresh={dashboardData.reload}
          />
        )}
      </AppShell>
    </ConfigProvider>
  );
}
