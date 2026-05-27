package com.wendyapp.backend.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID> {
    Page<Listing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);
    List<Listing> findByOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, Listing.Status status);
    Page<Listing> findByStatusOrderByCreatedAtDesc(Listing.Status status, Pageable pageable);
}
