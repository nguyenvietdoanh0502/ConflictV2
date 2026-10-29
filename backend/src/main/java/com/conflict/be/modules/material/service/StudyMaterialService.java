package com.conflict.be.modules.material.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.chat.dto.ChatMessageDTO;
import com.conflict.be.modules.chat.dto.SendMessageRequest;
import com.conflict.be.modules.chat.repository.ChatMessageRepository;
import com.conflict.be.modules.chat.service.ChatService;
import com.conflict.be.modules.material.dto.AiProcessMaterialResponse;
import com.conflict.be.modules.material.dto.MaterialUploadRequest;
import com.conflict.be.modules.material.dto.ShareMaterialRequest;
import com.conflict.be.modules.material.dto.StudyMaterialResponse;
import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import com.conflict.be.modules.material.entity.StudyMaterialFileEntity;
import com.conflict.be.modules.material.enums.MaterialProcessingStatus;
import com.conflict.be.modules.material.repository.StudyMaterialFileRepository;
import com.conflict.be.modules.material.repository.StudyMaterialRepository;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.zalo.client.AiEngineClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyMaterialService {

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024L; // 20MB

    private final StudyMaterialRepository studyMaterialRepository;
    private final StudyMaterialFileRepository studyMaterialFileRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AiEngineClient aiEngineClient;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatService chatService;

    public record MaterialFileDownload(
            String fileName,
            String contentType,
            byte[] data
    ) {}

    @Transactional
    public StudyMaterialResponse uploadAndProcessMaterial(String userEmail, MaterialUploadRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));

        if (!subject.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.SUBJECT_FORBIDDEN);
        }

        MultipartFile file = request.getFile();
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_MATERIAL_FILE);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.INVALID_MATERIAL_FILE);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "tailieu.pdf";
        }

        String ext = getFileExtension(originalFilename).toLowerCase(Locale.ROOT);
        if (!ext.equals("pdf") && !ext.equals("docx") && !ext.equals("txt")) {
            throw new AppException(ErrorCode.INVALID_MATERIAL_FILE);
        }

        String title = request.getTitle();
        if (title == null || title.isBlank()) {
            title = stripExtension(originalFilename);
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            log.error("Failed to read uploaded file bytes: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_MATERIAL_FILE);
        }

        // Tạo bản ghi ban đầu với trạng thái PROCESSING
        StudyMaterialEntity entity = StudyMaterialEntity.builder()
                .user(user)
                .subject(subject)
                .title(title)
                .fileName(originalFilename)
                .fileType(ext.toUpperCase(Locale.ROOT))
                .fileSize(file.getSize())
                .processingStatus(MaterialProcessingStatus.PROCESSING)
                .build();

        entity = studyMaterialRepository.save(entity);

        // Lưu trữ file gốc tách biệt để phục vụ xem trước PDF / tải lại bản gốc
        if (studyMaterialFileRepository != null && entity.getId() != null) {
            String contentType = resolveContentType(ext, file.getContentType());
            StudyMaterialFileEntity fileEntity = StudyMaterialFileEntity.builder()
                    .materialId(entity.getId())
                    .contentType(contentType)
                    .fileData(fileBytes)
                    .build();
            studyMaterialFileRepository.save(fileEntity);
            entity.setFileUrl("/api/v1/materials/" + entity.getId() + "/file");
        }

        // Gọi AI Engine xử lý tóm tắt đề cương và trích xuất văn bản gốc (Stage 1)
        try {
            com.conflict.be.modules.material.dto.AiSummarizeResponse aiResponse = aiEngineClient.summarizeMaterial(
                    fileBytes,
                    originalFilename,
                    subject.getName()
            );

            entity.setAiSummaryMarkdown(aiResponse.getSummaryMarkdown());
            String extracted = aiResponse.getExtractedText();
            if ((extracted == null || extracted.isBlank()) && ext.equals("txt")) {
                extracted = new String(fileBytes, StandardCharsets.UTF_8);
            }
            entity.setExtractedText(extracted);
            entity.setQuizData(new java.util.ArrayList<>());
            entity.setMemoryMatchData(new java.util.ArrayList<>());
            entity.setProcessingStatus(MaterialProcessingStatus.COMPLETED);
            entity.setErrorMessage(null);
        } catch (AppException e) {
            log.error("AppException during material AI processing: {}", e.getMessage());
            entity.setProcessingStatus(MaterialProcessingStatus.FAILED);
            entity.setErrorMessage(e.getMessage());
            studyMaterialRepository.save(entity);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during material AI processing: {}", e.getMessage(), e);
            entity.setProcessingStatus(MaterialProcessingStatus.FAILED);
            entity.setErrorMessage("Lỗi trong quá trình xử lý AI");
            studyMaterialRepository.save(entity);
            throw new AppException(ErrorCode.MATERIAL_PROCESSING_FAILED);
        }

        entity = studyMaterialRepository.save(entity);
        return mapToResponse(entity, user.getId());
    }

    @Transactional
    public StudyMaterialResponse generateMinigames(String userEmail, UUID materialId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        validateReadAndPlayAccess(user, entity);

        String summary = entity.getAiSummaryMarkdown();
        if (summary == null || summary.isBlank()) {
            throw new AppException(ErrorCode.MATERIAL_NOT_FOUND);
        }

        log.info("Generating minigames for material '{}' (ID: {}) from summary...", entity.getTitle(), materialId);
        com.conflict.be.modules.material.dto.AiGenerateMinigamesResponse aiResponse = aiEngineClient.generateMinigames(
                summary,
                entity.getSubject().getName()
        );

        entity.setQuizData(aiResponse.getSpeedQuiz());
        entity.setMemoryMatchData(aiResponse.getMemoryMatchPairs());
        entity = studyMaterialRepository.save(entity);
        return mapToResponse(entity, user.getId());
    }

    @Transactional(readOnly = true)
    public List<StudyMaterialResponse> getMaterials(String userEmail, UUID subjectId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<StudyMaterialEntity> list;
        if (subjectId != null) {
            list = studyMaterialRepository.findByUserIdAndSubjectIdOrderByCreatedAtDesc(user.getId(), subjectId);
        } else {
            list = studyMaterialRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        }

        return list.stream().map(e -> mapToResponse(e, user.getId())).toList();
    }

    @Transactional(readOnly = true)
    public List<StudyMaterialResponse> getSharedMaterials(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (chatMessageRepository == null) {
            return List.of();
        }
        List<StudyMaterialEntity> shared = chatMessageRepository.findDistinctSharedMaterialsForRecipient(user.getId());
        return shared.stream().map(e -> mapToResponse(e, user.getId())).toList();
    }

    @Transactional(readOnly = true)
    public StudyMaterialResponse getMaterialById(String userEmail, UUID materialId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        validateReadAndPlayAccess(user, entity);

        return mapToResponse(entity, user.getId());
    }

    @Transactional(readOnly = true)
    public MaterialFileDownload getMaterialFile(String userEmail, UUID materialId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        validateReadAndPlayAccess(user, entity);

        if (studyMaterialFileRepository != null) {
            Optional<StudyMaterialFileEntity> fileOpt = studyMaterialFileRepository.findById(materialId);
            if (fileOpt.isPresent()) {
                StudyMaterialFileEntity fileEntity = fileOpt.get();
                return new MaterialFileDownload(
                        entity.getFileName(),
                        fileEntity.getContentType(),
                        fileEntity.getFileData()
                );
            }
        }

        if (entity.getExtractedText() != null && !entity.getExtractedText().isBlank()) {
            String txtFileName = stripExtension(entity.getFileName()) + ".txt";
            return new MaterialFileDownload(
                    txtFileName,
                    "text/plain; charset=utf-8",
                    entity.getExtractedText().getBytes(StandardCharsets.UTF_8)
            );
        }

        throw new AppException(ErrorCode.MATERIAL_FILE_NOT_FOUND);
    }

    @Transactional
    public List<ChatMessageDTO> shareMaterial(String userEmail, UUID materialId, ShareMaterialRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        validateReadAndPlayAccess(user, entity);

        if (request.getRecipientIds() == null || request.getRecipientIds().isEmpty()) {
            throw new AppException(ErrorCode.MISSING_RECIPIENT_ID);
        }

        Set<UUID> uniqueRecipients = new LinkedHashSet<>(request.getRecipientIds());
        List<ChatMessageDTO> results = new ArrayList<>();

        for (UUID recipientId : uniqueRecipients) {
            SendMessageRequest sendReq = SendMessageRequest.builder()
                    .recipientId(recipientId)
                    .content(request.getMessage())
                    .sharedMaterialId(materialId)
                    .messageType(request.getShareType() != null ? request.getShareType() : "SHARE_MATERIAL")
                    .challengeGameType(request.getChallengeGameType())
                    .challengerScore(request.getChallengerScore())
                    .challengerTimeSeconds(request.getChallengerTimeSeconds())
                    .build();

            ChatMessageDTO sent = chatService.sendAndBroadcastMessage(userEmail, sendReq);
            results.add(sent);
        }

        return results;
    }

    @Transactional
    public void deleteMaterial(String userEmail, UUID materialId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        if (!entity.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.MATERIAL_FORBIDDEN);
        }

        if (studyMaterialFileRepository != null) {
            studyMaterialFileRepository.deleteById(materialId);
        }
        studyMaterialRepository.delete(entity);
    }

    @Transactional
    public StudyMaterialResponse regenerateMaterial(String userEmail, UUID materialId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        if (!entity.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.MATERIAL_FORBIDDEN);
        }

        String textToProcess = entity.getExtractedText();
        if (textToProcess == null || textToProcess.isBlank()) {
            textToProcess = entity.getTitle() + " - Môn học: " + entity.getSubject().getName();
        }

        AiProcessMaterialResponse aiResponse = aiEngineClient.processMaterialText(
                textToProcess,
                entity.getSubject().getName()
        );

        entity.setAiSummaryMarkdown(aiResponse.getSummaryMarkdown());
        entity.setQuizData(aiResponse.getSpeedQuiz());
        entity.setMemoryMatchData(aiResponse.getMemoryMatchPairs());
        entity.setProcessingStatus(MaterialProcessingStatus.COMPLETED);
        entity.setErrorMessage(null);

        entity = studyMaterialRepository.save(entity);
        return mapToResponse(entity, user.getId());
    }

    private void validateReadAndPlayAccess(User user, StudyMaterialEntity entity) {
        if (entity.getUser().getId().equals(user.getId())) {
            return;
        }
        if (chatMessageRepository != null && chatMessageRepository.existsSharedMaterialAccess(entity.getId(), user.getId())) {
            return;
        }
        throw new AppException(ErrorCode.MATERIAL_FORBIDDEN);
    }

    public StudyMaterialResponse mapToResponse(StudyMaterialEntity entity) {
        return mapToResponse(entity, entity.getUser() != null ? entity.getUser().getId() : null);
    }

    public StudyMaterialResponse mapToResponse(StudyMaterialEntity entity, UUID currentUserId) {
        boolean isOwner = currentUserId != null && entity.getUser() != null && currentUserId.equals(entity.getUser().getId());
        boolean hasFile = (entity.getFileUrl() != null && !entity.getFileUrl().isBlank())
                || (studyMaterialFileRepository != null && entity.getId() != null && studyMaterialFileRepository.existsById(entity.getId()));

        return StudyMaterialResponse.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .ownerName(entity.getUser().getFullName())
                .ownerAvatarUrl(entity.getUser().getAvatarUrl())
                .isOwner(isOwner)
                .subjectId(entity.getSubject().getId())
                .subjectName(entity.getSubject().getName())
                .title(entity.getTitle())
                .fileName(entity.getFileName())
                .fileType(entity.getFileType())
                .fileSize(entity.getFileSize())
                .fileUrl(entity.getFileUrl())
                .hasOriginalFile(hasFile)
                .extractedText(entity.getExtractedText())
                .aiSummaryMarkdown(entity.getAiSummaryMarkdown())
                .quizData(entity.getQuizData())
                .memoryMatchData(entity.getMemoryMatchData())
                .processingStatus(entity.getProcessingStatus())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String resolveContentType(String ext, String providedContentType) {
        if ("pdf".equals(ext)) {
            return "application/pdf";
        }
        if ("docx".equals(ext)) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        if ("txt".equals(ext)) {
            return "text/plain; charset=utf-8";
        }
        return (providedContentType != null && !providedContentType.isBlank())
                ? providedContentType
                : "application/octet-stream";
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex + 1);
    }

    private String stripExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? filename : filename.substring(0, dotIndex);
    }
}
