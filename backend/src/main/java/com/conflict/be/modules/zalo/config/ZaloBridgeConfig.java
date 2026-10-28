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
public class ZaloBridgeConfig {

    @Value("${unisync.zalo.bridge-url:http://localhost:3001}")
    private String bridgeUrl;

    @Value("${unisync.ai.internal-api-key:unisync_internal_secret_key_2026}")
    private String internalApiKey;

    @Bean
    public RestClient zaloBridgeRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(30));

        RestClient.Builder builder = RestClient.builder()
                .baseUrl(bridgeUrl)
                .requestFactory(factory);

        if (internalApiKey != null && !internalApiKey.isBlank()) {
            builder.defaultHeader("X-Internal-Api-Key", internalApiKey);
        }

        return builder.build();
    }
}

