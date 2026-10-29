package com.conflict.be.modules.chat.repository;

import com.conflict.be.modules.chat.entity.ChatMessage;
import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    @Query("""
            select m
            from ChatMessage m
            join fetch m.sender
            join fetch m.recipient
            left join fetch m.sharedMaterial sm
            left join fetch sm.subject
            left join fetch sm.user
            where
                (m.sender.id = :firstUserId and m.recipient.id = :secondUserId)
                or
                (m.sender.id = :secondUserId and m.recipient.id = :firstUserId)
            order by m.createdAt desc, m.id desc
            """)
    Slice<ChatMessage> findThread(
            @Param("firstUserId") UUID firstUserId,
            @Param("secondUserId") UUID secondUserId,
            Pageable pageable
    );

    @Query("""
            select (count(m) > 0)
            from ChatMessage m
            where m.sharedMaterial.id = :materialId
              and (m.recipient.id = :userId or m.sender.id = :userId)
            """)
    boolean existsSharedMaterialAccess(
            @Param("materialId") UUID materialId,
            @Param("userId") UUID userId
    );

    @Query("""
            select distinct sm
            from ChatMessage m
            join m.sharedMaterial sm
            join fetch sm.subject
            join fetch sm.user
            where m.recipient.id = :recipientId
              and sm.user.id <> :recipientId
            order by sm.createdAt desc
            """)
    List<StudyMaterialEntity> findDistinctSharedMaterialsForRecipient(
            @Param("recipientId") UUID recipientId
    );
}
