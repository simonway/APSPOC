package com.apspoc.backend.domain;

public enum JobFailureReason {
    SOLVER_NO_FEASIBLE_SCHEDULE,
    SOLVER_TIMEOUT,
    SOLVER_UNREACHABLE,
    JOB_CANCELLED,
    UNEXPECTED_ERROR
}
