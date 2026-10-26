package com.conflict.be.modules.zalo.dto;

import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleNotificationDTO {

    private String type; // e.g. "SCHEDULE_UPDATED"
    private String message;
    private String zaloGroupName;
    private String subjectName;
    private List<ScheduleEventResponse> events;
    private Instant timestamp;
}
