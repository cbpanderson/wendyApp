package com.wendyapp.backend.listings;

import com.wendyapp.backend.domain.*;
import com.wendyapp.backend.listings.dto.CreateListingRequest;
import com.wendyapp.backend.listings.dto.UpdateListingRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.UUID;

@Service
public class ListingService {

    private final ListingRepository listings;
    private final CategoryRepository categories;
    private final ListingPhotoRepository photos;
    private final StorageService storage;

    public ListingService(ListingRepository listings,
                          CategoryRepository categories,
                          ListingPhotoRepository photos,
                          StorageService storage) {
        this.listings = listings;
        this.categories = categories;
        this.photos = photos;
        this.storage = storage;
    }

    @Transactional
    public Listing create(User owner, CreateListingRequest req) {
        Listing.OfferType type;
        try {
            type = Listing.OfferType.valueOf(req.offerType());
        } catch (IllegalArgumentException e) {
            throw new InvalidListingException("offerType: must be TRADE_ONLY, GIFT_ONLY, or EITHER");
        }
        Category category = categories.findById(req.categoryId())
                .orElseThrow(() -> new InvalidListingException("categoryId: unknown category"));
        if (!category.isActive()) {
            throw new InvalidListingException("categoryId: category is not active");
        }
        Listing listing = new Listing(owner, category, req.title(), req.description(), type);
        return listings.save(listing);
    }

    @Transactional
    public Listing update(UUID listingId, User actor, UpdateListingRequest req) {
        Listing listing = listings.findById(listingId).orElseThrow(ListingNotFoundException::new);
        if (!listing.getOwner().getId().equals(actor.getId())) {
            throw new ForbiddenException("You do not own this listing");
        }
        if (req.categoryId() != null) {
            Category category = categories.findById(req.categoryId())
                    .orElseThrow(() -> new InvalidListingException("categoryId: unknown category"));
            if (!category.isActive()) {
                throw new InvalidListingException("categoryId: category is not active");
            }
            listing.setCategory(category);
        }
        if (req.title() != null) listing.setTitle(req.title());
        if (req.description() != null) listing.setDescription(req.description());
        if (req.offerType() != null) {
            try {
                listing.setOfferType(Listing.OfferType.valueOf(req.offerType()));
            } catch (IllegalArgumentException e) {
                throw new InvalidListingException("offerType: invalid value");
            }
        }
        if (req.status() != null) {
            try {
                Listing.Status s = Listing.Status.valueOf(req.status());
                if (s == Listing.Status.DELETED) {
                    throw new InvalidListingException("status: use DELETE to remove a listing");
                }
                listing.setStatus(s);
            } catch (IllegalArgumentException e) {
                throw new InvalidListingException("status: invalid value");
            }
        }
        return listing;
    }

    @Transactional
    public void softDelete(UUID listingId, User actor) {
        Listing listing = listings.findById(listingId).orElseThrow(ListingNotFoundException::new);
        if (!listing.getOwner().getId().equals(actor.getId())) {
            throw new ForbiddenException("You do not own this listing");
        }
        listing.setStatus(Listing.Status.DELETED);
    }

    @Transactional
    public ListingPhoto addPhoto(UUID listingId, User actor, byte[] bytes, String contentType, int position) {
        Listing listing = listings.findById(listingId).orElseThrow(ListingNotFoundException::new);
        if (!listing.getOwner().getId().equals(actor.getId())) {
            throw new ForbiddenException("You do not own this listing");
        }
        if (position != 0 && position != 1) {
            throw new InvalidListingException("position: must be 0 or 1");
        }
        if (bytes.length > ImageValidator.MAX_BYTES) {
            throw new InvalidListingException("File exceeds 2 MB limit");
        }
        ImageValidator.Kind kind = ImageValidator.detect(contentType, bytes);

        long existing = photos.countByListingId(listingId);
        if (existing >= 2) {
            throw new PhotoLimitReachedException("This listing already has 2 photos");
        }
        if (photos.existsByListingIdAndPosition(listingId, (short) position)) {
            throw new PhotoLimitReachedException("Position " + position + " is already occupied");
        }

        UUID photoId = UUID.randomUUID();
        String url;
        try {
            url = storage.save(photoId, ImageValidator.extensionFor(kind), bytes);
        } catch (IOException e) {
            throw new RuntimeException("Could not save photo", e);
        }
        ListingPhoto photo = new ListingPhoto(listing, url, position);
        // Persist with explicit id so storage filename matches DB id.
        return photos.save(photo);
    }

    @Transactional
    public void deletePhoto(UUID listingId, UUID photoId, User actor) {
        Listing listing = listings.findById(listingId).orElseThrow(ListingNotFoundException::new);
        if (!listing.getOwner().getId().equals(actor.getId())) {
            throw new ForbiddenException("You do not own this listing");
        }
        ListingPhoto photo = photos.findById(photoId).orElseThrow(ListingNotFoundException::new);
        if (!photo.getListing().getId().equals(listingId)) {
            throw new ListingNotFoundException();
        }
        storage.delete(photo.getUrl());
        listing.getPhotos().removeIf(p -> p.getId().equals(photo.getId()));
        photos.delete(photo);
        photos.flush();
    }
}
