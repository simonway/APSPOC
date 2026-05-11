package com.apspoc.backend.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record TrialSolveRequest(
        @NotEmpty List<@Valid DraftBarInput> draftBars
) {

    public TrialSolveRequest {
        draftBars = draftBars == null ? List.of() : List.copyOf(draftBars);
    }

    public record DraftBarInput(
            @NotBlank String barId,
            @NotBlank String rowId,
            @NotNull Long startMs,
            @NotNull @Positive Long endMs,
            Boolean pinned
    ) {
    }
}
