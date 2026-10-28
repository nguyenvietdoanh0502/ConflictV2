package com.conflict.be.modules.zalo.client;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.zalo.dto.bridge.BridgeApiResponse;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeGroupDTO;
import com.conflict.be.modules.zalo.dto.bridge.ZaloBridgeStatusDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ZaloBridgeClient {

    private final RestClient zaloBridgeRestClient;

    public ZaloBridgeStatusDTO getStatus(String userId) {
        log.info("[ZaloBridgeClient] Fetching bridge status for user {}", userId);
        try {
            BridgeApiResponse<ZaloBridgeStatusDTO> resp = zaloBridgeRestClient.get()
                    .uri("/zalo/session/{userId}/status", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<BridgeApiResponse<ZaloBridgeStatusDTO>>() {});
            return resp != null ? resp.getData() : null;
        } catch (RestClientException e) {
            log.warn("[ZaloBridgeClient] Bridge unreachable when fetching status for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    public ZaloBridgeStatusDTO generateQr(String userId) {
        log.info("[ZaloBridgeClient] Requesting QR generation for user {}", userId);
        try {
            BridgeApiResponse<ZaloBridgeStatusDTO> resp = zaloBridgeRestClient.post()
                    .uri("/zalo/session/{userId}/qr/generate", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<BridgeApiResponse<ZaloBridgeStatusDTO>>() {});
            return resp != null ? resp.getData() : null;
        } catch (RestClientException e) {
            log.error("[ZaloBridgeClient] Failed to generate QR for user {}: {}", userId, e.getMessage());
            throw new AppException(ErrorCode.ZALO_BRIDGE_UNAVAILABLE);
        }
    }

    public void logout(String userId) {
        log.info("[ZaloBridgeClient] Requesting logout for user {}", userId);
        try {
            zaloBridgeRestClient.post()
                    .uri("/zalo/session/{userId}/logout", userId)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("[ZaloBridgeClient] Logout failed for user {} (bridge may be offline): {}", userId, e.getMessage());
        }
    }

    public List<ZaloBridgeGroupDTO> getGroups(String userId) {
        log.info("[ZaloBridgeClient] Fetching groups for user {}", userId);
        try {
            BridgeApiResponse<List<ZaloBridgeGroupDTO>> resp = zaloBridgeRestClient.get()
                    .uri("/zalo/session/{userId}/groups", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<BridgeApiResponse<List<ZaloBridgeGroupDTO>>>() {});
            return resp != null && resp.getData() != null ? resp.getData() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("[ZaloBridgeClient] Failed to fetch groups for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<ZaloBridgeGroupDTO> refreshGroups(String userId) {
        log.info("[ZaloBridgeClient] Refreshing groups for user {}", userId);
        try {
            BridgeApiResponse<List<ZaloBridgeGroupDTO>> resp = zaloBridgeRestClient.post()
                    .uri("/zalo/session/{userId}/groups/refresh", userId)
                    .retrieve()
                    .body(new ParameterizedTypeReference<BridgeApiResponse<List<ZaloBridgeGroupDTO>>>() {});
            return resp != null && resp.getData() != null ? resp.getData() : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("[ZaloBridgeClient] Failed to refresh groups for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }
}

