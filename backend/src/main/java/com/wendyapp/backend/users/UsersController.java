package com.wendyapp.backend.users;

import com.wendyapp.backend.domain.Listing;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.Rating;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import com.wendyapp.backend.listings.dto.ListingDto;
import com.wendyapp.backend.ratings.RatingService;
import com.wendyapp.backend.ratings.dto.RatingDto;
import com.wendyapp.backend.ratings.dto.RatingPageDto;
import com.wendyapp.backend.users.dto.PublicProfileDto;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UsersController {

    private final UserRepository users;
    private final ListingRepository listings;
    private final RatingService ratingService;

    public UsersController(UserRepository users, ListingRepository listings, RatingService ratingService) {
        this.users = users;
        this.listings = listings;
        this.ratingService = ratingService;
    }

    @GetMapping("/{handle}")
    @Transactional(readOnly = true)
    public PublicProfileDto byHandle(@PathVariable String handle) {
        User user = users.findByHandle(handle)
                .orElseThrow(() -> new UserNotFoundException(handle));
        List<ListingDto> active = listings
                .findByOwnerIdAndStatusOrderByCreatedAtDesc(user.getId(), Listing.Status.ACTIVE)
                .stream().map(ListingDto::from).toList();
        return PublicProfileDto.fromEntity(user, active);
    }

    @GetMapping("/{handle}/ratings")
    public RatingPageDto ratings(@PathVariable String handle,
                                 @RequestParam(defaultValue = "20") int limit,
                                 @RequestParam(defaultValue = "0") int offset) {
        // Validate user exists
        User user = users.findByHandle(handle).orElseThrow(() -> new UserNotFoundException(handle));
        List<Rating> all = ratingService.getRatingsForUser(handle);
        List<RatingDto> items = all.stream().map(RatingDto::from).toList();
        return new RatingPageDto(items, items.size(), user.getAverageStars());
    }
}
