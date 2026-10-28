package com.conflict.be.modules.zalo.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.zalo.client.ZaloBridgeClient;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeGroupDTO;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeStatusDTO;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ZaloBridgeProxyServiceTest {

    @Mock
    private ZaloBridgeClient bridgeClient;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ZaloBridgeProxyService proxyService;

    private User testUser;
    private UUID userId;
    private String userEmail;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        userEmail = "student@unisync.edu.vn";

        testUser = User.builder()
                .id(userId)
                .email(userEmail)
                .fullName("Nguyễn Văn A")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();
    }

    @Test
    @DisplayName("getStatus - Trả về status Zalo của từng sinh viên theo userId")
    void getStatus_Success() {
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(testUser));
        ZaloBridgeStatusDTO mockStatus = ZaloBridgeStatusDTO.builder()
                .userId(userId.toString())
                .connected(true)
                .qrStatus("authenticated")
                .groupCount(5)
                .build();
        when(bridgeClient.getStatus(userId.toString())).thenReturn(mockStatus);

        ZaloBridgeStatusDTO result = proxyService.getStatus(userEmail);

        assertNotNull(result);
        assertEquals(userId.toString(), result.getUserId());
        assertTrue(result.isConnected());
        verify(bridgeClient).getStatus(userId.toString());
    }

    @Test
    @DisplayName("getStatus - Ném ngoại lệ khi Zalo Bridge offline")
    void getStatus_BridgeUnavailable_ThrowsException() {
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(testUser));
        when(bridgeClient.getStatus(userId.toString())).thenReturn(null);

        AppException ex = assertThrows(AppException.class, () -> proxyService.getStatus(userEmail));
        assertEquals(ErrorCode.ZALO_BRIDGE_UNAVAILABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("generateQr - Gọi bridge generateQr với userId riêng của user")
    void generateQr_Success() {
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(testUser));
        ZaloBridgeStatusDTO qrStatus = ZaloBridgeStatusDTO.builder()
                .userId(userId.toString())
                .qrStatus("ready")
                .qrCode("data:image/png;base64,mockQr")
                .build();
        when(bridgeClient.generateQr(userId.toString())).thenReturn(qrStatus);

        ZaloBridgeStatusDTO result = proxyService.generateQr(userEmail);

        assertNotNull(result);
        assertEquals("ready", result.getQrStatus());
        verify(bridgeClient).generateQr(userId.toString());
    }

    @Test
    @DisplayName("logout - Gọi bridge logout cho đúng userId")
    void logout_Success() {
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(testUser));
        doNothing().when(bridgeClient).logout(userId.toString());

        proxyService.logout(userEmail);

        verify(bridgeClient).logout(userId.toString());
    }

    @Test
    @DisplayName("getGroups - Trả về danh sách nhóm của riêng user")
    void getGroups_Success() {
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(testUser));
        List<ZaloBridgeGroupDTO> mockGroups = List.of(
                ZaloBridgeGroupDTO.builder().id("g1").name("Nhóm 1").memberCount(40).build(),
                ZaloBridgeGroupDTO.builder().id("g2").name("Nhóm 2").memberCount(35).build()
        );
        when(bridgeClient.getGroups(userId.toString())).thenReturn(mockGroups);

        List<ZaloBridgeGroupDTO> result = proxyService.getGroups(userEmail);

        assertEquals(2, result.size());
        assertEquals("Nhóm 1", result.get(0).getName());
        verify(bridgeClient).getGroups(userId.toString());
    }
}

