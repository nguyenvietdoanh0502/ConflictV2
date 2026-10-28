package com.conflict.be.modules.friendship.service;

import com.conflict.be.modules.friendship.dto.FriendDTO;
import com.conflict.be.modules.friendship.dto.FriendRequestDTO;
import com.conflict.be.modules.friendship.dto.SendFriendRequest;
import com.conflict.be.modules.friendship.entity.Friendship;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.friendship.repository.FriendshipRepository;
import com.conflict.be.modules.notification.enums.NotificationType;
import com.conflict.be.modules.notification.service.NotificationService;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FriendshipServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FriendshipService friendshipService;

    private User sender;
    private User receiver;
    private Friendship testFriendship;
    private UUID senderId;
    private UUID receiverId;
    private UUID friendshipId;

    @BeforeEach
    void setUp() {
        senderId = UUID.randomUUID();
        receiverId = UUID.randomUUID();
        friendshipId = UUID.randomUUID();

        sender = User.builder()
                .id(senderId)
                .email("sender@unisync.edu.vn")
                .fullName("Nguyễn Văn A")
                .pinCode("PIN-1111")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        receiver = User.builder()
                .id(receiverId)
                .email("receiver@unisync.edu.vn")
                .fullName("Trần Thị B")
                .pinCode("PIN-2222")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        testFriendship = Friendship.builder()
                .id(friendshipId)
                .lowUser(sender)
                .highUser(receiver)
                .requestedBy(sender)
                .status(FriendshipStatus.PENDING)
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void testSendFriendRequest_SendsNotification() {
        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findByPinCodeAndStatusAndIsDeletedFalse(eq("PIN-2222"), eq(AccountStatus.ACTIVE)))
                .thenReturn(Optional.of(receiver));
        when(friendshipRepository.findByPair(any(), any())).thenReturn(Optional.empty());
        when(friendshipRepository.saveAndFlush(any(Friendship.class))).thenAnswer(inv -> inv.getArgument(0));

        SendFriendRequest request = new SendFriendRequest();
        request.setPinCode("PIN-2222");

        FriendRequestDTO result = friendshipService.sendFriendRequest(sender.getEmail(), request);

        assertNotNull(result);
        verify(notificationService).createAndSendNotification(
                eq(receiver),
                eq(NotificationType.FRIEND_REQUEST_RECEIVED),
                eq(sender.getFullName()),
                contains("lời mời kết bạn"),
                eq("/friends"),
                any()
        );
    }

    @Test
    void testAcceptFriendRequest_SendsNotificationToRequester() {
        when(userRepository.findByEmail(receiver.getEmail())).thenReturn(Optional.of(receiver));
        when(friendshipRepository.findByIdForUpdate(friendshipId)).thenReturn(Optional.of(testFriendship));
        when(friendshipRepository.save(any(Friendship.class))).thenAnswer(inv -> inv.getArgument(0));

        FriendDTO result = friendshipService.acceptFriendRequest(receiver.getEmail(), friendshipId);

        assertNotNull(result);
        assertEquals(FriendshipStatus.ACCEPTED, testFriendship.getStatus());
        verify(notificationService).createAndSendNotification(
                eq(sender), // requester
                eq(NotificationType.FRIEND_REQUEST_ACCEPTED),
                eq(receiver.getFullName()),
                contains("chấp nhận lời mời"),
                eq("/friends"),
                any()
        );
    }

    @Test
    void testRemoveFriend_DoesNotSendNotification() {
        testFriendship.setStatus(FriendshipStatus.ACCEPTED);
        when(userRepository.findByEmail(receiver.getEmail())).thenReturn(Optional.of(receiver));
        when(friendshipRepository.findByIdForUpdate(friendshipId)).thenReturn(Optional.of(testFriendship));
        doNothing().when(friendshipRepository).delete(testFriendship);

        assertDoesNotThrow(() -> friendshipService.removeFriend(receiver.getEmail(), friendshipId));
        verify(friendshipRepository).delete(testFriendship);
        verifyNoInteractions(notificationService); // Không gửi thông báo khi xóa kết bạn
    }
}
