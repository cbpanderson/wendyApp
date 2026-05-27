package com.wendyapp.backend.me;

import com.wendyapp.backend.auth.dto.UserDto;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import com.wendyapp.backend.me.dto.UpdateMeRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me")
public class MeController {

    private final UserRepository users;

    public MeController(UserRepository users) {
        this.users = users;
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
