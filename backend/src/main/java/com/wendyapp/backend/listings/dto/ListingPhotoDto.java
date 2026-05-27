package com.wendyapp.backend.listings.dto;

import com.wendyapp.backend.domain.ListingPhoto;

import java.util.UUID;

public record ListingPhotoDto(UUID id, String url, int position) {
    public static ListingPhotoDto from(ListingPhoto p) {
        return new ListingPhotoDto(p.getId(), p.getUrl(), p.getPosition());
    }
}
