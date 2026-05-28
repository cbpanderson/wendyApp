package com.wendyapp.backend.messages;

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

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for /offers/{offerId}/messages per spec-docs/05-test-plan.md §4 → US-7.
 */
@SpringBootTest
@AutoConfigureMockMvc
class MessageControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository users;
    @Autowired CategoryRepository categories;
    @Autowired ListingRepository listings;
    @Autowired ListingPhotoRepository listingPhotos;
    @Autowired OfferRepository offers;
    @Autowired DealRepository deals;
    @Autowired MessageRepository messages;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private User alice;   // listing owner / toUser
    private User bob;     // offerer / fromUser
    private User carol;   // non-participant
    private String aliceToken;
    private String bobToken;
    private String carolToken;
    private Category cat;

    @BeforeEach
    void setup() {
        // FK-aware cleanup (messages cascade-delete when offers are deleted)
        deals.deleteAll();
        offers.deleteAll();
        listingPhotos.deleteAll();
        listings.deleteAll();
        users.deleteAll();

        cat = categories.findAllByActiveTrueOrderByNameAsc().get(0);

        alice = users.save(new User("alice@example.com",
                passwordEncoder.encode("password"), "alice", "98382", true));
        bob = users.save(new User("bob@example.com",
                passwordEncoder.encode("password"), "bob", "98382", true));
        carol = users.save(new User("carol@example.com",
                passwordEncoder.encode("password"), "carol", "98382", true));

        aliceToken = jwtService.issueFor(alice.getId()).token();
        bobToken = jwtService.issueFor(bob.getId()).token();
        carolToken = jwtService.issueFor(carol.getId()).token();
    }

    private Offer createOffer() {
        Listing aliceListing = listings.save(new Listing(alice, cat, "Alice's eggs",
                "Fresh from the coop.", Listing.OfferType.EITHER));
        Listing bobListing = listings.save(new Listing(bob, cat, "Bob's honey",
                "Local wildflower.", Listing.OfferType.EITHER));
        return offers.save(new Offer(aliceListing, bob, alice, Offer.Type.TRADE, bobListing, "Trade?"));
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    // US-7 TC-1: Authenticated offerer can POST a message → 201, body returned
    @Test
    void offerer_canSendMessage_returns201() throws Exception {
        Offer offer = createOffer();
        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", "Hey, interested?"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.body").value("Hey, interested?"))
                .andExpect(jsonPath("$.sender.handle").value("bob"));
    }

    // US-7 TC-2: Authenticated listing owner can POST a message → 201
    @Test
    void listingOwner_canSendMessage_returns201() throws Exception {
        Offer offer = createOffer();
        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", "Sure, sounds good!"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sender.handle").value("alice"));
    }

    // US-7 TC-3: Unauthenticated POST → 401
    @Test
    void unauthenticated_post_returns401() throws Exception {
        Offer offer = createOffer();
        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", "Hello"))))
                .andExpect(status().isUnauthorized());
    }

    // US-7 TC-4: Non-participant POST → 403
    @Test
    void nonParticipant_post_returns403() throws Exception {
        Offer offer = createOffer();
        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + carolToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", "Can I join?"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    // US-7 TC-5: Offer not found POST → 404
    @Test
    void offerNotFound_post_returns404() throws Exception {
        mockMvc.perform(post("/offers/" + UUID.randomUUID() + "/messages")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", "Hello"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    // US-7 TC-6: Body blank → 400
    @Test
    void blankBody_returns400() throws Exception {
        Offer offer = createOffer();
        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // US-7 TC-7: Body over 2000 chars → 400
    @Test
    void bodyTooLong_returns400() throws Exception {
        Offer offer = createOffer();
        String longBody = "x".repeat(2001);
        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", longBody))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // US-7 TC-8: GET messages returns thread in chronological order
    @Test
    void getMessages_returnsChronologicalThread() throws Exception {
        Offer offer = createOffer();

        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", "First message"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("body", "Second message"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].body").value("First message"))
                .andExpect(jsonPath("$.items[1].body").value("Second message"));
    }

    // US-7 TC-9: GET as non-participant → 403
    @Test
    void getMessages_nonParticipant_returns403() throws Exception {
        Offer offer = createOffer();
        mockMvc.perform(get("/offers/" + offer.getId() + "/messages")
                        .header("Authorization", "Bearer " + carolToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    // US-7 TC-10: GET on nonexistent offer → 404
    @Test
    void getMessages_offerNotFound_returns404() throws Exception {
        mockMvc.perform(get("/offers/" + UUID.randomUUID() + "/messages")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }
}
