package com.wendyapp.backend.messages;

import com.wendyapp.backend.domain.Message;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.messages.dto.MessageDto;
import com.wendyapp.backend.messages.dto.SendMessageRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class MessageController {

    private final MessageService service;

    public MessageController(MessageService service) {
        this.service = service;
    }

    @GetMapping("/offers/{offerId}/messages")
    public Map<String, Object> getMessages(@PathVariable UUID offerId,
                                           @AuthenticationPrincipal User current) {
        List<MessageDto> items = service.getMessages(offerId, current)
                .stream()
                .map(MessageDto::from)
                .toList();
        return Map.of("items", items, "total", items.size());
    }

    @PostMapping("/offers/{offerId}/messages")
    public ResponseEntity<MessageDto> sendMessage(@PathVariable UUID offerId,
                                                  @AuthenticationPrincipal User current,
                                                  @Valid @RequestBody SendMessageRequest req) {
        Message message = service.send(offerId, current, req.body());
        return ResponseEntity.status(HttpStatus.CREATED).body(MessageDto.from(message));
    }
}
