package com.conflict.be.modules.material.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.material.dto.LeaderboardEntryDTO;
import com.conflict.be.modules.material.dto.SubmitScoreRequest;
import com.conflict.be.modules.material.entity.GameScoreEntity;
import com.conflict.be.modules.material.entity.StudyMaterialEntity;
import com.conflict.be.modules.material.enums.GameType;
import com.conflict.be.modules.material.repository.GameScoreRepository;
import com.conflict.be.modules.material.repository.StudyMaterialRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameScoreService {

    private final GameScoreRepository gameScoreRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final UserRepository userRepository;

    @Transactional
    public LeaderboardEntryDTO submitScore(String userEmail, UUID materialId, SubmitScoreRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        StudyMaterialEntity material = studyMaterialRepository.findById(materialId)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        GameScoreEntity scoreEntity = GameScoreEntity.builder()
                .user(user)
                .material(material)
                .gameType(request.getGameType())
                .score(request.getScore())
                .timeTakenSeconds(request.getTimeTakenSeconds())
                .accuracyRate(request.getAccuracyRate())
                .playedAt(Instant.now())
                .build();

        scoreEntity = gameScoreRepository.save(scoreEntity);

        return LeaderboardEntryDTO.builder()
                .id(scoreEntity.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .score(scoreEntity.getScore())
                .timeTakenSeconds(scoreEntity.getTimeTakenSeconds())
                .accuracyRate(scoreEntity.getAccuracyRate())
                .playedAt(scoreEntity.getPlayedAt())
                .rank(1)
                .build();
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> getLeaderboard(UUID materialId, GameType gameType) {
        List<GameScoreEntity> scores = gameScoreRepository
                .findTop10ByMaterialIdAndGameTypeOrderByScoreDescTimeTakenSecondsAsc(materialId, gameType);

        List<LeaderboardEntryDTO> result = new ArrayList<>();
        int rank = 1;
        for (GameScoreEntity entity : scores) {
            result.add(LeaderboardEntryDTO.builder()
                    .id(entity.getId())
                    .userId(entity.getUser().getId())
                    .fullName(entity.getUser().getFullName())
                    .avatarUrl(entity.getUser().getAvatarUrl())
                    .score(entity.getScore())
                    .timeTakenSeconds(entity.getTimeTakenSeconds())
                    .accuracyRate(entity.getAccuracyRate())
                    .playedAt(entity.getPlayedAt())
                    .rank(rank++)
                    .build());
        }
        return result;
    }
}
