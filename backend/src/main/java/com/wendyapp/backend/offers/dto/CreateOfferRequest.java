package com.wendyapp.backend.offers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateOfferRequest(
        @NotBlank String offerType,
        UUID offeredListingId,
        @Size(max = 1000) String message
) {}
