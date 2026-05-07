package com.wendyapp.backend.auth.dto;

import com.wendyapp.backend.domain.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String handle,
        String bio,
        String zipCode,
        Double averageStars,
        int ratingCount,
        OffsetDateTime createdAt
) {
    public static UserDto fromEntity(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getHandle(),
                user.getBio(),
                user.getZipCode(),
                null, // ratings come in US-9
                0,
                user.getCreatedAt()
        );
    }
}
