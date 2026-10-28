package com.conflict.be.modules.notification.controller;

import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.notification.dto.NotificationPageResponse;
import com.conflict.be.modules.notification.dto.NotificationResponse;
import com.conflict.be.modules.notification.dto.UnreadCountResponse;
import com.conflict.be.modules.notification.enums.NotificationType;
import com.conflict.be.modules.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationService notificationService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private NotificationController notificationController;

    private final String testEmail = "student@unisync.edu.vn";
    private final UUID testId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
        lenient().when(authentication.getName()).thenReturn(testEmail);
    }

    @Test
    void testGetNotifications() throws Exception {
        NotificationResponse item = NotificationResponse.builder()
                .id(testId)
                .type(NotificationType.NEW_SCHEDULE_EVENT)
                .title("Sự kiện TKB mới")
                .content("Học bù môn Web")
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        NotificationPageResponse page = NotificationPageResponse.builder()
                .items(List.of(item))
                .page(0)
                .size(20)
                .totalUnread(1)
                .hasMore(false)
                .build();

        when(notificationService.getNotifications(eq(testEmail), eq(0), eq(20), isNull())).thenReturn(page);

        mockMvc.perform(get("/api/v1" + UrlConstant.Notification.BASE)
                        .principal(authentication)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].title").value("Sự kiện TKB mới"))
                .andExpect(jsonPath("$.data.totalUnread").value(1));
    }

    @Test
    void testGetUnreadCount() throws Exception {
        when(notificationService.getUnreadCount(eq(testEmail))).thenReturn(new UnreadCountResponse(4L));

        mockMvc.perform(get("/api/v1" + UrlConstant.Notification.UNREAD_COUNT)
                        .principal(authentication)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(4));
    }

    @Test
    void testMarkAsRead() throws Exception {
        doNothing().when(notificationService).markAsRead(eq(testEmail), eq(testId));

        mockMvc.perform(patch("/api/v1/notifications/" + testId + "/read")
                        .principal(authentication)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Notification marked as read"));
    }

    @Test
    void testMarkAllAsRead() throws Exception {
        doNothing().when(notificationService).markAllAsRead(eq(testEmail));

        mockMvc.perform(post("/api/v1" + UrlConstant.Notification.READ_ALL)
                        .principal(authentication)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All notifications marked as read"));
    }

    @Test
    void testDeleteNotification() throws Exception {
        doNothing().when(notificationService).deleteNotification(eq(testEmail), eq(testId));

        mockMvc.perform(delete("/api/v1/notifications/" + testId)
                        .principal(authentication)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Notification deleted successfully"));
    }

    @Test
    void testTriggerTodaySchedule() throws Exception {
        NotificationResponse response = NotificationResponse.builder()
                .id(testId)
                .type(NotificationType.TODAY_SCHEDULE)
                .title("Lịch học hôm nay")
                .content("Hôm nay bạn có 1 buổi học")
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        when(notificationService.triggerTodaySchedule(eq(testEmail))).thenReturn(response);

        mockMvc.perform(post("/api/v1" + UrlConstant.Notification.TRIGGER_TODAY)
                        .principal(authentication)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.type").value("TODAY_SCHEDULE"));
    }
}
