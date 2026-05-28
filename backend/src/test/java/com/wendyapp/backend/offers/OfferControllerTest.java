package com.wendyapp.backend.offers;

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
 * Integration tests for /offers/* and /listings/{id}/offers per spec-docs/05-test-plan.md §4 → US-6.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OfferControllerTest {

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
    private Category cat;

    // Alice's listings (the listers/targets)
    private Listing aliceEither;     // EITHER
    private Listing aliceTradeOnly;  // TRADE_ONLY
    private Listing aliceGiftOnly;   // GIFT_ONLY

    // Bob's listings (the offerer's items)
    private Listing bobItem;
    private Listing bobItem2;
    // Carol's listings
    private Listing carolItem;

    @BeforeEach
    void setup() {
        // FK-aware cleanup
        deals.deleteAll();
        offers.deleteAll();
        photos.deleteAll();
        listings.deleteAll();
        users.deleteAll();

        cat = categories.findAllByActiveTrueOrderByNameAsc().get(0);

        alice = users.save(new User("alice@example.com",
                passwordEncoder.encode("correct-horse-battery"), "alice", "98382", true));
        bob = users.save(new User("bob@example.com",
                passwordEncoder.encode("correct-horse-battery"), "bob", "98382", true));
        carol = users.save(new User("carol@example.com",
                passwordEncoder.encode("correct-horse-battery"), "carol", "98382", true));
        aliceToken = jwtService.issueFor(alice.getId()).token();
        bobToken = jwtService.issueFor(bob.getId()).token();
        carolToken = jwtService.issueFor(carol.getId()).token();

        aliceEither = listings.save(new Listing(alice, cat, "Alice eggs",
                "Fresh from coop.", Listing.OfferType.EITHER));
        aliceTradeOnly = listings.save(new Listing(alice, cat, "Alice trade-only herbs",
                "Trade-only basil.", Listing.OfferType.TRADE_ONLY));
        aliceGiftOnly = listings.save(new Listing(alice, cat, "Alice free spare tile",
                "Gift only.", Listing.OfferType.GIFT_ONLY));
        bobItem = listings.save(new Listing(bob, cat, "Bob honey",
                "Local wildflower.", Listing.OfferType.EITHER));
        bobItem2 = listings.save(new Listing(bob, cat, "Bob lawn service",
                "One mow.", Listing.OfferType.EITHER));
        carolItem = listings.save(new Listing(carol, cat, "Carol apples",
                "Crisp gala.", Listing.OfferType.EITHER));
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private UUID createOffer(String token, UUID listingId, String offerType,
                             UUID offeredListingId, String message, int expectedStatus) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("offerType", offerType);
        if (offeredListingId != null) body.put("offeredListingId", offeredListingId.toString());
        if (message != null) body.put("message", message);
        MvcResult r = mockMvc.perform(post("/listings/" + listingId + "/offers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().is(expectedStatus))
                .andReturn();
        if (expectedStatus == 201) {
            JsonNode node = objectMapper.readTree(r.getResponse().getContentAsString());
            return UUID.fromString(node.get("id").asText());
        }
        return null;
    }

    // ---------- Create offers ----------

    @Test
    void tradeOfferWithValidOfferedListing_returns201() throws Exception {
        mockMvc.perform(post("/listings/" + aliceEither.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "offerType", "TRADE",
                                "offeredListingId", bobItem.getId().toString(),
                                "message", "Trade?"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.offerType").value("TRADE"))
                .andExpect(jsonPath("$.fromUser.handle").value("bob"))
                .andExpect(jsonPath("$.toUser.handle").value("alice"))
                .andExpect(jsonPath("$.offeredListing.id").value(bobItem.getId().toString()));
    }

    @Test
    void giftRequestOffer_returns201() throws Exception {
        mockMvc.perform(post("/listings/" + aliceEither.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "offerType", "GIFT_REQUEST",
                                "message", "Please?"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.offerType").value("GIFT_REQUEST"))
                .andExpect(jsonPath("$.offeredListing").doesNotExist());
    }

    @Test
    void offerOnOwnListing_returns403() throws Exception {
        mockMvc.perform(post("/listings/" + aliceEither.getId() + "/offers")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("offerType", "GIFT_REQUEST"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void tradeOfferOnGiftOnlyListing_returns403() throws Exception {
        mockMvc.perform(post("/listings/" + aliceGiftOnly.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "offerType", "TRADE",
                                "offeredListingId", bobItem.getId().toString()
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void giftRequestOnTradeOnlyListing_returns403() throws Exception {
        mockMvc.perform(post("/listings/" + aliceTradeOnly.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("offerType", "GIFT_REQUEST"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void tradeOfferWithOfferedListingNotOwnedByOfferer_returns403() throws Exception {
        // Bob tries to offer Carol's listing as the trade item.
        mockMvc.perform(post("/listings/" + aliceEither.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "offerType", "TRADE",
                                "offeredListingId", carolItem.getId().toString()
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void secondPendingOfferFromSameUserOnSameListing_returns409() throws Exception {
        createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(post("/listings/" + aliceEither.getId() + "/offers")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("offerType", "GIFT_REQUEST"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("OFFER_CONFLICT"));
    }

    // ---------- Accept / Decline / Withdraw ----------

    @Test
    void acceptByNonLister_returns403() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        // Carol (not the lister) tries to accept
        mockMvc.perform(post("/offers/" + offerId + "/accept")
                        .header("Authorization", "Bearer " + carolToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void acceptOffer_createsDealAndAutoDeclinesSiblings() throws Exception {
        UUID bobOfferId = createOffer(bobToken, aliceEither.getId(), "TRADE",
                bobItem.getId(), null, 201);
        UUID carolOfferId = createOffer(carolToken, aliceEither.getId(), "GIFT_REQUEST",
                null, null, 201);

        MvcResult r = mockMvc.perform(post("/offers/" + bobOfferId + "/accept")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.offerId").value(bobOfferId.toString()))
                .andExpect(jsonPath("$.dealType").value("TRADE"))
                .andReturn();

        UUID dealId = UUID.fromString(
                objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asText());

        // Deal exists
        assertThat(deals.findById(dealId)).isPresent();
        assertThat(offers.findById(bobOfferId).orElseThrow().getStatus())
                .isEqualTo(Offer.Status.ACCEPTED);

        // Sibling Carol offer auto-declined
        assertThat(offers.findById(carolOfferId).orElseThrow().getStatus())
                .isEqualTo(Offer.Status.DECLINED);
    }

    @Test
    void acceptAlreadyAcceptedOffer_returns409() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(post("/offers/" + offerId + "/accept")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/offers/" + offerId + "/accept")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("OFFER_CONFLICT"));
    }

    @Test
    void declineOffer_setsStatusDeclined() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(post("/offers/" + offerId + "/decline")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DECLINED"));
        assertThat(offers.findById(offerId).orElseThrow().getStatus())
                .isEqualTo(Offer.Status.DECLINED);
    }

    @Test
    void withdrawOwnPendingOffer_setsStatusWithdrawn() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(post("/offers/" + offerId + "/withdraw")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("WITHDRAWN"));
    }

    @Test
    void withdrawSomeoneElsesOffer_returns403() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(post("/offers/" + offerId + "/withdraw")
                        .header("Authorization", "Bearer " + carolToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void withdrawNonPendingOffer_returns409() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        // Alice declines
        mockMvc.perform(post("/offers/" + offerId + "/decline")
                .header("Authorization", "Bearer " + aliceToken)).andExpect(status().isOk());
        // Bob then tries to withdraw the now-declined offer
        mockMvc.perform(post("/offers/" + offerId + "/withdraw")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("OFFER_CONFLICT"));
    }

    // ---------- /me/offers + /offers/{id} ----------

    @Test
    void getOfferById_byNonParticipant_returns403() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(get("/offers/" + offerId)
                        .header("Authorization", "Bearer " + carolToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOfferById_byParticipant_returns200() throws Exception {
        UUID offerId = createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(get("/offers/" + offerId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(offerId.toString()));
        mockMvc.perform(get("/offers/" + offerId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk());
    }

    @Test
    void myOffers_sent_returnsOffersAuthored() throws Exception {
        createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(get("/me/offers?direction=sent")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].fromUser.handle").value("bob"));
    }

    @Test
    void myOffers_received_returnsOffersToListings() throws Exception {
        createOffer(bobToken, aliceEither.getId(), "GIFT_REQUEST", null, null, 201);
        mockMvc.perform(get("/me/offers?direction=received")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].toUser.handle").value("alice"));
    }
}
