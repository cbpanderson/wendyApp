package com.wendyapp.backend.offers.dto;

import com.wendyapp.backend.domain.Offer;
import com.wendyapp.backend.listings.dto.ListingDto;
import com.wendyapp.backend.listings.dto.UserSummaryDto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OfferDto(
        UUID id,
        ListingDto listing,
        UserSummaryDto fromUser,
        UserSummaryDto toUser,
        String offerType,
        ListingDto offeredListing,
        String message,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime respondedAt
) {
    public static OfferDto from(Offer o) {
        return new OfferDto(
                o.getId(),
                ListingDto.from(o.getListing()),
                UserSummaryDto.from(o.getFromUser()),
                UserSummaryDto.from(o.getToUser()),
                o.getOfferType().name(),
                o.getOfferedListing() != null ? ListingDto.from(o.getOfferedListing()) : null,
                o.getMessage(),
                o.getStatus().name(),
                o.getCreatedAt(),
                o.getRespondedAt()
        );
    }
}
