package com.conflict.be.modules.zalo.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.zalo.dto.ZaloGroupMappingRequest;
import com.conflict.be.modules.zalo.dto.ZaloGroupMappingResponse;
import com.conflict.be.modules.zalo.service.ZaloMappingService;
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
public class ZaloMappingController {

    private final ZaloMappingService zaloMappingService;

    @GetMapping(UrlConstant.Zalo.MAPPINGS)
    public ResponseEntity<ApiResponse<List<ZaloGroupMappingResponse>>> getMyMappings(
            Authentication authentication
    ) {
        List<ZaloGroupMappingResponse> mappings = zaloMappingService.getMyMappings(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(mappings));
    }

    @PostMapping(UrlConstant.Zalo.MAPPINGS)
    public ResponseEntity<ApiResponse<ZaloGroupMappingResponse>> createMapping(
            Authentication authentication,
            @Valid @RequestBody ZaloGroupMappingRequest request
    ) {
        ZaloGroupMappingResponse response = zaloMappingService.createMapping(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Group mapping created successfully", response));
    }

    @PatchMapping(UrlConstant.Zalo.MAPPING_TOGGLE)
    public ResponseEntity<ApiResponse<ZaloGroupMappingResponse>> toggleActive(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        ZaloGroupMappingResponse response = zaloMappingService.toggleActive(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Toggled group mapping status", response));
    }

    @DeleteMapping(UrlConstant.Zalo.MAPPING_BY_ID)
    public ResponseEntity<ApiResponse<Void>> deleteMapping(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        zaloMappingService.deleteMapping(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Group mapping deleted successfully", null));
    }
}
