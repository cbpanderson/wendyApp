package com.wendyapp.backend.deals;

import com.wendyapp.backend.domain.Deal;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.offers.dto.DealDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class DealController {

    private final DealService service;

    public DealController(DealService service) {
        this.service = service;
    }

    @GetMapping("/me/deals")
    public Map<String, Object> myDeals(@AuthenticationPrincipal User current) {
        List<DealDto> items = service.getMyDeals(current.getId())
                .stream()
                .map(DealDto::from)
                .toList();
        return Map.of("items", items, "total", items.size());
    }

    @GetMapping("/deals/{id}")
    public DealDto getDeal(@PathVariable UUID id, @AuthenticationPrincipal User current) {
        Deal deal = service.getDeal(id, current.getId());
        return DealDto.from(deal);
    }

    @PostMapping("/deals/{id}/mark-complete")
    public DealDto markComplete(@PathVariable UUID id, @AuthenticationPrincipal User current) {
        Deal deal = service.markComplete(id, current.getId());
        return DealDto.from(deal);
    }

    @PostMapping("/deals/{id}/cancel")
    public DealDto cancel(@PathVariable UUID id, @AuthenticationPrincipal User current) {
        Deal deal = service.cancel(id, current.getId());
        return DealDto.from(deal);
    }
}
