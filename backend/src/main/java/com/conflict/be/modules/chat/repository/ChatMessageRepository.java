package com.conflict.be.modules.chat.repository;

import com.conflict.be.modules.chat.entity.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    @Query("""
            select m
            from ChatMessage m
            join fetch m.sender
            join fetch m.recipient
            where
                (m.sender.id = :firstUserId and m.recipient.id = :secondUserId)
                or
                (m.sender.id = :secondUserId and m.recipient.id = :firstUserId)
            order by m.createdAt desc, m.id desc
            """)
    Slice<ChatMessage> findThread(
            UUID firstUserId,
            UUID secondUserId,
            Pageable pageable
    );

}
