package com.apspoc.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SolverResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesFailureReasonsFromSolver() throws Exception {
        SolverResponse response = objectMapper.readValue(
                """
                {
                  "jobId": "job-1",
                  "status": "INFEASIBLE",
                  "solveTimeMs": 12,
                  "scheduledTasks": [],
                  "changeovers": [],
                  "kpis": {
                    "totalWeightedTardiness": 0,
                    "totalMakespan": 0,
                    "lateTaskCount": 0,
                    "averageUtilization": 0.0
                  },
                  "failureReasons": [
                    {
                      "reasonType": "MATERIAL_SHORTAGE",
                      "message": "Item RM-100 requires 1 units but only 0 units are available or produced.",
                      "itemCode": "RM-100",
                      "demandId": null
                    }
                  ]
                }
                """,
                SolverResponse.class
        );

        assertThat(response.failureReasons()).containsExactly(
                new SolverResponse.FailureReason(
                        "MATERIAL_SHORTAGE",
                        "Item RM-100 requires 1 units but only 0 units are available or produced.",
                        "RM-100",
                        null,
                        null,
                        List.of(),
                        List.of()
                )
        );
    }
}
