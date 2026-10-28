package com.conflict.be.modules.chat.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.chat.dto.ChatMessageDTO;
import com.conflict.be.modules.chat.dto.MessagePageDTO;
import com.conflict.be.modules.chat.dto.SendMessageRequest;
import com.conflict.be.modules.chat.entity.ChatMessage;
import com.conflict.be.modules.chat.repository.ChatMessageRepository;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.friendship.repository.FriendshipRepository;
import com.conflict.be.modules.notification.enums.NotificationType;
import com.conflict.be.modules.notification.service.NotificationService;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
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
    private final NotificationService notificationService;


    private User requireActiveUser(String email){
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        ()-> new AppException(ErrorCode.USER_NOT_EXISTED)
                );
        if(user.isDeleted()){
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        if(user.getStatus()!= AccountStatus.ACTIVE){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }
    private User requireActiveUser(UUID id){
        User user = userRepository.findById(id)
                .orElseThrow(
                        ()-> new AppException(ErrorCode.USER_NOT_EXISTED)
                );
        if(user.isDeleted()){
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        if(user.getStatus()!= AccountStatus.ACTIVE){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }
    public record MessageDelivery(
            ChatMessageDTO message,
            String recipientEmail
    ){}

    @Transactional
    public MessageDelivery sendMessage(String senderEmail, SendMessageRequest request){
        User sender =  requireActiveUser(senderEmail);
        User recipient = requireActiveUser(request.getRecipientId());
        if(sender.getId().equals(recipient.getId())){
            throw new AppException(ErrorCode.CANNOT_MESSAGE_SELF);
        }
        friendshipRepository.findByUsersAndStatusForUpdate(sender.getId(), recipient.getId(), FriendshipStatus.ACCEPTED)
                .orElseThrow(()->new AppException(ErrorCode.NOT_FRIENDS));
        String content = normalizeContent(request.getContent());
        ChatMessage saved = chatMessageRepository.save(
                ChatMessage.builder()
                        .sender(sender)
                        .recipient(recipient)
                        .content(content)
                        .build()
        );

        try {
            String preview = content.length() > 60 ? content.substring(0, 57) + "..." : content;
            String senderAvatar = sender.getAvatarUrl() != null ? sender.getAvatarUrl() : "";
            String metadataJson = "{\"senderId\":\"" + sender.getId() + "\",\"senderName\":\""
                    + sender.getFullName() + "\",\"avatarUrl\":\"" + senderAvatar + "\"}";

            notificationService.createAndSendNotification(
                    recipient,
                    NotificationType.NEW_MESSAGE,
                    sender.getFullName(),
                    preview,
                    "/friends",
                    metadataJson
            );
        } catch (Exception ex) {
            log.warn("Failed to create message notification: {}", ex.getMessage());
        }

        return new MessageDelivery(
                mapToDTO(saved),
                recipient.getEmail()
        );
    }
    @Transactional(readOnly = true)
    public MessagePageDTO getMessage(
            String currentEmail,
            UUID friendUserId,
            int page,
            int size
    ){
        if(page<0||size<1||size>50){
            throw new AppException(ErrorCode.INVALID_PAGINATION);
        }
        User currentUser = requireActiveUser(currentEmail);
        User friend = requireActiveUser(friendUserId);
        boolean areFriend = friendshipRepository.existsByUsersAndStatus(currentUser.getId(), friend.getId(),FriendshipStatus.ACCEPTED);
        if(!areFriend){
            throw new AppException(ErrorCode.NOT_FRIENDS);
        }
        Slice<ChatMessage> result = chatMessageRepository.findThread(currentUser.getId(),friend.getId(), PageRequest.of(page,size));
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
    private String normalizeContent(String rawContent){
        String content = rawContent == null ? "":rawContent.trim();
        if(content.isEmpty()){
            throw new AppException(ErrorCode.MISSING_MESSAGE_CONTENT);
        }
        if(content.length()>MAX_MESSAGE_LENGTH){
            throw new AppException(ErrorCode.MESSAGE_TOO_LONG);
        }
        return content;
    }
    private ChatMessageDTO mapToDTO(ChatMessage message){
        return ChatMessageDTO.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .recipientId(message.getRecipient().getId())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
