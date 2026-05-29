package com.wendyapp.backend.ratings.dto;

import com.wendyapp.backend.domain.Rating;
import com.wendyapp.backend.listings.dto.UserSummaryDto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RatingDto(
        UUID id,
        UUID dealId,
        UserSummaryDto rater,
        UserSummaryDto ratee,
        int stars,
        String review,
        OffsetDateTime createdAt
) {
    public static RatingDto from(Rating r) {
        return new RatingDto(
                r.getId(),
                r.getDeal().getId(),
                UserSummaryDto.from(r.getRater()),
                UserSummaryDto.from(r.getRatee()),
                r.getStars(),
                r.getReview(),
                r.getCreatedAt()
        );
    }
}
