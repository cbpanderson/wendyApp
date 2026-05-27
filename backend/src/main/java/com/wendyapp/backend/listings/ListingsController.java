package com.wendyapp.backend.listings;

import com.wendyapp.backend.domain.Listing;
import com.wendyapp.backend.domain.ListingRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.listings.dto.CreateListingRequest;
import com.wendyapp.backend.listings.dto.ListingDto;
import com.wendyapp.backend.listings.dto.ListingPhotoDto;
import com.wendyapp.backend.listings.dto.UpdateListingRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
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

    public ListingsController(ListingService service, ListingRepository listings) {
        this.service = service;
        this.listings = listings;
    }

    @GetMapping
    public java.util.Map<String, Object> browse(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        var page = listings.findByStatusOrderByCreatedAtDesc(
                Listing.Status.ACTIVE,
                PageRequest.of(offset / Math.max(1, limit), limit)
        );
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
