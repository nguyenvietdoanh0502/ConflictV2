package com.conflict.be.modules.e2ee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyE2eeKeyDTO {
    private boolean hasKey;
    private Integer keyVersion;
    private String publicKey;
    private String encryptedPrivateKey;
    private String kdfSalt;
    private Integer kdfIterations;
    private String wrapIv;
}

