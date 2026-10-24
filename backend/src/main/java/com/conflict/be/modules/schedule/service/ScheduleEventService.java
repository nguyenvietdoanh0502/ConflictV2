package com.conflict.be.modules.schedule.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.schedule.dto.CreateScheduleEventRequest;
import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
import com.conflict.be.modules.schedule.dto.UpdateScheduleEventRequest;
import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventSource;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleEventService {

    private final ScheduleEventRepository scheduleEventRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    private User requireActiveUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted() || user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    @Transactional(readOnly = true)
    public List<ScheduleEventResponse> getEvents(String userEmail, Instant from, Instant to) {
        User user = requireActiveUser(userEmail);

        Instant searchFrom = from != null ? from : Instant.now().minus(30, ChronoUnit.DAYS);
        Instant searchTo = to != null ? to : Instant.now().plus(60, ChronoUnit.DAYS);

        if (searchFrom.isAfter(searchTo)) {
            throw new AppException(ErrorCode.INVALID_SCHEDULE_TIME);
        }

        return scheduleEventRepository.findByUserIdAndDateRange(user.getId(), searchFrom, searchTo)
                .stream()
                .filter(event -> event.getStatus() != EventStatus.REJECTED)
                .map(ScheduleEventResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScheduleEventResponse getEventById(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);
        ScheduleEvent event = scheduleEventRepository.findByIdAndUserIdWithSubject(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_EVENT_NOT_FOUND));
        return ScheduleEventResponse.fromEntity(event);
    }

    @Transactional
    public ScheduleEventResponse createEvent(String userEmail, CreateScheduleEventRequest request) {
        User user = requireActiveUser(userEmail);

        if (request.getStartDatetime().isAfter(request.getEndDatetime())) {
            throw new AppException(ErrorCode.INVALID_SCHEDULE_TIME);
        }

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        }

        ScheduleEvent relatedEvent = null;
        if (request.getRelatedEventId() != null) {
            relatedEvent = scheduleEventRepository.findByIdAndUserId(request.getRelatedEventId(), user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_EVENT_NOT_FOUND));
        }

        ScheduleEvent event = ScheduleEvent.builder()
                .user(user)
                .subject(subject)
                .relatedEvent(relatedEvent)
                .title(request.getTitle().trim())
                .eventType(request.getEventType())
                .startDatetime(request.getStartDatetime())
                .endDatetime(request.getEndDatetime())
                .room(request.getRoom() != null ? request.getRoom().trim() : (subject != null ? subject.getDefaultRoom() : null))
                .source(EventSource.MANUAL)
                .status(EventStatus.CONFIRMED)
                .note(request.getNote())
                .build();

        ScheduleEvent saved = scheduleEventRepository.save(event);
        log.info("Created manual schedule event '{}' ({}) for user {}", saved.getTitle(), saved.getEventType(), user.getEmail());
        return ScheduleEventResponse.fromEntity(saved);
    }

    @Transactional
    public ScheduleEventResponse updateEvent(String userEmail, UUID id, UpdateScheduleEventRequest request) {
        User user = requireActiveUser(userEmail);

        ScheduleEvent event = scheduleEventRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_EVENT_NOT_FOUND));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            event.setTitle(request.getTitle().trim());
        }
        if (request.getEventType() != null) {
            event.setEventType(request.getEventType());
        }
        if (request.getStartDatetime() != null) {
            event.setStartDatetime(request.getStartDatetime());
        }
        if (request.getEndDatetime() != null) {
            event.setEndDatetime(request.getEndDatetime());
        }
        if (event.getStartDatetime().isAfter(event.getEndDatetime())) {
            throw new AppException(ErrorCode.INVALID_SCHEDULE_TIME);
        }

        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
            event.setSubject(subject);
        }
        if (request.getRoom() != null) {
            event.setRoom(request.getRoom().trim());
        }
        if (request.getStatus() != null) {
            event.setStatus(request.getStatus());
        }
        if (request.getNote() != null) {
            event.setNote(request.getNote());
        }

        ScheduleEvent updated = scheduleEventRepository.save(event);
        log.info("Updated schedule event '{}' (ID: {}) for user {}", updated.getTitle(), id, user.getEmail());
        return ScheduleEventResponse.fromEntity(updated);
    }

    @Transactional
    public ScheduleEventResponse confirmEvent(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);

        ScheduleEvent event = scheduleEventRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_EVENT_NOT_FOUND));

        event.setStatus(EventStatus.CONFIRMED);
        ScheduleEvent updated = scheduleEventRepository.save(event);
        log.info("Confirmed schedule event '{}' (ID: {}) for user {}", updated.getTitle(), id, user.getEmail());
        return ScheduleEventResponse.fromEntity(updated);
    }

    @Transactional
    public ScheduleEventResponse rejectEvent(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);

        ScheduleEvent event = scheduleEventRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_EVENT_NOT_FOUND));

        event.setStatus(EventStatus.REJECTED);
        ScheduleEvent updated = scheduleEventRepository.save(event);
        log.info("Rejected schedule event '{}' (ID: {}) for user {}", updated.getTitle(), id, user.getEmail());
        return ScheduleEventResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteEvent(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);

        ScheduleEvent event = scheduleEventRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_EVENT_NOT_FOUND));

        scheduleEventRepository.delete(event);
        log.info("Deleted schedule event '{}' (ID: {}) for user {}", event.getTitle(), id, user.getEmail());
    }
}
