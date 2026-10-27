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
public class MemoryMatchPairDTO {
    @JsonProperty("pair_id")
    private Integer pairId;
    private String term;
    private String definition;
}
