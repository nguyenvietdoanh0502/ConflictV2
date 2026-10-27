package com.conflict.be.modules.material.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.material.dto.AiProcessMaterialResponse;
import com.conflict.be.modules.material.dto.MaterialUploadRequest;
import com.conflict.be.modules.material.dto.MemoryMatchPairDTO;
import com.conflict.be.modules.material.dto.QuizQuestionDTO;
import com.conflict.be.modules.material.dto.StudyMaterialResponse;
import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import com.conflict.be.modules.material.enums.MaterialProcessingStatus;
import com.conflict.be.modules.material.repository.StudyMaterialRepository;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.zalo.client.AiEngineClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyMaterialServiceTest {

    @Mock
    private StudyMaterialRepository studyMaterialRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiEngineClient aiEngineClient;

    @InjectMocks
    private StudyMaterialService studyMaterialService;

    private User testUser;
    private Subject testSubject;
    private UUID userId;
    private UUID subjectId;
    private UUID materialId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        subjectId = UUID.randomUUID();
        materialId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("student@unisync.edu.vn")
                .fullName("Nguyễn Việt Doanh")
                .build();

        testSubject = Subject.builder()
                .id(subjectId)
                .user(testUser)
                .name("Lập trình Web")
                .code("IT3080")
                .build();
    }

    @Test
    @DisplayName("Upload tài liệu hợp lệ và AI sinh Minigame thành công")
    void uploadAndProcessMaterial_success() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "de_cuong_web.pdf",
                "application/pdf",
                "Nội dung đề cương lập trình web với Spring Boot".getBytes()
        );

        MaterialUploadRequest request = new MaterialUploadRequest();
        request.setSubjectId(subjectId);
        request.setTitle("Đề cương giữa kỳ");
        request.setFile(file);

        com.conflict.be.modules.material.dto.AiSummarizeResponse aiResponse = com.conflict.be.modules.material.dto.AiSummarizeResponse.builder()
                .summaryMarkdown("## 1. Khái niệm cốt lõi\nSpring Boot...")
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(testSubject));
        when(aiEngineClient.summarizeMaterial(any(), any(), any())).thenReturn(aiResponse);
        when(studyMaterialRepository.save(any(StudyMaterialEntity.class))).thenAnswer(invocation -> {
            StudyMaterialEntity saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(materialId);
            }
            return saved;
        });

        StudyMaterialResponse response = studyMaterialService.uploadAndProcessMaterial(testUser.getEmail(), request);

        assertNotNull(response);
        assertEquals("Đề cương giữa kỳ", response.getTitle());
        assertEquals("PDF", response.getFileType());
        assertEquals(MaterialProcessingStatus.COMPLETED, response.getProcessingStatus());
        assertNotNull(response.getAiSummaryMarkdown());
        verify(studyMaterialRepository, atLeastOnce()).save(any());
    }

    @Test
    @DisplayName("Khởi tạo Minigames từ bản tóm tắt đề cương thành công (Giai đoạn 2)")
    void generateMinigames_success() {
        StudyMaterialEntity existing = StudyMaterialEntity.builder()
                .id(materialId)
                .user(testUser)
                .subject(testSubject)
                .title("Đề cương giữa kỳ")
                .fileName("de_cuong.pdf")
                .fileType("PDF")
                .fileSize(1024L)
                .aiSummaryMarkdown("## 1. Khái niệm cốt lõi\nSpring Boot...")
                .processingStatus(MaterialProcessingStatus.COMPLETED)
                .build();

        com.conflict.be.modules.material.dto.AiGenerateMinigamesResponse minigamesResponse = com.conflict.be.modules.material.dto.AiGenerateMinigamesResponse.builder()
                .speedQuiz(List.of(
                        QuizQuestionDTO.builder()
                                .question("Spring Boot dùng Annotation nào để tạo REST controller?")
                                .options(List.of("@Controller", "@RestController", "@Service", "@Component"))
                                .correctIndex(1)
                                .explanation("@RestController kết hợp @Controller và @ResponseBody")
                                .build()
                ))
                .memoryMatchPairs(List.of(
                        MemoryMatchPairDTO.builder()
                                .pairId(1)
                                .term("HTTP 200")
                                .definition("Thành công")
                                .build()
                ))
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(studyMaterialRepository.findById(materialId)).thenReturn(Optional.of(existing));
        when(aiEngineClient.generateMinigames(any(), any())).thenReturn(minigamesResponse);
        when(studyMaterialRepository.save(any(StudyMaterialEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StudyMaterialResponse response = studyMaterialService.generateMinigames(testUser.getEmail(), materialId);

        assertNotNull(response);
        assertEquals(1, response.getQuizData().size());
        assertEquals(1, response.getMemoryMatchData().size());
        verify(studyMaterialRepository, atLeastOnce()).save(any());
    }

    @Test
    @DisplayName("Ném lỗi khi môn học không tồn tại")
    void uploadAndProcessMaterial_subjectNotFound() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());
        MaterialUploadRequest request = new MaterialUploadRequest();
        request.setSubjectId(subjectId);
        request.setFile(file);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findById(subjectId)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                studyMaterialService.uploadAndProcessMaterial(testUser.getEmail(), request)
        );
        assertEquals(ErrorCode.SUBJECT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném lỗi khi môn học thuộc về người dùng khác")
    void uploadAndProcessMaterial_forbidden() {
        User otherUser = User.builder().id(UUID.randomUUID()).build();
        Subject otherSubject = Subject.builder().id(subjectId).user(otherUser).name("Khác").build();

        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "data".getBytes());
        MaterialUploadRequest request = new MaterialUploadRequest();
        request.setSubjectId(subjectId);
        request.setFile(file);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(otherSubject));

        AppException ex = assertThrows(AppException.class, () ->
                studyMaterialService.uploadAndProcessMaterial(testUser.getEmail(), request)
        );
        assertEquals(ErrorCode.SUBJECT_FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ném lỗi khi tải lên định dạng file không được hỗ trợ")
    void uploadAndProcessMaterial_invalidExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "virus.exe", "application/octet-stream", "data".getBytes());
        MaterialUploadRequest request = new MaterialUploadRequest();
        request.setSubjectId(subjectId);
        request.setFile(file);

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findById(subjectId)).thenReturn(Optional.of(testSubject));

        AppException ex = assertThrows(AppException.class, () ->
                studyMaterialService.uploadAndProcessMaterial(testUser.getEmail(), request)
        );
        assertEquals(ErrorCode.INVALID_MATERIAL_FILE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Xóa tài liệu thành công")
    void deleteMaterial_success() {
        StudyMaterialEntity entity = StudyMaterialEntity.builder()
                .id(materialId)
                .user(testUser)
                .subject(testSubject)
                .title("Tài liệu")
                .fileName("test.pdf")
                .fileType("PDF")
                .fileSize(100L)
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(studyMaterialRepository.findById(materialId)).thenReturn(Optional.of(entity));

        studyMaterialService.deleteMaterial(testUser.getEmail(), materialId);

        verify(studyMaterialRepository).delete(entity);
    }
}
