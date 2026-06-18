# React Workbench Prototype Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust the existing React workbench homepage so it visually matches `tmp/aps-react-workbench-prototype.html` more closely and uses a smaller enterprise dashboard font scale.

**Architecture:** Keep the current React app, login gate, API client, dashboard data model, old UI link, backend, and solver unchanged. Modify only presentation components and CSS: `TopNav`, `LeftNavRail`, `WorkspaceDashboard`, and `styles.css`. Tests assert the prototype-aligned shell and dashboard structure instead of snapshot-perfect pixels.

**Tech Stack:** React 18, TypeScript, Ant Design, Ant Design Icons, Vitest, Testing Library.

---

## File structure

Modify:
- `frontend/src/App.test.tsx` — add assertions for prototype-aligned rail/menu/home-tab/dashboard sections.
- `frontend/src/components/TopNav.tsx` — replace the current top context/actions with horizontal menu, compact search, icon actions, user avatar, and old UI link.
- `frontend/src/components/LeftNavRail.tsx` — render a narrow icon rail with accessible labels and tooltips instead of Ant Design text menu.
- `frontend/src/features/workspace/WorkspaceDashboard.tsx` — add prototype-style home tab, two-column dashboard, user message card, compact KPI/action area, project/task/announcement side cards.
- `frontend/src/styles.css` — switch layout to 78px left rail, 54/56px right rail, lighter blue gradient workspace, smaller font scale, compact card spacing.

Do not modify:
- `frontend/src/lib/api.ts`
- `frontend/src/features/workspace/useDashboardData.ts`
- Backend or solver files.

---

### Task 1: Add prototype-alignment test coverage

**Files:**
- Modify: `frontend/src/App.test.tsx`

- [ ] **Step 1: Extend the existing successful-dashboard test**

Inside `renders the enterprise workbench shell with live backend summary data`, after the legacy link assertion, add:

```tsx
expect(screen.getByRole("navigation", { name: "顶部模块导航" })).toBeInTheDocument();
expect(screen.getByRole("tab", { name: "首页" })).toBeInTheDocument();
expect(screen.getByLabelText("主模块导航")).toHaveClass("left-nav-rail");
expect(screen.getByLabelText("用户消息和计划概览")).toBeInTheDocument();
expect(screen.getByLabelText("工作台右侧信息栏")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails before implementation**

Run:

```bash
npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: FAIL because top navigation role, home tab, and new dashboard section labels are not implemented.

---

### Task 2: Align top navigation and left rail

**Files:**
- Modify: `frontend/src/components/TopNav.tsx`
- Modify: `frontend/src/components/LeftNavRail.tsx`

- [ ] **Step 1: Replace `TopNav.tsx` with compact prototype-style top nav**

Use:

```tsx
import { BellOutlined, CustomerServiceOutlined, QuestionCircleOutlined, ReloadOutlined, SearchOutlined, SettingOutlined } from "@ant-design/icons";
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
      <div className="top-nav-brand" aria-label="APSPOC 智能排产">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </span>
        <strong>APSPOC</strong>
      </div>
      <nav className="top-menu" aria-label="顶部模块导航">
        {topMenuItems.map((item) => <a key={item} href="#workspace-main">{item}</a>)}
      </nav>
      <Input className="global-search" prefix={<SearchOutlined />} aria-label="全局搜索" placeholder="搜索" />
      <div className="top-nav-actions">
        <Button aria-label="刷新" icon={<ReloadOutlined />} onClick={onRefresh} />
        <a className="legacy-link" href={resolveLegacyUiUrl()} target="_blank" rel="noreferrer">旧版</a>
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
```

- [ ] **Step 2: Replace `LeftNavRail.tsx` with 78px icon rail**

Use:

```tsx
import { AuditOutlined, BarChartOutlined, CheckCircleOutlined, CloudUploadOutlined, DashboardOutlined, DatabaseOutlined, DeploymentUnitOutlined, PartitionOutlined } from "@ant-design/icons";
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
```

- [ ] **Step 3: Run App test and keep expected dashboard-section failures**

Run:

```bash
npm test --prefix frontend -- --run src/App.test.tsx
```

Expected: top nav and left rail assertions pass; home tab/dashboard section assertions still fail.

---

### Task 3: Align dashboard composition and font scale

**Files:**
- Modify: `frontend/src/features/workspace/WorkspaceDashboard.tsx`
- Modify: `frontend/src/styles.css`

- [ ] **Step 1: Replace `WorkspaceDashboard.tsx` with prototype-style composition**

Keep the existing `quickActions` array and imported icons, then render:

