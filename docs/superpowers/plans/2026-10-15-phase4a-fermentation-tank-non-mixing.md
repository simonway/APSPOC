# Phase 4A: 发酵罐不可混装（NON_MIXING）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `tankId` / `mixingFamily` 从配方 CSV 一路透传到求解器，并在同罐不同家族任务冲突时产出 `NON_MIXING` 失败证据。

**Architecture:** 求解器侧只加字段 + 校验 + 失败证据（复用既有 `AddNoOverlap`，不新增重叠约束）；Java 侧把这些可选字段沿 `ImportedRecipeRow → RecipeInput → TaskInput → SolverRequest.Task` 链透传，并把 `NON_MIXING` 证据格式化进任务失败消息。

**Tech Stack:** Python 3 + `ortools`（求解器，`unittest` 测试）；Java 21 + Spring Boot（`mvn test`）。

---

## 测试命令（全文统一）

- 求解器：`cd solver && python3 -m unittest discover -s tests -p 'test_*.py'`
- 后端：`cd backend && mvn test`

---

## Task 1: 求解器数据模型加字段

**Files:**
- Modify: `solver/app/models.py`（`SolverTask`、`SolverFailureReason`）

- [ ] **Step 1: 在 `SolverTask` 末尾加两个可选字段**

在 `setupGroup: str | None = None` 之后、`materialInputs` 之前插入：

```python
    setupGroup: str | None = None
    tankId: str | None = None
    mixingFamily: str | None = None
    materialInputs: list["SolverMaterialQuantity"] = Field(default_factory=list)
```

- [ ] **Step 2: 扩展 `SolverFailureReason`**

把 `SolverFailureReason`（当前 4 字段）改为：

```python
class SolverFailureReason(BaseModel):
    reasonType: str
    message: str
    itemCode: str | None = None
    demandId: str | None = None
    tankId: str | None = None
    conflictingTaskIds: list[str] = Field(default_factory=list)
    mixingFamilies: list[str] = Field(default_factory=list)
```

- [ ] **Step 3: 跑求解器测试确认无回归（纯增量字段，不应影响任何行为）**

Run: `cd solver && python3 -m unittest discover -s tests -p 'test_*.py'`
Expected: PASS（现有测试全绿）

- [ ] **Step 4: Commit**

```bash
git add solver/app/models.py
git commit -m "feat(solver): add optional tankId/mixingFamily task fields and NON_MIXING reason fields"
```

---

## Task 2: 求解器校验 + NON_MIXING 失败证据（TDD）

**Files:**
- Modify: `solver/app/solver_service.py`
- Test: `solver/tests/test_solver_service.py`

- [ ] **Step 1: 写 4 个失败测试**

在 `solver/tests/test_solver_service.py` 的 `SolverServiceDowntimeTest` 类内部（该类末尾、类结束前）加入以下 4 个方法及辅助方法 `_non_mixing_request`。`datetime`/`timezone` 已在文件顶部导入：

