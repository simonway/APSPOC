# React Gantt 试排闭环设计

## 1. 背景与目标

APSPOC 的 React Gantt 评审页已经支持对未固定任务进行本地拖动调整，并保留 `draftBars` 草稿；前端 API 和后端 `trial-solve` 异步端点也已经存在，但 React 页面尚未把草稿提交、排程任务状态和结果刷新连起来。

本阶段完成一条可验收的 React 纵向闭环：

```text
Gantt 本地调整
  → 角色授权的试排提交
  → ScheduleJob 异步执行与页内轮询
  → 成功后自动打开新版本
  → 失败时保留草稿并支持重试
```

正式版本不被直接覆盖。固定任务保持只读。现有排程任务中心继续作为历史任务和详情入口。

## 2. 范围与非目标

### 2.1 本阶段范围

- 将当前认证用户角色传入 `GanttReviewPanel`。
- 对 `ADMIN`、`PLANNER`、`APPROVER` 展示并启用“提交试排”。
- 将当前版本中被调整的任务条合并为后端所需的完整草稿条目。
- 调用已有 `POST /api/v1/versions/{versionId}/trial-solve`。
- 复用已有 `ScheduleJob` 查询接口进行 React 页内轮询。
- 展示提交中、已受理、排队、运行中、成功、失败、取消和超时状态。
- 成功后刷新版本列表，自动选择后端返回的新版本，并重新加载 Gantt。
- 提供进入“排程任务中心”的入口。
- 失败或轮询异常时保留本地草稿，允许查询重试或重新提交。
- 增加角色、payload、轮询、成功刷新和失败保留草稿的测试。

### 2.2 非目标

- 不新增或重写后端 `trial-solve` 端点。
- 不改变 `ScheduleJob` 数据模型或任务状态机。
- 不覆盖正式版本，不实现版本并排对比。
- 不实现版本审批、发布、回滚、审计或差异页面。
- 不实现发酵罐、跨工艺或其他第四期求解规则。
- 不把现有任务轮询抽象成通用 Hook；仅在本次实现确有重复且不增加不必要复杂度时复用现有 API 语义。

## 3. 已有契约与约束

### 3.1 后端接口

后端已有：

- `POST /api/v1/versions/{versionId}/trial-solve`：要求 `ADMIN`、`PLANNER` 或 `APPROVER`，返回 HTTP 202 和 `ScheduleJobResponse`。
- `GET /api/v1/schedule/jobs/{jobId}`：允许已认证角色查询任务状态。
- `GET /api/v1/versions`：返回版本摘要列表。
- `GET /api/v1/versions/{versionId}/gantt-data`：返回指定版本的 Gantt 数据。

### 3.2 试排 payload

提交请求使用已有 `TrialSolveDraftBar` 契约：

```ts
{
  draftBars: Array<{
    barId: string;
    rowId: string;
    startMs: number;
    endMs: number;
    pinned: boolean;
  }>;
}
```

仅发送真正出现在 `draftBars` 中的任务。每项以基础 Gantt 条与本地草稿合并后的有效值生成；`pinned` 取合并后的值，确保后端收到完整任务条语义，而不是仅收到局部时间差。

### 3.3 状态终止条件

以下任务状态停止轮询：

```text
SUCCEEDED, FAILED, CANCELLED, TIMEOUT
```

其余状态继续按固定间隔查询。轮询定时器必须在组件卸载、切换版本、任务进入终态时清理。

## 4. 组件与状态设计

### 4.1 `App.tsx`

`App` 继续负责认证和工作区选择；当激活 Gantt 时传入：

```tsx
<GanttReviewPanel role={dashboardData.summary.userRole} />
```

不在 `App` 中实现试排业务逻辑。

### 4.2 `GanttReviewPanel`

继续维护 Gantt 展示、本地草稿和交互状态，并增加试排状态：

- `trialJob: ScheduleJobResponse | null`
- `trialSubmitting: boolean`
- `trialError: string | null`
- 轮询 timer/ref，以及用于防止过期请求覆盖新状态的代次或请求标识

角色判断统一使用大写角色值：

```ts
const canRunTrialSolve = ["ADMIN", "PLANNER", "APPROVER"].includes(role.toUpperCase());
```

角色为空或未知时按无权限处理。

### 4.3 操作区

Gantt 头部保留版本选择、缩放、适配、刷新和重置调整。增加：

- “提交试排”按钮：仅在有权限、有草稿、无冲突且未提交时可用。
- 任务进行中时显示 loading，禁止重复提交和重置草稿。
- 试排已受理后显示任务 ID和当前状态。
- 在任务状态区域提供“打开排程任务中心”按钮，由页面已有导航回调或等价入口完成工作区切换。
- 无权限用户不显示可提交动作；仍可查看 Gantt 和本地拖动结果。

本地草稿提示从“尚未写回后端”调整为能区分：未提交、提交中、任务执行中和任务已失败。提交不会把本地草稿误标记为正式版本数据。

## 5. 数据流与交互时序

### 5.1 提交

1. 用户在当前版本拖动未固定任务，组件更新 `draftBars`。
2. 组件计算冲突集合；若存在资源行任务重叠或停机重叠，提交动作保持禁用。
3. 用户点击“提交试排”。组件将基础条与草稿合并，构造 `TrialSolveDraftBar[]`。
4. 设置 `trialSubmitting`，清除上一次试排错误，调用 `submitTrialSolve(versionId, draftBars)`。
5. 成功返回后保存 `trialJob`，关闭提交 loading，显示“已受理”和任务 ID，开始轮询。
6. POST 失败时停止提交 loading，保留 `draftBars`，展示错误信息并允许重新提交。

