package com.conflict.be.modules.material.repository;

import com.conflict.be.modules.material.entity.GameScoreEntity;
import com.conflict.be.modules.material.enums.GameType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScoreEntity, UUID> {

    List<GameScoreEntity> findTop10ByMaterialIdAndGameTypeOrderByScoreDescTimeTakenSecondsAsc(UUID materialId, GameType gameType);

    @Query("""
            select gs
            from GameScoreEntity gs
            join fetch gs.user
            where gs.material.id = :materialId
              and gs.gameType = :gameType
            order by gs.score desc, gs.timeTakenSeconds asc, gs.playedAt asc
            """)
    List<GameScoreEntity> findByMaterialIdAndGameTypeOrdered(
            @Param("materialId") UUID materialId,
            @Param("gameType") GameType gameType
    );

    List<GameScoreEntity> findByMaterialIdAndUserIdOrderByPlayedAtDesc(UUID materialId, UUID userId);
}
