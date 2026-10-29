package com.conflict.be.modules.material.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.chat.dto.ChatMessageDTO;
import com.conflict.be.modules.material.dto.LeaderboardEntryDTO;
import com.conflict.be.modules.material.dto.MaterialUploadRequest;
import com.conflict.be.modules.material.dto.ShareMaterialRequest;
import com.conflict.be.modules.material.dto.StudyMaterialResponse;
import com.conflict.be.modules.material.dto.SubmitScoreRequest;
import com.conflict.be.modules.material.enums.GameType;
import com.conflict.be.modules.material.service.GameScoreService;
import com.conflict.be.modules.material.service.StudyMaterialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class StudyMaterialController {

    private final StudyMaterialService studyMaterialService;
    private final GameScoreService gameScoreService;

    @PostMapping(value = UrlConstant.Material.BASE, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> uploadMaterial(
            Authentication authentication,
            @Valid @ModelAttribute MaterialUploadRequest request
    ) {
        StudyMaterialResponse response = studyMaterialService.uploadAndProcessMaterial(
                authentication.getName(),
                request
        );
        return ResponseEntity.ok(ApiResponse.success("Tải lên và xử lý tài liệu thành công", response));
    }

    @GetMapping(UrlConstant.Material.BASE)
    public ResponseEntity<ApiResponse<List<StudyMaterialResponse>>> getMaterials(
            Authentication authentication,
            @RequestParam(required = false) UUID subjectId
    ) {
        List<StudyMaterialResponse> list = studyMaterialService.getMaterials(
                authentication.getName(),
                subjectId
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping(UrlConstant.Material.SHARED_WITH_ME)
    public ResponseEntity<ApiResponse<List<StudyMaterialResponse>>> getSharedMaterials(
            Authentication authentication
    ) {
        List<StudyMaterialResponse> list = studyMaterialService.getSharedMaterials(
                authentication.getName()
        );
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping(UrlConstant.Material.BY_ID)
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> getMaterialById(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        StudyMaterialResponse response = studyMaterialService.getMaterialById(
                authentication.getName(),
                id
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(UrlConstant.Material.FILE)
    public ResponseEntity<byte[]> getMaterialFile(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "false") boolean download
    ) {
        StudyMaterialService.MaterialFileDownload fileDownload = studyMaterialService.getMaterialFile(
                authentication.getName(),
                id
        );

        ContentDisposition disposition = ContentDisposition.builder(download ? "attachment" : "inline")
                .filename(fileDownload.fileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, fileDownload.contentType())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(fileDownload.data());
    }

    @PostMapping(UrlConstant.Material.SHARE)
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> shareMaterial(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody ShareMaterialRequest request
    ) {
        List<ChatMessageDTO> messages = studyMaterialService.shareMaterial(
                authentication.getName(),
                id,
                request
        );
        return ResponseEntity.ok(ApiResponse.success("Đã gửi chia sẻ / lời mời thách đấu thành công", messages));
    }

    @DeleteMapping(UrlConstant.Material.BY_ID)
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        studyMaterialService.deleteMaterial(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu thành công", null));
    }

    @PostMapping(UrlConstant.Material.REGENERATE)
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> regenerateMaterial(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        StudyMaterialResponse response = studyMaterialService.regenerateMaterial(
                authentication.getName(),
                id
        );
        return ResponseEntity.ok(ApiResponse.success("Sinh lại học liệu thành công", response));
    }

    @PostMapping(UrlConstant.Material.GENERATE_MINIGAMES)
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> generateMinigames(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        StudyMaterialResponse response = studyMaterialService.generateMinigames(
                authentication.getName(),
                id
        );
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo bộ Minigame thành công", response));
    }

    @PostMapping(UrlConstant.Material.SCORES)
    public ResponseEntity<ApiResponse<LeaderboardEntryDTO>> submitScore(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody SubmitScoreRequest request
    ) {
        LeaderboardEntryDTO entry = gameScoreService.submitScore(
                authentication.getName(),
                id,
                request
        );
        return ResponseEntity.ok(ApiResponse.success("Lưu điểm chơi thành công", entry));
    }

    @GetMapping(UrlConstant.Material.LEADERBOARD)
    public ResponseEntity<ApiResponse<List<LeaderboardEntryDTO>>> getLeaderboard(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "SPEED_QUIZ") GameType gameType,
            @RequestParam(defaultValue = "global") String scope
    ) {
        String userEmail = authentication != null ? authentication.getName() : null;
        List<LeaderboardEntryDTO> leaderboard = gameScoreService.getLeaderboard(userEmail, id, gameType, scope);
        return ResponseEntity.ok(ApiResponse.success(leaderboard));
    }
}
