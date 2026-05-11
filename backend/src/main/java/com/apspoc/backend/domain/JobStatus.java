package com.apspoc.backend.domain;

public enum JobStatus {
    CREATED,
    QUEUED,
    RUNNING,
    SUCCEEDED,
    FAILED,
    TIMEOUT,
    CANCELLED;

    public boolean isTerminal() {
        return this == SUCCEEDED || this == FAILED || this == TIMEOUT || this == CANCELLED;
    }
}
