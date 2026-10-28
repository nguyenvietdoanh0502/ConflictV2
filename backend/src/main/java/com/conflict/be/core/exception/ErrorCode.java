package com.conflict.be.core.exception;

import lombok.Getter;

@Getter
public enum ErrorCode {

    // ==========================================
    // SYSTEM & GENERIC ERRORS (500, 400 defaults)
    // ==========================================
    UNCATEGORIZED_EXCEPTION("UNCATEGORIZED_EXCEPTION", "Uncategorized exception", 500),
    INVALID_KEY("INVALID_KEY", "Uncategorized exception", 400),

    // ==========================================
    // AUTHENTICATION & AUTHORIZATION ERRORS
    // ==========================================
    UNAUTHENTICATED("UNAUTHENTICATED", "Unauthenticated", 401),
    UNAUTHORIZED("UNAUTHORIZED", "You do not have permission", 403),
    ACCOUNT_NOT_VERIFIED("ACCOUNT_NOT_VERIFIED","Account is not verified", 403),
    ACCOUNT_BANNED("ACCOUNT_BANNED","Account has been banned", 403),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS","Invalid credentials", 401),
    ACCOUNT_LOCKED("ACCOUNT_LOCKED","Your account has been locked, try again in 15 minutes", 423),
    INVALID_REFRESH_TOKEN("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token", 401),

    // ==========================================
    // VALIDATION & INPUT ERRORS (400)
    // ==========================================
    MISSING_EMAIL("MISSING_EMAIL", "Email is required", 400),
    INVALID_EMAIL("INVALID_EMAIL", "Email is not valid", 400),

    MISSING_PASSWORD("MISSING_PASSWORD", "Password is required", 400),
    INVALID_PASSWORD("INVALID_PASSWORD", "Password must be at least 8 characters", 400),
    WEAK_PASSWORD("WEAK_PASSWORD", "Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character", 400),

    MISSING_CONFIRM_PASSWORD("MISSING_CONFIRM_PASSWORD", "Confirm Password is required", 400),
    PASSWORD_MISMATCH("PASSWORD_MISMATCH", "Passwords do not match", 400),

    MISSING_FULL_NAME("MISSING_FULL_NAME", "Full name is required", 400),
    INVALID_FULL_NAME("INVALID_FULL_NAME", "Full name must be between 2 and 100 characters", 400),
    INVALID_DATE_OF_BIRTH("INVALID_DATE_OF_BIRTH", "Date of birth must be a valid date that is not in the future", 400),
    INVALID_ADDRESS("INVALID_ADDRESS", "Address must not exceed 255 characters", 400),
    INVALID_GENDER("INVALID_GENDER", "Gender must be MALE, FEMALE, or OTHER", 400),

    MISSING_OTP("MISSING_OTP", "OTP is required", 400),
    INVALID_OTP_FORMAT("INVALID_OTP_FORMAT", "OTP must be exactly 6 digits", 400),

    USERNAME_INVALID("USERNAME_INVALID", "Username must be at least 3 characters", 400),
    INVALID_DOB("INVALID_DOB", "Your age must be at least {min}", 400),

