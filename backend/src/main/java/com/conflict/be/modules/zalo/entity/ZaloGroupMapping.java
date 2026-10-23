package com.conflict.be.modules.zalo.entity;

import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "zalo_group_mappings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_zalo_group_mappings_user_group", columnNames = {"user_id", "zalo_group_id"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZaloGroupMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(name = "zalo_group_id", nullable = false, length = 100)
    private String zaloGroupId;

    @Column(name = "zalo_group_name", nullable = false)
    private String zaloGroupName;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = false;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
