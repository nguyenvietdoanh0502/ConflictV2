package com.conflict.be.modules.material.entity;

import com.conflict.be.modules.material.dto.MemoryMatchPairDTO;
import com.conflict.be.modules.material.dto.QuizQuestionDTO;
import com.conflict.be.modules.material.enums.MaterialProcessingStatus;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "study_materials")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyMaterialEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false)
    private String title;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 50)
    private String fileType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(name = "ai_summary_markdown", columnDefinition = "TEXT")
    private String aiSummaryMarkdown;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "quiz_data_json", columnDefinition = "jsonb")
    @Builder.Default
    private List<QuizQuestionDTO> quizData = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "memory_match_json", columnDefinition = "jsonb")
    @Builder.Default
    private List<MemoryMatchPairDTO> memoryMatchData = new ArrayList<>();

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 30)
    private MaterialProcessingStatus processingStatus = MaterialProcessingStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (processingStatus == null) {
            processingStatus = MaterialProcessingStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
