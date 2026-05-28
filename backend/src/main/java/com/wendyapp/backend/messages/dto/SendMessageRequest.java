package com.wendyapp.backend.messages.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
        @NotBlank(message = "body: must not be blank")
        @Size(max = 2000, message = "body: must not exceed 2000 characters")
        String body
) {}
