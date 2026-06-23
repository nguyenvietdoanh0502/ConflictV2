package com.conflict.be.modules.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final String OTP_PREFIX = "otp:register:";
    private static final long OTP_TTL_MINUTES = 5;

    public String generateAndSaveOtp(String email) {
        // Generate a 6-digit OTP
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(otpNumber);

        // Save to Redis with 5 minutes TTL
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otpCode, Duration.ofMinutes(OTP_TTL_MINUTES));

        return otpCode;
    }

    public boolean verifyOtp(String email, String otpCode) {
        String savedOtp = redisTemplate.opsForValue().get(OTP_PREFIX + email);
        if (savedOtp != null && savedOtp.equals(otpCode)) {
            // Delete OTP after successful verification
            redisTemplate.delete(OTP_PREFIX + email);
            return true;
        }
        return false;
    }
}
