package com.conflict.be.modules.zalo.client;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.material.dto.AiGenerateMinigamesRequest;
import com.conflict.be.modules.material.dto.AiGenerateMinigamesResponse;
import com.conflict.be.modules.material.dto.AiProcessMaterialResponse;
import com.conflict.be.modules.material.dto.AiSummarizeResponse;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeRequest;
import com.conflict.be.modules.zalo.dto.ai.AiAnalyzeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

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

    public AiSummarizeResponse summarizeMaterial(byte[] fileBytes, String filename, String subjectName) {
        log.info("Sending document '{}' ({} bytes) to AI Engine for Smart Cheatsheet summarization ('{}')...",
                filename, fileBytes.length, subjectName);
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "document.txt";
                }
            };
            body.add("file", resource);
            body.add("subject_name", subjectName);

            AiSummarizeResponse response = aiRestClient.post()
                    .uri("/v1/materials/summarize")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(AiSummarizeResponse.class);

            if (response == null || response.getSummaryMarkdown() == null) {
                throw new AppException(ErrorCode.MATERIAL_PROCESSING_FAILED);
            }
            return response;
        } catch (RestClientResponseException ex) {
            log.error("AI Engine returned error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            if (ex.getStatusCode().value() == 422) {
                throw new AppException(ErrorCode.MATERIAL_PARSE_FAILED);
            }
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        } catch (RestClientException ex) {
            log.error("Failed to communicate with AI Engine during summarization: {}", ex.getMessage());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    public AiGenerateMinigamesResponse generateMinigames(String summaryMarkdown, String subjectName) {
        log.info("Requesting Minigames generation from Smart Cheatsheet ({} chars) for subject '{}'...",
                summaryMarkdown.length(), subjectName);
        try {
            AiGenerateMinigamesRequest request = AiGenerateMinigamesRequest.builder()
                    .summaryMarkdown(summaryMarkdown)
                    .subjectName(subjectName)
                    .build();

            AiGenerateMinigamesResponse response = aiRestClient.post()
                    .uri("/v1/materials/generate-minigames")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(AiGenerateMinigamesResponse.class);

            if (response == null) {
                throw new AppException(ErrorCode.MATERIAL_PROCESSING_FAILED);
            }
            return response;
        } catch (RestClientResponseException ex) {
            log.error("AI Engine returned error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        } catch (RestClientException ex) {
            log.error("Failed to communicate with AI Engine during minigames generation: {}", ex.getMessage());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    public AiProcessMaterialResponse processMaterial(byte[] fileBytes, String filename, String subjectName) {
        log.info("Sending document '{}' ({}) bytes to AI Engine for subject '{}'...", filename, fileBytes.length, subjectName);
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename != null ? filename : "document.txt";
                }
            };
            body.add("file", resource);
            body.add("subject_name", subjectName);

            AiProcessMaterialResponse response = aiRestClient.post()
                    .uri("/v1/materials/process")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(AiProcessMaterialResponse.class);

            if (response == null) {
                throw new AppException(ErrorCode.MATERIAL_PROCESSING_FAILED);
            }
            return response;
        } catch (RestClientResponseException ex) {
            log.error("AI Engine returned error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            if (ex.getStatusCode().value() == 422) {
                throw new AppException(ErrorCode.MATERIAL_PARSE_FAILED);
            }
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        } catch (RestClientException ex) {
            log.error("Failed to communicate with AI Engine during material processing: {}", ex.getMessage());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }

    public AiProcessMaterialResponse processMaterialText(String text, String subjectName) {
        log.info("Sending extracted text ({} chars) to AI Engine for subject '{}'...", text.length(), subjectName);
        try {
            Map<String, String> body = Map.of(
                    "text", text,
                    "subject_name", subjectName
            );

            AiProcessMaterialResponse response = aiRestClient.post()
                    .uri("/v1/materials/process-text")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(AiProcessMaterialResponse.class);

            if (response == null) {
                throw new AppException(ErrorCode.MATERIAL_PROCESSING_FAILED);
            }
            return response;
        } catch (RestClientResponseException ex) {
            log.error("AI Engine returned error HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        } catch (RestClientException ex) {
            log.error("Failed to communicate with AI Engine during text material processing: {}", ex.getMessage());
            throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
        }
    }
}

