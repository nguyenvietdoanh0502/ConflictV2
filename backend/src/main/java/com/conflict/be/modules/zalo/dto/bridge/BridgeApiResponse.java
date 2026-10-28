package com.conflict.be.modules.zalo.dto.bridge;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BridgeApiResponse<T> {
    private boolean success;
    private String message;
    private Integer total;
    private T data;
}

