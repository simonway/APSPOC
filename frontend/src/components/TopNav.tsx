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
import { resolveLegacyUiUrl } from "../lib/api";

interface TopNavProps {
  summary: DashboardSummary | null;
  onRefresh: () => void;
}

const topMenuItems = ["首页", "计划", "数据", "排程", "版本", "发布"];

export function TopNav({ summary, onRefresh }: TopNavProps) {
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
        {topMenuItems.map((item) => (
          <a key={item} href="#workspace-main">{item}</a>
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
