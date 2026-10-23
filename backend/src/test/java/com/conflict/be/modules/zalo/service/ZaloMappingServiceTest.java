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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ZaloMappingServiceTest {

    @Mock
    private ZaloGroupMappingRepository mappingRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ZaloMappingService mappingService;

    private User testUser;
    private Subject testSubject;
    private ZaloGroupMapping testMapping;
    private UUID userId;
    private UUID subjectId;
    private UUID mappingId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        subjectId = UUID.randomUUID();
        mappingId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .email("student@unisync.edu.vn")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        testSubject = Subject.builder()
                .id(subjectId)
                .user(testUser)
                .name("Lập trình Web")
                .defaultRoom("401-A1")
                .build();

        testMapping = ZaloGroupMapping.builder()
                .id(mappingId)
                .user(testUser)
                .subject(testSubject)
                .zaloGroupId("zalo-group-101")
                .zaloGroupName("Lập trình Web - K64")
                .active(false)
                .build();
    }

    @Test
    @DisplayName("Nên lấy danh sách mapping của user")
    void shouldGetMyMappings() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(mappingRepository.findByUserIdWithSubject(userId)).thenReturn(List.of(testMapping));

        List<ZaloGroupMappingResponse> responses = mappingService.getMyMappings(testUser.getEmail());

        assertEquals(1, responses.size());
        assertEquals("zalo-group-101", responses.get(0).getZaloGroupId());
        assertEquals("Lập trình Web - K64", responses.get(0).getZaloGroupName());
    }

    @Test
    @DisplayName("Nên tạo mapping mới thành công")
    void shouldCreateMappingSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByIdAndUserId(subjectId, userId)).thenReturn(Optional.of(testSubject));
        when(mappingRepository.existsByUserIdAndZaloGroupId(userId, "zalo-group-102")).thenReturn(false);
        when(mappingRepository.save(any(ZaloGroupMapping.class))).thenAnswer(invocation -> {
            ZaloGroupMapping m = invocation.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        ZaloGroupMappingRequest request = ZaloGroupMappingRequest.builder()
                .subjectId(subjectId)
                .zaloGroupId("zalo-group-102")
                .zaloGroupName("CSDL - Nhóm 2")
                .active(true)
                .build();

        ZaloGroupMappingResponse response = mappingService.createMapping(testUser.getEmail(), request);

        assertNotNull(response);
        assertEquals("zalo-group-102", response.getZaloGroupId());
        assertTrue(response.isActive());
    }

    @Test
    @DisplayName("Nên bật/tắt (toggle) trạng thái active thành công")
    void shouldToggleActiveSuccessfully() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(mappingRepository.findByIdAndUserId(mappingId, userId)).thenReturn(Optional.of(testMapping));
        when(mappingRepository.save(any(ZaloGroupMapping.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertFalse(testMapping.isActive());
        ZaloGroupMappingResponse response = mappingService.toggleActive(testUser.getEmail(), mappingId);

        assertTrue(response.isActive());
    }

    @Test
    @DisplayName("Nên ném ngoại lệ khi tạo mapping với nhóm đã tồn tại")
    void shouldThrowWhenCreatingDuplicateMapping() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(subjectRepository.findByIdAndUserId(subjectId, userId)).thenReturn(Optional.of(testSubject));
        when(mappingRepository.existsByUserIdAndZaloGroupId(userId, "zalo-group-101")).thenReturn(true);

        ZaloGroupMappingRequest request = ZaloGroupMappingRequest.builder()
                .subjectId(subjectId)
                .zaloGroupId("zalo-group-101")
                .zaloGroupName("Nhóm trùng")
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> mappingService.createMapping(testUser.getEmail(), request));

        assertEquals(ErrorCode.ZALO_MAPPING_ALREADY_EXISTS, ex.getErrorCode());
    }
}
