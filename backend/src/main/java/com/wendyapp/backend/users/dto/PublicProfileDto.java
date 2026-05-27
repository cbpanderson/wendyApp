package com.wendyapp.backend.users.dto;

import com.wendyapp.backend.domain.User;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Public profile for {@code GET /users/{handle}}. Per spec-docs/02-domain.md the email
 * is never exposed; ZIP is shown (used for display only — addresses are never stored).
 * activeListings is empty until US-3 lands.
 */
public record PublicProfileDto(
        String handle,
        String bio,
        String zipCode,
        Double averageStars,
        int ratingCount,
        OffsetDateTime memberSince,
        List<Object> activeListings
) {
    public static PublicProfileDto fromEntity(User user) {
        return new PublicProfileDto(
                user.getHandle(),
                user.getBio(),
                user.getZipCode(),
                null, // ratings come in US-9
                0,
                user.getCreatedAt(),
                List.of()
        );
    }
}
