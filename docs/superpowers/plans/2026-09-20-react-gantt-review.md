# React Gantt 评审迁移实施计划

**目标：** 将旧版控制台的核心只读甘特图评审能力迁移到 React 工作台，使左侧“Gantt 评审”直接打开原生 React 页面。

## 范围

- 复用后端 `GET /api/v1/versions/{versionId}/gantt-data`，不修改后端契约。
- 新增版本选择、KPI 摘要、时间轴、资源行、任务条、停机窗口、换型区间、图例和任务详情。
- 提供缩放、适配宽度、刷新和横向滚动。
- 本批保持只读；旧版拖拽草稿、试排、固定任务和版本治理留待后续独立迁移。

## 文件

- 修改 `frontend/src/lib/api.ts`：补充 Gantt DTO 类型和请求函数。
- 新增 `frontend/src/features/workspace/GanttReviewPanel.tsx`：数据加载、时间轴布局和交互。
- 修改 `frontend/src/App.tsx`：路由 `gantt` 工作区到新页面。
- 修改 `frontend/src/styles.css`：React Gantt 布局、语义状态和响应式样式。
- 修改 `frontend/src/App.test.tsx`、`frontend/src/lib/api.test.ts`：导航和 API 契约测试。

## 验收

1. 点击左侧“Gantt 评审”不再停留首页。
2. 默认加载最新版本，并可切换版本。
3. 任务、延期任务、固定任务、停机和换型具有可区分的视觉语义。
4. 点击任务显示详情；缩放、适配和刷新可用。
5. 加载、错误和空数据状态完整。
6. 前端完整测试与构建通过。
