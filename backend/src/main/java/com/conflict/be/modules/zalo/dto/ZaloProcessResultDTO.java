package com.conflict.be.modules.zalo.dto;

import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZaloProcessResultDTO {

    private String zaloGroupId;
    private boolean matchedFilter;
    private int matchedMappings;
    private int eventsCreated;
    private String statusMessage;

    @Builder.Default
    private List<ScheduleEventResponse> createdEvents = new ArrayList<>();
}
