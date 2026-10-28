package com.conflict.be.modules.notification.dto;

import com.conflict.be.modules.notification.entity.Notification;
import com.conflict.be.modules.notification.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private NotificationType type;
    private String title;
    private String content;
    private String link;
    private String metadata;
    private boolean isRead;
    private Instant readAt;
    private Instant createdAt;

    public static NotificationResponse fromEntity(Notification entity) {
        if (entity == null) return null;
        return NotificationResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .title(entity.getTitle())
                .content(entity.getContent())
                .link(entity.getLink())
                .metadata(entity.getMetadata())
                .isRead(entity.isRead())
                .readAt(entity.getReadAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
