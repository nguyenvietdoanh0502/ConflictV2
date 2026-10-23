package com.conflict.be.modules.schedule;

import com.conflict.be.modules.auth.service.MailService;
import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventSource;
import com.conflict.be.modules.schedule.enums.EventStatus;
import com.conflict.be.modules.schedule.enums.EventType;
import com.conflict.be.modules.schedule.repository.ScheduleEventRepository;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.enums.Gender;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.zalo.entity.ZaloGroupMapping;
import com.conflict.be.modules.zalo.repository.ZaloGroupMappingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Phase 1 Integration Tests: Subject, Zalo Mapping & Schedule Repositories")
class ScheduleModuleRepositoryTest {

    @MockBean
    private MailService mailService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ZaloGroupMappingRepository zaloGroupMappingRepository;

    @Autowired
    private ScheduleEventRepository scheduleEventRepository;

    private User testUser;
    private Subject webDevSubject;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(
                User.builder()
                        .email("student_test@example.com")
                        .fullName("Nguyễn Văn Test")
                        .pinCode("TEST-9999")
                        .gender(Gender.MALE)
                        .status(AccountStatus.ACTIVE)
                        .zaloConnected(true)
                        .build()
        );

        webDevSubject = subjectRepository.save(
                Subject.builder()
                        .user(testUser)
                        .name("Lập trình Web")
                        .code("IT4409")
                        .lecturer("TS. Nguyễn Văn A")
                        .defaultRoom("401-A1")
                        .colorHex("#7C6EE6")
                        .dayOfWeek(2)
                        .startTime(LocalTime.of(7, 0))
                        .endTime(LocalTime.of(9, 30))
                        .semester("2026-1")
                        .semesterStartDate(LocalDate.of(2026, 9, 1))
                        .semesterEndDate(LocalDate.of(2026, 12, 31))
                        .build()
        );
    }

    @Test
    @DisplayName("Should save and query Subject correctly")
    void testSubjectCrud() {
        List<Subject> subjects = subjectRepository.findByUserIdOrderByNameAsc(testUser.getId());
        assertThat(subjects).hasSize(1);
        assertThat(subjects.get(0).getName()).isEqualTo("Lập trình Web");
        assertThat(subjects.get(0).getCode()).isEqualTo("IT4409");

        boolean existsName = subjectRepository.existsByUserIdAndNameIgnoreCase(testUser.getId(), "lập trình web");
        assertThat(existsName).isTrue();

        boolean existsCode = subjectRepository.existsByUserIdAndCodeIgnoreCase(testUser.getId(), "it4409");
        assertThat(existsCode).isTrue();

        Optional<Subject> found = subjectRepository.findByIdAndUserId(webDevSubject.getId(), testUser.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getDefaultRoom()).isEqualTo("401-A1");
    }

    @Test
    @DisplayName("Should save and query ZaloGroupMapping by group id and user")
    void testZaloGroupMappingCrud() {
        ZaloGroupMapping mapping = zaloGroupMappingRepository.save(
                ZaloGroupMapping.builder()
                        .user(testUser)
                        .subject(webDevSubject)
                        .zaloGroupId("zalo-group-it4409")
                        .zaloGroupName("Nhóm Lập trình Web K64")
                        .active(true)
                        .build()
        );

        Optional<ZaloGroupMapping> found = zaloGroupMappingRepository.findByIdAndUserId(mapping.getId(), testUser.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getZaloGroupName()).isEqualTo("Nhóm Lập trình Web K64");
        assertThat(found.get().isActive()).isTrue();

        List<ZaloGroupMapping> activeMappings = zaloGroupMappingRepository
                .findAllActiveByZaloGroupIdWithSubjectAndUser("zalo-group-it4409");
        assertThat(activeMappings).hasSize(1);
        assertThat(activeMappings.get(0).getSubject().getName()).isEqualTo("Lập trình Web");
        assertThat(activeMappings.get(0).getUser().getEmail()).isEqualTo("student_test@example.com");

        boolean exists = zaloGroupMappingRepository.existsByUserIdAndZaloGroupId(testUser.getId(), "zalo-group-it4409");
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("Should save and filter ScheduleEvents by time range and source")
    void testScheduleEventCrudAndDateRange() {
        Instant now = Instant.now();
        Instant event1Start = now.plus(1, ChronoUnit.DAYS);
        Instant event1End = event1Start.plus(2, ChronoUnit.HOURS);

        Instant event2Start = now.plus(3, ChronoUnit.DAYS);
        Instant event2End = event2Start.plus(2, ChronoUnit.HOURS);

        Instant outsideStart = now.plus(10, ChronoUnit.DAYS);
        Instant outsideEnd = outsideStart.plus(2, ChronoUnit.HOURS);

        // Event 1: Makeup class created by AI
        scheduleEventRepository.save(
                ScheduleEvent.builder()
                        .user(testUser)
                        .subject(webDevSubject)
                        .title("Học bù: Lập trình Web")
                        .eventType(EventType.MAKEUP_CLASS)
                        .startDatetime(event1Start)
                        .endDatetime(event1End)
                        .room("305-A2")
                        .source(EventSource.ZALO_AI)
                        .status(EventStatus.PENDING_REVIEW)
                        .aiConfidence(0.96)
                        .rawZaloMessage("Thứ 7 tuần này nghỉ học bù sang sáng thứ 2...")
                        .senderName("Lớp trưởng Nam")
                        .sourceMessageId("msg-1001")
                        .build()
        );

        // Event 2: Exam created manually
        scheduleEventRepository.save(
                ScheduleEvent.builder()
                        .user(testUser)
                        .subject(webDevSubject)
                        .title("Kiểm tra giữa kỳ")
                        .eventType(EventType.EXAM)
                        .startDatetime(event2Start)
                        .endDatetime(event2End)
                        .room("401-A1")
                        .source(EventSource.MANUAL)
                        .status(EventStatus.CONFIRMED)
                        .build()
        );

        // Event 3: Outside query window
        scheduleEventRepository.save(
                ScheduleEvent.builder()
                        .user(testUser)
                        .subject(webDevSubject)
                        .title("Deadline BTL")
                        .eventType(EventType.DEADLINE)
                        .startDatetime(outsideStart)
                        .endDatetime(outsideEnd)
                        .source(EventSource.MANUAL)
                        .status(EventStatus.CONFIRMED)
                        .build()
        );

        // Query range covering next 5 days
        Instant rangeFrom = now;
        Instant rangeTo = now.plus(5, ChronoUnit.DAYS);

        List<ScheduleEvent> events = scheduleEventRepository.findByUserIdAndDateRange(testUser.getId(), rangeFrom, rangeTo);
        assertThat(events).hasSize(2);
        assertThat(events.get(0).getTitle()).isEqualTo("Học bù: Lập trình Web");
        assertThat(events.get(0).getEventType()).isEqualTo(EventType.MAKEUP_CLASS);
        assertThat(events.get(0).getSource()).isEqualTo(EventSource.ZALO_AI);
        assertThat(events.get(0).getStatus()).isEqualTo(EventStatus.PENDING_REVIEW);
        assertThat(events.get(0).getSubject().getName()).isEqualTo("Lập trình Web");

        assertThat(events.get(1).getTitle()).isEqualTo("Kiểm tra giữa kỳ");
        assertThat(events.get(1).getEventType()).isEqualTo(EventType.EXAM);

        // Check deduplication helper
        boolean duplicateMsg = scheduleEventRepository.existsByUserIdAndSourceMessageId(testUser.getId(), "msg-1001");
        assertThat(duplicateMsg).isTrue();

        boolean nonExistentMsg = scheduleEventRepository.existsByUserIdAndSourceMessageId(testUser.getId(), "msg-9999");
        assertThat(nonExistentMsg).isFalse();

        // Check pending count
        long pendingCount = scheduleEventRepository.countByUserIdAndStatus(testUser.getId(), EventStatus.PENDING_REVIEW);
        assertThat(pendingCount).isEqualTo(1);
    }
}
