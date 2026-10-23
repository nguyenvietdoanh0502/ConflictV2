package com.conflict.be.modules.zalo.service;

import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventType;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.zalo.client.AiEngineClient;
import com.conflict.be.modules.zalo.dto.ZaloProcessResultDTO;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeRequest;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeResponse;
import com.conflict.be.modules.zalo.dto.ai.AiDetectedEvent;
import com.conflict.be.modules.zalo.entity.ZaloGroupMapping;
import com.conflict.be.modules.zalo.filter.ZaloKeywordFilter;
import com.conflict.be.modules.zalo.repository.ZaloGroupMappingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ZaloMessageProcessorTest {

    @Mock
    private ZaloKeywordFilter keywordFilter;

    @Mock
    private ZaloGroupMappingRepository mappingRepository;

    @Mock
    private ScheduleEventRepository scheduleEventRepository;

    @Mock
    private AiEngineClient aiEngineClient;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ZaloMessageProcessor messageProcessor;

    private User testUser;
    private Subject testSubject;
    private ZaloGroupMapping testMapping;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("student@unisync.edu.vn")
                .status(AccountStatus.ACTIVE)
                .build();

        testSubject = Subject.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Lập trình Web")
                .defaultRoom("401-A1")
                .build();

        testMapping = ZaloGroupMapping.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .subject(testSubject)
                .zaloGroupId("zalo-group-101")
                .zaloGroupName("Lập trình Web - K64")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Nên bỏ qua tin nhắn khi bộ lọc từ khóa trả về false")
    void shouldDropMessageWhenKeywordFilterFails() {
        String msg = "Trưa nay ăn cơm không?";
        when(keywordFilter.isLikelyAcademic(msg)).thenReturn(false);

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101", "msg-1", "Tuấn", msg, Instant.now()
        );

        assertFalse(result.isMatchedFilter());
        assertEquals(0, result.getEventsCreated());
        verifyNoInteractions(mappingRepository);
        verifyNoInteractions(aiEngineClient);
    }

    @Test
    @DisplayName("Nên bỏ qua khi không có mapping active nào cho nhóm Zalo")
    void shouldDropWhenNoActiveMappingsFound() {
        String msg = "Thứ 2 tuần sau học bù nhé";
        when(keywordFilter.isLikelyAcademic(msg)).thenReturn(true);
        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-999"))
                .thenReturn(List.of());

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-999", "msg-2", "Tuấn", msg, Instant.now()
        );

        assertTrue(result.isMatchedFilter());
        assertEquals(0, result.getMatchedMappings());
        assertEquals(0, result.getEventsCreated());
        verifyNoInteractions(aiEngineClient);
    }

    @Test
    @DisplayName("Nên xử lý bóc tách thành công, lưu sự kiện vào DB và bắn WebSocket")
    void shouldProcessMessageAndCreateEventsSuccessfully() {
        String msg = "Ae chú ý sáng thứ 2 tuần sau học bù tiết 1-3 ở phòng 305-A2.";
        when(keywordFilter.isLikelyAcademic(msg)).thenReturn(true);
        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-101"))
                .thenReturn(List.of(testMapping));
        when(scheduleEventRepository.existsByUserIdAndSourceMessageId(eq(testUser.getId()), anyString()))
                .thenReturn(false);

        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        AiDetectedEvent detectedEvent = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Học bù: Lập trình Web (Tiết 1-3)")
                .startDatetime(start)
                .endDatetime(end)
                .room("305-A2")
                .note("Học bù tiết 1-3")
                .build();

        AiAnalyzeResponse aiResponse = AiAnalyzeResponse.builder()
                .academicAnnouncement(true)
                .confidenceScore(1.0)
                .detectedEvents(List.of(detectedEvent))
                .build();

        when(aiEngineClient.analyzeMessage(any(AiAnalyzeRequest.class))).thenReturn(aiResponse);
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(invocation -> {
            ScheduleEvent event = invocation.getArgument(0);
            event.setId(UUID.randomUUID());
            return event;
        });

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101", "msg-3", "Lớp trưởng", msg, Instant.now()
        );

        assertTrue(result.isMatchedFilter());
        assertEquals(1, result.getMatchedMappings());
        assertEquals(1, result.getEventsCreated());
        assertEquals(1, result.getCreatedEvents().size());
        assertEquals("Học bù: Lập trình Web (Tiết 1-3)", result.getCreatedEvents().get(0).getTitle());

        verify(scheduleEventRepository, times(1)).save(any(ScheduleEvent.class));
        verify(mappingRepository, times(1)).save(testMapping);
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq(testUser.getEmail()),
                eq("/queue/schedule"),
                any()
        );
    }
}
