package com.conflict.be.modules.chat.entity;

import com.conflict.be.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="sender_id",nullable = false,updatable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name="recipient_id",nullable = false,updatable = false)
    private User recipient;

    @Column(nullable = false, length = 2000,updatable = false)
    private String content;

    @Column(name = "created_at",nullable = false,updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate(){
        if (createdAt == null){
            createdAt = Instant.now();
        }
    }
}
