package com.wendyapp.backend.deals;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wendyapp.backend.auth.JwtService;
import com.wendyapp.backend.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for /me/deals, /deals/{id}, /deals/{id}/mark-complete, /deals/{id}/cancel
 * per spec-docs/05-test-plan.md §4 → US-8.
 */
@SpringBootTest
@AutoConfigureMockMvc
class DealControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository users;
    @Autowired CategoryRepository categories;
    @Autowired ListingRepository listings;
    @Autowired ListingPhotoRepository photos;
    @Autowired OfferRepository offers;
    @Autowired DealRepository deals;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private User alice;
    private User bob;
    private User carol;
    private String aliceToken;
    private String bobToken;
    private String carolToken;

    private UUID dealId;

    @BeforeEach
    void setup() throws Exception {
        // FK-aware cleanup
        deals.deleteAll();
        offers.deleteAll();
        photos.deleteAll();
        listings.deleteAll();
        users.deleteAll();

        Category cat = categories.findAllByActiveTrueOrderByNameAsc().get(0);

        alice = users.save(new User("alice@example.com",
                passwordEncoder.encode("pass"), "alice", "98382", true));
        bob = users.save(new User("bob@example.com",
                passwordEncoder.encode("pass"), "bob", "98382", true));
        carol = users.save(new User("carol@example.com",
                passwordEncoder.encode("pass"), "carol", "98382", true));

        aliceToken = jwtService.issueFor(alice.getId()).token();
        bobToken = jwtService.issueFor(bob.getId()).token();
        carolToken = jwtService.issueFor(carol.getId()).token();

        // alice owns the listing (participantA), bob makes the offer (participantB)
        Listing aliceListing = listings.save(new Listing(alice, cat, "Alice eggs",
                "Fresh from coop.", Listing.OfferType.EITHER));
        Listing bobListing = listings.save(new Listing(bob, cat, "Bob honey",
                "Local wildflower.", Listing.OfferType.EITHER));

        // Bob makes a trade offer on Alice's listing
        Map<String, Object> body = new HashMap<>();
        body.put("offerType", "TRADE");
        body.put("offeredListingId", bobListing.getId().toString());
        body.put("message", "Trade?");

        MvcResult offerResult = mockMvc.perform(post("/listings/" + aliceListing.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn();
        UUID offerId = UUID.fromString(
                objectMapper.readTree(offerResult.getResponse().getContentAsString()).get("id").asText());

        // Alice accepts -> creates deal
        MvcResult dealResult = mockMvc.perform(post("/offers/" + offerId + "/accept")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andReturn();
        dealId = UUID.fromString(
                objectMapper.readTree(dealResult.getResponse().getContentAsString()).get("id").asText());
    }

    // ---- GET /me/deals ----

    @Test
    void getMyDeals_returnsDealsForParticipant() throws Exception {
        mockMvc.perform(get("/me/deals")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(dealId.toString()));
    }

    @Test
    void getMyDeals_returnsEmptyForNonParticipant() throws Exception {
        mockMvc.perform(get("/me/deals")
                        .header("Authorization", "Bearer " + carolToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.items").isEmpty());
    }

    // ---- GET /deals/{id} ----

    @Test
    void getDeal_returnsForParticipant() throws Exception {
        mockMvc.perform(get("/deals/" + dealId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dealId.toString()))
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void getDeal_returns403ForNonParticipant() throws Exception {
        mockMvc.perform(get("/deals/" + dealId)
                        .header("Authorization", "Bearer " + carolToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void getDeal_returns404ForNonexistentDeal() throws Exception {
        mockMvc.perform(get("/deals/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DEAL_NOT_FOUND"));
    }

    // ---- POST /deals/{id}/mark-complete ----

    @Test
    void markComplete_participantAMarks_returnsCompletedByA() throws Exception {
        // Alice is participantA
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED_BY_A"));
    }

    @Test
    void markComplete_participantBMarks_returnsCompletedByB() throws Exception {
        // Bob is participantB
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED_BY_B"));
    }

    @Test
    void markComplete_bothMark_returnsCompleted() throws Exception {
        // Alice marks first
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED_BY_A"));

        // Bob marks second -> COMPLETED
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());
    }

    @Test
    void markComplete_alreadyMarkedBySameSide_returns400() throws Exception {
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
        // Alice tries to mark again
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_DEAL_STATE"))
                .andExpect(jsonPath("$.error.message").value("Already marked complete"));
    }

    @Test
    void markComplete_cancelledDeal_returns400() throws Exception {
        // Cancel first
        mockMvc.perform(post("/deals/" + dealId + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
        // Then try to mark complete
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_DEAL_STATE"));
    }

    // ---- POST /deals/{id}/cancel ----

    @Test
    void cancel_cancelsDeal() throws Exception {
        mockMvc.perform(post("/deals/" + dealId + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelledAt").isNotEmpty())
                .andExpect(jsonPath("$.cancelledByUserId").value(alice.getId().toString()));
    }

    @Test
    void cancel_alreadyCompleted_returns400() throws Exception {
        // Both mark complete first
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                .header("Authorization", "Bearer " + aliceToken)).andExpect(status().isOk());
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                .header("Authorization", "Bearer " + bobToken)).andExpect(status().isOk());
        // Now try cancel
        mockMvc.perform(post("/deals/" + dealId + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_DEAL_STATE"));
    }

    @Test
    void cancel_nonParticipant_returns403() throws Exception {
        mockMvc.perform(post("/deals/" + dealId + "/cancel")
                        .header("Authorization", "Bearer " + carolToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    // ---- Unauthenticated ----

    @Test
    void unauthenticatedRequests_return401() throws Exception {
        mockMvc.perform(get("/me/deals"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/deals/" + dealId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/deals/" + dealId + "/cancel"))
                .andExpect(status().isUnauthorized());
    }
}
