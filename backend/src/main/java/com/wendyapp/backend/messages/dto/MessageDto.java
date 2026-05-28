package com.wendyapp.backend.messages.dto;

import com.wendyapp.backend.domain.Message;
import com.wendyapp.backend.listings.dto.UserSummaryDto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MessageDto(
        UUID id,
        UUID offerId,
        UserSummaryDto sender,
        String body,
        OffsetDateTime createdAt
) {
    public static MessageDto from(Message m) {
        return new MessageDto(
                m.getId(),
                m.getOffer().getId(),
                UserSummaryDto.from(m.getSender()),
                m.getBody(),
                m.getCreatedAt()
        );
    }
}
