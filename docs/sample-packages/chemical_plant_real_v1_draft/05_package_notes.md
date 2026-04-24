# 第一版真实业务样本包说明

## 1. 目的

本目录用于组装第一版真实业务样本包。当前状态是**可填报草案**，不是可直接提交的最终请求体。

## 2. 建议填写顺序

1. 先填写 `06_request_context_mapping.csv`，确定排产起点、排产窗口和默认求解参数。
2. 再填写 `07_resource_staging.csv`，确认资源编码、资源名称、资源类型和排序。
3. 再填写 `08_task_staging.csv`，整理任务、交期、优先级、候选资源和可选固定约束。
4. 若存在设备停机或保养计划，填写 `09_downtime_staging.csv`。
5. 根据 06~09 的内容回填 `01_resources.json`、`02_tasks.json`、`03_downtimes.json`。
6. 最后更新 `04_schedule_request.json`，形成可提交的第一版真实样本请求体。

## 3. 当前默认值

- `objectiveWeights.tardiness = 100`
- `objectiveWeights.makespan = 1`
- `solverConfig.timeLimitSeconds = 10`
- `solverConfig.numSearchWorkers = 4`

这些值暂时沿用基线样本，后续可根据真实任务量调整。

## 4. 适用边界

当前第一版真实样本包只建议覆盖：

- 一个车间、产线或相对独立的生产单元
- 2~7 天排产窗口
- 独立任务模型
- 多候选资源、停机、固定资源、固定开始时间这四类当前已实现约束

以下内容不要直接塞进当前 JSON：

- 工序先后顺序
- 换型时长
- 库存与投料平衡
- 公用工程容量
- 人员班组
- 任务拆分

## 5. 完成判定

当满足以下条件时，可认为第一版真实样本包已可用于联调：

- `01_resources.json`、`02_tasks.json` 非空且字段完整
- 所有任务候选资源都能在资源表中找到
- 所有相对分钟字段都已按 `scheduleStartAt` 完成换算
- `04_schedule_request.json` 与 01/02/03 一致
- `10_data_gap_register.md` 中没有阻塞级问题
