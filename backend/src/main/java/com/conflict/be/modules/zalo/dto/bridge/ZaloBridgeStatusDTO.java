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
public class ZaloBridgeStatusDTO {
    private String userId;
    private boolean connected;
    private boolean initialized;
    private int groupCount;
    private ZaloBridgeUserDTO user;
    private String qrCode;
    private String qrStatus;
    private ZaloBridgeUserDTO scannedUser;
    private boolean hasSavedSession;
    private String backendUrl;
    private String timestamp;
}

