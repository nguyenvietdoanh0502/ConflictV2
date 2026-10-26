package com.conflict.be.modules.subject.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventSource;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.subject.dto.SubjectRequest;
import com.conflict.be.modules.subject.dto.SubjectResponse;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final ScheduleEventRepository scheduleEventRepository;
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
    public List<SubjectResponse> getMySubjects(String userEmail) {
        User user = requireActiveUser(userEmail);
        return subjectRepository.findByUserIdOrderByNameAsc(user.getId())
                .stream()
                .map(SubjectResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);
        Subject subject = subjectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));
        return SubjectResponse.fromEntity(subject);
    }

    @Transactional
    public SubjectResponse createSubject(String userEmail, SubjectRequest request) {
        User user = requireActiveUser(userEmail);

        if (subjectRepository.existsByUserIdAndNameIgnoreCase(user.getId(), request.getName().trim())) {
            throw new AppException(ErrorCode.SUBJECT_ALREADY_EXISTS);
        }

        Subject subject = Subject.builder()
                .user(user)
                .name(request.getName().trim())
                .code(request.getCode() != null ? request.getCode().trim() : null)
                .lecturer(request.getLecturer() != null ? request.getLecturer().trim() : null)
                .defaultRoom(request.getDefaultRoom() != null ? request.getDefaultRoom().trim() : null)
                .colorHex(request.getColorHex() != null && !request.getColorHex().isBlank() ? request.getColorHex() : "#7C6EE6")
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .semester(request.getSemester() != null ? request.getSemester().trim() : null)
                .semesterStartDate(request.getSemesterStartDate())
                .semesterEndDate(request.getSemesterEndDate())
                .build();

        Subject saved = subjectRepository.save(subject);
        log.info("Created subject '{}' (ID: {}) for user {}", saved.getName(), saved.getId(), user.getEmail());

        // Automatically generate recurring schedule events on the timetable
        generateRecurringScheduleEvents(user, saved);

        return SubjectResponse.fromEntity(saved);
    }

    private void generateRecurringScheduleEvents(User user, Subject subject) {
        if (subject.getDayOfWeek() == null
                || subject.getStartTime() == null
                || subject.getEndTime() == null
                || subject.getSemesterStartDate() == null
                || subject.getSemesterEndDate() == null) {
            return;
        }

        if (subject.getSemesterStartDate().isAfter(subject.getSemesterEndDate())) {
            log.warn("Cannot generate events: start date {} is after end date {}",
                    subject.getSemesterStartDate(), subject.getSemesterEndDate());
            return;
        }

        DayOfWeek targetDay;
        try {
            targetDay = DayOfWeek.of(subject.getDayOfWeek());
        } catch (DateTimeException e) {
            log.warn("Invalid dayOfWeek: {}", subject.getDayOfWeek());
            return;
        }

        // Align by weeks: from the week of semesterStartDate to the week of semesterEndDate
        LocalDate startWeekMonday = subject.getSemesterStartDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endWeekMonday = subject.getSemesterEndDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        if (startWeekMonday.isAfter(endWeekMonday)) {
            return;
        }

        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        List<ScheduleEvent> events = new ArrayList<>();
        LocalDate currentWeekMonday = startWeekMonday;

        while (!currentWeekMonday.isAfter(endWeekMonday)) {
            LocalDate eventDate = currentWeekMonday.plusDays(targetDay.getValue() - 1);

            Instant startInstant = eventDate.atTime(subject.getStartTime()).atZone(zone).toInstant();
            Instant endInstant = eventDate.atTime(subject.getEndTime()).atZone(zone).toInstant();

            ScheduleEvent event = ScheduleEvent.builder()
                    .user(user)
                    .subject(subject)
                    .title(subject.getName())
                    .eventType(EventType.REGULAR_CLASS)
                    .startDatetime(startInstant)
                    .endDatetime(endInstant)
                    .room(subject.getDefaultRoom())
                    .source(EventSource.MANUAL)
                    .status(EventStatus.CONFIRMED)
                    .build();

            events.add(event);
            currentWeekMonday = currentWeekMonday.plusWeeks(1);
        }

        if (!events.isEmpty()) {
            scheduleEventRepository.saveAll(events);
            log.info("Generated {} recurring schedule events for subject '{}'", events.size(), subject.getName());
        }
    }

    @Transactional
    public SubjectResponse updateSubject(String userEmail, UUID id, SubjectRequest request) {
        User user = requireActiveUser(userEmail);

        Subject subject = subjectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));

        if (!subject.getName().equalsIgnoreCase(request.getName().trim())
                && subjectRepository.existsByUserIdAndNameIgnoreCase(user.getId(), request.getName().trim())) {
            throw new AppException(ErrorCode.SUBJECT_ALREADY_EXISTS);
        }

        subject.setName(request.getName().trim());
        subject.setCode(request.getCode() != null ? request.getCode().trim() : null);
        subject.setLecturer(request.getLecturer() != null ? request.getLecturer().trim() : null);
        subject.setDefaultRoom(request.getDefaultRoom() != null ? request.getDefaultRoom().trim() : null);
        if (request.getColorHex() != null && !request.getColorHex().isBlank()) {
            subject.setColorHex(request.getColorHex());
        }
        subject.setDayOfWeek(request.getDayOfWeek());
        subject.setStartTime(request.getStartTime());
        subject.setEndTime(request.getEndTime());
        subject.setSemester(request.getSemester() != null ? request.getSemester().trim() : null);
        subject.setSemesterStartDate(request.getSemesterStartDate());
        subject.setSemesterEndDate(request.getSemesterEndDate());

        Subject updated = subjectRepository.save(subject);
        log.info("Updated subject '{}' (ID: {}) for user {}", updated.getName(), updated.getId(), user.getEmail());
        return SubjectResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteSubject(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);
        Subject subject = subjectRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));

        List<ScheduleEvent> events = scheduleEventRepository.findBySubjectId(subject.getId());
        if (events != null && !events.isEmpty()) {
            scheduleEventRepository.deleteAll(events);
        }

        subjectRepository.delete(subject);
        log.info("Deleted subject '{}' (ID: {}) for user {}", subject.getName(), id, user.getEmail());
    }
}
