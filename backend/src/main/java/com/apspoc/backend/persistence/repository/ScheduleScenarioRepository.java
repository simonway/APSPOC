package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.persistence.entity.ScheduleScenarioEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleScenarioRepository extends JpaRepository<ScheduleScenarioEntity, String> {
}
