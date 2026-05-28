package com.wendyapp.backend.me;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wendyapp.backend.auth.JwtService;
import com.wendyapp.backend.domain.DealRepository;
import com.wendyapp.backend.domain.ListingPhotoRepository;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.OfferRepository;
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

import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for GET/PATCH /me, per spec-docs/05-test-plan.md §4 → US-2.
 */
@SpringBootTest
@AutoConfigureMockMvc
class MeControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository users;
    @Autowired ListingRepository listings;
    @Autowired ListingPhotoRepository listingPhotos;
    @Autowired OfferRepository offers;
    @Autowired DealRepository deals;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private User alice;
    private String validToken;

    @BeforeEach
    void setup() {
        deals.deleteAll();
        offers.deleteAll();
        listingPhotos.deleteAll();
        listings.deleteAll();
        users.deleteAll();
        alice = new User(
                "alice@example.com",
                passwordEncoder.encode("correct-horse-battery"),
                "alice",
                "98382",
                true
        );
        alice.setBio("I trade eggs for help with my garden.");
        users.save(alice);
        validToken = jwtService.issueFor(alice.getId()).token();
    }

    private String json(Map<String, Object> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    // ✓ GET /me with valid token → returns current user
    @Test
    void getMe_withValidToken_returns200() throws Exception {
        mockMvc.perform(get("/me").header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.handle").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.bio").value("I trade eggs for help with my garden."));
    }

    // ✗ GET /me without token → 401
    @Test
    void getMe_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    // ✗ GET /me with expired token → 401
    @Test
    void getMe_withExpiredToken_returns401() throws Exception {
        String expired = jwtService.issueWithTtl(alice.getId(), -1000).token();
        mockMvc.perform(get("/me").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
    }

    // ✗ GET /me with malformed token → 401
    @Test
    void getMe_withGarbageToken_returns401() throws Exception {
        mockMvc.perform(get("/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    // ✓ PATCH /me { bio } → bio updated
    @Test
    void patchMe_bio_updatesBio() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("bio", "New bio text");

        mockMvc.perform(patch("/me")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("New bio text"));

        mockMvc.perform(get("/me").header("Authorization", "Bearer " + validToken))
                .andExpect(jsonPath("$.bio").value("New bio text"));
    }

    // ✗ PATCH /me { bio: <too long> } → 400
    @Test
    void patchMe_bioTooLong_returns400() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("bio", "a".repeat(501));

        mockMvc.perform(patch("/me")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    @Test
    void patchMe_withoutToken_returns401() throws Exception {
        mockMvc.perform(patch("/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bio\":\"x\"}"))
                .andExpect(status().isUnauthorized());
    }
}
