package com.conflict.be.modules.zalo.service;

import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventSource;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.zalo.client.AiEngineClient;
import com.conflict.be.modules.zalo.dto.ScheduleNotificationDTO;
import com.conflict.be.modules.zalo.dto.ZaloProcessResultDTO;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeRequest;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeResponse;
import com.conflict.be.modules.zalo.dto.ai.AiDetectedEvent;
import com.conflict.be.modules.zalo.entity.ZaloGroupMapping;
import com.conflict.be.modules.zalo.filter.ZaloKeywordFilter;
import com.conflict.be.modules.zalo.repository.ZaloGroupMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ZaloMessageProcessor {

    private final ZaloKeywordFilter keywordFilter;
    private final ZaloGroupMappingRepository mappingRepository;
    private final ScheduleEventRepository scheduleEventRepository;
    private final AiEngineClient aiEngineClient;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ZaloProcessResultDTO processMessage(
            String zaloGroupId,
            String messageId,
            String senderName,
            String messageText,
            Instant currentDatetime
    ) {
        log.info("Processing incoming Zalo message for group '{}', sender '{}'", zaloGroupId, senderName);

        // 1. Bộ lọc Regex từ khóa học vụ (Tiết kiệm chi phí AI & hạ độ trễ)
        if (!keywordFilter.isLikelyAcademic(messageText)) {
            log.info("Message for group '{}' dropped by keyword filter: '{}'", zaloGroupId, messageText);
            return ZaloProcessResultDTO.builder()
                    .zaloGroupId(zaloGroupId)
                    .matchedFilter(false)
                    .matchedMappings(0)
                    .eventsCreated(0)
                    .statusMessage("Tin nhắn bị bỏ qua bởi bộ lọc từ khóa (Không chứa lịch học hoặc quá ngắn)")
                    .build();
        }

        // 2. Tìm tất cả mapping đang active liên kết với zaloGroupId này
        List<ZaloGroupMapping> activeMappings =
                mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser(zaloGroupId);

        if (activeMappings.isEmpty()) {
            log.info("No active whitelist mapping found for group '{}'", zaloGroupId);
            return ZaloProcessResultDTO.builder()
                    .zaloGroupId(zaloGroupId)
                    .matchedFilter(true)
                    .matchedMappings(0)
                    .eventsCreated(0)
                    .statusMessage("Không có sinh viên nào kích hoạt theo dõi nhóm Zalo này")
                    .build();
        }

        Instant now = currentDatetime != null ? currentDatetime : Instant.now();
        String effectiveMessageId = messageId != null && !messageId.isBlank()
                ? messageId
                : UUID.randomUUID().toString();

        List<ScheduleEventResponse> allCreatedEvents = new ArrayList<>();

        // 3. Xử lý cho từng sinh viên đã ghép nhóm này
        for (ZaloGroupMapping mapping : activeMappings) {
            User user = mapping.getUser();

            // Kiểm tra trùng lặp tin nhắn (idempotency)
            if (scheduleEventRepository.existsByUserIdAndSourceMessageId(user.getId(), effectiveMessageId)) {
                log.info("Message {} already processed for user {}, skipping", effectiveMessageId, user.getEmail());
                continue;
            }

            AiAnalyzeRequest aiRequest = AiAnalyzeRequest.builder()
                    .currentDatetime(now.toString())
                    .subjectName(mapping.getSubject().getName())
                    .defaultRoom(mapping.getSubject().getDefaultRoom())
                    .senderName(senderName)
                    .messageText(messageText)
                    .build();

            AiAnalyzeResponse aiResponse = aiEngineClient.analyzeMessage(aiRequest);

            if (!aiResponse.isAcademicAnnouncement() || aiResponse.getDetectedEvents() == null
                    || aiResponse.getDetectedEvents().isEmpty()) {
                log.info("AI determined message is not academic for subject '{}'", mapping.getSubject().getName());
                continue;
            }

            List<ScheduleEventResponse> userCreatedEvents = new ArrayList<>();

            for (AiDetectedEvent detected : aiResponse.getDetectedEvents()) {
                ScheduleEvent event = ScheduleEvent.builder()
                        .user(user)
                        .subject(mapping.getSubject())
                        .title(detected.getTitle())
                        .eventType(detected.getEventType() != null ? detected.getEventType() : EventType.MAKEUP_CLASS)
                        .startDatetime(detected.getStartDatetime())
                        .endDatetime(detected.getEndDatetime())
                        .room(detected.getRoom() != null && !detected.getRoom().isBlank()
                                ? detected.getRoom()
                                : mapping.getSubject().getDefaultRoom())
                        .source(EventSource.ZALO_AI)
                        .status(EventStatus.PENDING_REVIEW)
                        .aiConfidence(aiResponse.getConfidenceScore())
                        .note(detected.getNote())
                        .rawZaloMessage(messageText)
                        .senderName(senderName)
                        .sourceMessageId(effectiveMessageId)
                        .build();

                ScheduleEvent saved = scheduleEventRepository.save(event);
                ScheduleEventResponse eventResponse = ScheduleEventResponse.fromEntity(saved);
                userCreatedEvents.add(eventResponse);
                allCreatedEvents.add(eventResponse);
            }

            // Cập nhật thời điểm đồng bộ gần nhất của mapping
            mapping.setLastSyncedAt(Instant.now());
            mappingRepository.save(mapping);

            // 4. Bắn WebSocket Real-time đến STOMP destination: /user/queue/schedule
            if (!userCreatedEvents.isEmpty()) {
                ScheduleNotificationDTO notification = ScheduleNotificationDTO.builder()
                        .type("SCHEDULE_EVENTS_DETECTED")
                        .message("Phát hiện " + userCreatedEvents.size() + " sự kiện học vụ mới từ nhóm " + mapping.getZaloGroupName())
                        .zaloGroupName(mapping.getZaloGroupName())
                        .subjectName(mapping.getSubject().getName())
                        .events(userCreatedEvents)
                        .timestamp(Instant.now())
                        .build();

                try {
                    messagingTemplate.convertAndSendToUser(
                            user.getEmail(),
                            "/queue/schedule",
                            notification
                    );
                    log.info("Sent WebSocket notification to user {} at /user/queue/schedule", user.getEmail());
                } catch (Exception wsEx) {
                    log.warn("Failed to push WebSocket notification to user {}: {}", user.getEmail(), wsEx.getMessage());
                }
            }
        }

        return ZaloProcessResultDTO.builder()
                .zaloGroupId(zaloGroupId)
                .matchedFilter(true)
                .matchedMappings(activeMappings.size())
                .eventsCreated(allCreatedEvents.size())
                .createdEvents(allCreatedEvents)
                .statusMessage("Đã phân tích thành công và tạo " + allCreatedEvents.size() + " sự kiện trên thời khóa biểu")
                .build();
    }
}
