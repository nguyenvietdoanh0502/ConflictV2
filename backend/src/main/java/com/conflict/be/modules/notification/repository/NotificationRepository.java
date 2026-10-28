package com.conflict.be.modules.notification.repository;

import com.conflict.be.modules.notification.entity.Notification;
import com.conflict.be.modules.notification.enums.NotificationType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Slice<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Slice<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(UUID userId, boolean isRead, Pageable pageable);

    long countByUserIdAndIsReadFalse(UUID userId);

    boolean existsByUserIdAndTypeAndCreatedAtGreaterThanEqual(UUID userId, NotificationType type, Instant startOfDay);

    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.id = :id AND n.user.id = :userId")
    int markAsRead(@Param("id") UUID id, @Param("userId") UUID userId, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") UUID userId, @Param("now") Instant now);
}
