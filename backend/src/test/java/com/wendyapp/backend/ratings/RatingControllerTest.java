package com.wendyapp.backend.ratings;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for POST /deals/{id}/ratings and GET /users/{handle}/ratings
 * per spec-docs/05-test-plan.md §4 → US-9.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RatingControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository users;
    @Autowired CategoryRepository categories;
    @Autowired ListingRepository listings;
    @Autowired ListingPhotoRepository photos;
    @Autowired OfferRepository offers;
    @Autowired DealRepository deals;
    @Autowired RatingRepository ratings;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private User alice;
    private User bob;
    private User carol;
    private String aliceToken;
    private String bobToken;
    private String carolToken;

    private UUID dealId;
    private UUID completedDealId;

    @BeforeEach
    void setup() throws Exception {
        // FK-aware cleanup
        ratings.deleteAll();
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

        // Both mark complete -> COMPLETED
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/deals/" + dealId + "/mark-complete")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk());

        completedDealId = dealId;
    }

    // ---- 1. Participant submits rating → 201 ----

    @Test
    void submitRating_returnsCreatedWithStarsAndReview() throws Exception {
        Map<String, Object> body = Map.of("stars", 5, "review", "Great trader!");
        MvcResult result = mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.stars").value(5))
                .andExpect(jsonPath("$.review").value("Great trader!"))
                .andExpect(jsonPath("$.dealId").value(completedDealId.toString()))
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(json.get("id").asText()).isNotEmpty();
        assertThat(json.get("ratee").get("handle").asText()).isEqualTo("bob");
        assertThat(json.get("rater").get("handle").asText()).isEqualTo("alice");
    }

    // ---- 2. GET /users/{handle}/ratings returns the rating ----

    @Test
    void getRatingsForUser_returnsSubmittedRating() throws Exception {
        // Alice rates bob
        Map<String, Object> body = Map.of("stars", 4, "review", "Reliable");
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/users/bob/ratings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].stars").value(4))
                .andExpect(jsonPath("$.items[0].review").value("Reliable"));
    }

    // ---- 3. averageStars updated after rating ----

    @Test
    void submitRating_updatesAverageStarsOnRatee() throws Exception {
        Map<String, Object> body = Map.of("stars", 5, "review", "Excellent!");
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/users/bob"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageStars").value(5.0))
                .andExpect(jsonPath("$.ratingCount").value(1));
    }

    // ---- 4. 400 if deal is not COMPLETED ----

    @Test
    void submitRating_dealNotCompleted_returns400() throws Exception {
        // Create a second deal that stays ACCEPTED
        Category cat = categories.findAllByActiveTrueOrderByNameAsc().get(0);
        Listing aliceListing2 = listings.save(new Listing(alice, cat, "Alice herbs",
                "Fresh from garden.", Listing.OfferType.EITHER));
        Listing bobListing2 = listings.save(new Listing(bob, cat, "Bob eggs",
                "Farm fresh.", Listing.OfferType.EITHER));

        Map<String, Object> offerBody = new HashMap<>();
        offerBody.put("offerType", "TRADE");
        offerBody.put("offeredListingId", bobListing2.getId().toString());

        MvcResult offerResult = mockMvc.perform(post("/listings/" + aliceListing2.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(offerBody)))
                .andExpect(status().isCreated())
                .andReturn();
        UUID offerId2 = UUID.fromString(
                objectMapper.readTree(offerResult.getResponse().getContentAsString()).get("id").asText());

        MvcResult dealResult = mockMvc.perform(post("/offers/" + offerId2 + "/accept")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andReturn();
        UUID acceptedDealId = UUID.fromString(
                objectMapper.readTree(dealResult.getResponse().getContentAsString()).get("id").asText());

        // Try to rate while still ACCEPTED
        Map<String, Object> body = Map.of("stars", 3);
        mockMvc.perform(post("/deals/" + acceptedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_DEAL_STATE"));
    }

    // ---- 5. 409 if same person rates twice ----

    @Test
    void submitRating_alreadyRated_returns409() throws Exception {
        Map<String, Object> body = Map.of("stars", 5);
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        // Second attempt
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("ALREADY_RATED"));
    }

    // ---- 6. 403 if non-participant tries to rate ----

    @Test
    void submitRating_nonParticipant_returns403() throws Exception {
        Map<String, Object> body = Map.of("stars", 4);
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + carolToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    // ---- 7. 404 if deal doesn't exist ----

    @Test
    void submitRating_dealNotFound_returns404() throws Exception {
        Map<String, Object> body = Map.of("stars", 4);
        mockMvc.perform(post("/deals/" + UUID.randomUUID() + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("DEAL_NOT_FOUND"));
    }

    // ---- 8. 400 if stars out of range ----

    @Test
    void submitRating_starsOutOfRange_returns400() throws Exception {
        Map<String, Object> bodyLow = Map.of("stars", 0);
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bodyLow)))
                .andExpect(status().isBadRequest());

        Map<String, Object> bodyHigh = Map.of("stars", 6);
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bodyHigh)))
                .andExpect(status().isBadRequest());
    }

    // ---- 9. Both participants can rate (two ratings on same deal is fine) ----

    @Test
    void submitRating_bothParticipantsCanRate() throws Exception {
        Map<String, Object> aliceBody = Map.of("stars", 5, "review", "Bob was great!");
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(aliceBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ratee.handle").value("bob"));

        Map<String, Object> bobBody = Map.of("stars", 4, "review", "Alice was reliable!");
        mockMvc.perform(post("/deals/" + completedDealId + "/ratings")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bobBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ratee.handle").value("alice"));

        // Two ratings exist on the deal
        assertThat(ratings.findByDealId(completedDealId)).hasSize(2);
    }
}
