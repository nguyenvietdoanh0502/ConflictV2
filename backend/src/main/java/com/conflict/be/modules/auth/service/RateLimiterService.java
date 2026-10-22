package com.conflict.be.modules.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    public boolean isAllowed(String key, int maxRequests, Duration timeWindow) {
        Long currentCount = redisTemplate.opsForValue().increment(key);

        if (currentCount != null && currentCount == 1) {
            // Lần đầu tiên tạo key, set thời gian sống (TTL)
            redisTemplate.expire(key, timeWindow);
        }

        return currentCount != null && currentCount <= maxRequests;
    }

    public boolean isRegisterAllowed(String ipAddress) {
        String key = "rate_limit:register:" + ipAddress;
        return isAllowed(key, 5, Duration.ofHours(1));
    }

    public boolean isLoginIpAllowed(String ipAddress) {
        String key = "rate_limit:login_ip:" + ipAddress;
        return isAllowed(key, 10, Duration.ofMinutes(15));
    }


    public boolean isLoginEmailAllowed(String email) {
        String key = "failed:login:" + email;
        return isAllowed(key, 5, Duration.ofMinutes(15));
    }

    public void resetFailedLoginCount(String email) {
        String key = "failed:login:" + email;
        redisTemplate.delete(key);
    }

    public boolean isEmailLocked(String email) {
        String key = "failed:login:" + email;
        String countStr = redisTemplate.opsForValue().get(key);
        if (countStr != null) {
            int count = Integer.parseInt(countStr);
            return count > 5;
        }
        return false;
    }

    public boolean isForgotPasswordAllowed(String email) {
        String key = "rate_limit:forgot:" + email;
        return isAllowed(key, 3, Duration.ofHours(1));
    }
}
