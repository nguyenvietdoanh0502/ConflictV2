package com.conflict.be.modules.schedule.dto;

import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import jakarta.validation.constraints.Size;
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
public class UpdateScheduleEventRequest {

    private UUID subjectId;

    @Size(max = 255, message = "Tiêu đề không quá 255 ký tự")
    private String title;

    private EventType eventType;

    private Instant startDatetime;

    private Instant endDatetime;

    @Size(max = 100, message = "Phòng học không quá 100 ký tự")
    private String room;

    private EventStatus status;

    private String note;
}