    // ==========================================
    // BUSINESS LOGIC ERRORS
    // ==========================================
    USER_EXISTED("USER_EXISTED", "User existed", 409),
    USER_NOT_EXISTED("USER_NOT_EXISTED", "User not existed", 404),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Resource not found", 404),
    CONCURRENCY_CONFLICT("CONCURRENCY_CONFLICT", "Resource is being processed by another user", 409),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "Rate limit exceeded", 429),

    // ==========================================
    // PASSWORD MANAGEMENT ERRORS
    // ==========================================
    OTP_EXPIRED_OR_INVALID("OTP_EXPIRED_OR_INVALID", "OTP code has expired or is invalid", 400),
    OTP_INVALID("OTP_INVALID", "Invalid OTP code", 400),
    INVALID_OLD_PASSWORD("INVALID_OLD_PASSWORD", "Current password is incorrect", 400),
    MISSING_RESET_TOKEN("MISSING_RESET_TOKEN", "Reset token is required", 400),
    SAME_PASSWORD("SAME_PASSWORD", "New password must be different from current password", 400),
    INVALID_AVATAR_FILE(
        "INVALID_AVATAR_FILE",
                "Avatar must be a JPEG, PNG, or WebP image",
                400
    ),

    AVATAR_TOO_LARGE(
        "AVATAR_TOO_LARGE",
                "Avatar must not exceed 5 MB",
                413
    ),

    AVATAR_UPLOAD_FAILED(
        "AVATAR_UPLOAD_FAILED",
                "Unable to upload avatar",
                500
    ),

    AVATAR_DELETE_FAILED(
        "AVATAR_DELETE_FAILED",
                "Unable to delete old avatar",
                500
    ),

    // ==========================================
    // FRIENDSHIP ERRORS
    // ==========================================
    MISSING_PIN_CODE(
            "MISSING_PIN_CODE",
            "PIN code is required",
            400
    ),

    INVALID_PIN_CODE(
            "INVALID_PIN_CODE",
            "PIN code is invalid",
            400
    ),

    PIN_CODE_NOT_FOUND(
            "PIN_CODE_NOT_FOUND",
            "User was not found",
            404
    ),

    CANNOT_FRIEND_SELF(
            "CANNOT_FRIEND_SELF",
            "You cannot add yourself as a friend",
            400
    ),

    FRIEND_REQUEST_ALREADY_SENT(
            "FRIEND_REQUEST_ALREADY_SENT",
            "Friend request has already been sent",
            409
    ),

    FRIEND_REQUEST_ALREADY_RECEIVED(
            "FRIEND_REQUEST_ALREADY_RECEIVED",
            "This user has already sent you a friend request",
            409
    ),

    FRIEND_REQUEST_ALREADY_EXISTS(
            "FRIEND_REQUEST_ALREADY_EXISTS",
            "A friend request already exists",
            409
    ),

    ALREADY_FRIENDS(
            "ALREADY_FRIENDS",
            "Users are already friends",
            409
    ),

    FRIEND_REQUEST_NOT_FOUND(
            "FRIEND_REQUEST_NOT_FOUND",
            "Friend request was not found",
            404
    ),

    INVALID_FRIEND_REQUEST_STATE(
            "INVALID_FRIEND_REQUEST_STATE",
            "Friend request is not in a valid state",
            409
    ),

    FRIEND_REQUEST_FORBIDDEN(
            "FRIEND_REQUEST_FORBIDDEN",
            "You cannot perform this action",
            403
    ),

    FRIENDSHIP_NOT_FOUND(
            "FRIENDSHIP_NOT_FOUND",
            "Friendship was not found",
            404
    ),

    FRIENDSHIP_FORBIDDEN(
            "FRIENDSHIP_FORBIDDEN",
            "You are not a member of this friendship",
            403
    ),
    MISSING_RECIPIENT_ID(
            "MISSING_RECIPIENT_ID",
            "Recipient is required",
            400
    ),
    MISSING_MESSAGE_CONTENT(
            "MISSING_MESSAGE_CONTENT",
            "Message content is required",
            400
    ),
    MESSAGE_TOO_LONG(
            "MESSAGE_TOO_LONG",
            "Message must not exceed 2000 characters",
            400
    ),
    CHAT_RECIPIENT_NOT_FOUND(
            "CHAT_RECIPIENT_NOT_FOUND",
            "Recipient was not found",
            404
    ),
    CANNOT_MESSAGE_SELF(
            "CANNOT_MESSAGE_SELF",
            "You cannot message yourself",
            400
    ),
    NOT_FRIENDS(
            "NOT_FRIENDS",
            "Users are not friends",
            403
    ),
    INVALID_PAGINATION(
            "INVALID_PAGINATION",
            "Invalid pagination parameters",
            400
    ),

    // ==========================================
    // SUBJECT & TIMETABLE ERRORS
    // ==========================================
    SUBJECT_NOT_FOUND("SUBJECT_NOT_FOUND", "Subject was not found", 404),
    SUBJECT_FORBIDDEN("SUBJECT_FORBIDDEN", "You do not have permission to access this subject", 403),
    SUBJECT_ALREADY_EXISTS("SUBJECT_ALREADY_EXISTS", "Subject already exists with this name or code", 409),

    // ==========================================
    // ZALO GROUP MAPPING ERRORS
    // ==========================================
    ZALO_MAPPING_NOT_FOUND("ZALO_MAPPING_NOT_FOUND", "Zalo group mapping was not found", 404),
    ZALO_MAPPING_FORBIDDEN("ZALO_MAPPING_FORBIDDEN", "You do not have permission to access this mapping", 403),
    ZALO_MAPPING_ALREADY_EXISTS("ZALO_MAPPING_ALREADY_EXISTS", "Group mapping already exists for this group", 409),

    // ==========================================
    // SCHEDULE EVENT ERRORS
    // ==========================================
    SCHEDULE_EVENT_NOT_FOUND("SCHEDULE_EVENT_NOT_FOUND", "Schedule event was not found", 404),
    SCHEDULE_EVENT_FORBIDDEN("SCHEDULE_EVENT_FORBIDDEN", "You do not have permission to access this schedule event", 403),
    INVALID_SCHEDULE_TIME("INVALID_SCHEDULE_TIME", "End time must be after or equal to start time", 400),
    AI_SERVICE_UNAVAILABLE("AI_SERVICE_UNAVAILABLE", "AI processing service is temporarily unavailable", 503),

    // ==========================================
    // STUDY MATERIAL & MINIGAME ERRORS
    // ==========================================
    MATERIAL_NOT_FOUND("MATERIAL_NOT_FOUND", "Study material was not found", 404),
    MATERIAL_FORBIDDEN("MATERIAL_FORBIDDEN", "You do not have permission to access this material", 403),
    INVALID_MATERIAL_FILE("INVALID_MATERIAL_FILE", "Only PDF, DOCX, and TXT files under 20MB are supported", 400),
    MATERIAL_PARSE_FAILED("MATERIAL_PARSE_FAILED", "Could not extract text from document (file may be empty or scanned images)", 422),
    MATERIAL_PROCESSING_FAILED("MATERIAL_PROCESSING_FAILED", "Failed to generate study materials via AI", 500),
    INVALID_GAME_TYPE("INVALID_GAME_TYPE", "Game type must be SPEED_QUIZ or MEMORY_MATCH", 400),

    // ==========================================
    // NOTIFICATION ERRORS
    // ==========================================
    NOTIFICATION_NOT_FOUND("NOTIFICATION_NOT_FOUND", "Notification was not found", 404),
    NOTIFICATION_FORBIDDEN("NOTIFICATION_FORBIDDEN", "You do not have permission to access this notification", 403);

    private final String code;
    private final String message;
    private final int httpStatus;

    ErrorCode(String code, String message, int httpStatus) {
        this.code = code;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}
