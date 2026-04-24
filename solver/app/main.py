from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException

from app.models import SolveRequest, SolveResponse
from app.solver_service import SolverService

app = FastAPI(title="APS POC Solver", version="0.0.1")
solver_service = SolverService()


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "service": "aps-poc-solver",
        "status": "UP",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/v1/solve", response_model=SolveResponse)
def solve(request: SolveRequest) -> SolveResponse:
    try:
        return solver_service.solve(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
