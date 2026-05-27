package com.wendyapp.backend.listings.dto;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateListingRequest(
        UUID categoryId,
        @Size(min = 5, max = 100) String title,
        @Size(max = 2000) String description,
        String offerType,
        String status
) {}
