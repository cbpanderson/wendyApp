package com.wendyapp.backend.me;

import com.wendyapp.backend.auth.dto.UserDto;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import com.wendyapp.backend.listings.dto.ListingDto;
import com.wendyapp.backend.me.dto.UpdateMeRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/me")
public class MeController {

    private final UserRepository users;
    private final ListingRepository listings;

    public MeController(UserRepository users, ListingRepository listings) {
        this.users = users;
        this.listings = listings;
    }

    @GetMapping("/listings")
    @Transactional(readOnly = true)
    public Map<String, Object> myListings(@AuthenticationPrincipal User current,
                                          @RequestParam(defaultValue = "20") int limit,
                                          @RequestParam(defaultValue = "0") int offset) {
        var page = listings.findByOwnerIdOrderByCreatedAtDesc(
                current.getId(),
                PageRequest.of(offset / Math.max(1, limit), limit)
        );
        return Map.of(
                "items", page.getContent().stream().map(ListingDto::from).toList(),
                "total", page.getTotalElements()
        );
    }

    @GetMapping
    public UserDto me(@AuthenticationPrincipal User current) {
        return UserDto.fromEntity(current);
    }

    @PatchMapping
    @Transactional
    public UserDto updateMe(@AuthenticationPrincipal User current,
                            @Valid @RequestBody UpdateMeRequest request) {
        // Re-load through the repository so changes are managed and flushed on commit.
        User managed = users.findById(current.getId()).orElseThrow();
        if (request.bio() != null) {
            // Treat empty/blank as clearing the bio.
            managed.setBio(request.bio().isBlank() ? null : request.bio());
        }
        users.save(managed);
        return UserDto.fromEntity(managed);
    }
}
