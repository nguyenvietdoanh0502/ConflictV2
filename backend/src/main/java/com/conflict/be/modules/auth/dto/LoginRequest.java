package com.conflict.be.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class LoginRequest {
    @NotBlank(message = "MISSING_EMAIL")
    @Email(message = "INVALID_EMAIL")
    private String email;

    @NotBlank(message = "MISSING_PASSWORD")
    private String password;
}
