import { AlertOutlined, CheckSquareOutlined, CommentOutlined, CustomerServiceOutlined, ExperimentOutlined, RobotOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

const tools = [
  { label: "排程解释", icon: <RobotOutlined /> },
  { label: "预警", icon: <AlertOutlined /> },
  { label: "帮助", icon: <CustomerServiceOutlined /> },
  { label: "回归状态", icon: <ExperimentOutlined /> },
  { label: "发布检查", icon: <CheckSquareOutlined /> },
  { label: "快速反馈", icon: <CommentOutlined /> },
];

export function RightToolRail() {
  return (
    <aside className="right-tool-rail" aria-label="快捷工具">
      {tools.map((tool) => (
        <Tooltip key={tool.label} title={tool.label} placement="left">
          <button className="right-tool-button" type="button" aria-label={tool.label}>
            {tool.icon}
          </button>
        </Tooltip>
      ))}
    </aside>
  );
}
