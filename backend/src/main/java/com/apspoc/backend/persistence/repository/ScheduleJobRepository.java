package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleJobRepository extends JpaRepository<ScheduleJobEntity, String> {
}
