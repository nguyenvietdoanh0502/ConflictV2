package com.conflict.be.modules.chat.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.chat.dto.SendMessageRequest;
import com.conflict.be.modules.chat.entity.ChatMessage;
import com.conflict.be.modules.chat.repository.ChatMessageRepository;
import com.conflict.be.modules.e2ee.service.E2eeKeyService;
import com.conflict.be.modules.friendship.entity.Friendship;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.friendship.repository.FriendshipRepository;
import com.conflict.be.modules.material.repository.StudyMaterialRepository;
import com.conflict.be.modules.notification.enums.NotificationType;
import com.conflict.be.modules.notification.service.NotificationService;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private StudyMaterialRepository studyMaterialRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private E2eeKeyService e2eeKeyService;

    @InjectMocks
    private ChatService chatService;

    private User sender;
    private User recipient;
    private String validCiphertextB64;
    private String validIvB64;

    @BeforeEach
    void setUp() {
        sender = User.builder()
                .id(UUID.randomUUID())
                .email("sender@unisync.edu.vn")
                .fullName("Sender User")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        recipient = User.builder()
                .id(UUID.randomUUID())
                .email("recipient@unisync.edu.vn")
                .fullName("Recipient User")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        validCiphertextB64 = Base64.getEncoder().encodeToString(new byte[32]);
        validIvB64 = Base64.getEncoder().encodeToString(new byte[12]);

        when(userRepository.findByEmail(sender.getEmail())).thenReturn(Optional.of(sender));
        when(userRepository.findById(recipient.getId())).thenReturn(Optional.of(recipient));
        when(friendshipRepository.findByUsersAndStatusForUpdate(sender.getId(), recipient.getId(), FriendshipStatus.ACCEPTED))
                .thenReturn(Optional.of(new Friendship()));
    }

    @Test
    @DisplayName("Tin nhắn mã hóa lưu nguyên ciphertext và tạo thông báo không lộ nội dung")
    void sendMessage_encrypted_preservesCiphertextAndRedactsNotification() {
        when(e2eeKeyService.getActiveVersion(sender.getId())).thenReturn(Optional.of(1));
        when(e2eeKeyService.getActiveVersion(recipient.getId())).thenReturn(Optional.of(2));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenAnswer(inv -> {
            ChatMessage m = inv.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        SendMessageRequest req = SendMessageRequest.builder()
                .recipientId(recipient.getId())
                .content(validCiphertextB64)
                .encrypted(true)
                .iv(validIvB64)
                .senderKeyVersion(1)
                .recipientKeyVersion(2)
                .build();

        ChatService.MessageDelivery delivery = chatService.sendMessage(sender.getEmail(), req);

        assertTrue(delivery.message().isEncrypted());
        assertEquals(validCiphertextB64, delivery.message().getContent());
        assertEquals(validIvB64, delivery.message().getIv());
        assertEquals(1, delivery.message().getSenderKeyVersion());
        assertEquals(2, delivery.message().getRecipientKeyVersion());

        ArgumentCaptor<String> previewCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> metadataCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationService).createAndSendNotification(
                eq(recipient),
                eq(NotificationType.NEW_MESSAGE),
                eq(sender.getFullName()),
                previewCaptor.capture(),
                eq("/friends"),
                metadataCaptor.capture()
        );
        assertEquals("Tin nhắn được mã hóa đầu-cuối", previewCaptor.getValue());
        assertFalse(previewCaptor.getValue().contains(validCiphertextB64));
        assertTrue(metadataCaptor.getValue().contains("\"encrypted\":true"));
    }

    @Test
    @DisplayName("Tin nhắn mã hóa bị từ chối khi người nhận chưa bật E2EE")
    void sendMessage_encryptedRecipientNoKey_throwsRecipientNoKey() {
        when(e2eeKeyService.getActiveVersion(sender.getId())).thenReturn(Optional.of(1));
        when(e2eeKeyService.getActiveVersion(recipient.getId())).thenReturn(Optional.empty());

        SendMessageRequest req = SendMessageRequest.builder()
                .recipientId(recipient.getId())
                .content(validCiphertextB64)
                .encrypted(true)
                .iv(validIvB64)
                .senderKeyVersion(1)
                .recipientKeyVersion(1)
                .build();

        AppException ex = assertThrows(AppException.class, () -> chatService.sendMessage(sender.getEmail(), req));
        assertEquals(ErrorCode.E2EE_RECIPIENT_NO_KEY, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tin nhắn mã hóa bị từ chối khi version khóa bị lệch")
    void sendMessage_encryptedOutdatedKeyVersion_throwsKeyOutdated() {
        when(e2eeKeyService.getActiveVersion(sender.getId())).thenReturn(Optional.of(1));
        when(e2eeKeyService.getActiveVersion(recipient.getId())).thenReturn(Optional.of(3));

        SendMessageRequest req = SendMessageRequest.builder()
                .recipientId(recipient.getId())
                .content(validCiphertextB64)
                .encrypted(true)
                .iv(validIvB64)
                .senderKeyVersion(1)
                .recipientKeyVersion(2)
                .build();

        AppException ex = assertThrows(AppException.class, () -> chatService.sendMessage(sender.getEmail(), req));
        assertEquals(ErrorCode.E2EE_KEY_OUTDATED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Không cho phép gắn cờ encrypted vào tin nhắn chia sẻ đề cương")
    void sendMessage_encryptedWithSharedMaterial_throwsInvalidPayload() {
        SendMessageRequest req = SendMessageRequest.builder()
                .recipientId(recipient.getId())
                .sharedMaterialId(UUID.randomUUID())
                .content(validCiphertextB64)
                .encrypted(true)
                .iv(validIvB64)
                .senderKeyVersion(1)
                .recipientKeyVersion(1)
                .build();

        AppException ex = assertThrows(AppException.class, () -> chatService.sendMessage(sender.getEmail(), req));
        assertEquals(ErrorCode.E2EE_INVALID_PAYLOAD, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tin nhắn plaintext quá 2000 ký tự vẫn bị chặn bởi MESSAGE_TOO_LONG")
    void sendMessage_plaintextTooLong_throwsMessageTooLong() {
        SendMessageRequest req = SendMessageRequest.builder()
                .recipientId(recipient.getId())
                .content("a".repeat(2001))
                .encrypted(false)
                .build();

        AppException ex = assertThrows(AppException.class, () -> chatService.sendMessage(sender.getEmail(), req));
        assertEquals(ErrorCode.MESSAGE_TOO_LONG, ex.getErrorCode());
    }
}

