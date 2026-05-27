package com.wendyapp.backend.listings.dto;

import com.wendyapp.backend.domain.Listing;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ListingDto(
        UUID id,
        UserSummaryDto owner,
        CategoryDto category,
        String title,
        String description,
        String offerType,
        String status,
        List<ListingPhotoDto> photos,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ListingDto from(Listing l) {
        return new ListingDto(
                l.getId(),
                UserSummaryDto.from(l.getOwner()),
                CategoryDto.from(l.getCategory()),
                l.getTitle(),
                l.getDescription(),
                l.getOfferType().name(),
                l.getStatus().name(),
                l.getPhotos().stream().map(ListingPhotoDto::from).toList(),
                l.getCreatedAt(),
                l.getUpdatedAt()
        );
    }
}
