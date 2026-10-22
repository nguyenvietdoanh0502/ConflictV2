package com.conflict.be.modules.friendship.dto;


import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class FriendDTO {
    private UUID friendshipId;
    private FriendUserDTO user;
    private Instant friendsSince;
}
