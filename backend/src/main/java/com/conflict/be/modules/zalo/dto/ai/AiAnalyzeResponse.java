package com.conflict.be.modules.zalo.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalyzeResponse {

    @JsonProperty("is_academic_announcement")
    private boolean academicAnnouncement;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @Builder.Default
    @JsonProperty("detected_events")
    private List<AiDetectedEvent> detectedEvents = new ArrayList<>();
}
