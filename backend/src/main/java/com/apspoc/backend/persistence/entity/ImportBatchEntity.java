package com.apspoc.backend.persistence.entity;

import com.apspoc.backend.domain.ImportBatchKind;
import com.apspoc.backend.domain.ImportBatchStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "import_batch")
public class ImportBatchEntity {

    @Id
    private String id;

    @Column(name = "data_version", nullable = false)
    private String dataVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_type", nullable = false)
    private ImportBatchKind importType;

    @Column(name = "source_file_name", nullable = false)
    private String sourceFileName;

    @Column(name = "imported_by", nullable = false)
    private String importedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImportBatchStatus status;

    @Column(name = "success_count", nullable = false)
    private int successCount;

    @Column(name = "failure_count", nullable = false)
    private int failureCount;

    @Column(name = "payload_json", nullable = false, columnDefinition = "text")
    private String payloadJson;

    @Column(name = "error_report_json", columnDefinition = "text")
    private String errorReportJson;

    protected ImportBatchEntity() {
    }

    public ImportBatchEntity(String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public String getDataVersion() {
        return dataVersion;
    }

    public void setDataVersion(String dataVersion) {
        this.dataVersion = dataVersion;
    }

    public ImportBatchKind getImportType() {
        return importType;
    }

    public void setImportType(ImportBatchKind importType) {
        this.importType = importType;
    }

    public String getSourceFileName() {
        return sourceFileName;
    }

    public void setSourceFileName(String sourceFileName) {
        this.sourceFileName = sourceFileName;
    }

    public String getImportedBy() {
        return importedBy;
    }

    public void setImportedBy(String importedBy) {
        this.importedBy = importedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public ImportBatchStatus getStatus() {
        return status;
    }

    public void setStatus(ImportBatchStatus status) {
        this.status = status;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(int failureCount) {
        this.failureCount = failureCount;
    }

    public String getPayloadJson() {
        return payloadJson;
    }

    public void setPayloadJson(String payloadJson) {
        this.payloadJson = payloadJson;
    }

    public String getErrorReportJson() {
        return errorReportJson;
    }

    public void setErrorReportJson(String errorReportJson) {
        this.errorReportJson = errorReportJson;
    }
}
