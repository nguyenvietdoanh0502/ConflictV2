package com.conflict.be.modules.notification.service;

import com.conflict.be.modules.notification.dto.NotificationPageResponse;
import com.conflict.be.modules.notification.dto.NotificationResponse;
import com.conflict.be.modules.notification.dto.UnreadCountResponse;
import com.conflict.be.modules.notification.entity.Notification;
import com.conflict.be.modules.notification.enums.NotificationType;
import com.conflict.be.modules.notification.repository.NotificationRepository;
import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.SliceImpl;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ScheduleEventRepository scheduleEventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;
    private UUID userId;
    private UUID notificationId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        notificationId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("student@unisync.edu.vn")
                .fullName("Sinh viên Test")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        testNotification = Notification.builder()
                .id(notificationId)
                .user(testUser)
                .type(NotificationType.NEW_SCHEDULE_EVENT)
                .title("Sự kiện TKB mới")
                .content("Lớp học bù Lập trình Web")
                .link("/timetable")
                .isRead(false)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void testGetNotifications_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(notificationRepository.existsByUserIdAndTypeAndCreatedAtGreaterThanEqual(eq(userId), eq(NotificationType.TODAY_SCHEDULE), any()))
                .thenReturn(true);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(userId), any(Pageable.class)))
                .thenReturn(new SliceImpl<>(List.of(testNotification)));
        when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(1L);

        NotificationPageResponse response = notificationService.getNotifications(testUser.getEmail(), 0, 10, false);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals(1L, response.getTotalUnread());
        assertEquals(testNotification.getTitle(), response.getItems().get(0).getTitle());
    }

    @Test
    void testGetUnreadCount_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(5L);

        UnreadCountResponse response = notificationService.getUnreadCount(testUser.getEmail());

        assertNotNull(response);
        assertEquals(5L, response.getUnreadCount());
    }

    @Test
    void testMarkAsRead_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(notificationRepository.markAsRead(eq(notificationId), eq(userId), any())).thenReturn(1);

        assertDoesNotThrow(() -> notificationService.markAsRead(testUser.getEmail(), notificationId));
        verify(notificationRepository).markAsRead(eq(notificationId), eq(userId), any());
    }

    @Test
    void testMarkAllAsRead_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(notificationRepository.markAllAsRead(eq(userId), any())).thenReturn(3);

        assertDoesNotThrow(() -> notificationService.markAllAsRead(testUser.getEmail()));
        verify(notificationRepository).markAllAsRead(eq(userId), any());
    }

    @Test
    void testDeleteNotification_Success() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(notificationRepository.findByIdAndUserId(notificationId, userId)).thenReturn(Optional.of(testNotification));

        assertDoesNotThrow(() -> notificationService.deleteNotification(testUser.getEmail(), notificationId));
        verify(notificationRepository).delete(testNotification);
    }

    @Test
    void testCreateAndSendNotification_Success() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(notificationId);
            return n;
        });

        NotificationResponse response = notificationService.createAndSendNotification(
                testUser,
                NotificationType.NEW_MESSAGE,
                "Nguyễn Văn A",
                "Chào bạn nhé",
                "/friends",
                "{}"
        );

        assertNotNull(response);
        assertEquals("Nguyễn Văn A", response.getTitle());
        verify(messagingTemplate).convertAndSendToUser(eq(testUser.getEmail()), eq("/queue/notifications"), any());
    }

    @Test
    void testTriggerTodaySchedule_WithEvents() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        ScheduleEvent event = ScheduleEvent.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .title("Lập trình Web")
                .eventType(EventType.REGULAR_CLASS)
                .status(EventStatus.CONFIRMED)
                .room("402-A1")
                .startDatetime(Instant.now())
                .endDatetime(Instant.now().plusSeconds(7200))
                .build();

        when(scheduleEventRepository.findByUserIdAndDateRange(eq(userId), any(), any()))
                .thenReturn(List.of(event));

        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        NotificationResponse response = notificationService.triggerTodaySchedule(testUser.getEmail());

        assertNotNull(response);
        assertEquals(NotificationType.TODAY_SCHEDULE, response.getType());
        assertTrue(response.getContent().contains("Lập trình Web"));
    }
}
