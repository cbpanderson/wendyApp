package com.wendyapp.backend.users.dto;

import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.listings.dto.ListingDto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Public profile for {@code GET /users/{handle}}. Per spec-docs/02-domain.md the email
 * is never exposed; ZIP is shown (used for display only — addresses are never stored).
 */
public record PublicProfileDto(
        String handle,
        String bio,
        String zipCode,
        Double averageStars,
        int ratingCount,
        OffsetDateTime memberSince,
        List<ListingDto> activeListings
) {
    public static PublicProfileDto fromEntity(User user, List<ListingDto> activeListings) {
        return new PublicProfileDto(
                user.getHandle(),
                user.getBio(),
                user.getZipCode(),
                user.getAverageStars(),
                user.getRatingCount(),
                user.getCreatedAt(),
                activeListings
        );
    }
}
