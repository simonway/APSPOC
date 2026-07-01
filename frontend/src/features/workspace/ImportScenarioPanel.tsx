import { Alert, Button, Input, InputNumber, Space, Tag } from "antd";
import {
  resolveImportBatchErrorsUrl,
  resolveModelImportTemplateUrl,
  type ImportBatchKind,
  type ImportBatchResponse,
} from "../../lib/api";
import {
  importBatchKinds,
  requiredImportBatchKinds,
  useImportScenarioWorkflow,
  type ScenarioSetupState,
} from "./useImportScenarioWorkflow";

const labels: Record<ImportBatchKind, string> = {
  resources: "Resources",
  recipes: "Recipes",
  demands: "Demands",
  "inventory-balances": "Inventory Balances",
  downtimes: "Downtimes",
  "setup-rules": "Setup Rules",
};

function isRequiredBatchKind(kind: ImportBatchKind) {
  return (requiredImportBatchKinds as readonly ImportBatchKind[]).includes(kind);
}

function statusColor(status: string) {
  if (status === "SUCCEEDED" || status === "SCENARIO_GENERATED") {
    return "green";
  }
  if (status === "FAILED" || status === "VALIDATION_FAILED") {
    return "red";
  }
  return "blue";
}

function BatchMetadata({ batch }: { batch: ImportBatchResponse }) {
  return (
    <dl className="import-batch-metadata">
      <div>
        <dt>file</dt>
        <dd>{batch.sourceFileName ?? "未记录"}</dd>
      </div>
      <div>
        <dt>importId</dt>
        <dd>{batch.importId}</dd>
      </div>
      <div>
        <dt>dataVersion</dt>
        <dd>{batch.dataVersion}</dd>
      </div>
      <div>
        <dt>status</dt>
        <dd>
          <Tag color={statusColor(batch.status)}>{batch.status}</Tag>
        </dd>
      </div>
      <div>
        <dt>success</dt>
        <dd>{batch.successCount}</dd>
      </div>
      <div>
        <dt>failure</dt>
        <dd>{batch.failureCount}</dd>
      </div>
      {batch.errorsDownloadPath && (
        <div>
          <dt>errors</dt>
          <dd>
            <a href={resolveImportBatchErrorsUrl(batch.errorsDownloadPath)}>下载错误报告</a>
          </dd>
        </div>
      )}
    </dl>
  );
}

function BatchCard({
  batch,
  kind,
  pending,
  uploadDisabled,
  onUpload,
}: {
  batch: ImportBatchResponse | undefined;
  kind: ImportBatchKind;
  pending: boolean;
  uploadDisabled: boolean;
  onUpload: (kind: ImportBatchKind, file: File) => void;
}) {
  const label = labels[kind];
  const inputId = `upload-${kind}`;

  return (
    <article className="import-batch-card" aria-label={`${label} import batch`}>
      <div className="import-batch-card-header">
        <h3>{label}</h3>
        {isRequiredBatchKind(kind) && <Tag color="blue">Required</Tag>}
      </div>
      <label htmlFor={inputId}>上传 {label}</label>
      <input
        accept=".csv,.xlsx,.xls"
        disabled={uploadDisabled}
        id={inputId}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            onUpload(kind, file);
          }
          event.currentTarget.value = "";
        }}
        type="file"
      />
      {pending && <span>上传中...</span>}
      {batch ? <BatchMetadata batch={batch} /> : <span>暂无批次</span>}
    </article>
  );
}