```tsx
export function WorkspaceDashboard({ summary }: WorkspaceDashboardProps) {
  return (
    <div className="workspace-dashboard-shell">
      <div className="tabs-line" role="tablist" aria-label="工作台页面">
        <button className="home-tab" role="tab" aria-selected="true">首页</button>
      </div>
      <section className="workspace-dashboard" aria-label="工作台首页">
        <div className="dashboard-main-column">
          <section className="message-card dashboard-card" aria-label="用户消息和计划概览">
            <div className="profile-block">
              <div className="profile-avatar" aria-hidden="true">{summary.userName.slice(0, 1).toUpperCase()}</div>
              <div>
                <p className="eyebrow">欢迎回来</p>
                <h1>{summary.userName}</h1>
                <span>{summary.userRole} · {summary.refreshedAtText}</span>
              </div>
            </div>
            <div className="message-metrics">
              <div><strong>{summary.totalVersions}</strong><span>排程版本</span></div>
              <div><strong>{summary.publishedVersions}</strong><span>已发布</span></div>
              <div><strong>{summary.draftVersions}</strong><span>草稿</span></div>
              <div><strong>{summary.averageUtilizationPercent}%</strong><span>平均利用率</span></div>
            </div>
          </section>
          <section className="kpi-card-row" aria-label="排程状态指标">
            <article className="kpi-card kpi-card-blue"><span>待排程任务</span><strong>{summary.draftVersions}</strong><p>草稿版本待处理</p></article>
            <article className="kpi-card kpi-card-amber"><span>排程通知</span><strong>{summary.releaseQueueVersions}</strong><p>等待审批发布</p></article>
            <article className="kpi-card kpi-card-red"><span>预警 / 冲突</span><strong>{summary.alertVersionCount}</strong><p>{summary.totalLateTasks} 个延期任务</p></article>
          </section>
          <section className="dashboard-card quick-app-card">
            <h2>快捷应用</h2>
            <div className="quick-action-grid">
              {quickActions.map((action) => <Button key={action.label} className="quick-action-button" icon={action.icon}>{action.label}</Button>)}
            </div>
          </section>
        </div>
        <aside className="dashboard-side-column" aria-label="工作台右侧信息栏">
          <section className="dashboard-card value-banner-card"><p>APS 智能排产</p><h2>让计划可视、可算、可追溯</h2><Space wrap>{["需求", "库存", "产能", "约束", "排程", "版本", "审批", "发布"].map((keyword) => <Tag key={keyword}>{keyword}</Tag>)}</Space></section>
          <section className="dashboard-card compact-info-card"><h2>排程任务</h2><strong>{summary.latestVersionName}</strong><span>最新版本状态：{summary.latestVersionStatus}</span><span>平均利用率：{summary.averageUtilizationPercent}%</span></section>
          <section className="dashboard-card compact-info-card"><h2>公告与发布状态</h2><strong>{summary.backendService} · {summary.backendStatus}</strong><span>{summary.planningNotice}</span></section>
        </aside>
      </section>
    </div>
  );
}
```

Remove unused imports from `WorkspaceDashboard.tsx` after the replacement.

- [ ] **Step 2: Replace shell/dashboard CSS sections with prototype-aligned values**

In `frontend/src/styles.css`, change the layout and type scale to:

```css
:root {
  --color-primary: #1677ff;
  --color-primary-strong: #006fe8;
  --color-background: #d9ebff;
  --color-surface: #ffffff;
  --color-rail: #0f223b;
  --color-text-primary: #172033;
  --color-text-secondary: #6b778c;
  --color-border: #dce8f7;
  --color-warning: #b45309;
  --color-danger: #dc2626;
  --color-success: #059669;
  color: var(--color-text-primary);
  background: var(--color-background);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
  font-size: 13px;
}
```

Then update the affected selectors:

