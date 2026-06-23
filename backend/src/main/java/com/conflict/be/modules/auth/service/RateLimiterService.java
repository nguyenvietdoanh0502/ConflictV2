package com.conflict.be.modules.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final StringRedisTemplate redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "rate_limit:register:";
    private static final long TIME_WINDOW_HOURS = 1;
    private static final int MAX_REQUESTS_PER_WINDOW = 5;

    public boolean isAllowed(String ipAddress) {
        String key = RATE_LIMIT_PREFIX + ipAddress;
        Long currentCount = redisTemplate.opsForValue().increment(key);
        
        if (currentCount != null && currentCount == 1) {
            // First time this key is created, set expiration
            redisTemplate.expire(key, Duration.ofHours(TIME_WINDOW_HOURS));
        }

        return currentCount != null && currentCount <= MAX_REQUESTS_PER_WINDOW;
    }
}
