# APSPOC React UI Redesign Design

## 1. Purpose

APSPOC should prioritize a product-grade React frontend redesign before adding more scheduling functionality. The current system has been validated as runnable, but the existing UI feels too rough for product usage and sales demonstrations.

This design defines the first React UI phase: a YonBIP-inspired enterprise APS workbench shell that wraps the existing backend, solver, and scheduling capabilities without rewriting the business logic.

## 2. Design reference

The primary visual reference is the logged-in YonBIP workbench screenshot provided by the user from `https://www.yonyoucloud.com/`.

Important reference traits:

- Blue enterprise top navigation bar.
- Dark vertical left module navigation rail.
- Right vertical quick-tool icon rail.
- Soft light-blue workspace background.
- White rounded dashboard cards with subtle elevation.
- Blue / yellow / red gradient KPI cards.
- Quick application shortcuts.
- Announcement and empty-state cards.
- Dashboard-style project and task tabs.

APSPOC should borrow layout and interaction patterns, not YonBIP branding, logos, or product claims.

## 3. Product goal

The first React UI phase should make APSPOC feel like an enterprise planning workbench rather than an engineering demo page.

The UI must support sales and product demonstrations by clearly communicating:

- Current planning status.
- Key scheduling actions.
- Scheduling health and risks.
- Version / release state.
- How users enter the main planning workflow.

## 4. Recommended stack

Use:

- React.
- Vite.
- TypeScript.
- Ant Design or Ant Design Pro-style components.
- SVG icon set such as Ant Design Icons or Lucide, but do not use emoji as structural icons.

Reasons:

- React + Vite gives a modern frontend build pipeline with fast local iteration.
- Ant Design is mature for enterprise dashboards, forms, tables, menus, cards, modals, notifications, and layout.
- TypeScript is appropriate for API contracts and larger UI migration work.

## 5. App shell architecture

The first phase should introduce a React `AppShell` with three navigation layers:

```text
AppShell
├─ TopNav
├─ LeftNavRail
├─ RightToolRail
└─ WorkspaceContent
```

### 5.1 TopNav

Purpose: global product and environment context.

Recommended content:

- APSPOC / 智能排产 product identity.
- Current environment or factory context.
- Global search entry for orders, products, versions, and tasks.
- Language switch.
- Help entry.
- Notification entry.
- Current user / account settings.

### 5.2 LeftNavRail

Purpose: primary module navigation.

Recommended modules:

- 工作台.
- 数据导入.
- 场景生成.
- 排程任务.
- Gantt 评审.
- 版本管理.
- 审批发布.
- 审计 / 设置.

This rail should answer “where do I go next?” and remain visually stable across the app.

### 5.3 RightToolRail

Purpose: auxiliary tools that can be reached from any screen.

Recommended tools:

- 排程解释 / AI 助手 placeholder.
- 预警.
- 帮助.
- 回归状态.
- 发布检查.
- 快速反馈.

This rail should not duplicate primary navigation.

## 6. First dashboard layout

The React dashboard should use card-based composition:

```text
WorkspaceDashboard
├─ UserMessageCard
├─ KpiCardRow
│  ├─ PendingScheduleCard
│  ├─ ScheduleNoticeCard
│  └─ AlertConflictCard
├─ QuickActionsCard
├─ ValueBannerCard
├─ ProjectOrderCard
├─ ScheduleTaskCard
└─ AnnouncementCard
```

### 6.1 UserMessageCard

Purpose: personalize the workbench and expose current date / user context.

Content:

- User avatar or initials.
- User name.
- Current date.
- Entry to message center.

### 6.2 KpiCardRow

Purpose: make APS status immediately visible.

Initial KPI cards:

- 待排程任务.
- 排程通知.
- 预警 / 冲突.

Use gradient cards similar to YonBIP, with strong numbers and secondary links.

### 6.3 QuickActionsCard

Purpose: expose the main APS workflow as visible actions.

Initial actions:

- 导入样本.
- 生成场景.
- 运行排程.
- 查看 Gantt.
- 版本发布.

### 6.4 ValueBannerCard

Purpose: improve sales-demo storytelling.

Recommended message:

> APS 智能排产，让计划可视、可算、可追溯

