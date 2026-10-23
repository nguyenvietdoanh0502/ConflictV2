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
public class ZaloSimulateRequest {

    @JsonProperty("zalo_group_id")
    private String zaloGroupId;

    @Builder.Default
    @JsonProperty("sender_name")
    private String senderName = "Lớp trưởng";

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @JsonProperty("message_text")
    private String messageText;

    @JsonProperty("current_datetime")
    private Instant currentDatetime;
}
