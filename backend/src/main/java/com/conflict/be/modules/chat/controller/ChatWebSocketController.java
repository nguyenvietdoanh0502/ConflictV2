package com.conflict.be.modules.chat.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.modules.chat.dto.ChatMessageDTO;
import com.conflict.be.modules.chat.dto.SendMessageRequest;
import com.conflict.be.modules.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(
            Principal principal,
            @Valid @Payload SendMessageRequest request
    ){
        ChatService.MessageDelivery delivery = chatService.sendMessage(principal.getName(), request);
        ApiResponse<ChatMessageDTO> event = ApiResponse.success(delivery.message());
        messagingTemplate.convertAndSendToUser(principal.getName(),"/queue/messages",event);
        messagingTemplate.convertAndSendToUser(delivery.recipientEmail(),"/queue/messages",event);
    }
}
