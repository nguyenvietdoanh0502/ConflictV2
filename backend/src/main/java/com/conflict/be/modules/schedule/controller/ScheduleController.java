package com.conflict.be.modules.schedule.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.schedule.dto.CreateScheduleEventRequest;
import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
import com.conflict.be.modules.schedule.dto.UpdateScheduleEventRequest;
import com.conflict.be.modules.schedule.service.ScheduleEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleEventService scheduleEventService;

    @GetMapping(UrlConstant.Schedule.EVENTS)
    public ResponseEntity<ApiResponse<List<ScheduleEventResponse>>> getEvents(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        List<ScheduleEventResponse> events = scheduleEventService.getEvents(authentication.getName(), from, to);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping(UrlConstant.Schedule.EVENT_BY_ID)
    public ResponseEntity<ApiResponse<ScheduleEventResponse>> getEventById(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        ScheduleEventResponse response = scheduleEventService.getEventById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(UrlConstant.Schedule.EVENTS)
    public ResponseEntity<ApiResponse<ScheduleEventResponse>> createEvent(
            Authentication authentication,
            @Valid @RequestBody CreateScheduleEventRequest request
    ) {
        ScheduleEventResponse response = scheduleEventService.createEvent(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Event created successfully", response));
    }

    @PutMapping(UrlConstant.Schedule.EVENT_BY_ID)
    public ResponseEntity<ApiResponse<ScheduleEventResponse>> updateEvent(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateScheduleEventRequest request
    ) {
        ScheduleEventResponse response = scheduleEventService.updateEvent(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", response));
    }

    @PostMapping(UrlConstant.Schedule.CONFIRM_EVENT)
    public ResponseEntity<ApiResponse<ScheduleEventResponse>> confirmEvent(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        ScheduleEventResponse response = scheduleEventService.confirmEvent(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Event confirmed successfully", response));
    }

    @PostMapping(UrlConstant.Schedule.REJECT_EVENT)
    public ResponseEntity<ApiResponse<ScheduleEventResponse>> rejectEvent(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        ScheduleEventResponse response = scheduleEventService.rejectEvent(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Event rejected successfully", response));
    }

    @DeleteMapping(UrlConstant.Schedule.EVENT_BY_ID)
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        scheduleEventService.deleteEvent(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Event deleted successfully", null));
    }
}
