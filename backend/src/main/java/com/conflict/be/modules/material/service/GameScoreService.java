package com.conflict.be.modules.material.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.friendship.entity.Friendship;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.friendship.repository.FriendshipRepository;
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
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameScoreService {

    private final GameScoreRepository gameScoreRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

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
        return getLeaderboard(null, materialId, gameType, "global");
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDTO> getLeaderboard(String userEmail, UUID materialId, GameType gameType, String scope) {
        List<GameScoreEntity> scores = gameScoreRepository.findByMaterialIdAndGameTypeOrdered(materialId, gameType);
        if (scores == null || scores.isEmpty()) {
            scores = gameScoreRepository.findTop10ByMaterialIdAndGameTypeOrderByScoreDescTimeTakenSecondsAsc(materialId, gameType);
        }

        Set<UUID> allowedUserIds = null;
        if ("friends".equalsIgnoreCase(scope) && userEmail != null && !userEmail.isBlank()) {
            Optional<User> currentUserOpt = userRepository.findByEmail(userEmail);
            if (currentUserOpt.isPresent()) {
                UUID currentUserId = currentUserOpt.get().getId();
                allowedUserIds = new HashSet<>();
                allowedUserIds.add(currentUserId);
                if (friendshipRepository != null) {
                    List<Friendship> friendships = friendshipRepository.findFriendships(currentUserId, FriendshipStatus.ACCEPTED);
                    for (Friendship f : friendships) {
                        if (f.getLowUser() != null) allowedUserIds.add(f.getLowUser().getId());
                        if (f.getHighUser() != null) allowedUserIds.add(f.getHighUser().getId());
                    }
                }
            }
        }

        List<LeaderboardEntryDTO> result = new ArrayList<>();
        Set<UUID> seenUsers = new HashSet<>();
        int rank = 1;

        for (GameScoreEntity entity : scores) {
            UUID playerId = entity.getUser().getId();
            if (allowedUserIds != null && !allowedUserIds.contains(playerId)) {
                continue;
            }
            // Mỗi người chơi lấy thành tích cao nhất trên bảng xếp hạng
            if (!seenUsers.add(playerId)) {
                continue;
            }
            result.add(LeaderboardEntryDTO.builder()
                    .id(entity.getId())
                    .userId(playerId)
                    .fullName(entity.getUser().getFullName())
                    .avatarUrl(entity.getUser().getAvatarUrl())
                    .score(entity.getScore())
                    .timeTakenSeconds(entity.getTimeTakenSeconds())
                    .accuracyRate(entity.getAccuracyRate())
                    .playedAt(entity.getPlayedAt())
                    .rank(rank++)
                    .build());
            if (result.size() >= 10) {
                break;
            }
        }
        return result;
    }
}
