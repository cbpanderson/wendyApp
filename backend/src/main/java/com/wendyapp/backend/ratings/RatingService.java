package com.wendyapp.backend.ratings;

import com.wendyapp.backend.deals.DealNotFoundException;
import com.wendyapp.backend.domain.*;
import com.wendyapp.backend.listings.ForbiddenException;
import com.wendyapp.backend.deals.InvalidDealException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RatingService {

    private final DealRepository deals;
    private final RatingRepository ratings;
    private final UserRepository users;

    public RatingService(DealRepository deals, RatingRepository ratings, UserRepository users) {
        this.deals = deals;
        this.ratings = ratings;
        this.users = users;
    }

    @Transactional
    public Rating submitRating(UUID dealId, UUID raterId, int stars, String review) {
        Deal deal = deals.findById(dealId).orElseThrow(DealNotFoundException::new);

        boolean isA = deal.getParticipantA().getId().equals(raterId);
        boolean isB = deal.getParticipantB().getId().equals(raterId);
        if (!isA && !isB) {
            throw new ForbiddenException("You are not a participant in this deal");
        }

        if (deal.getStatus() != Deal.Status.COMPLETED) {
            throw new InvalidDealException("Cannot rate a deal that is not COMPLETED");
        }

        if (ratings.existsByDealIdAndRaterId(dealId, raterId)) {
            throw new AlreadyRatedException();
        }

        User rater = isA ? deal.getParticipantA() : deal.getParticipantB();
        User ratee = isA ? deal.getParticipantB() : deal.getParticipantA();

        Rating rating = new Rating(deal, rater, ratee, stars, review);
        rating = ratings.save(rating);

        // Recalculate ratee's averageStars and ratingCount
        Double avg = ratings.findAverageStarsByRateeId(ratee.getId());
        long count = ratings.countByRateeId(ratee.getId());
        ratee.setAverageStars(avg);
        ratee.setRatingCount((int) count);
        users.save(ratee);

        return rating;
    }

    @Transactional(readOnly = true)
    public List<Rating> getRatingsForUser(String handle) {
        return ratings.findByRateeHandleOrderByCreatedAtDesc(handle);
    }
}
