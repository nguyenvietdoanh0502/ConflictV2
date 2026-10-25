package com.conflict.be.modules.zalo.service;

import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventSource;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.subject.entity.Subject;
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
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
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
            ScheduleEvent lastCancelledOldEvent = null;

            for (AiDetectedEvent detected : aiResponse.getDetectedEvents()) {
                EventType type = detected.getEventType() != null ? detected.getEventType() : EventType.MAKEUP_CLASS;

                boolean isCancellation = (type == EventType.CANCELLED_CLASS);
                boolean isRoomChange = (type == EventType.ROOM_CHANGE);

                // Phát hiện bổ sung nếu tin nhắn/note có từ khóa đổi phòng rõ rệt
                if (!isRoomChange && !isCancellation && detected.getRoom() != null && !detected.getRoom().isBlank()) {
                    String noteLower = (detected.getNote() != null ? detected.getNote() : "").toLowerCase();
                    String titleLower = (detected.getTitle() != null ? detected.getTitle() : "").toLowerCase();
                    String msgLower = messageText.toLowerCase();
                    if (noteLower.contains("đổi phòng") || titleLower.contains("đổi phòng")
                            || msgLower.contains("đổi phòng") || msgLower.contains("sang phòng") || msgLower.contains("chuyển sang phòng")) {
                        isRoomChange = true;
                    }
                }

                ScheduleEvent matchedEvent = findMatchingExistingEvent(
                        user,
                        mapping.getSubject(),
                        detected.getStartDatetime(),
                        detected.getEndDatetime()
                );

                if (isCancellation) {
                    // YÊU CẦU 1: với sự kiện được nghỉ học:
                    // Backend kiểm tra xem vào thời điểm đó có sự kiện gì trên thời khóa biểu,
                    // có trùng thời gian với thông báo nghỉ học không, có đúng là lớp học được thông báo không.
                    // Nếu đúng, sự kiện đó chuyển thành màu xám, độ trong suốt 70%, chờ người dùng duyệt.
                    if (matchedEvent != null) {
                        if (matchedEvent.getOriginalEventType() == null) {
                            matchedEvent.setOriginalEventType(matchedEvent.getEventType());
                        }
                        matchedEvent.setEventType(EventType.CANCELLED_CLASS);
                        matchedEvent.setStatus(EventStatus.PENDING_REVIEW);
                        matchedEvent.setSource(EventSource.ZALO_AI);
                        matchedEvent.setAiConfidence(aiResponse.getConfidenceScore());
                        matchedEvent.setRawZaloMessage(messageText);
                        matchedEvent.setSenderName(senderName);
                        matchedEvent.setSourceMessageId(effectiveMessageId);
                        matchedEvent.setNote(detected.getNote() != null && !detected.getNote().isBlank()
                                ? detected.getNote()
                                : "Giảng viên thông báo nghỉ học từ Zalo");

                        ScheduleEvent saved = scheduleEventRepository.save(matchedEvent);
                        lastCancelledOldEvent = saved;
                        ScheduleEventResponse eventResponse = ScheduleEventResponse.fromEntity(saved);
                        userCreatedEvents.add(eventResponse);
                        allCreatedEvents.add(eventResponse);
                        log.info("Attached cancellation notice to existing event '{}' (ID: {}) for user {}",
                                saved.getTitle(), saved.getId(), user.getEmail());
                    } else {
                        // Fallback nếu chưa có sự kiện môn học trên lịch: tạo sự kiện CANCELLED_CLASS mới
                        ScheduleEvent newCancelEvent = ScheduleEvent.builder()
                                .user(user)
                                .subject(mapping.getSubject())
                                .title(detected.getTitle() != null ? detected.getTitle() : ("Nghỉ học: " + mapping.getSubject().getName()))
                                .eventType(EventType.CANCELLED_CLASS)
                                .startDatetime(detected.getStartDatetime())
                                .endDatetime(detected.getEndDatetime())
                                .room(detected.getRoom() != null && !detected.getRoom().isBlank()
                                        ? detected.getRoom()
                                        : mapping.getSubject().getDefaultRoom())
                                .source(EventSource.ZALO_AI)
                                .status(EventStatus.PENDING_REVIEW)
                                .aiConfidence(aiResponse.getConfidenceScore())
                                .note(detected.getNote() != null ? detected.getNote() : "Thông báo nghỉ học từ Zalo")
                                .rawZaloMessage(messageText)
                                .senderName(senderName)
                                .sourceMessageId(effectiveMessageId)
                                .build();

                        ScheduleEvent saved = scheduleEventRepository.save(newCancelEvent);
                        lastCancelledOldEvent = saved;
                        ScheduleEventResponse eventResponse = ScheduleEventResponse.fromEntity(saved);
                        userCreatedEvents.add(eventResponse);
                        allCreatedEvents.add(eventResponse);
                    }
                } else if (isRoomChange) {
                    // YÊU CẦU 2: với sự kiện đổi phòng học:
                    // "không sinh sự kiện mới, chỉ update lại sự kiện cũ và đưa sự kiện vào trạng thái chờ duyệt"
                    String newRoom = detected.getRoom() != null && !detected.getRoom().isBlank()
                            ? detected.getRoom().trim()
                            : mapping.getSubject().getDefaultRoom();

                    if (matchedEvent != null) {
                        if (matchedEvent.getOriginalRoom() == null) {
                            matchedEvent.setOriginalRoom(matchedEvent.getRoom());
                        }
                        matchedEvent.setRoom(newRoom);
                        matchedEvent.setStatus(EventStatus.PENDING_REVIEW);
                        matchedEvent.setSource(EventSource.ZALO_AI);
                        matchedEvent.setAiConfidence(aiResponse.getConfidenceScore());
                        matchedEvent.setRawZaloMessage(messageText);
                        matchedEvent.setSenderName(senderName);
                        matchedEvent.setSourceMessageId(effectiveMessageId);
                        String roomNote = (detected.getNote() != null && !detected.getNote().isBlank())
                                ? detected.getNote()
                                : ("Đổi phòng học sang " + newRoom + (matchedEvent.getOriginalRoom() != null ? " (phòng cũ: " + matchedEvent.getOriginalRoom() + ")" : ""));
                        matchedEvent.setNote(roomNote);

                        ScheduleEvent saved = scheduleEventRepository.save(matchedEvent);
                        ScheduleEventResponse eventResponse = ScheduleEventResponse.fromEntity(saved);
                        userCreatedEvents.add(eventResponse);
                        allCreatedEvents.add(eventResponse);
                        log.info("Updated existing event with new room '{}' (ID: {}) for user {}",
                                newRoom, saved.getId(), user.getEmail());
                    } else {
                        // Fallback nếu chưa có sự kiện trên lịch: tạo sự kiện mới ở trạng thái PENDING_REVIEW
                        ScheduleEvent newRoomEvent = ScheduleEvent.builder()
                                .user(user)
                                .subject(mapping.getSubject())
                                .title(detected.getTitle() != null ? detected.getTitle() : ("Đổi phòng: " + mapping.getSubject().getName()))
                                .eventType(EventType.REGULAR_CLASS)
                                .startDatetime(detected.getStartDatetime())
                                .endDatetime(detected.getEndDatetime())
                                .room(newRoom)
                                .source(EventSource.ZALO_AI)
                                .status(EventStatus.PENDING_REVIEW)
                                .aiConfidence(aiResponse.getConfidenceScore())
                                .note(detected.getNote())
                                .rawZaloMessage(messageText)
                                .senderName(senderName)
                                .sourceMessageId(effectiveMessageId)
                                .build();

                        ScheduleEvent saved = scheduleEventRepository.save(newRoomEvent);
                        ScheduleEventResponse eventResponse = ScheduleEventResponse.fromEntity(saved);
                        userCreatedEvents.add(eventResponse);
                        allCreatedEvents.add(eventResponse);
                    }
                } else {
                    // YÊU CẦU 3: với sự kiện đổi thời gian học:
                    // "sinh sự kiện mới, sự kiện cũ xử lý như với trường hợp nghỉ học"
                    // (Sự kiện cũ đã được gắn hủy và lưu vào lastCancelledOldEvent ở trên)
                    ScheduleEvent event = ScheduleEvent.builder()
                            .user(user)
                            .subject(mapping.getSubject())
                            .relatedEvent(lastCancelledOldEvent)
                            .title(detected.getTitle())
                            .eventType(type)
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
                    log.info("Created new schedule event '{}' ({}) (ID: {}) for user {}",
                            saved.getTitle(), saved.getEventType(), saved.getId(), user.getEmail());
                }
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
                .statusMessage("Đã phân tích thành công và xử lý " + allCreatedEvents.size() + " sự kiện trên thời khóa biểu")
                .build();
    }

    /**
     * Tìm sự kiện hiện có trên thời khóa biểu của sinh viên khớp với môn học và thời gian được thông báo.
     */
    private ScheduleEvent findMatchingExistingEvent(
            User user,
            Subject subject,
            Instant detectedStart,
            Instant detectedEnd
    ) {
        if (user == null || subject == null || detectedStart == null) {
            return null;
        }

        ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDate targetDate = detectedStart.atZone(vnZone).toLocalDate();

        // Lấy khoảng thời gian của toàn bộ ngày đó (00:00:00 -> 23:59:59.999)
        Instant dayStart = targetDate.atStartOfDay(vnZone).toInstant();
        Instant dayEnd = targetDate.plusDays(1).atStartOfDay(vnZone).toInstant();

        // Tìm các sự kiện của user & subject trong ngày đó
        List<ScheduleEvent> eventsOnDay = scheduleEventRepository.findByUserIdAndSubjectIdAndDateRange(
                user.getId(),
                subject.getId(),
                dayStart,
                dayEnd
        ).stream()
         .filter(e -> e.getStatus() != EventStatus.REJECTED)
         .toList();

        if (eventsOnDay.isEmpty()) {
            return null;
        }

        if (eventsOnDay.size() == 1) {
            return eventsOnDay.get(0);
        }

        // Nếu có nhiều sự kiện của môn học trong ngày (vd: ca sáng và ca chiều)
        Instant effectiveEnd = detectedEnd != null ? detectedEnd : detectedStart.plus(2, ChronoUnit.HOURS);

        // 1. Tìm sự kiện giao nhau về mặt thời gian
        for (ScheduleEvent evt : eventsOnDay) {
            boolean overlaps = evt.getStartDatetime().isBefore(effectiveEnd)
                    && evt.getEndDatetime().isAfter(detectedStart);
            if (overlaps) {
                return evt;
            }
        }

        // 2. Nếu không giao nhau chính xác, chọn sự kiện có start time gần nhất
        ScheduleEvent closest = eventsOnDay.get(0);
        long minDiff = Math.abs(ChronoUnit.MINUTES.between(closest.getStartDatetime(), detectedStart));
        for (int i = 1; i < eventsOnDay.size(); i++) {
            ScheduleEvent cur = eventsOnDay.get(i);
            long diff = Math.abs(ChronoUnit.MINUTES.between(cur.getStartDatetime(), detectedStart));
            if (diff < minDiff) {
                minDiff = diff;
                closest = cur;
            }
        }

        return closest;
    }
}
