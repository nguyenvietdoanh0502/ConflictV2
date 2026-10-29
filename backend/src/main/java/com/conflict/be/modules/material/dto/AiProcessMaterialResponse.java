package com.conflict.be.modules.material.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiProcessMaterialResponse {
    @JsonProperty("summary_markdown")
    private String summaryMarkdown;

    @JsonProperty("extracted_text")
    private String extractedText;

    @JsonProperty("speed_quiz")
    private List<QuizQuestionDTO> speedQuiz;

    @JsonProperty("memory_match_pairs")
    private List<MemoryMatchPairDTO> memoryMatchPairs;
}
