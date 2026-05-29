package com.wendyapp.backend.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RatingRepository extends JpaRepository<Rating, UUID> {

    List<Rating> findByDealId(UUID dealId);

    List<Rating> findByRateeHandleOrderByCreatedAtDesc(String handle);

    boolean existsByDealIdAndRaterId(UUID dealId, UUID raterId);

    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.ratee.id = :userId")
    Double findAverageStarsByRateeId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.ratee.id = :userId")
    long countByRateeId(@Param("userId") UUID userId);
}
