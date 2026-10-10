package com.conflict.be.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    @NotNull(message = "MISSING_RECIPIENT_ID")
    private UUID recipientId;
    @NotBlank(message = "MISSING_MESSAGE_CONTENT")
    @Size(max = 2000,message = "MESSAGE_TOO_LONG")
    private String content;
}
