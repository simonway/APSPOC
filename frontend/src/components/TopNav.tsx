import {
  BellOutlined,
  CustomerServiceOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Input } from "antd";
import type { DashboardSummary } from "../features/workspace/dashboardModel";
import { workspaceNavItems, type WorkspaceNavKey } from "../features/workspace/workspaceNavigation";
import { resolveLegacyUiUrl } from "../lib/api";

interface TopNavProps {
  activeWorkspaceKey: WorkspaceNavKey;
  summary: DashboardSummary | null;
  onRefresh: () => void;
  onWorkspaceSelect: (key: WorkspaceNavKey) => void;
}

export function TopNav({ activeWorkspaceKey, summary, onRefresh, onWorkspaceSelect }: TopNavProps) {
  const userInitial = summary?.userName?.slice(0, 1).toUpperCase() ?? "A";

  return (
    <header className="top-nav">
      <div className="top-nav-brand" aria-label="APS高级排程">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <strong>APS高级排程</strong>
      </div>
      <nav className="top-menu" aria-label="顶部模块导航">
        {workspaceNavItems.map((item) => (
          <button
            key={item.key}
            className="top-menu-button"
            type="button"
            aria-pressed={activeWorkspaceKey === item.key}
            onClick={() => onWorkspaceSelect(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <Input className="global-search" prefix={<SearchOutlined />} aria-label="全局搜索" placeholder="搜索" />
      <div className="top-nav-actions">
        <Button aria-label="刷新" icon={<ReloadOutlined />} onClick={onRefresh} />
        <a className="legacy-link" href={resolveLegacyUiUrl()} target="_blank" rel="noreferrer">旧版控制台</a>
        <Button aria-label="帮助" icon={<QuestionCircleOutlined />} />
        <Button aria-label="客服" icon={<CustomerServiceOutlined />} />
        <Button aria-label="设置" icon={<SettingOutlined />} />
        <Badge dot>
          <Button aria-label="通知" icon={<BellOutlined />} />
        </Badge>
        <div className="user-chip" aria-label="当前用户">
          <Avatar>{userInitial}</Avatar>
          <span>{summary?.userName ?? "未登录"}</span>
        </div>
      </div>
    </header>
  );
}
