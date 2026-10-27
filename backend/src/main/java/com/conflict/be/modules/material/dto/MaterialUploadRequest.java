package com.conflict.be.modules.material.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Data
public class MaterialUploadRequest {
    @NotNull(message = "SUBJECT_NOT_FOUND")
    private UUID subjectId;

    private String title;

    @NotNull(message = "INVALID_MATERIAL_FILE")
    private MultipartFile file;
}
