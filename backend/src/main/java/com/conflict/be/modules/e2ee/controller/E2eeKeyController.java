package com.conflict.be.modules.e2ee.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.e2ee.dto.CreateE2eeKeyRequest;
import com.conflict.be.modules.e2ee.dto.MyE2eeKeyDTO;
import com.conflict.be.modules.e2ee.dto.PublicKeyDTO;
import com.conflict.be.modules.e2ee.dto.UpdateKeyBackupRequest;
import com.conflict.be.modules.e2ee.service.E2eeKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class E2eeKeyController {
    private final E2eeKeyService e2eeKeyService;

    @GetMapping(UrlConstant.E2ee.MY_KEY)
    public ResponseEntity<ApiResponse<MyE2eeKeyDTO>> getMyKey(Authentication authentication) {
        MyE2eeKeyDTO result = e2eeKeyService.getMyKey(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping(UrlConstant.E2ee.KEYS)
    public ResponseEntity<ApiResponse<MyE2eeKeyDTO>> createKey(
            Authentication authentication,
            @Valid @RequestBody CreateE2eeKeyRequest request
    ) {
        MyE2eeKeyDTO result = e2eeKeyService.createKey(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping(UrlConstant.E2ee.MY_KEY_BACKUP)
    public ResponseEntity<ApiResponse<MyE2eeKeyDTO>> updateKeyBackup(
            Authentication authentication,
            @Valid @RequestBody UpdateKeyBackupRequest request
    ) {
        MyE2eeKeyDTO result = e2eeKeyService.updateBackup(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping(UrlConstant.E2ee.USER_KEYS)
    public ResponseEntity<ApiResponse<List<PublicKeyDTO>>> getUserPublicKeys(
            Authentication authentication,
            @PathVariable UUID userId
    ) {
        List<PublicKeyDTO> result = e2eeKeyService.getPublicKeys(authentication.getName(), userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}

