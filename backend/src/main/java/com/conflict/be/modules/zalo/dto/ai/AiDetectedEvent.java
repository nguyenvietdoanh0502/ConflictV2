package com.conflict.be.modules.zalo.dto.ai;

import com.conflict.be.modules.schedule.enums.EventType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDetectedEvent {

    @JsonProperty("event_type")
    private EventType eventType;

    @JsonProperty("title")
    private String title;

    @JsonProperty("start_datetime")
    private Instant startDatetime;

    @JsonProperty("end_datetime")
    private Instant endDatetime;

    @JsonProperty("room")
    private String room;

    @JsonProperty("note")
    private String note;
}
