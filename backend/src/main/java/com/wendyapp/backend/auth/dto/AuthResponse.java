package com.wendyapp.backend.auth.dto;

import java.time.OffsetDateTime;

public record AuthResponse(
        String token,
        OffsetDateTime expiresAt,
        UserDto user
) {}
