package com.conflict.be.core.common.utils;

import jakarta.servlet.http.HttpServletRequest;

public class IpUtils {
    public static String getClientIpAddress(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && !"unknown".equalsIgnoreCase(realIp)) {
            return realIp.trim();
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank() && !"unknown".equalsIgnoreCase(forwardedFor)) {
            String[] parts = forwardedFor.split(",");
            return parts[parts.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
