package com.conflict.be.modules.material.entity;

import com.conflict.be.modules.material.enums.GameType;
import com.conflict.be.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "game_scores")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameScoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id", nullable = false)
    private StudyMaterialEntity material;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_type", nullable = false, length = 30)
    private GameType gameType;

    @Column(nullable = false)
    private int score;

    @Column(name = "time_taken_seconds", nullable = false)
    private int timeTakenSeconds;

    @Column(name = "accuracy_rate")
    private Double accuracyRate;

    @Column(name = "played_at", nullable = false, updatable = false)
    private Instant playedAt;

    @PrePersist
    protected void onCreate() {
        if (playedAt == null) {
            playedAt = Instant.now();
        }
    }
}
