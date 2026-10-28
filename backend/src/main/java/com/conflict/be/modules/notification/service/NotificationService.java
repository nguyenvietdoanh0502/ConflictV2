package com.conflict.be.modules.notification.service;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm").withZone(VN_ZONE);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(VN_ZONE);

    private final NotificationRepository notificationRepository;
    private final ScheduleEventRepository scheduleEventRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private User requireActiveUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted() || user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    @Transactional
    public NotificationPageResponse getNotifications(String userEmail, int page, int size, Boolean unreadOnly) {
        if (page < 0 || size < 1 || size > 50) {
            throw new AppException(ErrorCode.INVALID_PAGINATION);
        }

        User user = requireActiveUser(userEmail);

        // Kiểm tra và sinh tóm tắt lịch học hôm nay nếu chưa có
        try {
            checkAndGenerateTodayScheduleBriefing(user, false);
        } catch (Exception ex) {
            log.warn("Could not check/generate daily schedule notification for user {}: {}", user.getEmail(), ex.getMessage());
        }

        Pageable pageable = PageRequest.of(page, size);
        Slice<Notification> slice = Boolean.TRUE.equals(unreadOnly)
                ? notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(user.getId(), false, pageable)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);

        List<NotificationResponse> items = slice.getContent()
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());

        return NotificationPageResponse.builder()
                .items(items)
                .page(page)
                .size(size)
                .totalUnread(unreadCount)
                .hasMore(slice.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String userEmail) {
        User user = requireActiveUser(userEmail);
        long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public void markAsRead(String userEmail, UUID notificationId) {
        User user = requireActiveUser(userEmail);
        int updated = notificationRepository.markAsRead(notificationId, user.getId(), Instant.now());
        if (updated == 0) {
            throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = requireActiveUser(userEmail);
        notificationRepository.markAllAsRead(user.getId(), Instant.now());
    }

    @Transactional
    public void deleteNotification(String userEmail, UUID notificationId) {
        User user = requireActiveUser(userEmail);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        notificationRepository.delete(notification);
    }

    @Transactional
    public NotificationResponse createAndSendNotification(
            User recipient,
            NotificationType type,
            String title,
            String content,
            String link,
            String metadata
    ) {
        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .title(title)
                .content(content)
                .link(link)
                .metadata(metadata)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.fromEntity(saved);

        // Bắn WebSocket Real-time tới /user/queue/notifications
        try {
            ApiResponse<NotificationResponse> event = ApiResponse.success(response);
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/notifications",
                    event
            );
            log.info("Pushed real-time notification [{}] to user {}", type, recipient.getEmail());
        } catch (Exception ex) {
            log.warn("Failed to push real-time notification to user {}: {}", recipient.getEmail(), ex.getMessage());
        }

        return response;
    }

    @Transactional
    public NotificationResponse triggerTodaySchedule(String userEmail) {
        User user = requireActiveUser(userEmail);
        return checkAndGenerateTodayScheduleBriefing(user, true);
    }

    @Transactional
    public NotificationResponse checkAndGenerateTodayScheduleBriefing(User user, boolean force) {
        LocalDate today = LocalDate.now(VN_ZONE);
        Instant startOfDay = today.atStartOfDay(VN_ZONE).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(VN_ZONE).toInstant();

        if (!force && notificationRepository.existsByUserIdAndTypeAndCreatedAtGreaterThanEqual(
                user.getId(), NotificationType.TODAY_SCHEDULE, startOfDay)) {
            return null; // Đã gửi trong ngày hôm nay rồi
        }

        List<ScheduleEvent> todayEvents = scheduleEventRepository.findByUserIdAndDateRange(
                user.getId(), startOfDay, endOfDay
        ).stream()
                .filter(e -> e.getStatus() != EventStatus.REJECTED && e.getEventType() != EventType.CANCELLED_CLASS)
                .toList();

        String title = "Lịch học hôm nay (" + DATE_FMT.format(startOfDay) + ")";
        String content;
        String metadata;

        if (todayEvents.isEmpty()) {
            content = "Hôm nay bạn không có lịch học nào trong thời khóa biểu. Hãy dành thời gian ôn tập nhé!";
            metadata = "{\"eventCount\":0}";
        } else {
            String summary = todayEvents.stream()
                    .map(e -> {
                        String timeStr = TIME_FMT.format(e.getStartDatetime()) + " - " + TIME_FMT.format(e.getEndDatetime());
                        String roomStr = (e.getRoom() != null && !e.getRoom().isBlank()) ? " (P." + e.getRoom() + ")" : "";
                        return e.getTitle() + " [" + timeStr + roomStr + "]";
                    })
                    .collect(Collectors.joining("; "));

            content = "Hôm nay bạn có " + todayEvents.size() + " buổi học: " + summary;
            metadata = "{\"eventCount\":" + todayEvents.size() + "}";
        }

        return createAndSendNotification(
                user,
                NotificationType.TODAY_SCHEDULE,
                title,
                content,
                "/timetable",
                metadata
        );
    }
}
