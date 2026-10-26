package com.conflict.be.core.constant;

public class UrlConstant {

    public static final String API_V1 = "/api/v1";

    public static class Auth {
        public static final String REGISTER = "/auth/register";
        public static final String VERIFY_OTP = "/auth/verify-otp";
        public static final String LOGIN = "/auth/login";
        public static final String REFRESH_TOKEN = "/auth/refresh-token";
        public static final String LOGOUT = "/auth/logout";
        public static final String CHANGE_PASSWORD = "/auth/change-password";
        public static final String FORGOT_PASSWORD = "/auth/forgot-password";
        public static final String VERIFY_OTP_FORGOT_PASSWORD = "/auth/verify-otp-forgot-password";
        public static final String RESET_PASSWORD = "/auth/reset-password";
    }
    public static class User{
        public static final String ME = "/users/me";
        public static final String UPDATE_PROFILE = "/user/update-profile";
    }
    public static class Friendship {
        public static final String FRIENDS = "/friends";
        public static final String REQUESTS = "/friends/requests";
        public static final String INCOMING = "/friends/requests/incoming";
        public static final String OUTGOING = "/friends/requests/outgoing";
    }
    public static class Chat{
        public static final String HISTORY = "/chat/{friendUserId}/messages";
    }

    public static class Subject {
        public static final String BASE = "/subjects";
        public static final String BY_ID = "/subjects/{id}";
    }

    public static class Zalo {
        public static final String MAPPINGS = "/zalo/mappings";
        public static final String MAPPING_BY_ID = "/zalo/mappings/{id}";
        public static final String MAPPING_TOGGLE = "/zalo/mappings/{id}/toggle";
        public static final String SIMULATE = "/zalo/simulate";
        public static final String INTERNAL_MESSAGES = "/internal/zalo/messages";
        public static final String MOCK_WEBHOOK = "/webhook/mock-zalo";
    }

    public static class Schedule {
        public static final String EVENTS = "/schedule/events";
        public static final String EVENT_BY_ID = "/schedule/events/{id}";
        public static final String CONFIRM_EVENT = "/schedule/events/{id}/confirm";
        public static final String REJECT_EVENT = "/schedule/events/{id}/reject";
    }
}
