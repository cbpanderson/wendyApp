package com.wendyapp.backend.listings.dto;

import com.wendyapp.backend.domain.Category;

import java.util.UUID;

public record CategoryDto(UUID id, String name, String slug) {
    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug());
    }
}
