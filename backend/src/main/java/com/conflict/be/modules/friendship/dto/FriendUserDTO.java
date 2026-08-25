package com.conflict.be.modules.friendship.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class FriendUserDTO {
    private UUID id;
    private String fullName;
    private String avatarUrl;
}
