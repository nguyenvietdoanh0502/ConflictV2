package com.conflict.be.core.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {

    // ==========================================
    // SYSTEM & GENERIC ERRORS (500, 400 defaults)
    // ==========================================
    UNCATEGORIZED_EXCEPTION("UNCATEGORIZED_EXCEPTION", "Uncategorized exception"),
    INVALID_KEY("INVALID_KEY", "Uncategorized exception"),

    // ==========================================
    // AUTHENTICATION & AUTHORIZATION ERRORS (401, 403)
    // ==========================================
    UNAUTHENTICATED("UNAUTHENTICATED", "Unauthenticated"),
    UNAUTHORIZED("UNAUTHORIZED", "You do not have permission"),

    // ==========================================
    // VALIDATION & INPUT ERRORS (400)
    // Format: MISSING_*, INVALID_*, *_MISMATCH
    // ==========================================
    MISSING_EMAIL("MISSING_EMAIL", "Email is required"),
    INVALID_EMAIL("INVALID_EMAIL", "Email is not valid"),
    
    MISSING_PASSWORD("MISSING_PASSWORD", "Password is required"),
    INVALID_PASSWORD("INVALID_PASSWORD", "Password must be at least 8 characters"),
    WEAK_PASSWORD("WEAK_PASSWORD", "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    
    MISSING_CONFIRM_PASSWORD("MISSING_CONFIRM_PASSWORD", "Confirm Password is required"),
    PASSWORD_MISMATCH("PASSWORD_MISMATCH", "Passwords do not match"),
    
    MISSING_FULL_NAME("MISSING_FULL_NAME", "Full name is required"),
    INVALID_FULL_NAME("INVALID_FULL_NAME", "Full name must be between 2 and 100 characters"),

    MISSING_OTP("MISSING_OTP", "OTP is required"),
    INVALID_OTP_FORMAT("INVALID_OTP_FORMAT", "OTP must be exactly 6 digits"),
    
    USERNAME_INVALID("USERNAME_INVALID", "Username must be at least 3 characters"),
    INVALID_DOB("INVALID_DOB", "Your age must be at least {min}"),

    // ==========================================
    // BUSINESS LOGIC ERRORS (400, 404, 409, 429)
    // ==========================================
    USER_EXISTED("USER_EXISTED", "User existed"),
    USER_NOT_EXISTED("USER_NOT_EXISTED", "User not existed"),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Resource not found"),
    CONCURRENCY_CONFLICT("CONCURRENCY_CONFLICT", "Resource is being processed by another user"),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "Rate limit exceeded");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
