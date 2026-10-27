package com.conflict.be.modules.material.dto;

import com.conflict.be.modules.material.enums.GameType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitScoreRequest {
    @NotNull(message = "INVALID_GAME_TYPE")
    private GameType gameType;

    @Min(value = 0, message = "INVALID_INPUT")
    private int score;

    @Min(value = 0, message = "INVALID_INPUT")
    private int timeTakenSeconds;

    private Double accuracyRate;
}
