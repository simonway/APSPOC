package com.apspoc.backend.service;

import com.apspoc.backend.domain.ScheduleVersion;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class VersionService {

    private final ScheduleStore store;

    public VersionService(ScheduleStore store) {
        this.store = store;
    }

    public List<ScheduleVersion> listVersions() {
        return store.listVersions();
    }

    public ScheduleVersion getVersion(String versionId) {
        return store.findVersion(versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown version: " + versionId));
    }

    public ScheduleVersion publish(String versionId) {
        getVersion(versionId);
        return store.publish(versionId);
    }

    public ScheduleVersion rollback(String versionId) {
        getVersion(versionId);
        return store.rollback(versionId);
    }
}
