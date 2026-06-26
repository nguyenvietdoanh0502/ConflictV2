package com.conflict.be.modules.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VerifyOtpForgotPasswordResponse {
    private String resetToken;
}
