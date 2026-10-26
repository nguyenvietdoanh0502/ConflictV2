package com.conflict.be.modules.zalo.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.zalo.config.AiConfig;
import com.conflict.be.modules.zalo.dto.ZaloIncomingMessageDTO;
import com.conflict.be.modules.zalo.dto.ZaloProcessResultDTO;
import com.conflict.be.modules.zalo.dto.ZaloSimulateRequest;
import com.conflict.be.modules.zalo.entity.ZaloGroupMapping;
import com.conflict.be.modules.zalo.repository.ZaloGroupMappingRepository;
import com.conflict.be.modules.zalo.service.ZaloMessageProcessor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RestApiV1
@RequiredArgsConstructor
public class ZaloWebhookController {

    private final ZaloMessageProcessor messageProcessor;
    private final ZaloGroupMappingRepository mappingRepository;
    private final UserRepository userRepository;
    private final AiConfig aiConfig;

    /**
     * Endpoint Mock Simulator phục vụ việc thử nghiệm bóc tách và cập nhật Thời khóa biểu.
     * Cho phép kiểm thử toàn bộ luồng từ FE mà không cần Zalo thật.
     */
    @PostMapping(UrlConstant.Zalo.SIMULATE)
    public ResponseEntity<ApiResponse<ZaloProcessResultDTO>> simulateZaloMessage(
            Authentication authentication,
            @Valid @RequestBody ZaloSimulateRequest request
    ) {
        String targetGroupId = request.getZaloGroupId();

        // Nếu người dùng đã đăng nhập và chưa chỉ định nhóm, tự động chọn nhóm active đầu tiên của họ
        if ((targetGroupId == null || targetGroupId.isBlank()) && authentication != null) {
            User user = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (user != null) {
                List<ZaloGroupMapping> mappings = mappingRepository.findByUserIdWithSubject(user.getId());
                targetGroupId = mappings.stream()
                        .filter(ZaloGroupMapping::isActive)
                        .map(ZaloGroupMapping::getZaloGroupId)
                        .findFirst()
                        .orElse(null);
            }
        }

        if (targetGroupId == null || targetGroupId.isBlank()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "Vui lòng cung cấp zalo_group_id hoặc ghép một nhóm Zalo trước khi giả lập")
            );
        }

        String messageId = "sim-" + UUID.randomUUID().toString().substring(0, 8);
        ZaloProcessResultDTO result = messageProcessor.processMessage(
                targetGroupId,
                messageId,
                request.getSenderName() != null ? request.getSenderName() : "Lớp trưởng",
                request.getMessageText(),
                request.getImageUrl(),
                request.getImageBase64(),
                request.getImageMimeType(),
                request.getCurrentDatetime()
        );

        return ResponseEntity.ok(ApiResponse.success("Giả lập xử lý tin nhắn hoàn tất", result));
    }

    /**
     * Alias cho Mock Webhook theo chuẩn PRD.
     */
    @PostMapping(UrlConstant.Zalo.MOCK_WEBHOOK)
    public ResponseEntity<ApiResponse<ZaloProcessResultDTO>> mockWebhookAlias(
            Authentication authentication,
            @Valid @RequestBody ZaloSimulateRequest request
    ) {
        return simulateZaloMessage(authentication, request);
    }

    /**
     * Endpoint nội bộ dành cho Node.js Zalo Bridge gửi tin nhắn thực tế sang Backend.
     * Bảo vệ bằng X-Internal-Api-Key.
     */
    @PostMapping(UrlConstant.Zalo.INTERNAL_MESSAGES)
    public ResponseEntity<ApiResponse<ZaloProcessResultDTO>> receiveBridgeMessage(
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String internalApiKey,
            @Valid @RequestBody ZaloIncomingMessageDTO messageDTO
    ) {
        // Kiểm tra khóa bảo mật nội bộ
        if (aiConfig.getInternalApiKey() != null && !aiConfig.getInternalApiKey().isBlank()) {
            if (internalApiKey == null || !internalApiKey.equals(aiConfig.getInternalApiKey())) {
                log.warn("Unauthorized internal Zalo call from bridge. Key: {}", internalApiKey);
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }
        }

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                messageDTO.getZaloGroupId(),
                messageDTO.getMessageId(),
                messageDTO.getSenderName() != null ? messageDTO.getSenderName() : "Thành viên Zalo",
                messageDTO.getMessageText(),
                messageDTO.getImageUrl(),
                messageDTO.getImageBase64(),
                messageDTO.getImageMimeType(),
                messageDTO.getTimestamp()
        );

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(result));
    }
}
