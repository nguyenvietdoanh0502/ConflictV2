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
}
