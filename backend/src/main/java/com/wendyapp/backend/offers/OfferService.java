package com.wendyapp.backend.offers;

import com.wendyapp.backend.domain.*;
import com.wendyapp.backend.listings.ForbiddenException;
import com.wendyapp.backend.listings.ListingNotFoundException;
import com.wendyapp.backend.offers.dto.CreateOfferRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class OfferService {

    private final OfferRepository offers;
    private final ListingRepository listings;
    private final DealRepository deals;

    public OfferService(OfferRepository offers, ListingRepository listings, DealRepository deals) {
        this.offers = offers;
        this.listings = listings;
        this.deals = deals;
    }

    @Transactional
    public Offer create(UUID listingId, User actor, CreateOfferRequest req) {
        Listing target = listings.findById(listingId).orElseThrow(ListingNotFoundException::new);
        if (target.getStatus() != Listing.Status.ACTIVE) {
            throw new ListingNotFoundException();
        }

        Offer.Type type;
        try {
            type = Offer.Type.valueOf(req.offerType());
        } catch (IllegalArgumentException e) {
            throw new InvalidOfferException("offerType: must be TRADE or GIFT_REQUEST");
        }

        if (target.getOwner().getId().equals(actor.getId())) {
            throw new ForbiddenException("You cannot make an offer on your own listing");
        }

        Listing offered = null;
        if (type == Offer.Type.TRADE) {
            if (req.offeredListingId() == null) {
                throw new InvalidOfferException("offeredListingId: required for TRADE offers");
            }
            if (target.getOfferType() == Listing.OfferType.GIFT_ONLY) {
                throw new ForbiddenException("This listing does not accept trade offers");
            }
            offered = listings.findById(req.offeredListingId())
                    .orElseThrow(() -> new InvalidOfferException("offeredListingId: not found"));
            if (!offered.getOwner().getId().equals(actor.getId())) {
                throw new ForbiddenException("You can only offer listings you own");
            }
            if (offered.getStatus() != Listing.Status.ACTIVE) {
                throw new InvalidOfferException("offeredListingId: listing is not active");
            }
        } else {
            if (req.offeredListingId() != null) {
                throw new InvalidOfferException("offeredListingId: must be null for GIFT_REQUEST");
            }
            if (target.getOfferType() == Listing.OfferType.TRADE_ONLY) {
                throw new ForbiddenException("This listing does not accept gift requests");
            }
        }

        if (offers.existsByFromUserIdAndListingIdAndStatus(
                actor.getId(), target.getId(), Offer.Status.PENDING)) {
            throw new OfferConflictException("You already have a pending offer on this listing");
        }

        Offer offer = new Offer(target, actor, target.getOwner(), type, offered, req.message());
        return offers.save(offer);
    }

    @Transactional(readOnly = true)
    public Offer get(UUID offerId, User actor) {
        Offer offer = offers.findById(offerId).orElseThrow(OfferNotFoundException::new);
        if (!offer.getFromUser().getId().equals(actor.getId())
                && !offer.getToUser().getId().equals(actor.getId())) {
            throw new ForbiddenException("You are not a participant in this offer");
        }
        return offer;
    }

    @Transactional
    public Deal accept(UUID offerId, User actor) {
        Offer offer = offers.findById(offerId).orElseThrow(OfferNotFoundException::new);
        if (!offer.getToUser().getId().equals(actor.getId())) {
            throw new ForbiddenException("Only the listing owner can accept this offer");
        }
        if (offer.getStatus() != Offer.Status.PENDING) {
            throw new OfferConflictException("Offer is not in PENDING status");
        }
        offer.setStatus(Offer.Status.ACCEPTED);
        offer.setRespondedAt(OffsetDateTime.now());

        // Auto-decline sibling pending offers on same listing
        var siblings = offers.findByListingIdAndStatus(offer.getListing().getId(), Offer.Status.PENDING);
        OffsetDateTime now = OffsetDateTime.now();
        for (Offer s : siblings) {
            if (!s.getId().equals(offer.getId())) {
                s.setStatus(Offer.Status.DECLINED);
                s.setRespondedAt(now);
            }
        }

        Deal.Type dealType = offer.getOfferType() == Offer.Type.TRADE ? Deal.Type.TRADE : Deal.Type.GIFT;
        Deal deal = new Deal(offer, dealType,
                offer.getToUser(), offer.getFromUser(),
                offer.getListing(), offer.getOfferedListing());
        return deals.save(deal);
    }

    @Transactional
    public Offer decline(UUID offerId, User actor) {
        Offer offer = offers.findById(offerId).orElseThrow(OfferNotFoundException::new);
        if (!offer.getToUser().getId().equals(actor.getId())) {
            throw new ForbiddenException("Only the listing owner can decline this offer");
        }
        if (offer.getStatus() != Offer.Status.PENDING) {
            throw new OfferConflictException("Offer is not in PENDING status");
        }
        offer.setStatus(Offer.Status.DECLINED);
        offer.setRespondedAt(OffsetDateTime.now());
        return offer;
    }

    @Transactional
    public Offer withdraw(UUID offerId, User actor) {
        Offer offer = offers.findById(offerId).orElseThrow(OfferNotFoundException::new);
        if (!offer.getFromUser().getId().equals(actor.getId())) {
            throw new ForbiddenException("Only the offerer can withdraw this offer");
        }
        if (offer.getStatus() != Offer.Status.PENDING) {
            throw new OfferConflictException("Offer is not in PENDING status");
        }
        offer.setStatus(Offer.Status.WITHDRAWN);
        offer.setRespondedAt(OffsetDateTime.now());
        return offer;
    }
}