function ScenarioSetup({
  setup,
  updateSetup,
}: {
  setup: ScenarioSetupState;
  updateSetup: (setup: Partial<ScenarioSetupState>) => void;
}) {
  const updateObjectiveWeights = (objectiveWeights: Partial<ScenarioSetupState["objectiveWeights"]>) => {
    updateSetup({ objectiveWeights: { ...setup.objectiveWeights, ...objectiveWeights } });
  };
  const updateSolverConfig = (solverConfig: Partial<ScenarioSetupState["solverConfig"]>) => {
    updateSetup({ solverConfig: { ...setup.solverConfig, ...solverConfig } });
  };

  return (
    <section className="scenario-setup" aria-labelledby="scenario-setup-heading">
      <h2 id="scenario-setup-heading">场景参数</h2>
      <div className="scenario-setup-grid">
        <label>
          场景名称
          <Input
            value={setup.scenarioName}
            onChange={(event) => updateSetup({ scenarioName: event.target.value })}
          />
        </label>
        <label>
          排程开始
          <Input
            type="datetime-local"
            value={setup.scheduleStartAt}
            onChange={(event) => updateSetup({ scheduleStartAt: event.target.value })}
          />
        </label>
        <label>
          Horizon
          <InputNumber
            min={1}
            precision={0}
            step={1}
            value={setup.horizonMinutes}
            onChange={(value) => updateSetup({ horizonMinutes: value ?? setup.horizonMinutes })}
          />
        </label>
        <label>
          Tardiness 权重
          <InputNumber
            min={1}
            value={setup.objectiveWeights.tardiness}
            onChange={(value) => updateObjectiveWeights({ tardiness: value ?? setup.objectiveWeights.tardiness })}
          />
        </label>
        <label>
          Earliness 权重
          <InputNumber
            min={0}
            value={setup.objectiveWeights.earliness}
            onChange={(value) => updateObjectiveWeights({ earliness: value ?? setup.objectiveWeights.earliness })}
          />
        </label>
        <label>
          Makespan 权重
          <InputNumber
            min={0}
            value={setup.objectiveWeights.makespan}
            onChange={(value) => updateObjectiveWeights({ makespan: value ?? setup.objectiveWeights.makespan })}
          />
        </label>
        <label>
          Time Limit
          <InputNumber
            min={1}
            precision={0}
            step={1}
            value={setup.solverConfig.timeLimitSeconds}
            onChange={(value) => updateSolverConfig({ timeLimitSeconds: value ?? setup.solverConfig.timeLimitSeconds })}
          />
        </label>
        <label>
          Search Workers
          <InputNumber
            min={1}
            precision={0}
            step={1}
            value={setup.solverConfig.numSearchWorkers}
            onChange={(value) => updateSolverConfig({ numSearchWorkers: value ?? setup.solverConfig.numSearchWorkers })}
          />
        </label>
      </div>
    </section>
  );
}

export function ImportScenarioPanel({ onOpenJobs }: { onOpenJobs: () => void }) {
  const workflow = useImportScenarioWorkflow();
  const scenario = workflow.generatedScenario?.scenario;
  const uploadDisabled = workflow.uploadPendingKind !== null;

  return (
    <section className="import-scenario-panel" aria-label="数据导入与场景生成">
      <div className="import-scenario-header dashboard-card">
        <div>
          <p className="eyebrow">模型导入</p>
          <h1>数据导入与场景生成</h1>
          <span>{workflow.readinessMessage}</span>
        </div>
        <Space wrap>
          <Button href={resolveModelImportTemplateUrl()}>下载导入模板</Button>
          <Button onClick={workflow.resetWorkflow}>重置</Button>
        </Space>
      </div>

      {workflow.actionError && <Alert message={workflow.actionError} showIcon type="warning" />}

      <section className="import-control-panel dashboard-card" aria-label="导入控制">
        <label>
          dataVersion
          <Input
            value={workflow.dataVersion}
            onChange={(event) => workflow.updateDataVersion(event.target.value)}
          />
        </label>
        <span>
          required-ready {workflow.requiredReadyCount}/{requiredImportBatchKinds.length}
        </span>
      </section>

      <section className="import-batch-grid" aria-label="导入批次">
        {importBatchKinds.map((kind) => (
          <BatchCard
            batch={workflow.batches[kind]}
            key={kind}
            kind={kind}
            pending={workflow.uploadPendingKind === kind}
            uploadDisabled={uploadDisabled}
            onUpload={(nextKind, file) => void workflow.uploadBatch(nextKind, file)}
          />
        ))}
      </section>

      <div className="scenario-workflow-body dashboard-card">
        <ScenarioSetup setup={workflow.setup} updateSetup={workflow.updateSetup} />
        <Space wrap>
          <Button
            disabled={!workflow.canGenerate}
            loading={workflow.generating}
            onClick={() => void workflow.generateScenario()}
            type="primary"
          >
            生成场景
          </Button>
          <Button
            disabled={!workflow.canSubmit}
            loading={workflow.submitting}
            onClick={() => void workflow.submitGeneratedSchedule()}
          >
            提交排程任务
          </Button>
        </Space>
      </div>

      {scenario && (
        <section className="generated-scenario-summary dashboard-card" aria-label="生成场景摘要">
          <h2>{scenario.scenarioName}</h2>
          <Space wrap>
            <Tag>Operation {scenario.operationCount}</Tag>
            <Tag>Precedence {scenario.precedencePairCount}</Tag>
            <Tag>Resources {scenario.resourceCount}</Tag>
            <Tag>Demands {scenario.demandCount}</Tag>
          </Space>
        </section>
      )}

      {workflow.submittedJob && (
        <article className="submitted-job-card dashboard-card" aria-label="已提交排程任务">
          <strong>{workflow.submittedJob.jobId}</strong>
          <Tag color="blue">{workflow.submittedJob.status}</Tag>
          <Button onClick={onOpenJobs}>查看排程任务</Button>
        </article>
      )}
    </section>
  );
}
