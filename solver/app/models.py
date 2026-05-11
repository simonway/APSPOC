from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SolverResource(BaseModel):
    id: str
    label: str
    resourceType: str
    sortOrder: int = Field(ge=0)


class SolverTask(BaseModel):
    id: str
    label: str
    productCode: str
    durationMinutes: int = Field(gt=0)
    dueMinutes: int = Field(gt=0)
    priority: int = Field(gt=0)
    candidateResourceIds: list[str]
    pinnedResourceId: str | None = None
    pinnedStartMinutes: int | None = Field(default=None, ge=0)
    predecessorTaskIds: list[str] = Field(default_factory=list)
    setupGroup: str | None = None
    materialInputs: list["SolverMaterialQuantity"] = Field(default_factory=list)
    materialOutputs: list["SolverMaterialQuantity"] = Field(default_factory=list)


class SolverDowntime(BaseModel):
    id: str
    resourceId: str
    startMinutes: int = Field(ge=0)
    endMinutes: int = Field(gt=0)
    downtimeType: str
    source: str = "MANUAL"
    description: str = ""


class SolverSetupRule(BaseModel):
    fromSetupGroup: str
    toSetupGroup: str
    resourceType: str | None = None
    resourceId: str | None = None
    setupMinutes: int = Field(ge=0)


class SolverInventoryBalance(BaseModel):
    itemCode: str
    availableQuantity: int = Field(ge=0)
    availableFromMinutes: int = Field(default=0, ge=0)
    safetyStockQuantity: int = Field(default=0, ge=0)


class SolverMaterialQuantity(BaseModel):
    itemCode: str
    quantity: int = Field(gt=0)


class SolverInventoryDemand(BaseModel):
    demandId: str
    itemCode: str
    quantity: int = Field(gt=0)
    dueMinutes: int = Field(gt=0)


class ObjectiveWeights(BaseModel):
    tardiness: int = Field(default=100, gt=0)
    earliness: int = Field(default=0, ge=0)
    makespan: int = Field(default=1, ge=0)


class SolverConfig(BaseModel):
    timeLimitSeconds: int = Field(default=10, gt=0)
    numSearchWorkers: int = Field(default=4, gt=0)


class SolveRequest(BaseModel):
    jobId: str
    scheduleStartAt: datetime
    horizonMinutes: int = Field(gt=0)
    dataVersion: str | None = None
    resources: list[SolverResource]
    tasks: list[SolverTask]
    downtimes: list[SolverDowntime] = Field(default_factory=list)
    setupRules: list[SolverSetupRule] = Field(default_factory=list)
    inventoryBalances: list[SolverInventoryBalance] = Field(default_factory=list)
    inventoryDemands: list[SolverInventoryDemand] = Field(default_factory=list)
    objectiveWeights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)
    solverConfig: SolverConfig = Field(default_factory=SolverConfig)


class ScheduledTask(BaseModel):
    taskId: str
    resourceId: str
    startMinutes: int
    endMinutes: int
    late: bool
    tardinessMinutes: int


class Changeover(BaseModel):
    id: str
    resourceId: str
    fromTaskId: str
    toTaskId: str
    startMinutes: int
    endMinutes: int
    durationMinutes: int


class SolveKpis(BaseModel):
    totalWeightedTardiness: int
    totalMakespan: int
    lateTaskCount: int
    averageUtilization: float


class SolveResponse(BaseModel):
    jobId: str
    status: str
    solveTimeMs: int
    scheduledTasks: list[ScheduledTask]
    changeovers: list[Changeover]
    kpis: SolveKpis
