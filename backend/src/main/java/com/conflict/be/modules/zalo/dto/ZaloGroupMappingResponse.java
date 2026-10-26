package com.conflict.be.modules.zalo.dto;

import com.conflict.be.modules.zalo.entity.ZaloGroupMapping;
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
public class ZaloGroupMappingResponse {

    private UUID id;
    private UUID userId;
    private UUID subjectId;
    private String subjectName;
    private String subjectCode;
    private String subjectColorHex;
    private String defaultRoom;
    private String zaloGroupId;
    private String zaloGroupName;
    private boolean active;
    private Instant lastSyncedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public static ZaloGroupMappingResponse fromEntity(ZaloGroupMapping mapping) {
        if (mapping == null) {
            return null;
        }
        return ZaloGroupMappingResponse.builder()
                .id(mapping.getId())
                .userId(mapping.getUser() != null ? mapping.getUser().getId() : null)
                .subjectId(mapping.getSubject() != null ? mapping.getSubject().getId() : null)
                .subjectName(mapping.getSubject() != null ? mapping.getSubject().getName() : null)
                .subjectCode(mapping.getSubject() != null ? mapping.getSubject().getCode() : null)
                .subjectColorHex(mapping.getSubject() != null ? mapping.getSubject().getColorHex() : null)
                .defaultRoom(mapping.getSubject() != null ? mapping.getSubject().getDefaultRoom() : null)
                .zaloGroupId(mapping.getZaloGroupId())
                .zaloGroupName(mapping.getZaloGroupName())
                .active(mapping.isActive())
                .lastSyncedAt(mapping.getLastSyncedAt())
                .createdAt(mapping.getCreatedAt())
                .updatedAt(mapping.getUpdatedAt())
                .build();
    }
}