Supporting keywords:

- 需求.
- 库存.
- 产能.
- 约束.
- 排程.
- 版本.
- 审批.
- 发布.

### 6.5 ProjectOrderCard and ScheduleTaskCard

Purpose: introduce the workbench objects users care about.

Initial tabs can mirror YonBIP-style cards:

- 我关注的.
- 进行中.
- 已延期.
- 未开始.

The first phase can show real summaries where available and explicit empty states where not available.

### 6.6 AnnouncementCard

Purpose: reserve space for system notices, release notes, validation status, or UAT guidance.

If there is no data, show a polished empty state instead of a blank panel.

## 7. Visual style

Use a professional enterprise SaaS style:

- Primary blue top navigation.
- Dark blue-black left rail.
- Soft blue gradient page background.
- White cards with 12-20px border radius.
- Subtle shadows and clear card spacing.
- KPI gradients using blue, amber, and red / orange.
- Semantic colors for success, warning, error, draft, released, and failed states.
- Consistent SVG icon family and stroke style.

Use semantic design tokens rather than hard-coded colors inside components.

Suggested tokens:

```text
--color-primary: #2563EB
--color-primary-strong: #0B5CFF
--color-background: #F3F8FF
--color-surface: #FFFFFF
--color-rail: #10233F
--color-text-primary: #0F172A
--color-text-secondary: #64748B
--color-border: #E4ECFC
--color-warning: #F59E0B
--color-danger: #EF4444
--color-success: #059669
```

## 8. Migration boundary

The first phase must not rewrite backend, solver, scheduling logic, or Gantt behavior.

Allowed first-phase changes:

- Introduce React project structure.
- Add React AppShell.
- Add dashboard page.
- Connect to existing backend session / health / versions / jobs APIs where low-risk.
- Keep existing static frontend available as fallback until replacement is proven.

Deferred:

- Snow Beer fourth-phase complex scheduling functionality.
- Solver model changes.
- Full Gantt rewrite.
- Full approval governance redesign.
- Release-grade performance and queueing changes.

## 9. Data flow

The React app should call existing backend APIs directly, keeping the current local convention:

- frontend: `http://127.0.0.1:8080/`.
- backend: `http://127.0.0.1:8081/`.
- solver remains behind backend flows unless explicitly used for health display.

Initial dashboard data can come from:

- session endpoint for current user.
- backend health endpoint.
- solver health endpoint through a backend proxy only if one already exists; otherwise show backend-only health first.
- versions endpoint for version counts and latest version status.
- jobs endpoint only if current API supports safe listing; otherwise use explicit empty / unavailable states.

Do not invent backend capabilities in the UI. If a summary is not backed by an API, label it as empty, unavailable, or demo placeholder.

## 10. Accessibility and UX rules

The React UI must follow these rules from UI/UX Pro Max:

- Text contrast must meet WCAG AA: 4.5:1 for normal text.
- Interactive controls need visible focus states.
- Icon-only buttons need accessible labels.
- Primary click targets should be at least 44px high / wide.
- Do not use emoji as structural icons.
- Do not rely on color alone for status.
- Loading states should be visible for async API calls.
- Empty states must explain what the user can do next.
- Motion should be subtle and respect reduced-motion settings.

## 11. First-phase acceptance criteria

The first React UI phase is acceptable when:

1. The React app can be opened locally from the APSPOC frontend entry.
2. The shell includes top navigation, left module rail, right quick-tool rail, and workspace content area.
3. The dashboard visually follows the YonBIP-inspired enterprise workbench pattern without copying brand assets.
4. Login / session handling works with the existing backend or has a clearly documented fallback path.
5. At least backend health and one APS summary source are displayed from real APIs.
6. Existing backend / solver / sample package verification still passes.
7. The old UI remains reachable or recoverable until the React UI covers the core workflow.

## 12. Out of scope for this design

- Implementing new Snow Beer phase-four scheduling rules.
- Replacing all current Gantt interactions.
- Adding new backend aggregation APIs unless the implementation plan proves they are necessary.
- Copying YonBIP assets, logos, exact labels, or proprietary UI content.
- Claiming features that APSPOC has not implemented.
