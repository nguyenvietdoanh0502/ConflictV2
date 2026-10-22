package com.conflict.be.modules.auth.dto;

import com.conflict.be.modules.user.dto.UserDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private UserDTO user;
    private String accessToken;
    @JsonIgnore
    private String refreshToken;
    private long expiresIn;
}
