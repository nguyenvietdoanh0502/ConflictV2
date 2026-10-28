package com.conflict.be.modules.zalo.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeGroupDTO;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeStatusDTO;
import com.conflict.be.modules.zalo.service.ZaloBridgeProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class ZaloBridgeProxyController {

    private final ZaloBridgeProxyService proxyService;

    @GetMapping(UrlConstant.Zalo.BRIDGE_STATUS)
    public ResponseEntity<ApiResponse<ZaloBridgeStatusDTO>> getStatus(Authentication authentication) {
        ZaloBridgeStatusDTO status = proxyService.getStatus(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @PostMapping(UrlConstant.Zalo.BRIDGE_QR_GENERATE)
    public ResponseEntity<ApiResponse<ZaloBridgeStatusDTO>> generateQr(Authentication authentication) {
        ZaloBridgeStatusDTO status = proxyService.generateQr(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đang tạo mã QR Zalo mới...", status));
    }

    @PostMapping(UrlConstant.Zalo.BRIDGE_LOGOUT)
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        proxyService.logout(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã đăng xuất tài khoản Zalo thành công", null));
    }

    @GetMapping(UrlConstant.Zalo.BRIDGE_GROUPS)
    public ResponseEntity<ApiResponse<List<ZaloBridgeGroupDTO>>> getGroups(Authentication authentication) {
        List<ZaloBridgeGroupDTO> groups = proxyService.getGroups(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    @PostMapping(UrlConstant.Zalo.BRIDGE_GROUPS_REFRESH)
    public ResponseEntity<ApiResponse<List<ZaloBridgeGroupDTO>>> refreshGroups(Authentication authentication) {
        List<ZaloBridgeGroupDTO> groups = proxyService.refreshGroups(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Đã làm mới danh sách nhóm Zalo", groups));
    }
}

