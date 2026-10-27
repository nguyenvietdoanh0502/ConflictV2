package com.conflict.be.modules.material.dto;

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
public class LeaderboardEntryDTO {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String avatarUrl;
    private int score;
    private int timeTakenSeconds;
    private Double accuracyRate;
    private Instant playedAt;
    private int rank;
}
