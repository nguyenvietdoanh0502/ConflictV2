package com.conflict.be.modules.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RefreshTokenCookieService {
    private static final String REFRESH_TOKEN = "refresh_token";

    @Value("${conflict.auth.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${conflict.auth.cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${conflict.jwt.refresh-token-expiration}")
    private long refreshExpiration;

    public ResponseCookie createRefreshCookie(String token){
        return ResponseCookie.from(REFRESH_TOKEN,token).
                httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/v1/auth")
                .maxAge(Duration.ofMillis(refreshExpiration))
                .build();
    }
    public ResponseCookie deleteRefreshCookie(){
        return ResponseCookie.from(REFRESH_TOKEN,"")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path("/api/v1/auth")
                .maxAge(Duration.ZERO)
                .build();
    }
}
