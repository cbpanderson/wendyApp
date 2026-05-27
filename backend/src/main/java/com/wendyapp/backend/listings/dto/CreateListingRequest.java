package com.wendyapp.backend.listings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateListingRequest(
        @NotNull UUID categoryId,
        @NotBlank @Size(min = 5, max = 100) String title,
        @NotNull @Size(max = 2000) String description,
        @NotBlank String offerType
) {}
