package com.apspoc.backend.api.dto;

import com.apspoc.backend.domain.ImportBatch;

import java.util.List;

public record ImportedInventoryBalanceRowsResponse(
        String importId,
        String dataVersion,
        String status,
        int successCount,
        int failureCount,
        List<CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalances
) {

    public ImportedInventoryBalanceRowsResponse {
        inventoryBalances = List.copyOf(inventoryBalances);
    }

    public static ImportedInventoryBalanceRowsResponse from(
            ImportBatch batch,
            List<CreateScheduleJobRequest.InventoryBalanceInput> inventoryBalances
    ) {
        return new ImportedInventoryBalanceRowsResponse(
                batch.importId(),
                batch.dataVersion(),
                batch.status().name(),
                batch.successCount(),
                batch.failureCount(),
                inventoryBalances
        );
    }
}
