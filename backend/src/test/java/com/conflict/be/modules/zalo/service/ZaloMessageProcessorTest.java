package com.conflict.be.modules.zalo.service;

import com.conflict.be.modules.schedule.dto.ScheduleEventResponse;
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

    @Mock
    private com.conflict.be.modules.notification.service.NotificationService notificationService;

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

    @Test
    @DisplayName("Nên cập nhật sự kiện cũ thành CANCELLED_CLASS và PENDING_REVIEW khi báo nghỉ học, không sinh sự kiện mới")
    void shouldAttachCancellationToExistingEventInsteadOfCreatingNew() {
        String msg = "Thứ 4 tuần này lớp Lập trình Web được nghỉ học nhé";
        when(keywordFilter.isLikelyAcademic(msg)).thenReturn(true);
        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-101"))
                .thenReturn(List.of(testMapping));
        when(scheduleEventRepository.existsByUserIdAndSourceMessageId(eq(testUser.getId()), anyString()))
                .thenReturn(false);

        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        // Sự kiện học thường đã có sẵn trên TKB
        ScheduleEvent existingClass = ScheduleEvent.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .subject(testSubject)
                .title("Lập trình Web")
                .eventType(EventType.REGULAR_CLASS)
                .startDatetime(start)
                .endDatetime(end)
                .room("401-A1")
                .build();

        when(scheduleEventRepository.findByUserIdAndSubjectIdAndDateRange(eq(testUser.getId()), eq(testSubject.getId()), any(), any()))
                .thenReturn(List.of(existingClass));

        AiDetectedEvent cancelDetected = AiDetectedEvent.builder()
                .eventType(EventType.CANCELLED_CLASS)
                .title("Nghỉ học: Lập trình Web")
                .startDatetime(start)
                .endDatetime(end)
                .room("401-A1")
                .note("Giảng viên báo nghỉ")
                .build();

        AiAnalyzeResponse aiResponse = AiAnalyzeResponse.builder()
                .academicAnnouncement(true)
                .confidenceScore(0.98)
                .detectedEvents(List.of(cancelDetected))
                .build();

        when(aiEngineClient.analyzeMessage(any(AiAnalyzeRequest.class))).thenReturn(aiResponse);
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101", "msg-cancel-1", "Giảng viên", msg, Instant.now()
        );

        assertEquals(1, result.getEventsCreated());
        // Kiểm tra sự kiện trả về chính là existingClass đã được cập nhật
        assertEquals(existingClass.getId(), result.getCreatedEvents().get(0).getId());
        assertEquals(EventType.CANCELLED_CLASS, existingClass.getEventType());
        assertEquals(EventType.REGULAR_CLASS, existingClass.getOriginalEventType());
        assertEquals(com.conflict.be.modules.schedule.enums.EventStatus.PENDING_REVIEW, existingClass.getStatus());
    }

    @Test
    @DisplayName("Nên cập nhật phòng học mới và lưu originalRoom cho sự kiện cũ khi đổi phòng học, không sinh sự kiện mới")
    void shouldUpdateExistingEventRoomInsteadOfCreatingNewOnRoomChange() {
        String msg = "Lớp Lập trình Web ngày mai chuyển sang phòng 502-A2 nhé";
        when(keywordFilter.isLikelyAcademic(msg)).thenReturn(true);
        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-101"))
                .thenReturn(List.of(testMapping));
        when(scheduleEventRepository.existsByUserIdAndSourceMessageId(eq(testUser.getId()), anyString()))
                .thenReturn(false);

        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        ScheduleEvent existingClass = ScheduleEvent.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .subject(testSubject)
                .title("Lập trình Web")
                .eventType(EventType.REGULAR_CLASS)
                .startDatetime(start)
                .endDatetime(end)
                .room("401-A1")
                .build();

        when(scheduleEventRepository.findByUserIdAndSubjectIdAndDateRange(eq(testUser.getId()), eq(testSubject.getId()), any(), any()))
                .thenReturn(List.of(existingClass));

        AiDetectedEvent roomChangeDetected = AiDetectedEvent.builder()
                .eventType(EventType.ROOM_CHANGE)
                .title("Đổi phòng: Lập trình Web")
                .startDatetime(start)
                .endDatetime(end)
                .room("502-A2")
                .note("Đổi sang phòng 502-A2")
                .build();

        AiAnalyzeResponse aiResponse = AiAnalyzeResponse.builder()
                .academicAnnouncement(true)
                .confidenceScore(0.99)
                .detectedEvents(List.of(roomChangeDetected))
                .build();

        when(aiEngineClient.analyzeMessage(any(AiAnalyzeRequest.class))).thenReturn(aiResponse);
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101", "msg-room-1", "Lớp trưởng", msg, Instant.now()
        );

        assertEquals(1, result.getEventsCreated());
        assertEquals(existingClass.getId(), result.getCreatedEvents().get(0).getId());
        assertEquals("502-A2", existingClass.getRoom());
        assertEquals("401-A1", existingClass.getOriginalRoom());
        assertEquals(com.conflict.be.modules.schedule.enums.EventStatus.PENDING_REVIEW, existingClass.getStatus());
    }

    @Test
    @DisplayName("Tin nhắn hình ảnh (không có từ khóa học vụ) vẫn được bỏ qua bộ lọc từ khóa và tạo sự kiện thành công")
    void testProcessMessage_WithImage_BypassesKeywordFilterAndCreatesEvents() {
        String shortCaption = "gửi mn"; // Không có từ khóa học vụ
        String dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        String imageUrl = "https://res-zalo.zadn.vn/test-tkb.jpg";

        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-101"))
                .thenReturn(List.of(testMapping));
        when(scheduleEventRepository.existsByUserIdAndSourceMessageId(any(), any()))
                .thenReturn(false);

        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        AiDetectedEvent imageDetectedEvent = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Học bù từ ảnh TKB: Lập trình Web")
                .startDatetime(start)
                .endDatetime(end)
                .room("302-A1")
                .note("Bóc tách từ ảnh thời khóa biểu Zalo")
                .build();

        AiAnalyzeResponse aiResponse = AiAnalyzeResponse.builder()
                .academicAnnouncement(true)
                .confidenceScore(0.95)
                .detectedEvents(List.of(imageDetectedEvent))
                .build();

        when(aiEngineClient.analyzeMessage(any(AiAnalyzeRequest.class))).thenReturn(aiResponse);
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101",
                "msg-img-001",
                "Giảng viên",
                shortCaption,
                imageUrl,
                dummyBase64,
                "image/jpeg",
                Instant.now()
        );

        assertTrue(result.isMatchedFilter());
        assertEquals(1, result.getEventsCreated());
        assertEquals(1, result.getCreatedEvents().size());
        ScheduleEventResponse created = result.getCreatedEvents().get(0);
        assertTrue(created.getRawZaloMessage().contains("🖼️ [Hình ảnh]"));
        assertEquals(imageUrl, created.getRawZaloImageUrl());
        assertEquals(EventType.MAKEUP_CLASS, created.getEventType());
        assertEquals(com.conflict.be.modules.schedule.enums.EventStatus.PENDING_REVIEW, created.getStatus());

        // Xác nhận aiEngineClient đã nhận được imageBase64 và imageUrl
        verify(aiEngineClient).analyzeMessage(argThat(req ->
                dummyBase64.equals(req.getImageBase64()) && imageUrl.equals(req.getImageUrl())
        ));
    }

    @Test
    @DisplayName("Kiểm tra xác định ca học theo chữ cái đầu của Tên sinh viên (A-L: Ca 1, M-Z: Ca 2)")
    void testDetermineStudentShift() {
        assertEquals(1, ZaloMessageProcessor.determineStudentShift("Nguyễn Việt Doanh")); // Doanh -> D -> Ca 1
        assertEquals(1, ZaloMessageProcessor.determineStudentShift("Trần Anh")); // Anh -> A -> Ca 1
        assertEquals(1, ZaloMessageProcessor.determineStudentShift("Nguyễn Thị Ánh")); // Ánh -> A -> Ca 1
        assertEquals(1, ZaloMessageProcessor.determineStudentShift("Lê Văn Đạt")); // Đạt -> Đ -> Ca 1
        assertEquals(1, ZaloMessageProcessor.determineStudentShift("Đỗ Hải Lâm")); // Lâm -> L -> Ca 1

        assertEquals(2, ZaloMessageProcessor.determineStudentShift("Lê Minh Tuấn")); // Tuấn -> T -> Ca 2
        assertEquals(2, ZaloMessageProcessor.determineStudentShift("Phạm Mai")); // Mai -> M -> Ca 2
        assertEquals(2, ZaloMessageProcessor.determineStudentShift("Hoàng Yến")); // Yến -> Y -> Ca 2
        assertEquals(2, ZaloMessageProcessor.determineStudentShift("Bùi Đức Thịnh")); // Thịnh -> T -> Ca 2
        assertEquals(2, ZaloMessageProcessor.determineStudentShift("Vũ Thị Út")); // Út -> U -> Ca 2
    }

    @Test
    @DisplayName("Tuyệt đối không xếp cả 2 ca vào lịch học - Sinh viên nhóm A-L chỉ nhận Ca 1")
    void testTwoShiftsSplit_StudentInGroupAtoL_OnlyCa1Scheduled() {
        testUser.setFullName("Nguyễn Việt Doanh");
        when(keywordFilter.isLikelyAcademic(anyString())).thenReturn(true);
        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-101"))
                .thenReturn(List.of(testMapping));
        when(scheduleEventRepository.existsByUserIdAndSourceMessageId(any(UUID.class), anyString()))
                .thenReturn(false);

        Instant start1 = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end1 = start1.plus(2, ChronoUnit.HOURS);
        Instant start2 = start1.plus(4, ChronoUnit.HOURS);
        Instant end2 = start2.plus(2, ChronoUnit.HOURS);

        AiDetectedEvent eventCa1 = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Lịch học: Lập trình Web - Ca 1 (Tiết 1-3)")
                .startDatetime(start1)
                .endDatetime(end1)
                .room("401-A1")
                .note("Ca 1 dành cho sinh viên có tên từ A-L")
                .build();

        AiDetectedEvent eventCa2 = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Lịch học: Lập trình Web - Ca 2 (Tiết 4-6)")
                .startDatetime(start2)
                .endDatetime(end2)
                .room("401-A1")
                .note("Ca 2 dành cho sinh viên có tên từ M-Z")
                .build();

        // Giả lập AI trả về cả 2 ca
        AiAnalyzeResponse aiResponse = AiAnalyzeResponse.builder()
                .academicAnnouncement(true)
                .confidenceScore(0.95)
                .detectedEvents(List.of(eventCa1, eventCa2))
                .build();

        when(aiEngineClient.analyzeMessage(any(AiAnalyzeRequest.class))).thenReturn(aiResponse);
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101",
                "msg-shift-001",
                "Lớp trưởng",
                "Lớp chia làm 2 ca: Ca 1 từ A-L học sáng, Ca 2 từ M-Z học chiều",
                Instant.now()
        );

        assertTrue(result.isMatchedFilter());
        // Tuyệt đối chỉ có 1 ca được xếp
        assertEquals(1, result.getEventsCreated());
        assertEquals(1, result.getCreatedEvents().size());
        assertTrue(result.getCreatedEvents().get(0).getTitle().contains("Ca 1"));
        assertFalse(result.getCreatedEvents().get(0).getTitle().contains("Ca 2"));

        verify(scheduleEventRepository, times(1)).save(any(ScheduleEvent.class));
    }

    @Test
    @DisplayName("Tuyệt đối không xếp cả 2 ca vào lịch học - Sinh viên nhóm M-Z chỉ nhận Ca 2")
    void testTwoShiftsSplit_StudentInGroupMtoZ_OnlyCa2Scheduled() {
        testUser.setFullName("Lê Minh Tuấn");
        when(keywordFilter.isLikelyAcademic(anyString())).thenReturn(true);
        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-101"))
                .thenReturn(List.of(testMapping));
        when(scheduleEventRepository.existsByUserIdAndSourceMessageId(any(UUID.class), anyString()))
                .thenReturn(false);

        Instant start1 = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end1 = start1.plus(2, ChronoUnit.HOURS);
        Instant start2 = start1.plus(4, ChronoUnit.HOURS);
        Instant end2 = start2.plus(2, ChronoUnit.HOURS);

        AiDetectedEvent eventCa1 = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Lịch học: Lập trình Web - Ca 1 (Tiết 1-3)")
                .startDatetime(start1)
                .endDatetime(end1)
                .room("401-A1")
                .note("Ca 1 dành cho sinh viên có tên từ A-L")
                .build();

        AiDetectedEvent eventCa2 = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Lịch học: Lập trình Web - Ca 2 (Tiết 4-6)")
                .startDatetime(start2)
                .endDatetime(end2)
                .room("401-A1")
                .note("Ca 2 dành cho sinh viên có tên từ M-Z")
                .build();

        AiAnalyzeResponse aiResponse = AiAnalyzeResponse.builder()
                .academicAnnouncement(true)
                .confidenceScore(0.95)
                .detectedEvents(List.of(eventCa1, eventCa2))
                .build();

        when(aiEngineClient.analyzeMessage(any(AiAnalyzeRequest.class))).thenReturn(aiResponse);
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101",
                "msg-shift-002",
                "Lớp trưởng",
                "Lớp chia làm 2 ca: Ca 1 từ A-L học sáng, Ca 2 từ M-Z học chiều",
                Instant.now()
        );

        assertTrue(result.isMatchedFilter());
        // Tuyệt đối chỉ có 1 ca được xếp
        assertEquals(1, result.getEventsCreated());
        assertEquals(1, result.getCreatedEvents().size());
        assertTrue(result.getCreatedEvents().get(0).getTitle().contains("Ca 2"));
        assertFalse(result.getCreatedEvents().get(0).getTitle().contains("Ca 1"));

        verify(scheduleEventRepository, times(1)).save(any(ScheduleEvent.class));
    }

    @Test
    @DisplayName("Tuyệt đối không xếp cả 2 ca vào lịch học - 2 sự kiện từ ảnh TKB không có nhãn 'Ca 1'/'Ca 2'")
    void testTwoShiftsFromImageWithoutLabels_FilteredToSingleShift() {
        testUser.setFullName("Nguyễn Việt Doanh"); // Ca 1 (A-L)
        when(mappingRepository.findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-101"))
                .thenReturn(List.of(testMapping));
        when(scheduleEventRepository.existsByUserIdAndSourceMessageId(any(UUID.class), anyString()))
                .thenReturn(false);

        // Giả lập ảnh TKB được AI bóc tách ra 2 dòng cùng 1 ngày nhưng không chứa chữ 'Ca 1' hay 'Ca 2'
        Instant startEarly = Instant.parse("2026-10-28T00:00:00Z"); // 07:00 VN
        Instant endEarly = Instant.parse("2026-10-28T02:35:00Z");   // 09:35 VN
        Instant startLate = Instant.parse("2026-10-28T02:40:00Z");  // 09:40 VN
        Instant endLate = Instant.parse("2026-10-28T05:15:00Z");    // 12:15 VN

        AiDetectedEvent eventRow1 = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Lịch học: Lập trình Web (Tiết 1-3)")
                .startDatetime(startEarly)
                .endDatetime(endEarly)
                .room("401-A1")
                .note("Trích xuất từ bảng TKB")
                .build();

        AiDetectedEvent eventRow2 = AiDetectedEvent.builder()
                .eventType(EventType.MAKEUP_CLASS)
                .title("Lịch học: Lập trình Web (Tiết 4-6)")
                .startDatetime(startLate)
                .endDatetime(endLate)
                .room("401-A1")
                .note("Trích xuất từ bảng TKB")
                .build();

        AiAnalyzeResponse aiResponse = AiAnalyzeResponse.builder()
                .academicAnnouncement(true)
                .confidenceScore(0.95)
                .detectedEvents(List.of(eventRow1, eventRow2))
                .build();

        when(aiEngineClient.analyzeMessage(any(AiAnalyzeRequest.class))).thenReturn(aiResponse);
        when(scheduleEventRepository.save(any(ScheduleEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        ZaloProcessResultDTO result = messageProcessor.processMessage(
                "zalo-group-101",
                "msg-img-two-shifts",
                "Giảng viên",
                "Gửi ảnh TKB học bù",
                "https://example.com/tkb.png",
                "dummyBase64",
                "image/png",
                Instant.now()
        );

        assertTrue(result.isMatchedFilter());
        // Tuyệt đối chỉ xếp 1 ca vào lịch học (Ca 1 là ca sớm 07:00 cho sinh viên Doanh)
        assertEquals(1, result.getEventsCreated());
        assertEquals(1, result.getCreatedEvents().size());
        assertEquals("Lịch học: Lập trình Web (Tiết 1-3)", result.getCreatedEvents().get(0).getTitle());
        assertEquals(startEarly, result.getCreatedEvents().get(0).getStartDatetime());

        verify(scheduleEventRepository, times(1)).save(any(ScheduleEvent.class));
    }
}
