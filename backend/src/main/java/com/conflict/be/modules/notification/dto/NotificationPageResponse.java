package com.conflict.be.modules.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPageResponse {
    private List<NotificationResponse> items;
    private int page;
    private int size;
    private long totalUnread;
    private boolean hasMore;
}
