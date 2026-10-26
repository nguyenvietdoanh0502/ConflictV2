package com.conflict.be.modules.zalo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.AssertTrue;
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

    @JsonProperty("message_text")
    private String messageText;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("image_base64")
    private String imageBase64;

    @JsonProperty("image_mime_type")
    private String imageMimeType;

    @JsonProperty("current_datetime")
    private Instant currentDatetime;

    @JsonProperty("student_name")
    private String studentName;

    @AssertTrue(message = "Phải cung cấp message_text hoặc hình ảnh (image_base64/image_url)")
    public boolean hasContent() {
        return (messageText != null && !messageText.isBlank())
                || (imageBase64 != null && !imageBase64.isBlank())
                || (imageUrl != null && !imageUrl.isBlank());
    }
}
