package com.conflict.be.modules.subject.repository;

import com.conflict.be.modules.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {

    List<Subject> findByUserIdOrderByNameAsc(UUID userId);

    Optional<Subject> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);

    boolean existsByUserIdAndCodeIgnoreCase(UUID userId, String code);
}
