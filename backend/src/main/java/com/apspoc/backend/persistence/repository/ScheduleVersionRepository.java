package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.domain.VersionStatus;
import com.apspoc.backend.persistence.entity.ScheduleVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScheduleVersionRepository extends JpaRepository<ScheduleVersionEntity, String> {

    List<ScheduleVersionEntity> findAllByOrderByCreatedAtDesc();

    Optional<ScheduleVersionEntity> findFirstByStatusOrderByPublishedAtDescCreatedAtDesc(VersionStatus status);
}
