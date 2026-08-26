package com.conflict.be.modules.friendship.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SendFriendRequest {
    @NotBlank(message = "MISSING_PIN_CODE")
    @Pattern(
            regexp = "(?i)^RML-\\d{6}$",
            message = "INVALID_PIN_CODE"
    )
    private String pinCode;
}
