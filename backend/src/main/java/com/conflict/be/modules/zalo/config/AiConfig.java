package com.conflict.be.modules.zalo.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Getter
@Configuration
public class AiConfig {

    @Value("${unisync.ai.service-url:http://localhost:8000}")
    private String serviceUrl;

    @Value("${unisync.ai.internal-api-key:unisync_internal_secret_key_2026}")
    private String internalApiKey;

    @Value("${unisync.ai.timeout-seconds:15}")
    private int timeoutSeconds;

    @Bean
    public RestClient aiRestClient() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

        RestClient.Builder builder = RestClient.builder()
                .baseUrl(serviceUrl)
                .requestFactory(requestFactory);

        if (internalApiKey != null && !internalApiKey.isBlank()) {
            builder.defaultHeader("X-Internal-Api-Key", internalApiKey);
        }

        return builder.build();
    }
}
