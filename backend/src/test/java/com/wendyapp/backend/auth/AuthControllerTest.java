package com.wendyapp.backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wendyapp.backend.domain.ListingPhotoRepository;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for POST /auth/register, covering all eight cases listed in
 * spec-docs/05-test-plan.md §4 → US-1.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository users;
    @Autowired ListingRepository listings;
    @Autowired ListingPhotoRepository listingPhotos;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanDb() {
        listingPhotos.deleteAll();
        listings.deleteAll();
        users.deleteAll();
    }

    private String json(Map<String, Object> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private Map<String, Object> validRequest() {
        return Map.of(
                "email", "alice@example.com",
                "password", "correct-horse-battery",
                "handle", "alice",
                "zipCode", "98382",
                "confirmedAdult", true
        );
    }

    // ✓ Valid registration → 201, returns user + JWT, password is hashed in DB
    @Test
    void register_valid_returns201_andHashesPassword() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(validRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.expiresAt").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("alice@example.com"))
                .andExpect(jsonPath("$.user.handle").value("alice"))
                .andExpect(jsonPath("$.user.zipCode").value("98382"))
                .andExpect(jsonPath("$.user.id").isNotEmpty());

        Optional<User> saved = users.findByEmail("alice@example.com");
        assertThat(saved).isPresent();
        assertThat(saved.get().getPasswordHash()).isNotEqualTo("correct-horse-battery");
        assertThat(passwordEncoder.matches("correct-horse-battery", saved.get().getPasswordHash())).isTrue();
    }

    // ✗ Duplicate email → 409
    @Test
    void register_duplicateEmail_returns409() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(validRequest())))
                .andExpect(status().isCreated());

        Map<String, Object> dup = new java.util.HashMap<>(validRequest());
        dup.put("handle", "different_handle");
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(dup)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_IN_USE"));
    }

    // ✗ Duplicate handle → 409
    @Test
    void register_duplicateHandle_returns409() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(validRequest())))
                .andExpect(status().isCreated());

        Map<String, Object> dup = new java.util.HashMap<>(validRequest());
        dup.put("email", "different@example.com");
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(dup)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("HANDLE_IN_USE"));
    }

    // ✗ Invalid email format → 400
    @Test
    void register_invalidEmail_returns400() throws Exception {
        Map<String, Object> bad = new java.util.HashMap<>(validRequest());
        bad.put("email", "not-an-email");
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // ✗ Password too short (<8 chars) → 400
    @Test
    void register_shortPassword_returns400() throws Exception {
        Map<String, Object> bad = new java.util.HashMap<>(validRequest());
        bad.put("password", "short");
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // ✗ confirmedAdult: false → 400
    @Test
    void register_notAdult_returns400() throws Exception {
        Map<String, Object> bad = new java.util.HashMap<>(validRequest());
        bad.put("confirmedAdult", false);
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // ✗ Handle with invalid characters → 400
    @Test
    void register_invalidHandle_returns400() throws Exception {
        Map<String, Object> bad = new java.util.HashMap<>(validRequest());
        bad.put("handle", "no spaces!");
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // ✗ ZIP not in v1 allowlist → 400
    @Test
    void register_zipNotInAllowlist_returns400() throws Exception {
        Map<String, Object> bad = new java.util.HashMap<>(validRequest());
        bad.put("zipCode", "10001"); // valid format, not Sequim
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_ZIP"));
    }
}
