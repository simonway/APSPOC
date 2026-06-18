import type { ReactNode } from "react";
import type { DashboardSummary } from "../features/workspace/dashboardModel";
import type { RightToolKey, WorkspaceNavKey } from "../features/workspace/workspaceNavigation";
import { LeftNavRail } from "./LeftNavRail";
import { RightToolRail } from "./RightToolRail";
import { TopNav } from "./TopNav";

interface AppShellProps {
  activeWorkspaceKey: WorkspaceNavKey;
  activeToolKey: RightToolKey;
  children: ReactNode;
  summary: DashboardSummary | null;
  onRefresh: () => void;
  onWorkspaceSelect: (key: WorkspaceNavKey) => void;
  onToolSelect: (key: RightToolKey) => void;
}

export function AppShell({
  activeToolKey,
  activeWorkspaceKey,
  children,
  summary,
  onRefresh,
  onToolSelect,
  onWorkspaceSelect,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace-main">跳到主工作区</a>
      <TopNav activeWorkspaceKey={activeWorkspaceKey} summary={summary} onRefresh={onRefresh} onWorkspaceSelect={onWorkspaceSelect} />
      <div className="app-body">
        <LeftNavRail activeWorkspaceKey={activeWorkspaceKey} onWorkspaceSelect={onWorkspaceSelect} />
        <main id="workspace-main" className="workspace-main" aria-label="APS 工作区">
          {children}
        </main>
        <RightToolRail activeToolKey={activeToolKey} onToolSelect={onToolSelect} />
      </div>
    </div>
  );
}
