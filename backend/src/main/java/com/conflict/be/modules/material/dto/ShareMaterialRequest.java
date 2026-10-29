package com.conflict.be.modules.material.dto;

import com.conflict.be.modules.material.enums.GameType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareMaterialRequest {

    @NotEmpty(message = "MISSING_RECIPIENT_ID")
    private List<UUID> recipientIds;

    @Builder.Default
    private String shareType = "SHARE_MATERIAL"; // SHARE_MATERIAL | CHALLENGE_GAME

    private GameType challengeGameType; // SPEED_QUIZ | MEMORY_MATCH

    private Integer challengerScore;

    private Integer challengerTimeSeconds;

    @Size(max = 2000, message = "MESSAGE_TOO_LONG")
    private String message;
}

