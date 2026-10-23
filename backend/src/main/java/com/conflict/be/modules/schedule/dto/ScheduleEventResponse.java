package com.conflict.be.modules.schedule.dto;

import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventSource;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleEventResponse {

    private UUID id;
    private UUID userId;
    private UUID subjectId;
    private String subjectName;
    private String subjectCode;
    private String subjectColorHex;
    private UUID relatedEventId;
    private String title;
    private EventType eventType;
    private Instant startDatetime;
    private Instant endDatetime;
    private String room;
    private EventSource source;
    private EventStatus status;
    private Double aiConfidence;
    private String note;
    private String rawZaloMessage;
    private String senderName;
    private String sourceMessageId;
    private Instant createdAt;
    private Instant updatedAt;

    public static ScheduleEventResponse fromEntity(ScheduleEvent event) {
        if (event == null) {
            return null;
        }
        return ScheduleEventResponse.builder()
                .id(event.getId())
                .userId(event.getUser() != null ? event.getUser().getId() : null)
                .subjectId(event.getSubject() != null ? event.getSubject().getId() : null)
                .subjectName(event.getSubject() != null ? event.getSubject().getName() : null)
                .subjectCode(event.getSubject() != null ? event.getSubject().getCode() : null)
                .subjectColorHex(event.getSubject() != null ? event.getSubject().getColorHex() : "#7C6EE6")
                .relatedEventId(event.getRelatedEvent() != null ? event.getRelatedEvent().getId() : null)
                .title(event.getTitle())
                .eventType(event.getEventType())
                .startDatetime(event.getStartDatetime())
                .endDatetime(event.getEndDatetime())
                .room(event.getRoom())
                .source(event.getSource())
                .status(event.getStatus())
                .aiConfidence(event.getAiConfidence())
                .note(event.getNote())
                .rawZaloMessage(event.getRawZaloMessage())
                .senderName(event.getSenderName())
                .sourceMessageId(event.getSourceMessageId())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
