package com.wendyapp.backend.listings.dto;

import com.wendyapp.backend.domain.User;

public record UserSummaryDto(String handle, Double averageStars, int ratingCount) {
    public static UserSummaryDto from(User u) {
        return new UserSummaryDto(u.getHandle(), u.getAverageStars(), u.getRatingCount());
    }
}
