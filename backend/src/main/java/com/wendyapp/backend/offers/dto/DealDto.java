package com.wendyapp.backend.offers.dto;

import com.wendyapp.backend.domain.Deal;
import com.wendyapp.backend.listings.dto.ListingDto;
import com.wendyapp.backend.listings.dto.UserSummaryDto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DealDto(
        UUID id,
        UUID offerId,
        String dealType,
        UserSummaryDto participantA,
        UserSummaryDto participantB,
        ListingDto listingA,
        ListingDto listingB,
        String status,
        OffsetDateTime acceptedAt,
        OffsetDateTime completedAt,
        OffsetDateTime cancelledAt,
        UUID cancelledByUserId
) {
    public static DealDto from(Deal d) {
        return new DealDto(
                d.getId(),
                d.getOffer().getId(),
                d.getDealType().name(),
                UserSummaryDto.from(d.getParticipantA()),
                UserSummaryDto.from(d.getParticipantB()),
                ListingDto.from(d.getListingA()),
                d.getListingB() != null ? ListingDto.from(d.getListingB()) : null,
                d.getStatus().name(),
                d.getAcceptedAt(),
                d.getCompletedAt(),
                d.getCancelledAt(),
                d.getCancelledByUserId()
        );
    }
}
