package com.wendyapp.backend.users;

import com.wendyapp.backend.domain.ListingPhotoRepository;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for GET /users/{handle} and GET /users/{handle}/ratings,
 * per spec-docs/05-test-plan.md §4 → US-2.
 */
@SpringBootTest
@AutoConfigureMockMvc
class UsersControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository users;
    @Autowired ListingRepository listings;
    @Autowired ListingPhotoRepository listingPhotos;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        listingPhotos.deleteAll();
        listings.deleteAll();
        users.deleteAll();
        User alice = new User(
                "alice@example.com",
                passwordEncoder.encode("correct-horse-battery"),
                "alice",
                "98382",
                true
        );
        alice.setBio("I trade eggs for help with my garden.");
        users.save(alice);
    }

    // ✓ GET /users/{handle} → returns public profile (no email)
    @Test
    void byHandle_returnsPublicProfile() throws Exception {
        MvcResult result = mockMvc.perform(get("/users/alice"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.handle").value("alice"))
                .andExpect(jsonPath("$.bio").value("I trade eggs for help with my garden."))
                .andExpect(jsonPath("$.zipCode").value("98382"))
                .andExpect(jsonPath("$.memberSince").isNotEmpty())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        // Defense in depth: the email string must not appear anywhere in the body.
        assertThat(result.getResponse().getContentAsString()).doesNotContain("alice@example.com");
    }

    // ✗ GET /users/{nonexistent} → 404
    @Test
    void byHandle_unknown_returns404() throws Exception {
        mockMvc.perform(get("/users/no_such_user"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void ratings_empty_returns200() throws Exception {
        mockMvc.perform(get("/users/alice/ratings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void ratings_unknownUser_returns404() throws Exception {
        mockMvc.perform(get("/users/no_such_user/ratings"))
                .andExpect(status().isNotFound());
    }

    // Public endpoint must not require auth.
    @Test
    void byHandle_isPublic_noAuthRequired() throws Exception {
        mockMvc.perform(get("/users/alice"))
                .andExpect(status().isOk());
    }
}
