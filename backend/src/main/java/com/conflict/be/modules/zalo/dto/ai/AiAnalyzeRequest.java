package com.conflict.be.modules.zalo.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalyzeRequest {

    @JsonProperty("current_datetime")
    private String currentDatetime;

    @JsonProperty("subject_name")
    private String subjectName;

    @JsonProperty("default_room")
    private String defaultRoom;

    @JsonProperty("sender_name")
    private String senderName;

    @JsonProperty("message_text")
    private String messageText;

    @JsonProperty("image_url")
    private String imageUrl;

    @JsonProperty("image_base64")
    private String imageBase64;

    @JsonProperty("image_mime_type")
    private String imageMimeType;

    @JsonProperty("student_name")
    private String studentName;
}
