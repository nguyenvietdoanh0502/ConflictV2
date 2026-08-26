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

}
