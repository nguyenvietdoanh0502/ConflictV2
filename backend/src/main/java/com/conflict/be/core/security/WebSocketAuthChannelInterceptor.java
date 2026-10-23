package com.conflict.be.core.security;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import org.springframework.security.access.AccessDeniedException;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor
        implements ChannelInterceptor {

    private final JwtProvider jwtProvider;
    private final UserDetailsService userDetailsService;
    private final StringRedisTemplate redisTemplate;

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            Authentication authentication =
                    authenticateConnect(accessor);

            accessor.setUser(authentication);
        }

        if (StompCommand.SEND.equals(command)) {
            requireAuthenticated(accessor);

            if (!"/app/chat.send".equals(
                    accessor.getDestination()
            )) {
                throw new AccessDeniedException(
                        "Unsupported destination"
                );
            }
        }

        if (StompCommand.SUBSCRIBE.equals(command)) {
            requireAuthenticated(accessor);

            String destination = accessor.getDestination();

            if (!Set.of(
                    "/user/queue/messages",
                    "/user/queue/errors",
                    "/user/queue/schedule",
                    "/user/queue/schedule-events"
            ).contains(destination)) {
                throw new AccessDeniedException(
                        "Unsupported subscription"
                );
            }
        }

        return message;
    }

    private Authentication authenticateConnect(StompHeaderAccessor accessor) {
        String authHeader = getFirstNativeHeader(accessor, "Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String jwt = authHeader.substring(7);
        String tokenId = jwtProvider.extractJwtId(jwt);
        Boolean isBlacklisted = redisTemplate.hasKey(
                "blacklist:jti:" + tokenId
        );
        if (Boolean.TRUE.equals(isBlacklisted)) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String email = jwtProvider.extractUsername(jwt);
        if (email == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        if (!jwtProvider.isTokenValid(jwt, userDetails)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
    }

    private void requireAuthenticated(StompHeaderAccessor accessor) {
        if (accessor.getUser() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }

    private String getFirstNativeHeader(StompHeaderAccessor accessor, String headerName) {
        List<String> values = accessor.getNativeHeader(headerName);
        return values != null && !values.isEmpty() ? values.get(0) : null;
    }
}
