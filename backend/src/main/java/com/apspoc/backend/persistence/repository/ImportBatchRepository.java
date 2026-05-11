package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.domain.ImportBatchKind;
import com.apspoc.backend.domain.ImportBatchStatus;
import com.apspoc.backend.persistence.entity.ImportBatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImportBatchRepository extends JpaRepository<ImportBatchEntity, String> {

    Optional<ImportBatchEntity> findFirstByDataVersionAndImportTypeAndStatusOrderByCreatedAtDesc(
            String dataVersion,
            ImportBatchKind importType,
            ImportBatchStatus status
    );
}
