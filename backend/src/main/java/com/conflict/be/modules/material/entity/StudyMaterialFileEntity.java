package com.conflict.be.modules.material.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "study_material_files")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyMaterialFileEntity {

    @Id
    @Column(name = "material_id", nullable = false, updatable = false)
    private UUID materialId;

    @Column(name = "content_type", nullable = false, length = 120)
    private String contentType;

    @Column(name = "file_data", nullable = false)
    private byte[] fileData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}

