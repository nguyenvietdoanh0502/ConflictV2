package com.conflict.be.modules.zalo.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.subject.entity.Subject;
import com.conflict.be.modules.subject.repository.SubjectRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.zalo.dto.ZaloGroupMappingRequest;
import com.conflict.be.modules.zalo.dto.ZaloGroupMappingResponse;
import com.conflict.be.modules.zalo.entity.ZaloGroupMapping;
import com.conflict.be.modules.zalo.repository.ZaloGroupMappingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ZaloMappingService {

    private final ZaloGroupMappingRepository mappingRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    private User requireActiveUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted() || user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    @Transactional(readOnly = true)
    public List<ZaloGroupMappingResponse> getMyMappings(String userEmail) {
        User user = requireActiveUser(userEmail);
        return mappingRepository.findByUserIdWithSubject(user.getId())
                .stream()
                .map(ZaloGroupMappingResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ZaloGroupMappingResponse createMapping(String userEmail, ZaloGroupMappingRequest request) {
        User user = requireActiveUser(userEmail);

        Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBJECT_NOT_FOUND));

        if (mappingRepository.existsByUserIdAndZaloGroupId(user.getId(), request.getZaloGroupId().trim())) {
            throw new AppException(ErrorCode.ZALO_MAPPING_ALREADY_EXISTS);
        }

        ZaloGroupMapping mapping = ZaloGroupMapping.builder()
                .user(user)
                .subject(subject)
                .zaloGroupId(request.getZaloGroupId().trim())
                .zaloGroupName(request.getZaloGroupName().trim())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        ZaloGroupMapping saved = mappingRepository.save(mapping);
        log.info("Created Zalo group mapping '{}' <-> Subject '{}' for user {}",
                saved.getZaloGroupName(), subject.getName(), user.getEmail());

        return ZaloGroupMappingResponse.fromEntity(saved);
    }

    @Transactional
    public ZaloGroupMappingResponse toggleActive(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);

        ZaloGroupMapping mapping = mappingRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ZALO_MAPPING_NOT_FOUND));

        mapping.setActive(!mapping.isActive());
        ZaloGroupMapping updated = mappingRepository.save(mapping);

        log.info("Toggled Zalo group mapping '{}' to active={}", updated.getZaloGroupName(), updated.isActive());
        return ZaloGroupMappingResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteMapping(String userEmail, UUID id) {
        User user = requireActiveUser(userEmail);

        ZaloGroupMapping mapping = mappingRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ZALO_MAPPING_NOT_FOUND));

        mappingRepository.delete(mapping);
        log.info("Deleted Zalo group mapping '{}' (ID: {}) for user {}", mapping.getZaloGroupName(), id, user.getEmail());
    }
}
