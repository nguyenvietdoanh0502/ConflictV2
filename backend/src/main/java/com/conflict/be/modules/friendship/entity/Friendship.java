package com.conflict.be.modules.friendship.entity;


import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "friendships")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Friendship {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "low_user_id",nullable = false)
    private User lowUser;

    @ManyToOne(fetch = FetchType.LAZY,optional = false)
    @JoinColumn(name = "high_user_id",nullable = false)
    private User highUser;

    @ManyToOne(fetch = FetchType.LAZY,optional = false)
    @JoinColumn(name = "requested_by_id",nullable = false)
    private User requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false,length = 16)
    private FriendshipStatus status;

    @Column(name = "created_at",nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at",nullable = false)
    private Instant updatedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @PrePersist
    void onCreate(){
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        if(status == null){
            status = FriendshipStatus.PENDING;
        }
    }
    @PreUpdate
    void onUpdate(){
        updatedAt = Instant.now();
    }
}
