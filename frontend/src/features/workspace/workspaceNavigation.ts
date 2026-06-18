export const workspaceNavItems = [
  { key: "workspace", label: "工作台" },
  { key: "planning", label: "计划" },
  { key: "data", label: "数据" },
  { key: "scheduling", label: "排程" },
  { key: "versions", label: "版本" },
  { key: "release", label: "发布" },
] as const;

export const leftRailItems = [
  { key: "workspace", label: "工作台" },
  { key: "import", label: "数据导入" },
  { key: "scenario", label: "场景生成" },
  { key: "jobs", label: "排程任务" },
  { key: "gantt", label: "Gantt 评审" },
  { key: "versions", label: "版本管理" },
  { key: "approval", label: "审批发布" },
  { key: "audit", label: "审计 / 设置" },
] as const;

export const rightToolItems = [
  { key: "explain", label: "排程解释" },
  { key: "alerts", label: "预警" },
  { key: "support", label: "帮助" },
  { key: "regression", label: "回归状态" },
  { key: "release-check", label: "发布检查" },
  { key: "feedback", label: "快速反馈" },
] as const;

export type WorkspaceNavKey = (typeof workspaceNavItems)[number]["key"] | (typeof leftRailItems)[number]["key"];
export type RightToolKey = (typeof rightToolItems)[number]["key"];
