package com.wendyapp.backend.deals;

import com.wendyapp.backend.domain.Deal;
import com.wendyapp.backend.domain.DealRepository;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.listings.ForbiddenException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DealService {

    private final DealRepository deals;

    public DealService(DealRepository deals) {
        this.deals = deals;
    }

    @Transactional(readOnly = true)
    public List<Deal> getMyDeals(UUID userId) {
        return deals.findByParticipantAIdOrParticipantBId(userId, userId);
    }

    @Transactional(readOnly = true)
    public Deal getDeal(UUID dealId, UUID callerId) {
        Deal deal = deals.findById(dealId).orElseThrow(DealNotFoundException::new);
        if (!deal.getParticipantA().getId().equals(callerId)
                && !deal.getParticipantB().getId().equals(callerId)) {
            throw new ForbiddenException("You are not a participant in this deal");
        }
        return deal;
    }

    @Transactional
    public Deal markComplete(UUID dealId, UUID callerId) {
        Deal deal = deals.findById(dealId).orElseThrow(DealNotFoundException::new);

        boolean isA = deal.getParticipantA().getId().equals(callerId);
        boolean isB = deal.getParticipantB().getId().equals(callerId);
        if (!isA && !isB) {
            throw new ForbiddenException("You are not a participant in this deal");
        }

        Deal.Status current = deal.getStatus();
        if (current == Deal.Status.COMPLETED || current == Deal.Status.CANCELLED) {
            throw new InvalidDealException("Deal cannot be marked complete in state: " + current.name());
        }

        // Check if caller already marked
        if (isA && current == Deal.Status.COMPLETED_BY_A) {
            throw new InvalidDealException("Already marked complete");
        }
        if (isB && current == Deal.Status.COMPLETED_BY_B) {
            throw new InvalidDealException("Already marked complete");
        }

        // Transitions
        if (isA) {
            if (current == Deal.Status.ACCEPTED) {
                deal.setStatus(Deal.Status.COMPLETED_BY_A);
            } else if (current == Deal.Status.COMPLETED_BY_B) {
                deal.setStatus(Deal.Status.COMPLETED);
                deal.setCompletedAt(OffsetDateTime.now());
            }
        } else {
            if (current == Deal.Status.ACCEPTED) {
                deal.setStatus(Deal.Status.COMPLETED_BY_B);
            } else if (current == Deal.Status.COMPLETED_BY_A) {
                deal.setStatus(Deal.Status.COMPLETED);
                deal.setCompletedAt(OffsetDateTime.now());
            }
        }

        return deals.save(deal);
    }

    @Transactional
    public Deal cancel(UUID dealId, UUID callerId) {
        Deal deal = deals.findById(dealId).orElseThrow(DealNotFoundException::new);

        if (!deal.getParticipantA().getId().equals(callerId)
                && !deal.getParticipantB().getId().equals(callerId)) {
            throw new ForbiddenException("You are not a participant in this deal");
        }

        Deal.Status current = deal.getStatus();
        if (current == Deal.Status.COMPLETED) {
            throw new InvalidDealException("Cannot cancel a completed deal");
        }
        if (current == Deal.Status.CANCELLED) {
            throw new InvalidDealException("Deal is already cancelled");
        }

        deal.setStatus(Deal.Status.CANCELLED);
        deal.setCancelledAt(OffsetDateTime.now());
        deal.setCancelledByUserId(callerId);
        return deals.save(deal);
    }
}
