package com.conflict.be.modules.zalo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZaloIncomingMessageDTO {

    @NotBlank(message = "zaloGroupId không được để trống")
    @JsonProperty("zalo_group_id")
    private String zaloGroupId;

    @JsonProperty("message_id")
    private String messageId;

    @JsonProperty("sender_name")
    private String senderName;

    @NotBlank(message = "messageText không được để trống")
    @JsonProperty("message_text")
    private String messageText;

    @JsonProperty("timestamp")
    private Instant timestamp;
}
