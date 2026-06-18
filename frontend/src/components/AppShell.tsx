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
      <a className="skip-link" href="#workspace-main">跳到主工作区</a>
      <TopNav summary={summary} onRefresh={onRefresh} />
      <div className="app-body">
        <LeftNavRail />
        <main id="workspace-main" className="workspace-main" aria-label="APS 工作区">
          {children}
        </main>
        <RightToolRail />
      </div>
    </div>
  );
}
