# Phase 4A: 发酵罐不可混装（NON_MIXING）设计

> **复核状态**：本文档为 2026-09-12 已批准"方案 A"设计的复原稿，2026-10-15 依据当前 master 现状修订。落笔时 master 已独立合并了"失败证据"机制（见下），因此本设计只描述**尚未落地**的部分。
>
> 相关计划：`docs/superpowers/plans/2026-10-15-phase4a-fermentation-tank-non-mixing.md`

## 1. 目标

为 Snow Beer POC 增加发酵罐"不可混装"约束的最小业务切片：排程结果必须能**在同罐、时间重叠、且混装家族不同**的任务之间给出不可行解释（`NON_MIXING`），并在成功场景下不影响现有求解。

一句话验收：给定两个发酵任务落在同一发酵罐、时间重叠且 `mixingFamily` 不同时，求解要么把他们错开，要么在不可行时产出业务化的 `NON_MIXING` 失败证据。

## 2. 范围边界（冻结）

**纳入：**

- `tankId`（发酵罐标识）与 `mixingFamily`（混装家族/产品家族）两个可选字段，从配方导入一路透传到求解器任务。
- 求解器在不可行时产出 `NON_MIXING` 失败证据（reasonType、tankId、conflictingTaskIds、mixingFamilies、message）。
- `tankId` 必须属于任务 `candidateResourceIds` 的校验。
- 后端把 `NON_MIXING` 失败证据格式化进任务失败消息。

**不纳入（继续后置）：**

- 发酵罐容量、占用率、满罐关系。
- 多个锅次共满一罐（multi-brew aggregation），即同家族共罐重叠仍被禁止。
- 成熟驻留窗口、清酒罐中转、静置/保鲜窗口。
- 连续流、浓度/收率机理、采购反推。

## 3. 关键语义决策（比原方案更关键的澄清）

评审原 worktree 实现（`worktree-phase4a-non-mixing`，提交 `da78c53`）后，有两个语义点需要在此显式定调：

### 3.1 `tankId` 不是第二个 `pinnedResourceId`

`tankId` 只用于**不可混装分组**（同罐下把任务按 `mixingFamily` 分组），不强制指派资源。任务最终落在哪个资源仍由既有机制决定：

- `pinnedResourceId` / `pinnedStartMinutes`（硬 pin）；
- 候选资源 + `AddExactlyOne(presences)`（自由选择）。

`tankId` 语义是"该发酵任务声明的目标罐"，因此必须 ∈ `candidateResourceIds`（否则分组无意义）。若业务上要求"发到指定罐"，应同时设 `pinnedResourceId`，而不是靠 `tankId` 隐式 pin。

### 3.2 不可混装 ≠ 新增重叠约束（与 `AddNoOverlap` 的关系）

master 求解器对每个资源都有 `model.AddNoOverlap(intervals_by_resource[resource_id])`（`solver_service.py:88-89`）。由于"多锅次共满一罐"已后置，发酵罐在 POC 里就是**独占资源**：同一罐上任意两个任务都不得重叠（无论家族是否相同）。

因此原 worktree 中的 `_add_tank_non_mixing_constraints`（约 50 行排序约束）**与 `AddNoOverlap` 功能重复**，属于冗余复杂度。本设计选择**不引入**该方法——非混装的"约束"由既有 `AddNoOverlap` 承担，本切片真正新增的是：

1. `tankId` / `mixingFamily` 字段透传；
2. `tankId` 必须是候选资源的校验；
3. 不可行时的 `NON_MIXING` 失败证据（与既有 `MATERIAL_SHORTAGE` 同属"计算成功/不可行的启发式解释"，非精确诊断）。

> 若后续要支持同家族共罐（multi-brew aggregation），那时才需要把 TANK 类型资源从 `AddNoOverlap` 里摘出、换成家族感知的排序约束——那是 P5 范围，本切片不做。

## 4. 求解器数据模型

`SolverTask` 新增两个可选字段：

```python
tankId: str | None = None
mixingFamily: str | None = None
```

`SolverFailureReason` 新增三个可选字段（供 `NON_MIXING` 复用，`MATERIAL_SHORTAGE` 不用）：

```python
tankId: str | None = None
conflictingTaskIds: list[str] = Field(default_factory=list)
mixingFamilies: list[str] = Field(default_factory=list)
```

## 5. 端到端数据流（透传链）

`tankId` / `mixingFamily` 沿以下链路逐跳透传（各文件当前均无这两个字段）：

```
recipe CSV 列 (tankId, mixingFamily)
  → ImportedRecipeRow                    backend/.../api/dto/ImportedRecipeRow.java
  → GenerateScenarioRequest.RecipeInput  backend/.../api/dto/GenerateScenarioRequest.java
  → CreateScheduleJobRequest.TaskInput   backend/.../api/dto/CreateScheduleJobRequest.java
  → SolverRequest.Task                   backend/.../service/SolverRequest.java
  → 求解器 SolverTask                    solver/app/models.py
```

失败证据回传链：

```
SolverFailureReason (tankId/conflictingTaskIds/mixingFamilies)
  → SolverResponse.FailureReason         backend/.../service/SolverResponse.java
  → SchedulingJobService.buildSolverFailureMessage   jobs 失败消息
```

字段构造点：

- `ModelImportService.importRecipes`：解析 recipe CSV 新列。
- `ImportBatchScenarioService.generate`：`ImportedRecipeRow` → `RecipeInput`。
- `ScenarioGenerationService.generate`：`RecipeInput` → `TaskInput`。
- `SchedulingJobService.toSolverRequest`：`TaskInput` → `SolverRequest.Task`。
- `SchedulingJobService.buildSolverFailureMessage`：追加 `tankId` / `conflictingTaskIds` / `mixingFamilies` 到失败详情串。

## 6. 非目标 / 后续

- 端到端"负向 smoke"（发酵罐冲突样本包 + 业务解释）在计划里作为最后一个集成任务补齐。
- 样本包与 CSV 模板列头在计划里给出（`tankId` 别名含中文"罐号/发酵罐"等）。