# 产品文档目录规范

产品文档统一放在 `docs/product/` 下，按“产品范围 → 业务流程 → 需求 → 设计 → 数据/接口 → 交付 → 验收 → 上线”组织。

## 目录结构

- `00_index/`：文档索引、术语表、变更记录
- `01_scope_and_roadmap/`：产品目标、范围边界、版本路线图
- `02_business_process/`：业务角色、现状流程、目标流程、流程图
- `03_requirements/`：PRD、用户故事、需求清单、非功能需求
- `04_ux_and_prototype/`：页面清单、原型、交互说明、页面流转
- `05_functional_design/`：功能设计、状态流转、权限规则、异常场景
- `06_data_and_rules/`：数据字典、主数据、业务规则、计算口径
- `07_api_and_integration/`：接口清单、API 契约、外部系统对接说明
- `08_delivery_plan/`：迭代计划、任务拆解、里程碑、风险清单
- `09_testing_and_acceptance/`：测试用例、验收标准、UAT 问题跟踪
- `10_release_and_operation/`：上线清单、培训材料、运维交接
- `99_archive/`：历史版本、废弃方案、归档材料

## 建议优先准备的文档

### P0：立项和开发前必须有
1. `01_scope_and_roadmap/产品目标与范围.md`
2. `02_business_process/业务角色与核心流程.md`
3. `03_requirements/PRD_核心排产能力.md`
4. `04_ux_and_prototype/页面清单与原型说明.md`
5. `05_functional_design/功能清单与详细设计.md`
6. `06_data_and_rules/数据字典与业务规则.md`
7. `07_api_and_integration/接口清单与字段契约.md`
8. `09_testing_and_acceptance/验收标准与测试用例.md`

### P1：进入联调和交付阶段建议补齐
1. `01_scope_and_roadmap/版本路线图.md`
2. `03_requirements/非功能需求.md`
3. `05_functional_design/权限与状态流转说明.md`
4. `07_api_and_integration/外部系统对接说明.md`
5. `08_delivery_plan/迭代计划与里程碑.md`
6. `08_delivery_plan/风险问题清单.md`
7. `10_release_and_operation/上线检查清单.md`

### P2：沉淀与复盘类文档
1. `00_index/术语表.md`
2. `00_index/变更记录.md`
3. `10_release_and_operation/培训与操作手册.md`
4. `99_archive/历史方案归档.md`

## 编写规范

- 默认使用 Markdown，图片放在同目录 `assets/` 子目录中。
- 一个文档只讲一个主题，避免把需求、设计、测试混写在同一个文件里。
- 文件名建议采用 `主题.md` 或 `主题_对象.md`，避免随意命名。
- 需求变更优先更新原文档，并在 `00_index/变更记录.md` 记录关键变更。
- 原型、流程图、接口样例如果有源文件，和导出文件放在同目录。

## 建议下一步

建议先从 P0 文档开始，优先把“范围、流程、PRD、原型、功能设计、数据规则、接口契约、验收标准”补齐，再进入详细开发。