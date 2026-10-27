package com.conflict.be.modules.material.repository;

import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudyMaterialRepository extends JpaRepository<StudyMaterialEntity, UUID> {

    List<StudyMaterialEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<StudyMaterialEntity> findByUserIdAndSubjectIdOrderByCreatedAtDesc(UUID userId, UUID subjectId);

    Optional<StudyMaterialEntity> findByIdAndUserId(UUID id, UUID userId);
}
