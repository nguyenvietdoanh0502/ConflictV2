package com.conflict.be.modules.auth.controller;

import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.modules.auth.dto.VerifyOtpRequest;
import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.auth.dto.AuthResponse;
import com.conflict.be.modules.auth.dto.RegisterRequest;
import com.conflict.be.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping(UrlConstant.Auth.REGISTER)
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("OTP has been sent to your email", null));
    }

    @PostMapping(UrlConstant.Auth.VERIFY_OTP)
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Verification successful", response));
    }
}
