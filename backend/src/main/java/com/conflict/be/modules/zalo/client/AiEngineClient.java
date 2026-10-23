package com.conflict.be.modules.zalo.client;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeRequest;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiEngineClient {

    private final RestClient aiRestClient;

    public AiAnalyzeResponse analyzeMessage(AiAnalyzeRequest request) {
        log.info("Sending message to AI Engine for subject '{}'...", request.getSubjectName());
        try {
            AiAnalyzeResponse response = aiRestClient.post()
                    .uri("/ai/analyze-message")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(AiAnalyzeResponse.class);

            if (response != null) {
                log.info("AI Engine response: isAcademic={}, eventsCount={}, confidence={}",
                        response.isAcademicAnnouncement(),
                        response.getDetectedEvents() != null ? response.getDetectedEvents().size() : 0,
                        response.getConfidenceScore());
            }
            return response != null ? response : new AiAnalyzeResponse();
        } catch (RestClientException ex) {
            log.error("Failed to communicate with AI Engine: {}", ex.getMessage());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }
}
