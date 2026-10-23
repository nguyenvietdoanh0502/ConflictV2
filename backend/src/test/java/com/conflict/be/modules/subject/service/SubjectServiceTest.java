package com.conflict.be.modules.subject.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.subject.dto.SubjectRequest;
import com.conflict.be.modules.subject.dto.SubjectResponse;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubjectServiceTest {

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SubjectService subjectService;

    private User testUser;
    private Subject testSubject;
    private UUID userId;
    private UUID subjectId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        subjectId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("student@unisync.edu.vn")
                .fullName("Sinh Vien Test")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        testSubject = Subject.builder()
                .id(subjectId)
                .user(testUser)
                .name("Lập trình Web")
                .code("IT101")
                .defaultRoom("401-A1")
                .colorHex("#7C6EE6")
                .dayOfWeek(2)
                .startTime(LocalTime.of(7, 0))
                .endTime(LocalTime.of(9, 35))
                .build();
    }

    @Test
    @DisplayName("Nên lấy danh sách môn học của user thành công")
    void shouldGetMySubjectsSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByUserIdOrderByNameAsc(userId)).thenReturn(List.of(testSubject));

        List<SubjectResponse> responses = subjectService.getMySubjects(testUser.getEmail());

        assertEquals(1, responses.size());
        assertEquals("Lập trình Web", responses.get(0).getName());
        assertEquals("IT101", responses.get(0).getCode());
    }

    @Test
    @DisplayName("Nên tạo môn học mới thành công khi không bị trùng tên")
    void shouldCreateSubjectSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.existsByUserIdAndNameIgnoreCase(userId, "Cơ sở dữ liệu")).thenReturn(false);
        when(subjectRepository.save(any(Subject.class))).thenAnswer(invocation -> {
            Subject s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        SubjectRequest request = SubjectRequest.builder()
                .name("Cơ sở dữ liệu")
                .code("IT102")
                .defaultRoom("203-A2")
                .dayOfWeek(4)
                .build();

        SubjectResponse response = subjectService.createSubject(testUser.getEmail(), request);

        assertNotNull(response);
        assertEquals("Cơ sở dữ liệu", response.getName());
        assertEquals("IT102", response.getCode());
        verify(subjectRepository, times(1)).save(any(Subject.class));
    }

    @Test
    @DisplayName("Nên ném ngoại lệ khi tạo môn học trùng tên")
    void shouldThrowWhenCreatingDuplicateSubject() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.existsByUserIdAndNameIgnoreCase(userId, "Lập trình Web")).thenReturn(true);

        SubjectRequest request = SubjectRequest.builder()
                .name("Lập trình Web")
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> subjectService.createSubject(testUser.getEmail(), request));

        assertEquals(ErrorCode.SUBJECT_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Nên xóa môn học thành công khi thuộc sở hữu của user")
    void shouldDeleteSubjectSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByIdAndUserId(subjectId, userId)).thenReturn(Optional.of(testSubject));

        assertDoesNotThrow(() -> subjectService.deleteSubject(testUser.getEmail(), subjectId));
        verify(subjectRepository, times(1)).delete(testSubject);
    }
}
