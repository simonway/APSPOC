package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.persistence.entity.VersionAuditEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VersionAuditEventRepository extends JpaRepository<VersionAuditEventEntity, Long> {

    List<VersionAuditEventEntity> findAllByOrderByCreatedAtDesc();

    List<VersionAuditEventEntity> findAllByTargetVersionIdOrderByCreatedAtDesc(String targetVersionId);
}
