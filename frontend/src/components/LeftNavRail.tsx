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

const items = [
  { key: "workspace", icon: <DashboardOutlined />, label: "工作台" },
  { key: "import", icon: <CloudUploadOutlined />, label: "数据导入" },
  { key: "scenario", icon: <PartitionOutlined />, label: "场景生成" },
  { key: "jobs", icon: <DeploymentUnitOutlined />, label: "排程任务" },
  { key: "gantt", icon: <BarChartOutlined />, label: "Gantt 评审" },
  { key: "versions", icon: <DatabaseOutlined />, label: "版本管理" },
  { key: "approval", icon: <CheckCircleOutlined />, label: "审批发布" },
  { key: "audit", icon: <AuditOutlined />, label: "审计 / 设置" },
];

export function LeftNavRail() {
  return (
    <aside className="left-nav-rail" aria-label="主模块导航">
      {items.map((item) => (
        <Tooltip key={item.key} title={item.label} placement="right">
          <button className={`rail-icon-button${item.key === "workspace" ? " active" : ""}`} type="button" aria-label={item.label}>
            {item.icon}
          </button>
        </Tooltip>
      ))}
    </aside>
  );
}
