package com.conflict.be.modules.e2ee.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateE2eeKeyRequest {
    @NotBlank(message = "E2EE_INVALID_PUBLIC_KEY")
    @Size(max = 512, message = "E2EE_INVALID_PUBLIC_KEY")
    private String publicKey;

    @NotBlank(message = "E2EE_INVALID_KEY_BACKUP")
    @Size(max = 1024, message = "E2EE_INVALID_KEY_BACKUP")
    private String encryptedPrivateKey;

    @NotBlank(message = "E2EE_INVALID_KEY_BACKUP")
    @Size(max = 64, message = "E2EE_INVALID_KEY_BACKUP")
    private String kdfSalt;

    @NotNull(message = "E2EE_INVALID_KEY_BACKUP")
    @Min(value = 100000, message = "E2EE_INVALID_KEY_BACKUP")
    private Integer kdfIterations;

    @NotBlank(message = "E2EE_INVALID_KEY_BACKUP")
    @Size(max = 32, message = "E2EE_INVALID_KEY_BACKUP")
    private String wrapIv;

    // Required when replacing an existing active E2EE key
    private String currentPassword;
}

