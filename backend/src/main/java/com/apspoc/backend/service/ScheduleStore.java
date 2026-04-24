package com.apspoc.backend.service;

import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;

import java.util.List;
import java.util.Optional;

public interface ScheduleStore {

    ScheduleJob saveJob(ScheduleJob job);

    Optional<ScheduleJob> findJob(String jobId);

    ScheduleVersion saveVersion(ScheduleVersion version);

    Optional<ScheduleVersion> findVersion(String versionId);

    List<ScheduleVersion> listVersions();

    ScheduleVersion publish(String versionId);

    ScheduleVersion rollback(String versionId);
}
