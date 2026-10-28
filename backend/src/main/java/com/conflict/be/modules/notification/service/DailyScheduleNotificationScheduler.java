package com.conflict.be.modules.notification.service;

import com.conflict.be.modules.notification.entity.Notification;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyScheduleNotificationScheduler {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Tự động quét và gửi thông báo tóm tắt lịch học hôm nay cho tất cả user active
     * Chạy vào lúc 06:00 sáng mỗi ngày theo giờ Việt Nam.
     */
    @Scheduled(cron = "0 0 6 * * *", zone = "Asia/Ho_Chi_Minh")
    public void scheduleDailyBriefing() {
        log.info("Running daily schedule notification briefing at 06:00 AM VN time");
        try {
            List<User> activeUsers = userRepository.findAll().stream()
                    .filter(u -> !u.isDeleted() && u.getStatus() == AccountStatus.ACTIVE)
                    .toList();

            for (User user : activeUsers) {
                try {
                    notificationService.checkAndGenerateTodayScheduleBriefing(user, false);
                } catch (Exception ex) {
                    log.warn("Failed to generate daily schedule notification for user {}: {}", user.getEmail(), ex.getMessage());
                }
            }
            log.info("Finished daily schedule notification briefing for {} users", activeUsers.size());
        } catch (Exception ex) {
            log.error("Error running daily schedule briefing job: {}", ex.getMessage(), ex);
        }
    }
}
