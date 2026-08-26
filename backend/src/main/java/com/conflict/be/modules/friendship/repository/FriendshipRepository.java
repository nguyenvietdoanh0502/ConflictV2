package com.conflict.be.modules.friendship.repository;

import com.conflict.be.modules.friendship.entity.Friendship;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository
        extends JpaRepository<Friendship, UUID> {

    @Query("""
            select f
            from Friendship f
            join fetch f.lowUser
            join fetch f.highUser
            join fetch f.requestedBy
            where f.lowUser.id = :lowUserId
            and f.highUser.id = :highUserId
            """)
    Optional<Friendship> findByPair(
            @Param("lowUserId") UUID lowUserId,
            @Param("highUserId") UUID highUserId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select f
            from Friendship f
            join fetch f.lowUser
            join fetch f.highUser
            join fetch f.requestedBy
            where f.id = :friendshipId
            """)
    Optional<Friendship> findByIdForUpdate(@Param("friendshipId") UUID friendshipId);

    @Query("""
            select f
            from Friendship f
            join fetch f.lowUser
            join fetch f.highUser
            join fetch f.requestedBy
            where f.status = :status
                and f.requestedBy.id <> :currentUserId
                and (
                    f.lowUser.id = :currentUserId
                    or f.highUser.id = :currentUserId
                )
            order by f.createdAt desc
            """)
    List<Friendship> findIncomingRequests(
            @Param("currentUserId") UUID currentUserId,
            @Param("status") FriendshipStatus status
    );

    @Query("""
            select f
            from Friendship f
            join fetch f.lowUser
            join fetch f.highUser
            join fetch f.requestedBy
            where f.status = :status
                and f.requestedBy.id = :currentUserId
            order by f.createdAt desc
            """)
    List<Friendship> findOutgoingRequests(
            @Param("currentUserId") UUID currentUserId,
            @Param("status") FriendshipStatus status
    );

    @Query("""
            select f
            from Friendship f
            join fetch f.lowUser
            join fetch f.highUser
            where f.status = :status
                and (
                    f.lowUser.id = :currentUserId
                    or f.highUser.id = :currentUserId
                )
            order by f.acceptedAt desc
            """)
    List<Friendship> findFriendships(
            @Param("currentUserId") UUID currentUserId,
            @Param("status") FriendshipStatus status
    );
}