### 5.2 轮询

1. 轮询调用 `fetchScheduleJob(trialJob.jobId)`。
2. 返回非终态时更新 `trialJob`，显示状态，并安排下一次查询。
3. 查询失败时停止当前定时器，保留任务 ID和草稿，显示“无法刷新任务状态”；“重试查询”只重新 GET，不再次 POST。
4. 切换版本、重新加载 Gantt 或卸载组件时使旧轮询失效，旧响应不得覆盖当前版本状态。

### 5.3 成功

1. 任务状态为 `SUCCEEDED` 时停止轮询。
2. 从返回任务读取 `versionId`；若缺失，按结果契约错误处理，不清除草稿并提示无法定位生成版本。
3. 刷新版本列表。
4. 自动选择返回的 `versionId`，触发已有 Gantt 数据加载流程。
5. 新版本加载成功后清除旧草稿和试排临时状态，让用户看到新版本结果；版本选择器仍允许返回原版本。
6. 若版本列表刷新或新版本 Gantt 加载失败，保留任务成功信息和可重试入口，不把成功任务误报为失败。

### 5.4 失败、取消和超时

- 停止轮询。
- 优先展示 `errorMessage`，其次 `failureReason`，最后使用统一中文降级文案。
- 保留 `draftBars`，允许用户修正后重新提交。
- 允许“重试查询”；不自动重复 POST。
- 任务中心入口仍可用，便于查看完整任务记录。

## 6. 错误处理与可访问性

- 后端 403 显示权限错误，不清除草稿。
- 后端 400/409 显示后端返回的业务错误，不清除草稿。
- 网络提交失败与轮询失败区分显示，便于用户判断是重新提交还是查询重试。
- 状态同时使用文字、状态标签和语义颜色，不依赖颜色单独传达状态。
- 提交按钮具有明确的可访问名称和 loading 反馈。
- 任务状态区域使用 `role="status"` 或 `aria-live="polite"`，使状态变化可被辅助技术感知。
- 任务 ID、错误信息和“打开排程任务中心”入口在窄屏下允许换行，不造成页面级横向溢出。

## 7. 测试设计

### 7.1 App 集成行为

- 认证用户角色传给 Gantt。
- `ADMIN`、`PLANNER`、`APPROVER` 可看到试排动作。
- `VIEWER` 不可提交。

### 7.2 Gantt 交互行为

- 无草稿时提交按钮禁用。
- 有草稿且无冲突时可以提交。
- 存在冲突时提交按钮禁用并显示原因。
- 提交时正确合并基础条和草稿，发送完整的 `barId`、`rowId`、`startMs`、`endMs`、`pinned`。
- 返回任务后显示任务 ID和受理状态。
- 非终态继续轮询，终态停止轮询。
- 成功后刷新版本、自动选择返回版本并加载其 Gantt 数据。
- 失败、取消、超时和轮询异常显示错误且保留草稿。
- 查询重试只发起 GET，不重新提交 POST。
- 组件卸载或切换版本后，旧轮询响应不会污染新版本。

### 7.3 API 契约

- 保留现有 `submitTrialSolve` URL 编码、POST、凭证、请求头和 JSON body 测试。
- 补充或确认 `fetchScheduleJob` 的路径编码和 GET 契约测试。
- 不修改后端契约测试范围，除非验证发现当前 DTO 断言缺失。

### 7.4 验证命令

实现后依次执行：

1. React 定向测试；
2. React 完整测试和生产构建；
3. `graphify update .`；
4. 使用本地服务启动/重启脚本和现有 smoke 流程，实际验证拖动、提交、轮询、成功切换和失败保留草稿；
5. 检查 diff，确保不包含本次范围外的版本治理或第四期规则改动。

## 8. 文件边界

预计修改：

- `frontend/src/App.tsx`
- `frontend/src/features/workspace/GanttReviewPanel.tsx`
- `frontend/src/lib/api.test.ts`
- 现有前端 Gantt/App 测试文件，或新增同目录测试文件（以当前测试组织为准）
- 必要时少量 `frontend/src/styles.css`

本阶段不修改：

- 后端 trial-solve、ScheduleJob 或版本服务实现；
- 版本治理和对比页面；
- solver 约束和第四期业务规则；
- 与试排闭环无关的现有未提交运行手册、重启脚本或视觉改动。

## 9. 验收标准

1. 具备试排权限的用户可从 React Gantt 提交当前本地调整。
2. 提交请求符合既有 trial-solve 契约，正式版本不被覆盖。
3. Gantt 页面能显示任务受理、排队、运行和终态反馈。
4. 成功后自动切换并展示后端生成的新版本。
5. 失败、取消、超时和网络轮询失败均不会丢失本地草稿。
6. 用户可以从 Gantt 页面进入排程任务中心。
7. VIEWER 无法提交试排，固定任务无法被拖动或提交修改。
8. 相关前端测试、构建、图谱更新和实际本地 smoke 验证通过。
9. 本阶段不引入新的后端接口，不扩大到版本治理或第四期规则实现。
