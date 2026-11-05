package com.conflict.be.modules.e2ee.repository;

import com.conflict.be.modules.e2ee.entity.UserE2eeKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserE2eeKeyRepository extends JpaRepository<UserE2eeKey, UUID> {
    Optional<UserE2eeKey> findByUserIdAndActiveTrue(UUID userId);

    List<UserE2eeKey> findAllByUserIdOrderByKeyVersionAsc(UUID userId);

    @Query("select coalesce(max(k.keyVersion), 0) from UserE2eeKey k where k.user.id = :userId")
    int findMaxVersionByUserId(@Param("userId") UUID userId);
}

