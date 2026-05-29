package com.wendyapp.backend.ratings.dto;

import java.util.List;

public record RatingPageDto(
        List<RatingDto> items,
        int total,
        Double averageStars
) {}
