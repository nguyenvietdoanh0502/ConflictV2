package com.conflict.be.core.security;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Service
public class JwtProvider {
    private final UserDetailsService userDetailsService;

    @Value("${conflict.jwt.secret}")
    private String secretKey;

    @Value("${conflict.jwt.access-token-expiration}")
    private long jwtExpiration;

    @Value("${conflict.jwt.refresh-token-expiration}")
    private long refreshExpiration;

    @Value("${conflict.jwt.reset-password-expiration}")
    private long resetExpiration;

    public JwtProvider(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractJwtId(String token) {
        return extractClaim(token, Claims::getId);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return buildToken(Map.of("tokenType","access"),userDetails,jwtExpiration);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(Map.of("tokenType","refresh"), userDetails, refreshExpiration);
    }

    public String generateResetPasswordToken(UserDetails userDetails) {
        return buildToken(Map.of("tokenType", "reset_password"), userDetails, resetExpiration);
    }

    public UserDetails validateRefreshToken(String refreshToken){
        String email = extractUsername(refreshToken);
        if(email==null){
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String tokenType = extractClaim(refreshToken,claims -> claims.get("tokenType",String.class));
        if(!"refresh".equals(tokenType)||isTokenExpired(refreshToken)){
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        return userDetails;
    }
    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}