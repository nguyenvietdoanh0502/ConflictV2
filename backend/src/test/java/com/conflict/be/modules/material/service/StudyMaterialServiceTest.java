package com.conflict.be.modules.material.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.chat.dto.ChatMessageDTO;
import com.conflict.be.modules.chat.dto.SendMessageRequest;
import com.conflict.be.modules.chat.repository.ChatMessageRepository;
import com.conflict.be.modules.chat.service.ChatService;
import com.conflict.be.modules.material.dto.*;
import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import com.conflict.be.modules.material.entity.StudyMaterialFileEntity;
import com.conflict.be.modules.material.enums.GameType;
import com.conflict.be.modules.material.enums.MaterialProcessingStatus;
import com.conflict.be.modules.material.repository.StudyMaterialFileRepository;
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

import java.nio.charset.StandardCharsets;
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
    private StudyMaterialFileRepository studyMaterialFileRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiEngineClient aiEngineClient;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ChatService chatService;

    @InjectMocks
    private StudyMaterialService studyMaterialService;

    private User testUser;
    private User friendUser;
    private Subject testSubject;
    private UUID userId;
    private UUID friendId;
    private UUID subjectId;
    private UUID materialId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        friendId = UUID.randomUUID();
        subjectId = UUID.randomUUID();
        materialId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("student@unisync.edu.vn")
                .fullName("Nguyễn Việt Doanh")
                .build();

        friendUser = User.builder()
                .id(friendId)
                .email("friend@unisync.edu.vn")
                .fullName("Trần Minh Quân")
                .build();

        testSubject = Subject.builder()
                .id(subjectId)
                .user(testUser)
                .name("Lập trình Web")
                .code("IT3080")
                .build();
    }

    @Test
    @DisplayName("Upload tài liệu hợp lệ, lưu file gốc + văn bản gốc và AI sinh tóm tắt thành công")
    void uploadAndProcessMaterial_success() {
        byte[] rawContent = "Nội dung đề cương lập trình web với Spring Boot".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "de_cuong_web.pdf",
                "application/pdf",
                rawContent
        );

        MaterialUploadRequest request = new MaterialUploadRequest();
        request.setSubjectId(subjectId);
        request.setTitle("Đề cương giữa kỳ");
        request.setFile(file);

        AiSummarizeResponse aiResponse = AiSummarizeResponse.builder()
                .summaryMarkdown("## 1. Khái niệm cốt lõi\nSpring Boot...")
                .extractedText("Nội dung đề cương lập trình web với Spring Boot")
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
        assertEquals("Nội dung đề cương lập trình web với Spring Boot", response.getExtractedText());
        assertTrue(response.isHasOriginalFile());
        assertTrue(response.isOwner());
        verify(studyMaterialFileRepository).save(any(StudyMaterialFileEntity.class));
        verify(studyMaterialRepository, atLeastOnce()).save(any());
    }

    @Test
    @DisplayName("Tải xuống bản gốc của đề cương thành công")
    void getMaterialFile_success() {
        byte[] pdfBytes = "%PDF-1.4 sample".getBytes(StandardCharsets.UTF_8);
        StudyMaterialEntity existing = StudyMaterialEntity.builder()
                .id(materialId)
                .user(testUser)
                .subject(testSubject)
                .title("Đề cương giữa kỳ")
                .fileName("de_cuong.pdf")
                .fileType("PDF")
                .fileSize((long) pdfBytes.length)
                .build();

        StudyMaterialFileEntity fileEntity = StudyMaterialFileEntity.builder()
                .materialId(materialId)
                .contentType("application/pdf")
                .fileData(pdfBytes)
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(studyMaterialRepository.findById(materialId)).thenReturn(Optional.of(existing));
        when(studyMaterialFileRepository.findById(materialId)).thenReturn(Optional.of(fileEntity));

        StudyMaterialService.MaterialFileDownload download = studyMaterialService.getMaterialFile(testUser.getEmail(), materialId);

        assertNotNull(download);
        assertEquals("de_cuong.pdf", download.fileName());
        assertEquals("application/pdf", download.contentType());
        assertArrayEquals(pdfBytes, download.data());
    }

    @Test
    @DisplayName("Bạn bè được chia sẻ đề cương có quyền xem chi tiết nhưng không có quyền xóa")
    void sharedMaterial_friendCanReadButCannotDelete() {
        StudyMaterialEntity existing = StudyMaterialEntity.builder()
                .id(materialId)
                .user(testUser)
                .subject(testSubject)
                .title("Đề cương giữa kỳ")
                .fileName("de_cuong.pdf")
                .fileType("PDF")
                .fileSize(1024L)
                .extractedText("Văn bản gốc")
                .aiSummaryMarkdown("## 1. Khái niệm cốt lõi")
                .processingStatus(MaterialProcessingStatus.COMPLETED)
                .build();

        when(userRepository.findByEmail(friendUser.getEmail())).thenReturn(Optional.of(friendUser));
        when(studyMaterialRepository.findById(materialId)).thenReturn(Optional.of(existing));
        when(chatMessageRepository.existsSharedMaterialAccess(materialId, friendId)).thenReturn(true);

        StudyMaterialResponse response = studyMaterialService.getMaterialById(friendUser.getEmail(), materialId);
        assertNotNull(response);
        assertFalse(response.isOwner());
        assertEquals("Nguyễn Việt Doanh", response.getOwnerName());

        // Nhưng bạn bè không được phép xóa
        AppException deleteEx = assertThrows(AppException.class, () ->
                studyMaterialService.deleteMaterial(friendUser.getEmail(), materialId)
        );
        assertEquals(ErrorCode.MATERIAL_FORBIDDEN, deleteEx.getErrorCode());
    }

    @Test
    @DisplayName("Chia sẻ đề cương và gửi lời mời thách đấu Minigame cho bạn bè thành công")
    void shareMaterial_success() {
        StudyMaterialEntity existing = StudyMaterialEntity.builder()
                .id(materialId)
                .user(testUser)
                .subject(testSubject)
                .title("Đề cương giữa kỳ")
                .fileName("de_cuong.pdf")
                .fileType("PDF")
                .fileSize(1024L)
                .processingStatus(MaterialProcessingStatus.COMPLETED)
                .build();

        ShareMaterialRequest shareReq = ShareMaterialRequest.builder()
                .recipientIds(List.of(friendId))
                .shareType("CHALLENGE_GAME")
                .challengeGameType(GameType.SPEED_QUIZ)
                .challengerScore(1250)
                .challengerTimeSeconds(45)
                .message("Vào đua top nào!")
                .build();

        ChatMessageDTO expectedMsg = ChatMessageDTO.builder()
                .id(UUID.randomUUID())
                .senderId(userId)
                .recipientId(friendId)
                .messageType("CHALLENGE_GAME")
                .challengeGameType(GameType.SPEED_QUIZ)
                .challengerScore(1250)
                .content("Vào đua top nào!")
                .build();

        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(studyMaterialRepository.findById(materialId)).thenReturn(Optional.of(existing));
        when(chatService.sendAndBroadcastMessage(eq(testUser.getEmail()), any(SendMessageRequest.class))).thenReturn(expectedMsg);

        List<ChatMessageDTO> sentList = studyMaterialService.shareMaterial(testUser.getEmail(), materialId, shareReq);

        assertEquals(1, sentList.size());
        assertEquals("CHALLENGE_GAME", sentList.get(0).getMessageType());
        assertEquals(1250, sentList.get(0).getChallengerScore());
        verify(chatService, times(1)).sendAndBroadcastMessage(eq(testUser.getEmail()), any(SendMessageRequest.class));
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

        AiGenerateMinigamesResponse minigamesResponse = AiGenerateMinigamesResponse.builder()
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

        verify(studyMaterialFileRepository).deleteById(materialId);
        verify(studyMaterialRepository).delete(entity);
    }
}
