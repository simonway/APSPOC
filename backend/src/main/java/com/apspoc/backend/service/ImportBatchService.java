package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.ImportBatchErrorDetail;
import com.apspoc.backend.api.dto.ImportBatchResponse;
import com.apspoc.backend.domain.ImportBatch;
import com.apspoc.backend.domain.ImportBatchKind;
import com.apspoc.backend.domain.ImportBatchStatus;
import com.apspoc.backend.persistence.entity.ImportBatchEntity;
import com.apspoc.backend.persistence.repository.ImportBatchRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ImportBatchService {

    private static final DateTimeFormatter DATA_VERSION_SUFFIX = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);

    private final ImportBatchRepository importBatchRepository;
    private final ObjectMapper objectMapper;

    public ImportBatchService(ImportBatchRepository importBatchRepository, ObjectMapper objectMapper) {
        this.importBatchRepository = importBatchRepository;
        this.objectMapper = objectMapper;
    }

    public <T> PersistedImportRows<T> saveValidatedBatch(
            ImportBatchKind importType,
            String dataVersion,
            String sourceFileName,
            String importedBy,
            List<T> rows
    ) {
        ImportBatch batch = new ImportBatch(
                "imp-" + UUID.randomUUID(),
                normalizeDataVersion(dataVersion),
                importType,
                sourceFileName == null || sourceFileName.isBlank() ? importType.name().toLowerCase() + ".csv" : sourceFileName,
                importedBy == null || importedBy.isBlank() ? "unknown" : importedBy.trim(),
                Instant.now(),
                ImportBatchStatus.VALIDATED,
                rows.size(),
                0,
                writeJson(rows),
                null
        );

        importBatchRepository.save(toEntity(batch));

        return new PersistedImportRows<>(batch, rows);
    }

    public ImportBatch saveFailedBatch(
            ImportBatchKind importType,
            String dataVersion,
            String sourceFileName,
            String importedBy,
            List<ImportBatchErrorDetail> errors
    ) {
        ImportBatch batch = new ImportBatch(
                "imp-" + UUID.randomUUID(),
                normalizeDataVersion(dataVersion),
                importType,
                sourceFileName == null || sourceFileName.isBlank() ? importType.name().toLowerCase() + ".csv" : sourceFileName,
                importedBy == null || importedBy.isBlank() ? "unknown" : importedBy.trim(),
                Instant.now(),
                ImportBatchStatus.VALIDATION_FAILED,
                0,
                errors == null ? 0 : errors.size(),
                "[]",
                writeJson(errors == null ? List.of() : errors)
        );

        importBatchRepository.save(toEntity(batch));
        return batch;
    }

    public ImportBatchResponse getBatchResponse(String importId) {
        ImportBatch batch = getBatch(importId);
        try {
            JsonNode payload = objectMapper.readTree(batch.payloadJson());
            JsonNode errors = batch.errorReportJson() == null || batch.errorReportJson().isBlank()
                    ? null
                    : objectMapper.readTree(batch.errorReportJson());
            return new ImportBatchResponse(
                    batch.importId(),
                    batch.dataVersion(),
                    batch.importType().name(),
                    batch.sourceFileName(),
                    batch.importedBy(),
                    batch.createdAt(),
                    batch.status().name(),
                    batch.successCount(),
                    batch.failureCount(),
                    payload,
                    errors,
                    errors == null ? null : buildErrorsDownloadPath(batch.importId())
            );
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse import batch data");
        }
    }

    public ImportBatch getBatch(String importId) {
        return importBatchRepository.findById(importId)
                .map(this::toDomain)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown import batch: " + importId));
    }

    public Optional<ImportBatch> findLatestValidatedBatch(String dataVersion, ImportBatchKind importType) {
        return importBatchRepository.findFirstByDataVersionAndImportTypeAndStatusOrderByCreatedAtDesc(
                dataVersion,
                importType,
                ImportBatchStatus.VALIDATED
        ).map(this::toDomain);
    }

    public void markScenarioGenerated(Collection<String> importIds) {
        if (importIds == null || importIds.isEmpty()) {
            return;
        }
        for (String importId : importIds) {
            if (importId == null || importId.isBlank()) {
                continue;
            }
            importBatchRepository.findById(importId).ifPresent(entity -> {
                if (entity.getStatus() == ImportBatchStatus.VALIDATED) {
                    entity.setStatus(ImportBatchStatus.SCENARIO_GENERATED);
                    importBatchRepository.save(entity);
                }
            });
        }
    }

    public <T> List<T> readRows(ImportBatch batch, Class<T> elementType) {
        JavaType javaType = objectMapper.getTypeFactory().constructCollectionType(List.class, elementType);
        try {
            return objectMapper.readValue(batch.payloadJson(), javaType);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read import batch payload");
        }
    }

    public <T> List<T> readRows(ImportBatch batch, TypeReference<List<T>> typeReference) {
        try {
            return objectMapper.readValue(batch.payloadJson(), typeReference);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read import batch payload");
        }
    }

    public List<ImportBatchErrorDetail> readErrors(ImportBatch batch) {
        if (batch.errorReportJson() == null || batch.errorReportJson().isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(
                    batch.errorReportJson(),
                    new TypeReference<List<ImportBatchErrorDetail>>() {
                    }
            );
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read import batch error report");
        }
    }

    public byte[] exportErrorReport(String importId) {
        ImportBatch batch = getBatch(importId);
        List<ImportBatchErrorDetail> errors = readErrors(batch);
        if (errors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Import batch does not contain an error report");
        }

        StringBuilder builder = new StringBuilder();
        builder.append("sheetName,rowNumber,fieldName,rawValue,errorCode,message,suggestion\n");
        for (ImportBatchErrorDetail error : errors) {
            appendCsvCell(builder, error.sheetName());
            builder.append(',');
            appendCsvCell(builder, error.rowNumber() == null ? "" : String.valueOf(error.rowNumber()));
            builder.append(',');
            appendCsvCell(builder, error.fieldName());
            builder.append(',');
            appendCsvCell(builder, error.rawValue());
            builder.append(',');
            appendCsvCell(builder, error.errorCode());
            builder.append(',');
            appendCsvCell(builder, error.message());
            builder.append(',');
            appendCsvCell(builder, error.suggestion());
            builder.append('\n');
        }
        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    public String buildErrorsDownloadPath(String importId) {
        return "/api/v1/model-import/batches/" + importId + "/errors";
    }

    private String normalizeDataVersion(String value) {
        if (value == null || value.isBlank()) {
            return "adhoc_" + DATA_VERSION_SUFFIX.format(Instant.now());
        }
        return value.trim();
    }

    private String writeJson(Object rows) {
        try {
            return objectMapper.writeValueAsString(rows);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize import batch payload");
        }
    }

    private ImportBatch toDomain(ImportBatchEntity entity) {
        return new ImportBatch(
                entity.getId(),
                entity.getDataVersion(),
                entity.getImportType(),
                entity.getSourceFileName(),
                entity.getImportedBy(),
                entity.getCreatedAt(),
                entity.getStatus(),
                entity.getSuccessCount(),
                entity.getFailureCount(),
                entity.getPayloadJson(),
                entity.getErrorReportJson()
        );
    }

    private ImportBatchEntity toEntity(ImportBatch batch) {
        ImportBatchEntity entity = new ImportBatchEntity(batch.importId());
        entity.setDataVersion(batch.dataVersion());
        entity.setImportType(batch.importType());
        entity.setSourceFileName(batch.sourceFileName());
        entity.setImportedBy(batch.importedBy());
        entity.setCreatedAt(batch.createdAt());
        entity.setStatus(batch.status());
        entity.setSuccessCount(batch.successCount());
        entity.setFailureCount(batch.failureCount());
        entity.setPayloadJson(batch.payloadJson());
        entity.setErrorReportJson(batch.errorReportJson());
        return entity;
    }

    private void appendCsvCell(StringBuilder builder, String value) {
        String normalized = value == null ? "" : value;
        boolean quoted = normalized.contains(",") || normalized.contains("\"") || normalized.contains("\n") || normalized.contains("\r");
        if (quoted) {
            builder.append('"');
            builder.append(normalized.replace("\"", "\"\""));
            builder.append('"');
            return;
        }
        builder.append(normalized);
    }

    public record PersistedImportRows<T>(
            ImportBatch batch,
            List<T> rows
    ) {
    }
}
