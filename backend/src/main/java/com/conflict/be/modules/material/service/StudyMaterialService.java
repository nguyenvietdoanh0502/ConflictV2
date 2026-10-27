package com.conflict.be.modules.material.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.material.dto.AiProcessMaterialResponse;
import com.conflict.be.modules.material.dto.MaterialUploadRequest;
import com.conflict.be.modules.material.dto.StudyMaterialResponse;
import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import com.conflict.be.modules.material.enums.MaterialProcessingStatus;
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
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyMaterialService {

    private static final long MAX_FILE_SIZE = 20 * 1024 * 1024L; // 20MB

    private final StudyMaterialRepository studyMaterialRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final AiEngineClient aiEngineClient;

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

        // Gọi AI Engine chỉ xử lý tóm tắt đề cương (Stage 1)
        try {
            com.conflict.be.modules.material.dto.AiSummarizeResponse aiResponse = aiEngineClient.summarizeMaterial(
                    fileBytes,
                    originalFilename,
                    subject.getName()
            );

            entity.setAiSummaryMarkdown(aiResponse.getSummaryMarkdown());
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
        return mapToResponse(entity);
    }

    @Transactional
    public StudyMaterialResponse generateMinigames(String userEmail, UUID materialId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        if (!entity.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.MATERIAL_FORBIDDEN);
        }

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
        return mapToResponse(entity);
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

        return list.stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public StudyMaterialResponse getMaterialById(String userEmail, UUID materialId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity entity = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        if (!entity.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.MATERIAL_FORBIDDEN);
        }

        return mapToResponse(entity);
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
        return mapToResponse(entity);
    }

    public StudyMaterialResponse mapToResponse(StudyMaterialEntity entity) {
        return StudyMaterialResponse.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .subjectId(entity.getSubject().getId())
                .subjectName(entity.getSubject().getName())
                .title(entity.getTitle())
                .fileName(entity.getFileName())
                .fileType(entity.getFileType())
                .fileSize(entity.getFileSize())
                .fileUrl(entity.getFileUrl())
                .aiSummaryMarkdown(entity.getAiSummaryMarkdown())
                .quizData(entity.getQuizData())
                .memoryMatchData(entity.getMemoryMatchData())
                .processingStatus(entity.getProcessingStatus())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
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
