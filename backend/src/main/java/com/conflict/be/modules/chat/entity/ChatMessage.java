package com.conflict.be.modules.chat.entity;

import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import com.conflict.be.modules.material.enums.GameType;
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
    @JoinColumn(name = "sender_id", nullable = false, updatable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false, updatable = false)
    private User recipient;

    @Column(nullable = false, length = 8192, updatable = false)
    private String content;

    @Builder.Default
    @Column(name = "is_encrypted", nullable = false, updatable = false)
    private boolean encrypted = false;

    @Column(name = "encryption_iv", length = 32, updatable = false)
    private String encryptionIv;

    @Column(name = "sender_key_version", updatable = false)
    private Integer senderKeyVersion;

    @Column(name = "recipient_key_version", updatable = false)
    private Integer recipientKeyVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_material_id", updatable = false)
    private StudyMaterialEntity sharedMaterial;

    @Builder.Default
    @Column(name = "message_type", nullable = false, length = 30, updatable = false)
    private String messageType = "TEXT"; // TEXT | SHARE_MATERIAL | CHALLENGE_GAME

    @Enumerated(EnumType.STRING)
    @Column(name = "challenge_game_type", length = 30, updatable = false)
    private GameType challengeGameType;

    @Column(name = "challenger_score", updatable = false)
    private Integer challengerScore;

    @Column(name = "challenger_time_seconds", updatable = false)
    private Integer challengerTimeSeconds;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (messageType == null || messageType.isBlank()) {
            messageType = "TEXT";
        }
    }
}
