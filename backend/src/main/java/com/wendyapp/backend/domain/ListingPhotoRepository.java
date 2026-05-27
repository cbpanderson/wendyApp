package com.wendyapp.backend.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListingPhotoRepository extends JpaRepository<ListingPhoto, UUID> {
    List<ListingPhoto> findByListingIdOrderByPositionAsc(UUID listingId);
    long countByListingId(UUID listingId);
    boolean existsByListingIdAndPosition(UUID listingId, short position);
}
