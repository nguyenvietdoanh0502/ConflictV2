package com.conflict.be.modules.auth.controller;

import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.common.utils.IpUtils;
import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.auth.dto.*;
import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.auth.service.AuthService;
import com.conflict.be.modules.auth.service.RefreshTokenCookieService;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenCookieService refreshTokenCookieService;

    @PostMapping(UrlConstant.Auth.REGISTER)
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("OTP has been sent to your email", null));
    }

    @PostMapping(UrlConstant.Auth.REFRESH_TOKEN)
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(@CookieValue(name= "refresh_token", required = false)
                                                                          String refreshToken){
        if(refreshToken == null || refreshToken.isBlank()){
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        RefreshTokenResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshTokenCookieService.createRefreshCookie(response.getRefreshToken()).toString()
                ).body(ApiResponse.success(response));
    }
    @PostMapping(UrlConstant.Auth.LOGIN)
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request){
        String ipAddress = IpUtils.getClientIpAddress(request);
        AuthResponse response = authService.login(loginRequest,ipAddress);
        return ResponseEntity.ok().header(
                HttpHeaders.SET_COOKIE,
                refreshTokenCookieService.createRefreshCookie(response.getRefreshToken()).toString()
            ).body(ApiResponse.success("Login successful",response));
    }
    @PostMapping(UrlConstant.Auth.VERIFY_OTP)
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshTokenCookieService.createRefreshCookie(response.getRefreshToken()).toString()
                ).body(ApiResponse.success("Verification successful",response));
    }
    @PostMapping(UrlConstant.Auth.LOGOUT)
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request){
        authService.logout(request);
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        refreshTokenCookieService.deleteRefreshCookie().toString()
                ).body(ApiResponse.success("Logout successful",null));
    }
    @PostMapping(UrlConstant.Auth.CHANGE_PASSWORD)
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request){
        if(!Objects.equals(request.getConfirmNewPassword(), request.getNewPassword())){
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }
        if(Objects.equals(request.getOldPassword(), request.getNewPassword())){
            throw new AppException(ErrorCode.SAME_PASSWORD);
        }
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
    @PostMapping(UrlConstant.Auth.FORGOT_PASSWORD)
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request){
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("If the email is registered, you will receive an OTP code to reset your password.",null));
    }
    @PostMapping(UrlConstant.Auth.VERIFY_OTP_FORGOT_PASSWORD)
    public ResponseEntity<ApiResponse<VerifyOtpForgotPasswordResponse>> verifyOtpForgotPassword(@Valid @RequestBody VerifyOtpRequest request){
        VerifyOtpForgotPasswordResponse response = authService.verifyOtpForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Verification successful", response));
    }
    @PostMapping(UrlConstant.Auth.RESET_PASSWORD)
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request){
        if(!Objects.equals(request.getNewPassword(), request.getConfirmNewPassword())){
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Change password successful",null));
    }
}