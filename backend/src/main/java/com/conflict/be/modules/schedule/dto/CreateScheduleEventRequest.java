package com.conflict.be.modules.schedule.dto;

import com.conflict.be.modules.schedule.enums.EventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateScheduleEventRequest {

    private UUID subjectId;

    private UUID relatedEventId;

    @NotBlank(message = "Tiêu đề sự kiện không được để trống")
    @Size(max = 255, message = "Tiêu đề không quá 255 ký tự")
    private String title;

    @NotNull(message = "Loại sự kiện không được để trống")
    private EventType eventType;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private Instant startDatetime;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private Instant endDatetime;

    @Size(max = 100, message = "Phòng học không quá 100 ký tự")
    private String room;

    private String note;
}
