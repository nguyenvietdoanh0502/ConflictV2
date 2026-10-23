package com.conflict.be.modules.subject.controller;

import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.subject.dto.SubjectRequest;
import com.conflict.be.modules.subject.dto.SubjectResponse;
import com.conflict.be.modules.subject.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping(UrlConstant.Subject.BASE)
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getMySubjects(
            Authentication authentication
    ) {
        List<SubjectResponse> subjects = subjectService.getMySubjects(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(subjects));
    }

    @GetMapping(UrlConstant.Subject.BY_ID)
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubjectById(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        SubjectResponse response = subjectService.getSubjectById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(UrlConstant.Subject.BASE)
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(
            Authentication authentication,
            @Valid @RequestBody SubjectRequest request
    ) {
        SubjectResponse response = subjectService.createSubject(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Subject created successfully", response));
    }

    @PutMapping(UrlConstant.Subject.BY_ID)
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody SubjectRequest request
    ) {
        SubjectResponse response = subjectService.updateSubject(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Subject updated successfully", response));
    }

    @DeleteMapping(UrlConstant.Subject.BY_ID)
    public ResponseEntity<ApiResponse<Void>> deleteSubject(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        subjectService.deleteSubject(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Subject deleted successfully", null));
    }
}