```python
    def _non_mixing_request(
        self,
        second_tank: str = "ferm_t1",
        second_family: str = "B600",
        overlap: bool = False,
    ) -> SolveRequest:
        return SolveRequest(
            jobId="job-non-mixing",
            scheduleStartAt=datetime(2026, 4, 15, 8, 0, tzinfo=timezone.utc),
            horizonMinutes=240,
            resources=[
                SolverResource(id="ferm_t1", label="Fermentation Tank 1", resourceType="TANK", sortOrder=1),
                SolverResource(id="ferm_t2", label="Fermentation Tank 2", resourceType="TANK", sortOrder=2),
            ],
            tasks=[
                SolverTask(
                    id="task_a", label="A500", productCode="A", durationMinutes=120,
                    dueMinutes=240, priority=1, candidateResourceIds=["ferm_t1"],
                    pinnedStartMinutes=0 if overlap else None,
                    tankId="ferm_t1", mixingFamily="A500",
                ),
                SolverTask(
                    id="task_b", label="B600", productCode="B", durationMinutes=120,
                    dueMinutes=240, priority=1, candidateResourceIds=[second_tank],
                    pinnedStartMinutes=0 if overlap else None,
                    tankId=second_tank, mixingFamily=second_family,
                ),
            ],
            objectiveWeights=ObjectiveWeights(tardiness=100, makespan=1),
            solverConfig=SolverConfig(timeLimitSeconds=5, numSearchWorkers=1),
        )

    def test_overlapping_different_families_on_same_tank_are_infeasible_with_non_mixing_reason(self) -> None:
        response = self.service.solve(self._non_mixing_request(overlap=True))

        self.assertEqual(response.status, "INFEASIBLE")
        self.assertEqual(response.scheduledTasks, [])
        self.assertEqual(len(response.failureReasons), 1)
        reason = response.failureReasons[0]
        self.assertEqual(reason.reasonType, "NON_MIXING")
        self.assertIn("ferm_t1", reason.message)
        self.assertIn("task_a", reason.message)
        self.assertIn("task_b", reason.message)
        self.assertIn("A500", reason.message)
        self.assertIn("B600", reason.message)
        self.assertEqual(reason.tankId, "ferm_t1")
        self.assertEqual(reason.conflictingTaskIds, ["task_a", "task_b"])
        self.assertEqual(reason.mixingFamilies, ["A500", "B600"])

    def test_same_mixing_family_on_same_tank_remains_feasible(self) -> None:
        response = self.service.solve(self._non_mixing_request(second_family="A500"))

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 2)

    def test_different_tanks_remain_feasible_for_different_mixing_families(self) -> None:
        response = self.service.solve(self._non_mixing_request(second_tank="ferm_t2"))

        self.assertIn(response.status, {"OPTIMAL", "FEASIBLE"})
        self.assertEqual(len(response.scheduledTasks), 2)

    def test_tank_id_must_be_a_candidate_resource(self) -> None:
        request = self._non_mixing_request()
        request.tasks[0].tankId = "ferm_t2"

        with self.assertRaisesRegex(ValueError, "Task task_a tankId ferm_t2 is not a candidate resource"):
            self.service.solve(request)
```

- [ ] **Step 2: 跑测试确认红**

Run: `cd solver && python3 -m unittest discover -s tests -p 'test_*.py'`
Expected: FAIL — `test_tank_id_must_be_a_candidate_resource` 报 `ValueError` 未抛出；`test_overlapping_...` 报 `failureReasons` 为空（`AssertionError`）。

- [ ] **Step 3: 加 `tankId` 校验**

在 `solver/app/solver_service.py` 的 `_validate` 里，紧跟 `pinnedResourceId` 校验（现位于 `if task.pinnedResourceId is not None ...` 之后）插入：

```python
            if task.tankId is not None and task.tankId not in task.candidateResourceIds:
                raise ValueError(
                    f"Task {task.id} tankId {task.tankId} is not a candidate resource"
                )
```

- [ ] **Step 4: 在 `_build_failure_reasons` 里加 NON_MIXING 分支**

在 `_build_failure_reasons`（现约 `solver_service.py:432`）的 `reasons: list[SolverFailureReason] = []` 之后、`for item_code in sorted(...)` 之前插入：

```python
        tasks_by_tank: dict[str, list[SolverTask]] = defaultdict(list)
        for task in request.tasks:
            if task.tankId and task.mixingFamily:
                tasks_by_tank[task.tankId].append(task)
        for tank_id in sorted(tasks_by_tank):
            tasks = sorted(tasks_by_tank[tank_id], key=lambda task: task.id)
            for first_index, first_task in enumerate(tasks):
                for second_task in tasks[first_index + 1 :]:
                    if first_task.mixingFamily == second_task.mixingFamily:
                        continue
                    families = [first_task.mixingFamily, second_task.mixingFamily]
                    task_ids = [first_task.id, second_task.id]
                    reasons.append(
                        SolverFailureReason(
                            reasonType="NON_MIXING",
                            tankId=tank_id,
                            conflictingTaskIds=task_ids,
                            mixingFamilies=families,
                            message=(
                                f"NON_MIXING | tankId={tank_id} | tasks={','.join(task_ids)} | "
                                f"mixingFamilies={','.join(families)} | "
                                "tasks require different families on the same fermentation tank"
                            ),
                        )
                    )
```

