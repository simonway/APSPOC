package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.domain.VersionStatus;
import com.apspoc.backend.persistence.entity.ScheduleVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ScheduleVersionRepository extends JpaRepository<ScheduleVersionEntity, String> {

    List<ScheduleVersionEntity> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Query("""
            update ScheduleVersionEntity version
               set version.status = :archivedStatus
             where version.status = :publishedStatus
               and version.id <> :versionId
            """)
    int archivePublishedVersionsExcept(
            @Param("archivedStatus") VersionStatus archivedStatus,
            @Param("publishedStatus") VersionStatus publishedStatus,
            @Param("versionId") String versionId
    );
}