```css
.app-shell { min-height: 100vh; background: linear-gradient(135deg, #d7ecff 0%, #eaf3ff 46%, #c9e3ff 100%); }
.top-nav { min-height: 64px; gap: 22px; padding: 0 22px; background: linear-gradient(90deg, #078bf5, #087df0 58%, #0788f5); box-shadow: 0 2px 10px rgba(0, 89, 180, 0.22); }
.top-nav-brand { min-width: 210px; gap: 14px; font-size: 20px; }
.brand-mark { width: 36px; height: 36px; grid-template-columns: repeat(2, 1fr); gap: 4px; padding: 7px; }
.brand-mark span { display: block; border-radius: 99px; background: #fff; opacity: .95; }
.top-menu { display: flex; flex: 1; align-items: center; gap: 26px; }
.top-menu a { color: rgba(255,255,255,.94); font-size: 13px; font-weight: 650; text-decoration: none; }
.global-search { width: 290px; max-width: 290px; height: 38px; }
.top-nav-actions { display: flex; align-items: center; gap: 10px; color: var(--color-text-primary); }
.user-chip { min-height: 38px; font-size: 12px; }
.app-body { grid-template-columns: 78px minmax(0, 1fr) 54px; min-height: calc(100vh - 64px); }
.left-nav-rail { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 14px 8px; box-shadow: 2px 0 10px rgba(12, 31, 59, .22); }
.rail-icon-button { width: 52px; height: 52px; border: 1px solid transparent; border-radius: 14px; color: #c7d6eb; background: transparent; cursor: pointer; }
.rail-icon-button.active { color: #fff; background: #263f63; border-color: rgba(255,255,255,.08); box-shadow: inset 3px 0 0 #33a4ff; }
.workspace-main { padding: 0; overflow: auto; }
.tabs-line { height: 44px; display: flex; align-items: stretch; background: rgba(255,255,255,.32); border-bottom: 1px solid rgba(255,255,255,.5); }
.home-tab { width: 128px; border: 0; color: #087be8; background: rgba(255,255,255,.72); font-size: 13px; font-weight: 700; cursor: pointer; }
.workspace-dashboard { display: grid; grid-template-columns: minmax(640px, 2fr) minmax(340px, .95fr); gap: 18px 20px; max-width: 1700px; margin: 0 auto; padding: 18px 20px 28px; }
.dashboard-main-column, .dashboard-side-column { display: flex; flex-direction: column; gap: 16px; }
.dashboard-card { border: 1px solid rgba(255,255,255,.75); border-radius: 18px; background: rgba(255,255,255,.96); box-shadow: 0 10px 26px rgba(31, 70, 122, 0.10); }
.dashboard-card h2 { margin: 0 0 14px; font-size: 14px; }
.message-card { min-height: 210px; display: grid; grid-template-columns: 310px 1fr; gap: 20px; padding: 24px; }
.profile-block { display: grid; grid-template-columns: 82px 1fr; gap: 16px; align-items: center; border-right: 1px solid #edf2fb; }
.profile-avatar { width: 76px; height: 76px; display: grid; place-items: center; border-radius: 50%; color: #ba371d; background: #ffe2cb; font-size: 28px; font-weight: 800; }
.profile-block h1 { margin: 0 0 6px; font-size: 22px; }
.profile-block span, .compact-info-card span { display: block; color: var(--color-text-secondary); font-size: 12px; }
.message-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; align-content: center; }
.message-metrics strong { display: block; font-size: 26px; }
.message-metrics span { color: var(--color-text-secondary); font-size: 12px; }
.kpi-card-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.kpi-card { min-height: 126px; padding: 20px; }
.kpi-card strong { font-size: 34px; }
.quick-app-card, .compact-info-card, .value-banner-card { padding: 20px; }
.quick-action-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.quick-action-button { min-height: 64px; font-size: 13px; }
```

Keep existing login styles, error styles, right rail styles, and reduced-motion block unless they conflict.

- [ ] **Step 3: Run frontend tests and build**

Run:

```bash
npm test --prefix frontend -- --run
npm run build --prefix frontend
```

Expected: all frontend tests pass and build succeeds.

---

### Task 4: Browser verify and graph update

**Files:**
- Modified React files from previous tasks.

- [ ] **Step 1: Verify live browser layout metadata**

Run the existing headless browser verification script pattern and confirm:
- `.left-nav-rail` width is about `78px`.
- `.top-menu` exists.
- `role="tab"` 首页 exists.
- Dashboard has `.dashboard-main-column` and `.dashboard-side-column`.
- Screenshot is saved under `.runtime/`.

- [ ] **Step 2: Run release tests-only**

Run:

```bash
./scripts/verify-release.sh --tests-only
```

Expected: backend, solver, React frontend tests/build, old static JS syntax, and diff check pass.

- [ ] **Step 3: Update graphify**

Run:

```bash
graphify update .
```

Expected: graphify completes.

- [ ] **Step 4: Final status check**

Run:

```bash
git status --short --untracked-files=all
git diff --check
```

Expected: no whitespace errors; changes limited to the React presentation patch plus existing plan files.

---

## Self-review

Spec coverage:
- 78px icon left rail: Task 2 and Task 3 CSS.
- Top horizontal menu/search/icons: Task 2 and Task 3 CSS.
- Home tab strip: Task 3.
- Two-column dashboard composition: Task 3.
- Smaller font scale: Task 3 CSS.
- Preserve auth/API/backend/solver: file scope excludes API hook and backend/solver.
- Tests/browser verification: Tasks 1, 3, 4.

Placeholder scan: no placeholders remain.

Type consistency: all component props remain unchanged except internal markup; `WorkspaceDashboard` still accepts `DashboardSummary`.
