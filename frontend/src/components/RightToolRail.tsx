import type { ReactNode } from "react";
import { AlertOutlined, CheckSquareOutlined, CommentOutlined, CustomerServiceOutlined, ExperimentOutlined, RobotOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { rightToolItems, type RightToolKey } from "../features/workspace/workspaceNavigation";

const toolIcons: Record<string, ReactNode> = {
  explain: <RobotOutlined />,
  alerts: <AlertOutlined />,
  support: <CustomerServiceOutlined />,
  regression: <ExperimentOutlined />,
  "release-check": <CheckSquareOutlined />,
  feedback: <CommentOutlined />,
};

interface RightToolRailProps {
  activeToolKey: RightToolKey;
  onToolSelect: (key: RightToolKey) => void;
}

export function RightToolRail({ activeToolKey, onToolSelect }: RightToolRailProps) {
  return (
    <aside className="right-tool-rail" aria-label="快捷工具">
      {rightToolItems.map((tool) => (
        <Tooltip key={tool.key} title={tool.label} placement="left">
          <button
            className={`right-tool-button${activeToolKey === tool.key ? " active" : ""}`}
            type="button"
            aria-label={tool.label}
            aria-pressed={activeToolKey === tool.key}
            onClick={() => onToolSelect(tool.key)}
          >
            {toolIcons[tool.key]}
          </button>
        </Tooltip>
      ))}
    </aside>
  );
}
