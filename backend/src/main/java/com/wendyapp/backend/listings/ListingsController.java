package com.wendyapp.backend.listings;

import com.wendyapp.backend.config.AllowedZipsConfig;
import com.wendyapp.backend.domain.Listing;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.listings.dto.CreateListingRequest;
import com.wendyapp.backend.listings.dto.ListingDto;
import com.wendyapp.backend.listings.dto.ListingPhotoDto;
import com.wendyapp.backend.listings.dto.UpdateListingRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/listings")
public class ListingsController {

    private final ListingService service;
    private final ListingRepository listings;
    private final AllowedZipsConfig allowedZips;

    public ListingsController(ListingService service, ListingRepository listings, AllowedZipsConfig allowedZips) {
        this.service = service;
        this.listings = listings;
        this.allowedZips = allowedZips;
    }

    @GetMapping
    public java.util.Map<String, Object> browse(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Listing.OfferType offerType,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        var zips = allowedZips.asSet();
        var pageable = PageRequest.of(offset / Math.max(1, limit), limit,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        final String keyword = (q == null || q.isBlank()) ? null : q.trim().toLowerCase();
        Specification<Listing> spec = (root, query, cb) -> {
            var preds = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            preds.add(cb.equal(root.get("status"), Listing.Status.ACTIVE));
            preds.add(root.get("owner").get("zipCode").in(zips));
            if (categoryId != null) {
                preds.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (offerType != null) {
                preds.add(cb.equal(root.get("offerType"), offerType));
            }
            if (keyword != null) {
                String like = "%" + keyword + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }
            return cb.and(preds.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        var page = listings.findAll(spec, pageable);
        return java.util.Map.of(
                "items", page.getContent().stream().map(ListingDto::from).toList(),
                "total", page.getTotalElements()
        );
    }

    @PostMapping
    public ResponseEntity<ListingDto> create(@AuthenticationPrincipal User current,
                                             @Valid @RequestBody CreateListingRequest req) {
        Listing listing = service.create(current, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ListingDto.from(listing));
    }

    @GetMapping("/{id}")
    public ListingDto get(@PathVariable UUID id) {
        Listing listing = listings.findById(id).orElseThrow(ListingNotFoundException::new);
        if (listing.getStatus() == Listing.Status.DELETED) {
            throw new ListingNotFoundException();
        }
        return ListingDto.from(listing);
    }

    @PatchMapping("/{id}")
    public ListingDto update(@PathVariable UUID id,
                             @AuthenticationPrincipal User current,
                             @Valid @RequestBody UpdateListingRequest req) {
        return ListingDto.from(service.update(id, current, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id,
                                       @AuthenticationPrincipal User current) {
        service.softDelete(id, current);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/{id}/photos", consumes = "multipart/form-data")
    public ResponseEntity<ListingPhotoDto> uploadPhoto(@PathVariable UUID id,
                                                       @AuthenticationPrincipal User current,
                                                       @RequestParam("file") MultipartFile file,
                                                       @RequestParam("position") int position) throws IOException {
        byte[] bytes = file.getBytes();
        var photo = service.addPhoto(id, current, bytes, file.getContentType(), position);
        return ResponseEntity.status(HttpStatus.CREATED).body(ListingPhotoDto.from(photo));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id,
                                            @PathVariable UUID photoId,
                                            @AuthenticationPrincipal User current) {
        service.deletePhoto(id, photoId, current);
        return ResponseEntity.noContent().build();
    }
}
