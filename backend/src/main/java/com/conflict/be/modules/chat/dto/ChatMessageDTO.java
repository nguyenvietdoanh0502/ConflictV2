package com.conflict.be.modules.chat.dto;

import com.conflict.be.modules.material.dto.SharedMaterialPreviewDTO;
import com.conflict.be.modules.material.enums.GameType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private UUID id;
    private UUID senderId;
    private UUID recipientId;
    private String content;
    private String messageType;
    private GameType challengeGameType;
    private Integer challengerScore;
    private Integer challengerTimeSeconds;
    private SharedMaterialPreviewDTO sharedMaterial;
    private Instant createdAt;
}
