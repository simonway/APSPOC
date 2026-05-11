package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.ImportBatchErrorDetail;
import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public class ImportBatchValidationException extends RuntimeException {

    private final ImportBatch batch;
    private final List<ImportBatchErrorDetail> errors;

    public ImportBatchValidationException(String message, List<ImportBatchErrorDetail> errors) {
        this(message, null, errors);
    }

    public ImportBatchValidationException(String message, ImportBatch batch, List<ImportBatchErrorDetail> errors) {
        super(message);
        this.batch = batch;
        this.errors = errors == null ? List.of() : List.copyOf(errors);
    }

    public ImportBatch batch() {
        return batch;
    }

    public List<ImportBatchErrorDetail> errors() {
        return errors;
    }

    public ImportBatchValidationException withBatch(ImportBatch persistedBatch) {
        return new ImportBatchValidationException(getMessage(), persistedBatch, errors);
    }
}
