package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.ImportBatchValidationErrorResponse;
import com.apspoc.backend.service.ImportBatchService;
import com.apspoc.backend.service.ImportBatchValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private final ImportBatchService importBatchService;

    public ApiExceptionHandler(ImportBatchService importBatchService) {
        this.importBatchService = importBatchService;
    }

    @ExceptionHandler(ImportBatchValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ImportBatchValidationErrorResponse handleImportBatchValidationFailure(ImportBatchValidationException exception) {
        if (exception.batch() == null) {
            return new ImportBatchValidationErrorResponse(
                    "IMPORT_VALIDATION_FAILED",
                    exception.getMessage(),
                    null,
                    exception.errors(),
                    null
            );
        }

        return new ImportBatchValidationErrorResponse(
                "IMPORT_VALIDATION_FAILED",
                exception.getMessage(),
                importBatchService.getBatchResponse(exception.batch().importId()),
                exception.errors(),
                importBatchService.buildErrorsDownloadPath(exception.batch().importId())
        );
    }
}
