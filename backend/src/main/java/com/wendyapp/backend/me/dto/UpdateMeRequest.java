package com.wendyapp.backend.me.dto;

import jakarta.validation.constraints.Size;

public record UpdateMeRequest(
        @Size(max = 500, message = "Bio must be 500 characters or fewer") String bio
) {}
