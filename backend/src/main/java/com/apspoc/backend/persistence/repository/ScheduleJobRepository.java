package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.persistence.entity.ScheduleJobEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ScheduleJobRepository extends JpaRepository<ScheduleJobEntity, String> {

    List<ScheduleJobEntity> findAllByStatusIn(Collection<JobStatus> statuses);
}
