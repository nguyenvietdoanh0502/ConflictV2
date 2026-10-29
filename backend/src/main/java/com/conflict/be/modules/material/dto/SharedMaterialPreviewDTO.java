package com.conflict.be.modules.material.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedMaterialPreviewDTO {
    private UUID id;
    private String title;
    private String subjectName;
    private String fileType;
    private int quizCount;
    private int memoryMatchCount;
    private String ownerName;

    public UUID getMaterialId() {
        return id;
    }

    public boolean isHasMinigames() {
        return quizCount > 0 || memoryMatchCount > 0;
    }
}
