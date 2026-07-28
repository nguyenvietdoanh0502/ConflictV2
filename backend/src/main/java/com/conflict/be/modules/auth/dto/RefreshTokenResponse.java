package com.conflict.be.modules.auth.dto;


import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RefreshTokenResponse {
    private String accessToken;
    @JsonIgnore
    private String refreshToken;
    private long expiresIn;
}
