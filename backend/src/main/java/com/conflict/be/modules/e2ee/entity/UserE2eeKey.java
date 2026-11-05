package com.conflict.be.modules.e2ee.entity;

import com.conflict.be.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_e2ee_keys")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserE2eeKey {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "key_version", nullable = false, updatable = false)
    private Integer keyVersion;

    @Column(name = "public_key", nullable = false, length = 512, updatable = false)
    private String publicKey;

    @Column(name = "encrypted_private_key", nullable = false, length = 1024)
    private String encryptedPrivateKey;

    @Column(name = "kdf_salt", nullable = false, length = 64)
    private String kdfSalt;

    @Column(name = "kdf_iterations", nullable = false)
    private Integer kdfIterations;

    @Column(name = "wrap_iv", nullable = false, length = 32)
    private String wrapIv;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}