（`defaultdict` 已在文件顶部 `from collections import defaultdict` 导入。）

- [ ] **Step 5: 跑测试确认绿**

Run: `cd solver && python3 -m unittest discover -s tests -p 'test_*.py'`
Expected: PASS（含 Task 1 的既有测试与新增 4 个测试）

- [ ] **Step 6: Commit**

```bash
git add solver/app/solver_service.py solver/tests/test_solver_service.py
git commit -m "feat(solver): validate tankId membership and emit NON_MIXING failure evidence"
```

---

## Task 3: Java 端到端字段透传（原子任务）

> 说明：Java `record` 增加字段会改变规范构造器参数个数，所有 `new Record(...)` 调用点必须同步更新，否则编译失败。本任务把整条链一次性改完，用 `mvn test` 作为编译门槛。下面每个子步骤对应一个文件的小改动。

**Files:**
- Modify: `backend/src/main/java/com/apspoc/backend/service/SolverRequest.java`
- Modify: `backend/src/main/java/com/apspoc/backend/service/SolverResponse.java`
- Modify: `backend/src/main/java/com/apspoc/backend/api/dto/CreateScheduleJobRequest.java`
- Modify: `backend/src/main/java/com/apspoc/backend/api/dto/GenerateScenarioRequest.java`
- Modify: `backend/src/main/java/com/apspoc/backend/api/dto/ImportedRecipeRow.java`
- Modify: `backend/src/main/java/com/apspoc/backend/service/SchedulingJobService.java`
- Modify: `backend/src/main/java/com/apspoc/backend/service/ScenarioGenerationService.java`
- Modify: `backend/src/main/java/com/apspoc/backend/service/ImportBatchScenarioService.java`
- Modify: `backend/src/main/java/com/apspoc/backend/service/ModelImportService.java`
- Modify（测试）：`backend/src/test/java/com/apspoc/backend/service/SolverResponseTest.java`
- Modify（测试）：`backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java`
- Modify（测试）：`backend/src/test/java/com/apspoc/backend/service/VersionTrialSolveServiceTest.java`
- Modify（测试）：`backend/src/test/java/com/apspoc/backend/service/VersionGanttViewServiceTest.java`

### 3.1 `SolverRequest.Task` 加字段

把 `Task` record 的字段列表在 `materialOutputs` 之后追加两个组件，并在紧凑构造器里正规化：

```java
    public record Task(
            String id,
            String label,
            String productCode,
            int durationMinutes,
            int dueMinutes,
            int priority,
            List<String> candidateResourceIds,
            String pinnedResourceId,
            Integer pinnedStartMinutes,
            List<String> predecessorTaskIds,
            String setupGroup,
            List<MaterialQuantity> materialInputs,
            List<MaterialQuantity> materialOutputs,
            String tankId,
            String mixingFamily
    ) {
        public Task {
            candidateResourceIds = List.copyOf(candidateResourceIds);
            predecessorTaskIds = predecessorTaskIds == null ? List.of() : List.copyOf(predecessorTaskIds);
            setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
            materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
            materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
            tankId = tankId == null || tankId.isBlank() ? null : tankId.trim();
            mixingFamily = mixingFamily == null || mixingFamily.isBlank() ? null : mixingFamily.trim();
        }
    }
```

### 3.2 `SolverResponse.FailureReason` 加字段

把 `FailureReason` 改为（含紧凑构造器正规化 list 字段）：

```java
    public record FailureReason(
            String reasonType,
            String message,
            String itemCode,
            String demandId,
            String tankId,
            List<String> conflictingTaskIds,
            List<String> mixingFamilies
    ) {
        public FailureReason {
            conflictingTaskIds = conflictingTaskIds == null ? List.of() : List.copyOf(conflictingTaskIds);
            mixingFamilies = mixingFamilies == null ? List.of() : List.copyOf(mixingFamilies);
        }
    }
```

