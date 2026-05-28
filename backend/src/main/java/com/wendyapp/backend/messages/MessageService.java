package com.wendyapp.backend.messages;

import com.wendyapp.backend.domain.*;
import com.wendyapp.backend.listings.ForbiddenException;
import com.wendyapp.backend.offers.OfferNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MessageService {

    private final OfferRepository offers;
    private final MessageRepository messages;

    public MessageService(OfferRepository offers, MessageRepository messages) {
        this.offers = offers;
        this.messages = messages;
    }

    private Offer findAndAuthorize(UUID offerId, User actor) {
        Offer offer = offers.findById(offerId).orElseThrow(OfferNotFoundException::new);
        boolean isParticipant = offer.getFromUser().getId().equals(actor.getId())
                || offer.getToUser().getId().equals(actor.getId());
        if (!isParticipant) {
            throw new ForbiddenException("You are not a participant in this offer");
        }
        return offer;
    }

    @Transactional(readOnly = true)
    public List<Message> getMessages(UUID offerId, User actor) {
        findAndAuthorize(offerId, actor);
        return messages.findByOfferIdOrderByCreatedAtAsc(offerId);
    }

    @Transactional
    public Message send(UUID offerId, User actor, String body) {
        Offer offer = findAndAuthorize(offerId, actor);
        Message message = new Message(offer, actor, body);
        return messages.save(message);
    }
}
