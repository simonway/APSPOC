package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.CreateScheduleJobRequest;
import com.apspoc.backend.api.dto.GanttDataResponse;
import com.apspoc.backend.domain.ScheduleVersion;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VersionGanttViewService {

    private final ObjectMapper objectMapper;

    public VersionGanttViewService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public GanttDataResponse toResponse(ScheduleVersion version) {
        return GanttDataResponse.from(version, buildInventoryCoverages(version));
    }

    private List<GanttDataResponse.InventoryCoverageResponse> buildInventoryCoverages(ScheduleVersion version) {
        if (version.sourceRequestJson() == null || version.sourceRequestJson().isBlank()) {
            return List.of();
        }

        CreateScheduleJobRequest request;
        try {
            request = objectMapper.readValue(version.sourceRequestJson(), CreateScheduleJobRequest.class);
        } catch (JsonProcessingException ex) {
            return List.of();
        }

        Map<String, Integer> remainingInventoryByItemCode = new LinkedHashMap<>();
        for (CreateScheduleJobRequest.InventoryBalanceInput inventoryBalance : request.inventoryBalances()) {
            remainingInventoryByItemCode.put(
                    inventoryBalance.itemCode(),
                    Math.max(0, inventoryBalance.availableQuantity() - inventoryBalance.safetyStockQuantity())
            );
        }

        List<InventoryDemandCandidate> candidates = new ArrayList<>();
        for (int index = 0; index < request.inventoryDemands().size(); index++) {
            CreateScheduleJobRequest.InventoryDemandInput inventoryDemand = request.inventoryDemands().get(index);
            candidates.add(new InventoryDemandCandidate(index, inventoryDemand));
        }
        candidates.sort(Comparator
                .comparingInt((InventoryDemandCandidate candidate) -> candidate.inventoryDemand().dueMinutes())
                .thenComparing(Comparator.comparingInt((InventoryDemandCandidate candidate) -> candidate.inventoryDemand().priority()).reversed())
                .thenComparingInt(InventoryDemandCandidate::requestIndex));

        long baseMs = request.scheduleStartAt().toEpochMilli();
        List<GanttDataResponse.InventoryCoverageResponse> coverageResponses = new ArrayList<>();
        for (InventoryDemandCandidate candidate : candidates) {
            CreateScheduleJobRequest.InventoryDemandInput inventoryDemand = candidate.inventoryDemand();
            CreateScheduleJobRequest.InventoryBalanceInput inventoryBalance = request.inventoryBalances().stream()
                    .filter(balance -> balance.itemCode().equals(inventoryDemand.itemCode()))
                    .findFirst()
                    .orElse(null);
            if (inventoryBalance == null || inventoryBalance.availableFromMinutes() > inventoryDemand.dueMinutes()) {
                continue;
            }

            int remainingInventory = remainingInventoryByItemCode.getOrDefault(inventoryBalance.itemCode(), 0);
            int coveredQuantity = Math.min(inventoryDemand.quantity(), remainingInventory);
            if (coveredQuantity <= 0) {
                continue;
            }

            remainingInventoryByItemCode.put(inventoryBalance.itemCode(), remainingInventory - coveredQuantity);
            coverageResponses.add(new GanttDataResponse.InventoryCoverageResponse(
                    "invcov_" + inventoryDemand.demandId(),
                    inventoryDemand.demandId(),
                    inventoryDemand.itemCode(),
                    inventoryDemand.quantity(),
                    coveredQuantity,
                    inventoryDemand.priority(),
                    baseMs + inventoryDemand.dueMinutes() * 60_000L,
                    coveredQuantity >= inventoryDemand.quantity()
            ));
        }

        return coverageResponses;
    }

    private record InventoryDemandCandidate(
            int requestIndex,
            CreateScheduleJobRequest.InventoryDemandInput inventoryDemand
    ) {
    }
}
