package com.wendyapp.backend.ratings.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitRatingRequest(
        @NotNull @Min(1) @Max(5) Integer stars,
        @Size(max = 1000) String review
) {}
