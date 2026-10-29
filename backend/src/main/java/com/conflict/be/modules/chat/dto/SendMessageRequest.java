package com.conflict.be.modules.chat.dto;

import com.conflict.be.modules.material.enums.GameType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull(message = "MISSING_RECIPIENT_ID")
    private UUID recipientId;

    @Size(max = 2000, message = "MESSAGE_TOO_LONG")
    private String content;

    private UUID sharedMaterialId;

    private String messageType; // TEXT | SHARE_MATERIAL | CHALLENGE_GAME

    private GameType challengeGameType; // SPEED_QUIZ | MEMORY_MATCH

    private Integer challengerScore;

    private Integer challengerTimeSeconds;
}