### 3.3 `CreateScheduleJobRequest.TaskInput` 加字段 + 修便捷构造器

在 `TaskInput` 字段列表 `materialOutputs` 之后追加 `String tankId, String mixingFamily`，紧凑构造器追加两行正规化，并把两个便捷构造器改为在末尾传 `null, null`。完整替换后的 record 如下（其余不变，仅示意改动点）：

```java
    public record TaskInput(
            @NotBlank String id,
            @NotBlank String label,
            @NotBlank String productCode,
            @NotNull @Positive Integer durationMinutes,
            @NotNull @Positive Integer dueMinutes,
            @NotNull @Positive Integer priority,
            @NotEmpty List<@NotBlank String> candidateResourceIds,
            String pinnedResourceId,
            @PositiveOrZero Integer pinnedStartMinutes,
            List<@NotBlank String> predecessorTaskIds,
            String setupGroup,
            List<@Valid MaterialQuantityInput> materialInputs,
            List<@Valid MaterialQuantityInput> materialOutputs,
            String tankId,
            String mixingFamily
    ) {
        public TaskInput {
            candidateResourceIds = List.copyOf(candidateResourceIds);
            predecessorTaskIds = predecessorTaskIds == null ? List.of() : List.copyOf(predecessorTaskIds);
            setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
            materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
            materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
            tankId = tankId == null || tankId.isBlank() ? null : tankId.trim();
            mixingFamily = mixingFamily == null || mixingFamily.isBlank() ? null : mixingFamily.trim();
        }

        // 11 参便捷构造器：在末尾追加 null, null
        public TaskInput(
                String id, String label, String productCode, Integer durationMinutes,
                Integer dueMinutes, Integer priority, List<String> candidateResourceIds,
                String pinnedResourceId, Integer pinnedStartMinutes,
                List<String> predecessorTaskIds, String setupGroup
        ) {
            this(id, label, productCode, durationMinutes, dueMinutes, priority,
                    candidateResourceIds, pinnedResourceId, pinnedStartMinutes,
                    predecessorTaskIds, setupGroup, List.of(), List.of(), null, null);
        }

        // 9 参便捷构造器：在末尾追加 null, null
        public TaskInput(
                String id, String label, String productCode, Integer durationMinutes,
                Integer dueMinutes, Integer priority, List<String> candidateResourceIds,
                String pinnedResourceId, Integer pinnedStartMinutes
        ) {
            this(id, label, productCode, durationMinutes, dueMinutes, priority,
                    candidateResourceIds, pinnedResourceId, pinnedStartMinutes,
                    List.of(), null, List.of(), List.of(), null, null);
        }
    }
```

### 3.4 `GenerateScenarioRequest.RecipeInput` 加字段 + 修便捷构造器

字段列表在 `setupGroup` 之后追加 `String tankId, String mixingFamily`；紧凑构造器追加两行正规化；8 参便捷构造器末尾追加 `null, null`：

```java
    public record RecipeInput(
            @NotBlank String recipeId,
            @NotBlank String productCode,
            @NotBlank String operationCode,
            @NotBlank String operationName,
            @NotNull @Positive Integer sequence,
            @NotNull @Positive Integer durationMinutes,
            @NotEmpty List<@NotBlank String> candidateResourceIds,
            List<@Valid MaterialQuantityInput> materialInputs,
            List<@Valid MaterialQuantityInput> materialOutputs,
            String setupGroup,
            String tankId,
            String mixingFamily
    ) {
        public RecipeInput {
            candidateResourceIds = List.copyOf(candidateResourceIds);
            materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
            materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
            setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
            tankId = tankId == null || tankId.isBlank() ? null : tankId.trim();
            mixingFamily = mixingFamily == null || mixingFamily.isBlank() ? null : mixingFamily.trim();
        }

        public RecipeInput(
                String recipeId, String productCode, String operationCode,
                String operationName, Integer sequence, Integer durationMinutes,
                List<String> candidateResourceIds, String setupGroup
        ) {
            this(recipeId, productCode, operationCode, operationName, sequence,
                    durationMinutes, candidateResourceIds, List.of(), List.of(),
                    setupGroup, null, null);
        }
    }
```

