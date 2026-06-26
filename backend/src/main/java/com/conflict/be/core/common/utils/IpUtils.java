package com.conflict.be.core.common.utils;

import jakarta.servlet.http.HttpServletRequest;

public class IpUtils {
    public static String getClientIpAddress(HttpServletRequest request) {
        String header = request.getHeader("X-Forwarded-For");
        if (header != null && !header.isEmpty() && !"unknown".equalsIgnoreCase(header)) {
            return header.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
