package com.wendyapp.backend.users;

import com.wendyapp.backend.domain.Listing;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import com.wendyapp.backend.listings.dto.ListingDto;
import com.wendyapp.backend.users.dto.PublicProfileDto;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UsersController {

    private final UserRepository users;
    private final ListingRepository listings;

    public UsersController(UserRepository users, ListingRepository listings) {
        this.users = users;
        this.listings = listings;
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

    /**
     * Stub for US-9. Returns an empty list so the public profile page can render the
     * ratings section without a 404. Real implementation arrives with the Rating story.
     */
    @GetMapping("/{handle}/ratings")
    public Map<String, Object> ratings(@PathVariable String handle,
                                       @RequestParam(defaultValue = "20") int limit,
                                       @RequestParam(defaultValue = "0") int offset) {
        users.findByHandle(handle).orElseThrow(() -> new UserNotFoundException(handle));
        return Map.of(
                "items", List.of(),
                "total", 0,
                "averageStars", 0.0
        );
    }
}
