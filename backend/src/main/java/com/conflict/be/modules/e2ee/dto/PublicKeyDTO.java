package com.conflict.be.modules.e2ee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicKeyDTO {
    private UUID userId;
    private Integer keyVersion;
    private String publicKey;
    private boolean active;
}

