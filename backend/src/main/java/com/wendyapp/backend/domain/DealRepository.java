package com.wendyapp.backend.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DealRepository extends JpaRepository<Deal, UUID> {
    Optional<Deal> findByOfferId(UUID offerId);
}
