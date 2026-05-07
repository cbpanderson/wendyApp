package com.wendyapp.backend.auth;

import com.wendyapp.backend.auth.dto.AuthResponse;
import com.wendyapp.backend.auth.dto.RegisterRequest;
import com.wendyapp.backend.auth.dto.UserDto;
import com.wendyapp.backend.config.AllowedZipsConfig;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AllowedZipsConfig allowedZips;

    public AuthService(UserRepository users,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AllowedZipsConfig allowedZips) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.allowedZips = allowedZips;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().toLowerCase();

        if (!allowedZips.asSet().contains(req.zipCode())) {
            throw new InvalidZipException();
        }
        if (users.existsByEmail(email)) {
            throw new EmailAlreadyInUseException();
        }
        if (users.existsByHandle(req.handle())) {
            throw new HandleAlreadyInUseException();
        }

        User user = new User(
                email,
                passwordEncoder.encode(req.password()),
                req.handle(),
                req.zipCode(),
                req.confirmedAdult()
        );
        if (req.bio() != null && !req.bio().isBlank()) {
            user.setBio(req.bio());
        }
        users.save(user);

        JwtService.IssuedToken token = jwtService.issueFor(user.getId());
        return new AuthResponse(token.token(), token.expiresAt(), UserDto.fromEntity(user));
    }
}
