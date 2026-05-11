package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.ImportBatchErrorDetail;
import com.apspoc.backend.domain.ImportBatchKind;
import com.apspoc.backend.domain.ImportBatchStatus;
import com.apspoc.backend.persistence.entity.ImportBatchEntity;
import com.apspoc.backend.persistence.repository.ImportBatchRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class ImportBatchServiceTest {

    private RepositoryStub repositoryStub;
    private ImportBatchService importBatchService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        repositoryStub = new RepositoryStub();
        objectMapper = new ObjectMapper();
        importBatchService = new ImportBatchService(repositoryStub.proxy(), objectMapper);
    }

    @Test
    void saveFailedBatchPersistsStructuredErrorReport() throws Exception {
        List<ImportBatchErrorDetail> errors = List.of(new ImportBatchErrorDetail(
                "Resources",
                3,
                "resourceType",
                "bad_type",
                "INVALID_ENUM",
                "resourceType must be valid",
                "Use REACTOR/FILTER/DRYER."
        ));

        importBatchService.saveFailedBatch(
                ImportBatchKind.RESOURCE,
                "dv-1",
                "resources.xlsx",
                "planner",
                errors
        );

        ImportBatchEntity saved = repositoryStub.savedEntity;
        assertThat(saved.getStatus()).isEqualTo(ImportBatchStatus.VALIDATION_FAILED);
        assertThat(saved.getFailureCount()).isEqualTo(1);
        assertThat(saved.getPayloadJson()).isEqualTo("[]");
        assertThat(objectMapper.readTree(saved.getErrorReportJson()).get(0).path("fieldName").asText()).isEqualTo("resourceType");
    }

    @Test
    void exportErrorReportBuildsCsvFromPersistedErrors() throws Exception {
        ImportBatchEntity entity = new ImportBatchEntity("imp-1");
        entity.setDataVersion("dv-1");
        entity.setImportType(ImportBatchKind.RESOURCE);
        entity.setSourceFileName("resources.xlsx");
        entity.setImportedBy("planner");
        entity.setCreatedAt(Instant.parse("2026-05-05T12:00:00Z"));
        entity.setStatus(ImportBatchStatus.VALIDATION_FAILED);
        entity.setSuccessCount(0);
        entity.setFailureCount(1);
        entity.setPayloadJson("[]");
        entity.setErrorReportJson(objectMapper.writeValueAsString(List.of(new ImportBatchErrorDetail(
                "Resources",
                4,
                "candidateResourceIds",
                "",
                "EMPTY_LIST",
                "candidateResourceIds must contain at least one resource id",
                "Provide one or more resource ids."
        ))));
        repositoryStub.findByIdResult = Optional.of(entity);

        byte[] csv = importBatchService.exportErrorReport("imp-1");

        assertThat(new String(csv, StandardCharsets.UTF_8))
                .contains("sheetName,rowNumber,fieldName,rawValue,errorCode,message,suggestion")
                .contains("candidateResourceIds")
                .contains("EMPTY_LIST");
        assertThat(importBatchService.getBatchResponse("imp-1").errorsDownloadPath())
                .isEqualTo("/api/v1/model-import/batches/imp-1/errors");
    }

    private static final class RepositoryStub implements InvocationHandler {
        private ImportBatchEntity savedEntity;
        private Optional<ImportBatchEntity> findByIdResult = Optional.empty();

        private ImportBatchRepository proxy() {
            return (ImportBatchRepository) Proxy.newProxyInstance(
                    ImportBatchRepository.class.getClassLoader(),
                    new Class<?>[]{ImportBatchRepository.class},
                    this
            );
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) {
            return switch (method.getName()) {
                case "save" -> {
                    savedEntity = (ImportBatchEntity) args[0];
                    yield savedEntity;
                }
                case "findById" -> findByIdResult;
                case "hashCode" -> System.identityHashCode(proxy);
                case "equals" -> proxy == args[0];
                case "toString" -> "ImportBatchRepositoryStub";
                default -> throw new UnsupportedOperationException("Unsupported repository method: " + method.getName());
            };
        }
    }
}
