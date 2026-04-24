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


class SolverDowntime(BaseModel):
    id: str
    resourceId: str
    startMinutes: int = Field(ge=0)
    endMinutes: int = Field(gt=0)
    downtimeType: str
    source: str = "MANUAL"
    description: str = ""


class ObjectiveWeights(BaseModel):
    tardiness: int = Field(default=100, gt=0)
    makespan: int = Field(default=1, ge=0)


class SolverConfig(BaseModel):
    timeLimitSeconds: int = Field(default=10, gt=0)
    numSearchWorkers: int = Field(default=4, gt=0)


class SolveRequest(BaseModel):
    jobId: str
    scheduleStartAt: datetime
    horizonMinutes: int = Field(gt=0)
    resources: list[SolverResource]
    tasks: list[SolverTask]
    downtimes: list[SolverDowntime] = Field(default_factory=list)
    objectiveWeights: ObjectiveWeights = Field(default_factory=ObjectiveWeights)
    solverConfig: SolverConfig = Field(default_factory=SolverConfig)


class ScheduledTask(BaseModel):
    taskId: str
    resourceId: str
    startMinutes: int
    endMinutes: int
    late: bool
    tardinessMinutes: int


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
    kpis: SolveKpis
