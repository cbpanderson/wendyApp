package com.wendyapp.backend.listings;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wendyapp.backend.auth.JwtService;
import com.wendyapp.backend.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for /listings/* and /categories per spec-docs/05-test-plan.md §4 → US-3.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ListingsControllerTest {

    @TempDir
    static Path tempUploads;

    @DynamicPropertySource
    static void overrideUploadsDir(DynamicPropertyRegistry registry) {
        registry.add("app.uploads.dir", () -> tempUploads.toAbsolutePath().toString());
    }

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
    private String aliceToken;
    private String bobToken;
    private Category cat;
    private Category inactive;

    @BeforeEach
    void setup() {
        // Clear in dependency order
        deals.deleteAll();
        offers.deleteAll();
        photos.deleteAll();
        listings.deleteAll();
        users.deleteAll();
        // categories are seeded by V2; just add an inactive one for tests
        Category maybeInactive = categories.findAll().stream()
                .filter(c -> "test-inactive".equals(c.getSlug())).findFirst().orElse(null);
        if (maybeInactive == null) {
            maybeInactive = categories.save(new Category("Test Inactive", "test-inactive", false));
        } else {
            maybeInactive.setActive(false);
            maybeInactive = categories.save(maybeInactive);
        }
        inactive = maybeInactive;

        cat = categories.findAllByActiveTrueOrderByNameAsc().get(0);

        alice = users.save(new User("alice@example.com",
                passwordEncoder.encode("correct-horse-battery"), "alice", "98382", true));
        bob = users.save(new User("bob@example.com",
                passwordEncoder.encode("correct-horse-battery"), "bob", "98382", true));
        aliceToken = jwtService.issueFor(alice.getId()).token();
        bobToken = jwtService.issueFor(bob.getId()).token();
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private UUID createListingAs(User u, String token) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("categoryId", cat.getId().toString());
        body.put("title", "Fresh garden eggs");
        body.put("description", "Free-range dozen.");
        body.put("offerType", "EITHER");
        MvcResult result = mockMvc.perform(post("/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(node.get("id").asText());
    }

    // ------------------------ Categories ------------------------

    @Test
    void getCategories_returnsSeeded() throws Exception {
        mockMvc.perform(get("/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                // 28 seeded + we don't count our inactive
                .andExpect(jsonPath("$[0].id").exists());
        // Ensure inactive not present
        String body = mockMvc.perform(get("/categories")).andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("test-inactive");
        // and at least 28 active
        JsonNode arr = objectMapper.readTree(body);
        assertThat(arr.size()).isGreaterThanOrEqualTo(28);
    }

    // ------------------------ Create ------------------------

    @Test
    void createListing_valid_returns201() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("categoryId", cat.getId().toString());
        body.put("title", "Fresh garden eggs");
        body.put("description", "Free-range dozen.");
        body.put("offerType", "EITHER");
        mockMvc.perform(post("/listings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Fresh garden eggs"))
                .andExpect(jsonPath("$.owner.handle").value("alice"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createListing_noAuth_returns401() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("categoryId", cat.getId().toString());
        body.put("title", "Fresh garden eggs");
        body.put("description", "Free-range dozen.");
        body.put("offerType", "EITHER");
        mockMvc.perform(post("/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createListing_shortTitle_returns400() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("categoryId", cat.getId().toString());
        body.put("title", "abc");
        body.put("description", "Short.");
        body.put("offerType", "EITHER");
        mockMvc.perform(post("/listings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    @Test
    void createListing_inactiveCategory_returns400() throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("categoryId", inactive.getId().toString());
        body.put("title", "Fresh garden eggs");
        body.put("description", "Free-range dozen.");
        body.put("offerType", "EITHER");
        mockMvc.perform(post("/listings")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // ------------------------ Update / Delete ------------------------

    @Test
    void updateOwnListing_returns200() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Updated title");
        mockMvc.perform(patch("/listings/" + id)
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"));
    }

    @Test
    void updateSomeoneElsesListing_returns403() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        Map<String, Object> body = new HashMap<>();
        body.put("title", "Hacked title");
        mockMvc.perform(patch("/listings/" + id)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void softDeleteOwnListing_returns204_andHiddenFromBrowse() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        mockMvc.perform(delete("/listings/" + id)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());

        // Status updated in DB
        assertThat(listings.findById(id).orElseThrow().getStatus())
                .isEqualTo(Listing.Status.DELETED);

        // Not returned by GET /listings (browse only shows ACTIVE)
        MvcResult result = mockMvc.perform(get("/listings"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain(id.toString());

        // 404 on the detail endpoint
        mockMvc.perform(get("/listings/" + id))
                .andExpect(status().isNotFound());
    }

    // ------------------------ Photos ------------------------

    private MockMultipartFile jpeg(String fieldName) {
        // Minimal JPEG: SOI, app0 JFIF marker, EOI
        byte[] data = new byte[] {
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 'J', 'F', 'I', 'F', 0x00,
                0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
                (byte) 0xFF, (byte) 0xD9
        };
        return new MockMultipartFile(fieldName, "photo.jpg", "image/jpeg", data);
    }

    @Test
    void uploadFirstPhoto_returns201_position0() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(jpeg("file"))
                        .param("position", "0")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.position").value(0))
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void uploadSecondPhoto_returns201_position1() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(jpeg("file"))
                        .param("position", "0")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated());
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(jpeg("file"))
                        .param("position", "1")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.position").value(1));
    }

    @Test
    void uploadThirdPhoto_returns409() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                .file(jpeg("file")).param("position", "0")
                .header("Authorization", "Bearer " + aliceToken)).andExpect(status().isCreated());
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                .file(jpeg("file")).param("position", "1")
                .header("Authorization", "Bearer " + aliceToken)).andExpect(status().isCreated());
        // 3rd attempt — reuses position 0 which is also occupied; either way must be 409
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(jpeg("file")).param("position", "0")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("PHOTO_LIMIT"));
    }

    @Test
    void uploadPhotoOnOthersListing_returns403() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(jpeg("file")).param("position", "0")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void uploadOversizedPhoto_returns400() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        byte[] big = new byte[(int) (ImageValidator.MAX_BYTES + 1024)];
        // Make valid JPEG header so we hit the size check first (still, size > 2MB)
        big[0] = (byte) 0xFF; big[1] = (byte) 0xD8; big[2] = (byte) 0xFF;
        MockMultipartFile huge = new MockMultipartFile("file", "big.jpg", "image/jpeg", big);
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(huge).param("position", "0")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    @Test
    void uploadDisallowedType_returns400() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        // GIF magic bytes
        byte[] gif = new byte[] { 'G', 'I', 'F', '8', '9', 'a', 0x00, 0x00 };
        MockMultipartFile bad = new MockMultipartFile("file", "x.gif", "image/gif", gif);
        mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(bad).param("position", "0")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
    }

    // ------------------------ Browse (US-4) ------------------------

    private UUID createListingAs(User u, String token, String title, String description,
                                 String offerType, UUID categoryId) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("categoryId", categoryId.toString());
        body.put("title", title);
        body.put("description", description);
        body.put("offerType", offerType);
        MvcResult result = mockMvc.perform(post("/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isCreated())
                .andReturn();
        return UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    @Test
    void browse_returnsOnlyActiveListings() throws Exception {
        UUID active = createListingAs(alice, aliceToken, "Garden eggs", "Fresh.", "EITHER", cat.getId());
        UUID paused = createListingAs(alice, aliceToken, "Honey jar", "Local raw.", "EITHER", cat.getId());
        UUID deleted = createListingAs(alice, aliceToken, "Apples bag", "Crisp.", "EITHER", cat.getId());
        // Pause one directly via repo
        var p = listings.findById(paused).orElseThrow();
        p.setStatus(Listing.Status.PAUSED);
        listings.save(p);
        // Delete one via API
        mockMvc.perform(delete("/listings/" + deleted)
                .header("Authorization", "Bearer " + aliceToken)).andExpect(status().isNoContent());

        MvcResult r = mockMvc.perform(get("/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andReturn();
        String body = r.getResponse().getContentAsString();
        assertThat(body).contains(active.toString());
        assertThat(body).doesNotContain(paused.toString());
        assertThat(body).doesNotContain(deleted.toString());
    }

    @Test
    void browse_filterByCategory() throws Exception {
        var actives = categories.findAllByActiveTrueOrderByNameAsc();
        Category catA = actives.get(0);
        Category catB = actives.get(1);
        UUID inA = createListingAs(alice, aliceToken, "Thing in A", "Desc.", "EITHER", catA.getId());
        UUID inB = createListingAs(alice, aliceToken, "Thing in B", "Desc.", "EITHER", catB.getId());

        MvcResult r = mockMvc.perform(get("/listings").param("categoryId", catA.getId().toString()))
                .andExpect(status().isOk()).andReturn();
        String body = r.getResponse().getContentAsString();
        assertThat(body).contains(inA.toString());
        assertThat(body).doesNotContain(inB.toString());
    }

    @Test
    void browse_keywordMatchesTitleOrDescription_caseInsensitive() throws Exception {
        UUID withInTitle = createListingAs(alice, aliceToken, "Sourdough starter", "Bubbly.", "EITHER", cat.getId());
        UUID withInDesc = createListingAs(alice, aliceToken, "Mystery bag", "Includes sourDOUGH bread.", "EITHER", cat.getId());
        UUID unrelated = createListingAs(alice, aliceToken, "Garden gloves", "Cotton.", "EITHER", cat.getId());

        MvcResult r = mockMvc.perform(get("/listings").param("q", "SOURDOUGH"))
                .andExpect(status().isOk()).andReturn();
        String body = r.getResponse().getContentAsString();
        assertThat(body).contains(withInTitle.toString());
        assertThat(body).contains(withInDesc.toString());
        assertThat(body).doesNotContain(unrelated.toString());
    }

    @Test
    void browse_filterByOfferType() throws Exception {
        UUID gift = createListingAs(alice, aliceToken, "Free spare tile", "Extra.", "GIFT_ONLY", cat.getId());
        UUID trade = createListingAs(alice, aliceToken, "Trade-only herbs", "Basil.", "TRADE_ONLY", cat.getId());

        MvcResult r = mockMvc.perform(get("/listings").param("offerType", "GIFT_ONLY"))
                .andExpect(status().isOk()).andReturn();
        String body = r.getResponse().getContentAsString();
        assertThat(body).contains(gift.toString());
        assertThat(body).doesNotContain(trade.toString());
    }

    @Test
    void browse_pagination_returnsCorrectTotalAndPage() throws Exception {
        // Create 12 active listings
        for (int i = 0; i < 12; i++) {
            createListingAs(alice, aliceToken, "Listing number " + i, "Desc " + i, "EITHER", cat.getId());
        }
        MvcResult page1 = mockMvc.perform(get("/listings").param("limit", "10").param("offset", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(12))
                .andExpect(jsonPath("$.items.length()").value(10))
                .andReturn();
        MvcResult page2 = mockMvc.perform(get("/listings").param("limit", "10").param("offset", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(12))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andReturn();
        // Pages shouldn't overlap
        var p1ids = objectMapper.readTree(page1.getResponse().getContentAsString()).get("items");
        var p2ids = objectMapper.readTree(page2.getResponse().getContentAsString()).get("items");
        assertThat(p1ids.get(0).get("id").asText())
                .isNotEqualTo(p2ids.get(0).get("id").asText());
    }

    @Test
    void browse_excludesNonSequimUserListings() throws Exception {
        // Insert a user with a non-Sequim ZIP directly via the repo, bypassing AllowedZipsConfig.
        // (Signup would reject this ZIP — we're testing the browse-side filter, so we go direct.)
        User outsider = users.save(new User("out@example.com",
                passwordEncoder.encode("correct-horse-battery"), "outsider", "90210", true));
        // Persist a listing for the outsider directly (no controller path lets us do this with
        // a non-Sequim user, since auth filter requires a registered user — but JwtService accepts any UUID).
        String outsiderToken = jwtService.issueFor(outsider.getId()).token();
        UUID hidden = createListingAs(outsider, outsiderToken, "Outsider widget", "Far away.", "EITHER", cat.getId());
        UUID shown = createListingAs(alice, aliceToken, "Local widget", "Nearby.", "EITHER", cat.getId());

        MvcResult r = mockMvc.perform(get("/listings")).andExpect(status().isOk()).andReturn();
        String body = r.getResponse().getContentAsString();
        assertThat(body).contains(shown.toString());
        assertThat(body).doesNotContain(hidden.toString());
    }

    // ------------------------ Detail (US-5) ------------------------

    @Test
    void getListingById_returnsOwnerSummaryAndCategoryAndPhotos() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        mockMvc.perform(get("/listings/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.owner.handle").value("alice"))
                .andExpect(jsonPath("$.owner.ratingCount").exists())
                .andExpect(jsonPath("$.category.id").value(cat.getId().toString()))
                .andExpect(jsonPath("$.category.name").exists())
                .andExpect(jsonPath("$.photos").isArray())
                .andExpect(jsonPath("$.title").value("Fresh garden eggs"));
    }

    @Test
    void getListingById_deletedListing_returns404() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        mockMvc.perform(delete("/listings/" + id)
                .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/listings/" + id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void deletePhoto_returns204() throws Exception {
        UUID id = createListingAs(alice, aliceToken);
        MvcResult r = mockMvc.perform(multipart("/listings/" + id + "/photos")
                        .file(jpeg("file")).param("position", "0")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated()).andReturn();
        UUID photoId = UUID.fromString(objectMapper.readTree(r.getResponse().getContentAsString()).get("id").asText());

        mockMvc.perform(delete("/listings/" + id + "/photos/" + photoId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());
        assertThat(photos.findById(photoId)).isEmpty();
    }
}
