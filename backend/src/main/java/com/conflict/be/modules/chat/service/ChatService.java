package com.conflict.be.modules.chat.service;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.chat.dto.ChatMessageDTO;
import com.conflict.be.modules.chat.dto.MessagePageDTO;
import com.conflict.be.modules.chat.dto.SendMessageRequest;
import com.conflict.be.modules.chat.entity.ChatMessage;
import com.conflict.be.modules.chat.repository.ChatMessageRepository;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.friendship.repository.FriendshipRepository;
import com.conflict.be.modules.material.dto.SharedMaterialPreviewDTO;
import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import com.conflict.be.modules.material.enums.GameType;
import com.conflict.be.modules.material.repository.StudyMaterialRepository;
import com.conflict.be.modules.notification.enums.NotificationType;
import com.conflict.be.modules.notification.service.NotificationService;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {
    private static final int MAX_MESSAGE_LENGTH = 2000;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    private User requireActiveUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    private User requireActiveUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    public record MessageDelivery(
            ChatMessageDTO message,
            String recipientEmail
    ) {}

    @Transactional
    public MessageDelivery sendMessage(String senderEmail, SendMessageRequest request) {
        User sender = requireActiveUser(senderEmail);
        User recipient = requireActiveUser(request.getRecipientId());
        if (sender.getId().equals(recipient.getId())) {
            throw new AppException(ErrorCode.CANNOT_MESSAGE_SELF);
        }
        friendshipRepository.findByUsersAndStatusForUpdate(sender.getId(), recipient.getId(), FriendshipStatus.ACCEPTED)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FRIENDS));

        StudyMaterialEntity sharedMaterial = null;
        String messageType = "TEXT";
        GameType challengeGameType = null;
        Integer challengerScore = null;
        Integer challengerTimeSeconds = null;

        if (request.getSharedMaterialId() != null) {
            sharedMaterial = studyMaterialRepository.findById(request.getSharedMaterialId())
                    .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

            boolean isOwner = sharedMaterial.getUser().getId().equals(sender.getId());
            boolean hasSharedAccess = chatMessageRepository.existsSharedMaterialAccess(sharedMaterial.getId(), sender.getId());
            if (!isOwner && !hasSharedAccess) {
                throw new AppException(ErrorCode.MATERIAL_FORBIDDEN);
            }

            if ("CHALLENGE_GAME".equalsIgnoreCase(request.getMessageType())) {
                messageType = "CHALLENGE_GAME";
                challengeGameType = request.getChallengeGameType() != null ? request.getChallengeGameType() : GameType.SPEED_QUIZ;
                boolean hasQuiz = sharedMaterial.getQuizData() != null && !sharedMaterial.getQuizData().isEmpty();
                boolean hasMatch = sharedMaterial.getMemoryMatchData() != null && !sharedMaterial.getMemoryMatchData().isEmpty();
                if (!hasQuiz && !hasMatch) {
                    throw new AppException(ErrorCode.MINIGAME_NOT_GENERATED);
                }
                challengerScore = request.getChallengerScore();
                challengerTimeSeconds = request.getChallengerTimeSeconds();
            } else {
                messageType = "SHARE_MATERIAL";
            }
        }

        String content = resolveContent(request.getContent(), sharedMaterial, messageType, challengeGameType, challengerScore);

        ChatMessage saved = chatMessageRepository.save(
                ChatMessage.builder()
                        .sender(sender)
                        .recipient(recipient)
                        .content(content)
                        .sharedMaterial(sharedMaterial)
                        .messageType(messageType)
                        .challengeGameType(challengeGameType)
                        .challengerScore(challengerScore)
                        .challengerTimeSeconds(challengerTimeSeconds)
                        .build()
        );

        try {
            sendNotificationForMessage(sender, recipient, saved, sharedMaterial, messageType, challengeGameType, challengerScore);
        } catch (Exception ex) {
            log.warn("Failed to create message notification: {}", ex.getMessage());
        }

        return new MessageDelivery(
                mapToDTO(saved),
                recipient.getEmail()
        );
    }

    @Transactional
    public ChatMessageDTO sendAndBroadcastMessage(String senderEmail, SendMessageRequest request) {
        MessageDelivery delivery = sendMessage(senderEmail, request);
        ApiResponse<ChatMessageDTO> event = ApiResponse.success(delivery.message());
        try {
            messagingTemplate.convertAndSendToUser(senderEmail, "/queue/messages", event);
            messagingTemplate.convertAndSendToUser(delivery.recipientEmail(), "/queue/messages", event);
        } catch (Exception ex) {
            log.warn("Failed to push message over WebSocket: {}", ex.getMessage());
        }
        return delivery.message();
    }

    private void sendNotificationForMessage(
            User sender,
            User recipient,
            ChatMessage saved,
            StudyMaterialEntity sharedMaterial,
            String messageType,
            GameType challengeGameType,
            Integer challengerScore
    ) {
        String senderAvatar = sender.getAvatarUrl() != null ? sender.getAvatarUrl() : "";

        if ("CHALLENGE_GAME".equals(messageType) && sharedMaterial != null) {
            String gameName = challengeGameType == GameType.MEMORY_MATCH ? "Lật thẻ Ghép cặp" : "Đấu trường Trắc nghiệm";
            String scorePart = (challengerScore != null && challengerScore > 0)
                    ? " (Mục tiêu cần vượt: " + challengerScore + " điểm)"
                    : "";
            String notifContent = "đã gửi lời mời thách đấu " + gameName + " bộ đề \"" + sharedMaterial.getTitle() + "\"" + scorePart;
            String mode = challengeGameType == GameType.MEMORY_MATCH ? "match" : "quiz";
            String link = "/study?materialId=" + sharedMaterial.getId() + "&mode=" + mode;
            String metadataJson = String.format(
                    "{\"senderId\":\"%s\",\"senderName\":\"%s\",\"avatarUrl\":\"%s\",\"materialId\":\"%s\",\"gameType\":\"%s\"}",
                    sender.getId(), escapeJson(sender.getFullName()), escapeJson(senderAvatar),
                    sharedMaterial.getId(), challengeGameType != null ? challengeGameType.name() : "SPEED_QUIZ"
            );

            notificationService.createAndSendNotification(
                    recipient,
                    NotificationType.MINIGAME_CHALLENGE,
                    sender.getFullName(),
                    notifContent,
                    link,
                    metadataJson
            );
        } else if ("SHARE_MATERIAL".equals(messageType) && sharedMaterial != null) {
            String notifContent = "đã chia sẻ đề cương \"" + sharedMaterial.getTitle() + "\" (" + sharedMaterial.getSubject().getName() + ") với bạn.";
            String link = "/study?materialId=" + sharedMaterial.getId() + "&mode=cheatsheet";
            String metadataJson = String.format(
                    "{\"senderId\":\"%s\",\"senderName\":\"%s\",\"avatarUrl\":\"%s\",\"materialId\":\"%s\"}",
                    sender.getId(), escapeJson(sender.getFullName()), escapeJson(senderAvatar),
                    sharedMaterial.getId()
            );

            notificationService.createAndSendNotification(
                    recipient,
                    NotificationType.MATERIAL_SHARED,
                    sender.getFullName(),
                    notifContent,
                    link,
                    metadataJson
            );
        } else {
            String content = saved.getContent();
            String preview = content.length() > 60 ? content.substring(0, 57) + "..." : content;
            String metadataJson = String.format(
                    "{\"senderId\":\"%s\",\"senderName\":\"%s\",\"avatarUrl\":\"%s\"}",
                    sender.getId(), escapeJson(sender.getFullName()), escapeJson(senderAvatar)
            );

            notificationService.createAndSendNotification(
                    recipient,
                    NotificationType.NEW_MESSAGE,
                    sender.getFullName(),
                    preview,
                    "/friends",
                    metadataJson
            );
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String resolveContent(
            String rawContent,
            StudyMaterialEntity sharedMaterial,
            String messageType,
            GameType challengeGameType,
            Integer challengerScore
    ) {
        String trimmed = rawContent == null ? "" : rawContent.trim();
        if (trimmed.isEmpty() && sharedMaterial != null) {
            if ("CHALLENGE_GAME".equals(messageType)) {
                String gameLabel = challengeGameType == GameType.MEMORY_MATCH ? "Lật thẻ Ghép cặp" : "Đấu trường Trắc nghiệm";
                if (challengerScore != null && challengerScore > 0) {
                    trimmed = "Thách đấu bạn vượt qua mốc " + challengerScore + " điểm ở trò " + gameLabel + " — đề cương \"" + sharedMaterial.getTitle() + "\"!";
                } else {
                    trimmed = "Mình thách đấu bạn cùng so tài trò " + gameLabel + " trong đề cương \"" + sharedMaterial.getTitle() + "\"!";
                }
            } else {
                trimmed = "Mình chia sẻ với bạn đề cương \"" + sharedMaterial.getTitle() + "\" (" + sharedMaterial.getSubject().getName() + ") để cùng ôn tập nhé!";
            }
        }
        if (trimmed.isEmpty()) {
            throw new AppException(ErrorCode.MISSING_MESSAGE_CONTENT);
        }
        if (trimmed.length() > MAX_MESSAGE_LENGTH) {
            throw new AppException(ErrorCode.MESSAGE_TOO_LONG);
        }
        return trimmed;
    }

    @Transactional(readOnly = true)
    public MessagePageDTO getMessage(
            String currentEmail,
            UUID friendUserId,
            int page,
            int size
    ) {
        if (page < 0 || size < 1 || size > 50) {
            throw new AppException(ErrorCode.INVALID_PAGINATION);
        }
        User currentUser = requireActiveUser(currentEmail);
        User friend = requireActiveUser(friendUserId);
        boolean areFriend = friendshipRepository.existsByUsersAndStatus(currentUser.getId(), friend.getId(), FriendshipStatus.ACCEPTED);
        if (!areFriend) {
            throw new AppException(ErrorCode.NOT_FRIENDS);
        }
        Slice<ChatMessage> result = chatMessageRepository.findThread(currentUser.getId(), friend.getId(), PageRequest.of(page, size));
        List<ChatMessageDTO> items = new ArrayList<>(
                result.getContent()
                        .stream()
                        .map(this::mapToDTO)
                        .toList()
        );
        Collections.reverse(items);
        return MessagePageDTO.builder()
                .items(items)
                .page(page)
                .size(size)
                .hasMore(result.hasNext())
                .build();
    }

    private ChatMessageDTO mapToDTO(ChatMessage message) {
        SharedMaterialPreviewDTO preview = null;
        StudyMaterialEntity mat = message.getSharedMaterial();
        if (mat != null) {
            preview = SharedMaterialPreviewDTO.builder()
                    .id(mat.getId())
                    .title(mat.getTitle())
                    .subjectName(mat.getSubject() != null ? mat.getSubject().getName() : "Môn học")
                    .fileType(mat.getFileType())
                    .quizCount(mat.getQuizData() != null ? mat.getQuizData().size() : 0)
                    .memoryMatchCount(mat.getMemoryMatchData() != null ? mat.getMemoryMatchData().size() : 0)
                    .ownerName(mat.getUser() != null ? mat.getUser().getFullName() : "")
                    .build();
        }

        return ChatMessageDTO.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .recipientId(message.getRecipient().getId())
                .content(message.getContent())
                .messageType(message.getMessageType() != null ? message.getMessageType() : "TEXT")
                .challengeGameType(message.getChallengeGameType())
                .challengerScore(message.getChallengerScore())
                .challengerTimeSeconds(message.getChallengerTimeSeconds())
                .sharedMaterial(preview)
                .createdAt(message.getCreatedAt())
                .build();
    }
}
