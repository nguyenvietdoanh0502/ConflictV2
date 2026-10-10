package com.conflict.be.modules.chat.controller;


import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.chat.dto.MessagePageDTO;
import com.conflict.be.modules.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @GetMapping(UrlConstant.Chat.HISTORY)
    public ResponseEntity<ApiResponse<MessagePageDTO>> getMessage(
            Authentication authentication,
            @PathVariable UUID friendUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ){
        MessagePageDTO result = chatService.getMessage(authentication.getName(), friendUserId,page,size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
