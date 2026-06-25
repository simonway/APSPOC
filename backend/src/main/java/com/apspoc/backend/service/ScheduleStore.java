package com.apspoc.backend.service;

import com.apspoc.backend.domain.JobStatus;
import com.apspoc.backend.domain.ScheduleJob;
import com.apspoc.backend.domain.ScheduleVersion;
import com.apspoc.backend.domain.VersionAuditEvent;

import java.util.List;
import java.util.Optional;

public interface ScheduleStore {

    ScheduleJob saveJob(ScheduleJob job);

    Optional<ScheduleJob> findJob(String jobId);

    List<ScheduleJob> listJobsByStatuses(List<JobStatus> statuses);

    List<ScheduleJob> listRecentJobs(int limit);

    ScheduleVersion saveVersion(ScheduleVersion version);

    Optional<ScheduleVersion> findVersion(String versionId);

    List<ScheduleVersion> listVersions();

    List<VersionAuditEvent> listVersionHistory();

    List<VersionAuditEvent> listVersionHistory(String versionId);

    ScheduleVersion updateReleaseNote(String versionId, String releaseNote);

    void deleteVersion(String versionId);

    void deleteVersions(List<String> versionIds);

    ScheduleVersion markReadyForRelease(String versionId, String actorUsername, String comment, String releaseNote);

    ScheduleVersion approve(String versionId, String actorUsername, String comment);

    ScheduleVersion reject(String versionId, String actorUsername, String comment);

    ScheduleVersion publish(String versionId, String actorUsername, String comment, String releaseNote);

    ScheduleVersion rollback(String versionId, String actorUsername, String comment);
}
