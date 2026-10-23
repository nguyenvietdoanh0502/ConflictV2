package com.conflict.be.modules.zalo.repository;

import com.conflict.be.modules.zalo.entity.ZaloGroupMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ZaloGroupMappingRepository extends JpaRepository<ZaloGroupMapping, UUID> {

    @Query("SELECT m FROM ZaloGroupMapping m JOIN FETCH m.subject WHERE m.user.id = :userId ORDER BY m.createdAt DESC")
    List<ZaloGroupMapping> findByUserIdWithSubject(@Param("userId") UUID userId);

    Optional<ZaloGroupMapping> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT m FROM ZaloGroupMapping m JOIN FETCH m.subject JOIN FETCH m.user WHERE m.zaloGroupId = :zaloGroupId AND m.active = true")
    List<ZaloGroupMapping> findAllActiveByZaloGroupIdWithSubjectAndUser(@Param("zaloGroupId") String zaloGroupId);

    Optional<ZaloGroupMapping> findFirstByZaloGroupIdAndActiveTrue(String zaloGroupId);

    Optional<ZaloGroupMapping> findByUserIdAndZaloGroupId(UUID userId, String zaloGroupId);

    boolean existsByUserIdAndZaloGroupId(UUID userId, String zaloGroupId);

    List<ZaloGroupMapping> findBySubjectId(UUID subjectId);
}
