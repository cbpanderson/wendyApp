package com.wendyapp.backend.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_]{3,30}$",
                message = "Handle must be 3-30 characters; letters, numbers, underscores only")
        String handle,
        @NotBlank @Pattern(regexp = "^[0-9]{5}$", message = "ZIP must be 5 digits") String zipCode,
        @Size(max = 500) String bio,
        @NotNull @AssertTrue(message = "You must confirm you are 18 or older") Boolean confirmedAdult
) {}