### 3.5 `ImportedRecipeRow` 加字段 + 修便捷构造器

字段列表在 `setupGroup` 之后追加 `String tankId, String mixingFamily`；紧凑构造器追加正规化；8 参便捷构造器末尾追加 `null, null`：

```java
public record ImportedRecipeRow(
        String recipeId,
        String productCode,
        String operationCode,
        String operationName,
        int sequence,
        int durationMinutes,
        List<String> candidateResourceIds,
        List<CreateScheduleJobRequest.MaterialQuantityInput> materialInputs,
        List<CreateScheduleJobRequest.MaterialQuantityInput> materialOutputs,
        String setupGroup,
        String tankId,
        String mixingFamily
) {
    public ImportedRecipeRow {
        candidateResourceIds = List.copyOf(candidateResourceIds);
        materialInputs = materialInputs == null ? List.of() : List.copyOf(materialInputs);
        materialOutputs = materialOutputs == null ? List.of() : List.copyOf(materialOutputs);
        setupGroup = setupGroup == null || setupGroup.isBlank() ? null : setupGroup.trim();
        tankId = tankId == null || tankId.isBlank() ? null : tankId.trim();
        mixingFamily = mixingFamily == null || mixingFamily.isBlank() ? null : mixingFamily.trim();
    }

    public ImportedRecipeRow(
            String recipeId, String productCode, String operationCode,
            String operationName, int sequence, int durationMinutes,
            List<String> candidateResourceIds, String setupGroup
    ) {
        this(recipeId, productCode, operationCode, operationName, sequence,
                durationMinutes, candidateResourceIds, List.of(), List.of(),
                setupGroup, null, null);
    }
}
```

### 3.6 `SchedulingJobService`：透传 + 失败消息格式化

(1) 在 `toSolverRequest` 的 `new SolverRequest.Task(...)` 调用末尾（`task.materialOutputs()...toList()` 之后）追加两参：

```java
                                task.materialOutputs().stream()
                                        .map(material -> new SolverRequest.MaterialQuantity(
                                                material.itemCode(),
                                                material.quantity()
                                        ))
                                        .toList(),
                                task.tankId(),
                                task.mixingFamily()
```

(2) 在 `buildSolverFailureMessage` 的 `parts` 追加逻辑（`demandId` 判断之后、`reason.message()` 判断之前）追加：

```java
                    if (reason.tankId() != null && !reason.tankId().isBlank()) {
                        parts.add("tankId=" + reason.tankId());
                    }
                    if (reason.conflictingTaskIds() != null && !reason.conflictingTaskIds().isEmpty()) {
                        parts.add("conflictingTaskIds=" + String.join(",", reason.conflictingTaskIds()));
                    }
                    if (reason.mixingFamilies() != null && !reason.mixingFamilies().isEmpty()) {
                        parts.add("mixingFamilies=" + String.join(",", reason.mixingFamilies()));
                    }
```

### 3.7 `ScenarioGenerationService`：RecipeInput → TaskInput 透传

在 `generate()` 里 `new CreateScheduleJobRequest.TaskInput(...)` 调用末尾（`materialOutputs` 参数之后）追加两参：

```java
                            recipe.setupGroup(),
                            materialInputs,
                            materialOutputs,
                            recipe.tankId(),
                            recipe.mixingFamily()
```

### 3.8 `ImportBatchScenarioService`：ImportedRecipeRow → RecipeInput 透传

在 `generate()` 里 `new GenerateScenarioRequest.RecipeInput(...)` 调用末尾（`row.setupGroup()` 之后）追加两参：

```java
                                row.materialOutputs(),
                                row.setupGroup(),
                                row.tankId(),
                                row.mixingFamily()
```

### 3.9 `ModelImportService`：recipe CSV 解析新列

(1) `RECIPE_HEADER_ALIASES`（`solver/app` 无关，位于 `ModelImportService.java` 约 `:69-80`）末尾追加两项：

