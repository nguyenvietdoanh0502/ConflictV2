package com.conflict.be.modules.material.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSummarizeResponse {
    @JsonProperty("summary_markdown")
    private String summaryMarkdown;

    @JsonProperty("extracted_text")
    private String extractedText;
}
