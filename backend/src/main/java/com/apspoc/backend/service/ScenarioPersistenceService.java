package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.GeneratedScenarioResponse;
import com.apspoc.backend.persistence.entity.ScheduleScenarioEntity;
import com.apspoc.backend.persistence.repository.ScheduleScenarioRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class ScenarioPersistenceService {

    private final ScheduleScenarioRepository scheduleScenarioRepository;
    private final ObjectMapper objectMapper;

    public ScenarioPersistenceService(
            ScheduleScenarioRepository scheduleScenarioRepository,
            ObjectMapper objectMapper
    ) {
        this.scheduleScenarioRepository = scheduleScenarioRepository;
        this.objectMapper = objectMapper;
    }

    public GeneratedScenarioResponse save(
            GeneratedScenarioResponse scenario,
            Map<String, String> sourceImportBatchIds
    ) {
        Instant createdAt = Instant.now();
        String scenarioId = "scn-" + UUID.randomUUID();
        GeneratedScenarioResponse persisted = GeneratedScenarioResponse.persisted(
                scenarioId,
                createdAt,
                sourceImportBatchIds,
                scenario
        );

        ScheduleScenarioEntity entity = new ScheduleScenarioEntity(scenarioId);
        entity.setScenarioName(persisted.scenarioName());
        entity.setDataVersion(persisted.dataVersion());
        entity.setScheduleStartAt(persisted.scheduleStartAt());
        entity.setHorizonMinutes(persisted.horizonMinutes());
        entity.setCreatedAt(createdAt);
        entity.setPayloadJson(writePayload(persisted));
        scheduleScenarioRepository.save(entity);
        return persisted;
    }

    public GeneratedScenarioResponse getScenario(String scenarioId) {
        ScheduleScenarioEntity entity = scheduleScenarioRepository.findById(scenarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown scenario: " + scenarioId));
        try {
            return objectMapper.readValue(entity.getPayloadJson(), GeneratedScenarioResponse.class);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse persisted scenario payload");
        }
    }

    private String writePayload(GeneratedScenarioResponse scenario) {
        try {
            return objectMapper.writeValueAsString(scenario);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize generated scenario");
        }
    }
}