```java
            "setupGroup", Set.of("setupgroup", "setup", "换型组", "换型分组"),
            "tankId", Set.of("tankid", "tank", "罐号", "发酵罐", "储罐"),
            "mixingFamily", Set.of("mixingfamily", "family", "混装家族", "家族", "混装")
```

(2) `RECIPE_TEMPLATE_HEADERS`（约 `:135-146`）末尾追加：

```java
            "materialOutputs",
            "setupGroup",
            "tankId",
            "mixingFamily"
```

(3) `importRecipes` 里 `new ImportedRecipeRow(...)` 调用末尾（`optionalValue(row, "setupGroup", "recipe")` 之后）追加两参：

```java
                    optionalValue(row, "setupGroup", "recipe"),
                    optionalValue(row, "tankId", "recipe"),
                    optionalValue(row, "mixingFamily", "recipe")
```

### 3.10 修复测试调用点（全规范构造器）

以下 `new` 调用因 record 增字段而需补参。逐个改为：

- `SolverResponseTest.java`（约 `:42`）与 `SchedulingJobServiceTest.java`（约 `:108`）的 `new SolverResponse.FailureReason("MATERIAL_SHORTAGE", "...", "RM-100", null)` → 追加 `null, List.of(), List.of()`（即 `tankId=null, conflictingTaskIds=List.of(), mixingFamilies=List.of()`）。
- `SchedulingJobServiceTest.java`（约 `:149`）、`VersionTrialSolveServiceTest.java`（约 `:94`）、`VersionGanttViewServiceTest.java`（约 `:31`）的 `new CreateScheduleJobRequest.TaskInput(...)` 全规范构造调用 → 末尾追加 `null, null`。

> 若 `mvn test` 仍报某处 `TaskInput`/`RecipeInput`/`ImportedRecipeRow` 构造参数个数不匹配，按同一规则在末尾补 `null, null`（这类多为 `ScenarioGenerationServiceTest` 里的全规范 10 参 `RecipeInput` 调用；8 参便捷构造器不受影响）。编译器会精确列出每一处。

### 3.11 验证与提交

- [ ] **Step: 跑后端测试**

Run: `cd backend && mvn test`
Expected: PASS（既有测试 + 编译通过）

- [ ] **Step: 跑求解器测试确认未破坏**

Run: `cd solver && python3 -m unittest discover -s tests -p 'test_*.py'`
Expected: PASS

- [ ] **Step: Commit**

```bash
git add backend/src/main/java backend/src/test/java
git commit -m "feat(backend): thread tankId/mixingFamily from recipe import through solver task"
```

---

## Task 4: 端到端集成测试（recipe→task→SolverRequest 透传）

**Files:**
- Test: `backend/src/test/java/com/apspoc/backend/service/ScenarioGenerationServiceTest.java`（追加一个测试方法）
- Test: `backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java`（追加一个测试方法）

- [ ] **Step 1: `ScenarioGenerationService` 透传测试**

在 `ScenarioGenerationServiceTest` 加：

```java
    @Test
    void generated_task_carries_tank_and_mixing_family_from_recipe() {
        GenerateScenarioRequest request = new GenerateScenarioRequest(
                "non-mixing",
                null,
                Instant.parse("2026-04-15T08:00:00Z"),
                240,
                List.of(new CreateScheduleJobRequest.ResourceInput("ferm_t1", "Tank 1", ResourceType.TANK, 1)),
                List.of(new GenerateScenarioRequest.RecipeInput(
                        "rcp_1", "SKU-A", "FERMENT", "Ferment", 1, 120, List.of("ferm_t1"),
                        List.of(), List.of(), "FAM_A", "ferm_t1", "A500"
                )),
                List.of(new GenerateScenarioRequest.DemandInput("d1", "SKU-A", "1", 240, 1, null, null)),
                List.of(), List.of(),
                new CreateScheduleJobRequest.ObjectiveWeights(100, 0, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4)
        );

        GeneratedScenarioResponse response = scenarioGenerationService.generate(request);

        CreateScheduleJobRequest.TaskInput task = response.scheduleRequest().tasks().get(0);
        assertThat(task.tankId()).isEqualTo("ferm_t1");
        assertThat(task.mixingFamily()).isEqualTo("A500");
    }
```

