package com.wendyapp.backend.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface OfferRepository extends JpaRepository<Offer, UUID>, JpaSpecificationExecutor<Offer> {
    boolean existsByFromUserIdAndListingIdAndStatus(UUID fromUserId, UUID listingId, Offer.Status status);

    List<Offer> findByListingIdAndStatus(UUID listingId, Offer.Status status);

    Page<Offer> findByFromUserIdOrderByCreatedAtDesc(UUID fromUserId, Pageable pageable);
    Page<Offer> findByFromUserIdAndStatusOrderByCreatedAtDesc(UUID fromUserId, Offer.Status status, Pageable pageable);
    Page<Offer> findByToUserIdOrderByCreatedAtDesc(UUID toUserId, Pageable pageable);
    Page<Offer> findByToUserIdAndStatusOrderByCreatedAtDesc(UUID toUserId, Offer.Status status, Pageable pageable);
}
