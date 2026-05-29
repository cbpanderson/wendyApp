package com.wendyapp.backend.ratings;

import com.wendyapp.backend.domain.Rating;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.ratings.dto.RatingDto;
import com.wendyapp.backend.ratings.dto.RatingPageDto;
import com.wendyapp.backend.ratings.dto.SubmitRatingRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class RatingController {

    private final RatingService service;

    public RatingController(RatingService service) {
        this.service = service;
    }

    @PostMapping("/deals/{dealId}/ratings")
    @ResponseStatus(HttpStatus.CREATED)
    public RatingDto submitRating(
            @PathVariable UUID dealId,
            @Valid @RequestBody SubmitRatingRequest request,
            @AuthenticationPrincipal User current) {
        Rating rating = service.submitRating(dealId, current.getId(), request.stars(), request.review());
        return RatingDto.from(rating);
    }
}
