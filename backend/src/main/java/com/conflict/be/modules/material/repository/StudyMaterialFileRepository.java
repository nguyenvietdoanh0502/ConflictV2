package com.conflict.be.modules.material.repository;

import com.conflict.be.modules.material.entity.StudyMaterialFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StudyMaterialFileRepository extends JpaRepository<StudyMaterialFileEntity, UUID> {
}

