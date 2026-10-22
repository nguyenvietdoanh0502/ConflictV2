package com.conflict.be.modules.friendship.dto;

import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FriendRequestDTO {
    private UUID requestId;
    private FriendUserDTO user;
    private FriendshipStatus status;
    private Instant createdAt;
}
