package com.conflict.be.modules.zalo.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.zalo.client.ZaloBridgeClient;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeGroupDTO;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeStatusDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ZaloBridgeProxyService {

    private final ZaloBridgeClient bridgeClient;
    private final UserRepository userRepository;

    private User requireActiveUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted() || user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    public ZaloBridgeStatusDTO getStatus(String userEmail) {
        User user = requireActiveUser(userEmail);
        ZaloBridgeStatusDTO status = bridgeClient.getStatus(user.getId().toString());
        if (status == null) {
            throw new AppException(ErrorCode.ZALO_BRIDGE_UNAVAILABLE);
        }
        return status;
    }

    public ZaloBridgeStatusDTO generateQr(String userEmail) {
        User user = requireActiveUser(userEmail);
        ZaloBridgeStatusDTO status = bridgeClient.generateQr(user.getId().toString());
        if (status == null) {
            throw new AppException(ErrorCode.ZALO_BRIDGE_UNAVAILABLE);
        }
        return status;
    }

    public void logout(String userEmail) {
        User user = requireActiveUser(userEmail);
        bridgeClient.logout(user.getId().toString());
        log.info("[ZaloBridgeProxy] User {} (ID: {}) logged out from Zalo bridge", userEmail, user.getId());
    }

    public List<ZaloBridgeGroupDTO> getGroups(String userEmail) {
        User user = requireActiveUser(userEmail);
        return bridgeClient.getGroups(user.getId().toString());
    }

    public List<ZaloBridgeGroupDTO> refreshGroups(String userEmail) {
        User user = requireActiveUser(userEmail);
        return bridgeClient.refreshGroups(user.getId().toString());
    }
}

