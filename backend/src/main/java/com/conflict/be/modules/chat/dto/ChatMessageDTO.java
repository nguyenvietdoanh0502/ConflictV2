package com.conflict.be.modules.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ChatMessageDTO {
    private UUID id;
    private UUID senderId;
    private UUID recipientId;
    private String content;
    private Instant createdAt;

}
