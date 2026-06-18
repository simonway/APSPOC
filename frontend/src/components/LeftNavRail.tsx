import type { ReactNode } from "react";
import {
  AuditOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";
import { leftRailItems, type WorkspaceNavKey } from "../features/workspace/workspaceNavigation";

const itemIcons: Record<string, ReactNode> = {
  workspace: <DashboardOutlined />,
  import: <CloudUploadOutlined />,
  scenario: <PartitionOutlined />,
  jobs: <DeploymentUnitOutlined />,
  gantt: <BarChartOutlined />,
  versions: <DatabaseOutlined />,
  approval: <CheckCircleOutlined />,
  audit: <AuditOutlined />,
};

interface LeftNavRailProps {
  activeWorkspaceKey: WorkspaceNavKey;
  onWorkspaceSelect: (key: WorkspaceNavKey) => void;
}

export function LeftNavRail({ activeWorkspaceKey, onWorkspaceSelect }: LeftNavRailProps) {
  return (
    <aside className="left-nav-rail" aria-label="主模块导航">
      {leftRailItems.map((item) => (
        <Tooltip key={item.key} title={item.label} placement="right">
          <button
            className={`rail-icon-button${activeWorkspaceKey === item.key ? " active" : ""}`}
            type="button"
            aria-label={item.label}
            aria-pressed={activeWorkspaceKey === item.key}
            onClick={() => onWorkspaceSelect(item.key)}
          >
            {itemIcons[item.key]}
          </button>
        </Tooltip>
      ))}
    </aside>
  );
}
