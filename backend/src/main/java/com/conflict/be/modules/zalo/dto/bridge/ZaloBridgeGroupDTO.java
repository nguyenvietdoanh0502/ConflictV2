package com.conflict.be.modules.zalo.dto.bridge;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ZaloBridgeGroupDTO {
    private String id;
    private String name;
    private Integer memberCount;
    private boolean active;
    private String avatar;
}

