package com.conflict.be.modules.material.dto;

import com.conflict.be.modules.material.enums.MaterialProcessingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyMaterialResponse {
    private UUID id;
    private UUID userId;
    private String ownerName;
    private String ownerAvatarUrl;
    private boolean isOwner;
    private UUID subjectId;
    private String subjectName;
    private String title;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileUrl;
    private boolean hasOriginalFile;
    private String extractedText;
    private String aiSummaryMarkdown;
    private List<QuizQuestionDTO> quizData;
    private List<MemoryMatchPairDTO> memoryMatchData;
    private MaterialProcessingStatus processingStatus;
    private String errorMessage;
    private Instant createdAt;
    private Instant updatedAt;
}
