package com.wendyapp.backend.offers;

import com.wendyapp.backend.domain.Deal;
import com.wendyapp.backend.domain.Offer;
import com.wendyapp.backend.domain.OfferRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.offers.dto.CreateOfferRequest;
import com.wendyapp.backend.offers.dto.DealDto;
import com.wendyapp.backend.offers.dto.OfferDto;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
public class OffersController {

    private final OfferService service;
    private final OfferRepository offers;

    public OffersController(OfferService service, OfferRepository offers) {
        this.service = service;
        this.offers = offers;
    }

    @PostMapping("/listings/{id}/offers")
    public ResponseEntity<OfferDto> create(@PathVariable("id") UUID listingId,
                                           @AuthenticationPrincipal User current,
                                           @Valid @RequestBody CreateOfferRequest req) {
        Offer offer = service.create(listingId, current, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(OfferDto.from(offer));
    }

    @GetMapping("/me/offers")
    public Map<String, Object> myOffers(@AuthenticationPrincipal User current,
                                        @RequestParam String direction,
                                        @RequestParam(required = false) Offer.Status status,
                                        @RequestParam(defaultValue = "20") int limit,
                                        @RequestParam(defaultValue = "0") int offset) {
        if (!"sent".equals(direction) && !"received".equals(direction)) {
            throw new InvalidOfferException("direction: must be sent or received");
        }
        var pageable = PageRequest.of(offset / Math.max(1, limit), limit);
        Page<Offer> page;
        if ("sent".equals(direction)) {
            page = (status == null)
                    ? offers.findByFromUserIdOrderByCreatedAtDesc(current.getId(), pageable)
                    : offers.findByFromUserIdAndStatusOrderByCreatedAtDesc(current.getId(), status, pageable);
        } else {
            page = (status == null)
                    ? offers.findByToUserIdOrderByCreatedAtDesc(current.getId(), pageable)
                    : offers.findByToUserIdAndStatusOrderByCreatedAtDesc(current.getId(), status, pageable);
        }
        return Map.of(
                "items", page.getContent().stream().map(OfferDto::from).toList(),
                "total", page.getTotalElements()
        );
    }

    @GetMapping("/offers/{id}")
    public OfferDto get(@PathVariable UUID id, @AuthenticationPrincipal User current) {
        return OfferDto.from(service.get(id, current));
    }

    @PostMapping("/offers/{id}/accept")
    public DealDto accept(@PathVariable UUID id, @AuthenticationPrincipal User current) {
        Deal deal = service.accept(id, current);
        return DealDto.from(deal);
    }

    @PostMapping("/offers/{id}/decline")
    public OfferDto decline(@PathVariable UUID id, @AuthenticationPrincipal User current) {
        return OfferDto.from(service.decline(id, current));
    }

    @PostMapping("/offers/{id}/withdraw")
    public OfferDto withdraw(@PathVariable UUID id, @AuthenticationPrincipal User current) {
        return OfferDto.from(service.withdraw(id, current));
    }
}