（如测试未引入 `Instant` / `assertThat` / `ResourceType`，按文件中既有 import 补齐；`scenarioGenerationService` 为当前测试类已有注入字段。）

- [ ] **Step 2: `SchedulingJobService.toSolverRequest` 透传测试**

在 `SchedulingJobServiceTest` 加（构造一个带 `tankId`/`mixingFamily` 的 `TaskInput`，断言 `toSolverRequest` 产物 `SolverRequest.Task` 含同样字段）。测试体按该类既有 `toSolverRequest` 调用方式写出：

```java
    @Test
    void solver_request_task_carries_tank_and_mixing_family() {
        CreateScheduleJobRequest request = new CreateScheduleJobRequest(
                "non-mixing",
                Instant.parse("2026-04-15T08:00:00Z"),
                240,
                List.of(new CreateScheduleJobRequest.ResourceInput("ferm_t1", "Tank 1", ResourceType.TANK, 1)),
                List.of(new CreateScheduleJobRequest.TaskInput(
                        "task_a", "A", "SKU-A", 120, 240, 1, List.of("ferm_t1"),
                        null, null, List.of(), null, List.of(), List.of(), "ferm_t1", "A500"
                )),
                List.of(), new CreateScheduleJobRequest.ObjectiveWeights(100, 0, 1),
                new CreateScheduleJobRequest.SolverConfig(10, 4)
        );

        SolverRequest solverRequest = schedulingJobService.toSolverRequestForTest(request);

        assertThat(solverRequest.tasks().get(0).tankId()).isEqualTo("ferm_t1");
        assertThat(solverRequest.tasks().get(0).mixingFamily()).isEqualTo("A500");
    }
```

> 注：`toSolverRequest` 是私有方法。若测试类未暴露测试辅助方法 `toSolverRequestForTest`，可直接断言私有方法存在性代价过高——改为在既有 `SchedulingJobServiceTest` 的"求解成功"路径测试里触发 `toSolverRequest` 并捕获抛给 `SolverGateway` 的 `SolverRequest`（粘贴该测试类已有的 mock 断言方式），或把本步骤降级为纯编译回归（`mvn test` 全绿即可），核心行为已由 Task 2 求解器测试覆盖。执行者按该类既有 mock 结构选择最小侵入方式。

- [ ] **Step 3: 跑后端测试**

Run: `cd backend && mvn test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/src/test/java/com/apspoc/backend/service/ScenarioGenerationServiceTest.java backend/src/test/java/com/apspoc/backend/service/SchedulingJobServiceTest.java
git commit -m "test(backend): assert tankId/mixingFamily carry through scenario generation and solver request"
```

---

## 自检（Self-Review）

- **覆盖**：设计稿 §5 的透传链（`ImportedRecipeRow→RecipeInput→TaskInput→SolverRequest.Task→SolverTask`）与 §6 的失败证据回传（`SolverFailureReason→SolverResponse.FailureReason→buildSolverFailureMessage`）都在 Task 1–4 有对应改动；求解器约束语义（§3.2 复用 `AddNoOverlap`）由 Task 2 测试直接锁定。
- **类型一致性**：`tankId`/`mixingFamily` 两个字段名在 Python（`SolverTask`/`SolverFailureReason`）与 Java（5 个 record）间保持一致；`conflictingTaskIds`/`mixingFamilies` 在 `SolverFailureReason` 与 `SolverResponse.FailureReason` 间保持一致。
- **尚需执行者确认**：Task 4 Step 2 的私有 `toSolverRequest` 测试采用"最小侵入"实现策略（见注），不作为硬性失败条件。

## 完成后的下一步（计划外，另行确认）

- 补 Snow Beer 第四期"发酵罐不可混装"负向样本包（CSV + `uat_package_smoke` 路径），验证端到端失败解释。范围见设计稿 §6。