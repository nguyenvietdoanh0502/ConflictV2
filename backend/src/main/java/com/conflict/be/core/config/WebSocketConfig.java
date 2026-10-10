package com.conflict.be.core.config;

import com.conflict.be.core.security.WebSocketAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final WebSocketAuthChannelInterceptor authInterceptor;

    @Override
    public void registerStompEndpoints(
            StompEndpointRegistry registry
    ) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173");

        registry.setPreserveReceiveOrder(true);
    }
    @Override
    public void configureMessageBroker(
            MessageBrokerRegistry registry
    ){
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
        registry.enableSimpleBroker("/queue");
        registry.setPreservePublishOrder(true);
    }
    @Override
    public void configureClientInboundChannel(
            ChannelRegistration registration
    ) {
        registration.interceptors(authInterceptor);
    }

    @Override
    public void configureWebSocketTransport(
            WebSocketTransportRegistration registration
    ) {
        registration.setMessageSizeLimit(16 * 1024);
        registration.setTimeToFirstMessage(10_000);
    }
}
