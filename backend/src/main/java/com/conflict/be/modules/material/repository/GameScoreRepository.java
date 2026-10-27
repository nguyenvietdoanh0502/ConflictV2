package com.conflict.be.modules.material.repository;

import com.conflict.be.modules.material.entity.GameScoreEntity;
import com.conflict.be.modules.material.enums.GameType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScoreEntity, UUID> {

    List<GameScoreEntity> findTop10ByMaterialIdAndGameTypeOrderByScoreDescTimeTakenSecondsAsc(UUID materialId, GameType gameType);

    List<GameScoreEntity> findByMaterialIdAndUserIdOrderByPlayedAtDesc(UUID materialId, UUID userId);
}
