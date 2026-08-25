package com.conflict.be.modules.friendship.dto;

import com.conflict.be.modules.user.entity.User;

public record FriendPair(User firstUser, User secondUser) {
    private FriendPair createPair(User firstUser, User secondUser) {
        int comparison = firstUser
                .getPinCode()
                .compareTo(secondUser.getPinCode());

        if (comparison < 0) {
            return new FriendPair(firstUser, secondUser);
        }

        return new FriendPair(secondUser, firstUser);
    }
}
