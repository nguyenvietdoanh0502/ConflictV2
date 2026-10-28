package com.conflict.be.modules.notification.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.notification.dto.NotificationPageResponse;
import com.conflict.be.modules.notification.dto.NotificationResponse;
import com.conflict.be.modules.notification.dto.UnreadCountResponse;
import com.conflict.be.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping(UrlConstant.Notification.BASE)
    public ResponseEntity<ApiResponse<NotificationPageResponse>> getNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean unreadOnly
    ) {
        NotificationPageResponse response = notificationService.getNotifications(
                authentication.getName(), page, size, unreadOnly
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(UrlConstant.Notification.UNREAD_COUNT)
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(
            Authentication authentication
    ) {
        UnreadCountResponse response = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping(UrlConstant.Notification.READ)
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        notificationService.markAsRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @PostMapping(UrlConstant.Notification.READ_ALL)
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            Authentication authentication
    ) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping(UrlConstant.Notification.BY_ID)
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        notificationService.deleteNotification(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }

    @PostMapping(UrlConstant.Notification.TRIGGER_TODAY)
    public ResponseEntity<ApiResponse<NotificationResponse>> triggerTodaySchedule(
            Authentication authentication
    ) {
        NotificationResponse response = notificationService.triggerTodaySchedule(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Today's schedule notification generated", response));
    }
}
