package com.conflict.be.modules.schedule.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.schedule.dto.CreateScheduleEventRequest;
import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventSource;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduleEventServiceTest {

    @Mock
    private ScheduleEventRepository scheduleEventRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.conflict.be.modules.notification.service.NotificationService notificationService;

    @InjectMocks
    private ScheduleEventService scheduleEventService;

    private User testUser;
    private Subject testSubject;
    private ScheduleEvent testEvent;
    private UUID userId;
    private UUID subjectId;
    private UUID eventId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        subjectId = UUID.randomUUID();
        eventId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("student@unisync.edu.vn")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        testSubject = Subject.builder()
                .id(subjectId)
                .user(testUser)
                .name("Lập trình Web")
                .defaultRoom("401-A1")
                .build();

        testEvent = ScheduleEvent.builder()
                .id(eventId)
                .user(testUser)
                .subject(testSubject)
                .title("Học bù: Lập trình Web (Tiết 1-3)")
                .eventType(EventType.MAKEUP_CLASS)
                .startDatetime(Instant.now().plus(1, ChronoUnit.DAYS))
                .endDatetime(Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS))
                .room("305-A2")
                .source(EventSource.ZALO_AI)
                .status(EventStatus.PENDING_REVIEW)
                .build();
    }

    @Test
    @DisplayName("Nên lấy danh sách sự kiện trong khoảng thời gian")
    void shouldGetEventsInDateRange() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(scheduleEventRepository.findByUserIdAndDateRange(eq(userId), any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(testEvent));

        List<ScheduleEventResponse> responses = scheduleEventService.getEvents(testUser.getEmail(), null, null);

        assertEquals(1, responses.size());
        assertEquals("Học bù: Lập trình Web (Tiết 1-3)", responses.get(0).getTitle());
        assertEquals(EventType.MAKEUP_CLASS, responses.get(0).getEventType());
    }

    @Test
    @DisplayName("Nên tạo sự kiện thủ công thành công")
    void shouldCreateManualEventSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByIdAndUserId(subjectId, userId)).thenReturn(Optional.of(testSubject));
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(invocation -> {
            ScheduleEvent e = invocation.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        CreateScheduleEventRequest request = CreateScheduleEventRequest.builder()
                .subjectId(subjectId)
                .title("Kiểm tra 15p")
                .eventType(EventType.EXAM)
                .startDatetime(start)
                .endDatetime(end)
                .build();

        ScheduleEventResponse response = scheduleEventService.createEvent(testUser.getEmail(), request);

        assertNotNull(response);
        assertEquals("Kiểm tra 15p", response.getTitle());
        assertEquals(EventStatus.CONFIRMED, response.getStatus());
        assertEquals(EventSource.MANUAL, response.getSource());
    }

    @Test
    @DisplayName("Nên ném ngoại lệ khi thời gian bắt đầu sau thời gian kết thúc")
    void shouldThrowWhenStartTimeAfterEndTime() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.minus(2, ChronoUnit.HOURS);

        CreateScheduleEventRequest request = CreateScheduleEventRequest.builder()
                .title("Lỗi giờ")
                .eventType(EventType.REGULAR_CLASS)
                .startDatetime(start)
                .endDatetime(end)
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> scheduleEventService.createEvent(testUser.getEmail(), request));

        assertEquals(ErrorCode.INVALID_SCHEDULE_TIME, ex.getErrorCode());
    }

    @Test
    @DisplayName("Nên duyệt (confirm) sự kiện PENDING_REVIEW thành CONFIRMED")
    void shouldConfirmEventSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(scheduleEventRepository.findByIdAndUserId(eventId, userId)).thenReturn(Optional.of(testEvent));
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertEquals(EventStatus.PENDING_REVIEW, testEvent.getStatus());
        ScheduleEventResponse response = scheduleEventService.confirmEvent(testUser.getEmail(), eventId);

        assertEquals(EventStatus.CONFIRMED, response.getStatus());
    }

    @Test
    @DisplayName("Nên từ chối (reject) sự kiện học vụ")
    void shouldRejectEventSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(scheduleEventRepository.findByIdAndUserId(eventId, userId)).thenReturn(Optional.of(testEvent));
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ScheduleEventResponse response = scheduleEventService.rejectEvent(testUser.getEmail(), eventId);

        assertEquals(EventStatus.REJECTED, response.getStatus());
    }

    @Test
    @DisplayName("Nên khôi phục sự kiện về loại cũ và CONFIRMED khi từ chối thông báo nghỉ học")
    void shouldRevertCancelledEventToOriginalTypeWhenRejected() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        ScheduleEvent cancelPendingEvent = ScheduleEvent.builder()
                .id(eventId)
                .user(testUser)
                .subject(testSubject)
                .title("Lập trình Web")
                .originalEventType(EventType.REGULAR_CLASS)
                .eventType(EventType.CANCELLED_CLASS)
                .status(EventStatus.PENDING_REVIEW)
                .source(EventSource.ZALO_AI)
                .build();

        when(scheduleEventRepository.findByIdAndUserId(eventId, userId)).thenReturn(Optional.of(cancelPendingEvent));
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ScheduleEventResponse response = scheduleEventService.rejectEvent(testUser.getEmail(), eventId);

        assertEquals(EventType.REGULAR_CLASS, response.getEventType());
        assertEquals(EventStatus.CONFIRMED, response.getStatus());
        assertNull(cancelPendingEvent.getOriginalEventType());
    }

    @Test
    @DisplayName("Nên khôi phục phòng học cũ và CONFIRMED khi từ chối thông báo đổi phòng")
    void shouldRevertRoomChangeToOriginalRoomWhenRejected() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        ScheduleEvent roomPendingEvent = ScheduleEvent.builder()
                .id(eventId)
                .user(testUser)
                .subject(testSubject)
                .title("Lập trình Web")
                .room("502-A2")
                .originalRoom("401-A1")
                .eventType(EventType.REGULAR_CLASS)
                .status(EventStatus.PENDING_REVIEW)
                .source(EventSource.ZALO_AI)
                .build();

        when(scheduleEventRepository.findByIdAndUserId(eventId, userId)).thenReturn(Optional.of(roomPendingEvent));
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ScheduleEventResponse response = scheduleEventService.rejectEvent(testUser.getEmail(), eventId);

        assertEquals("401-A1", response.getRoom());
        assertEquals(EventStatus.CONFIRMED, response.getStatus());
        assertNull(roomPendingEvent.getOriginalRoom());
    }
}
