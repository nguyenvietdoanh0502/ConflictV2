package com.conflict.be.core.config;

import com.conflict.be.core.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.Customizer;
import java.util.List;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity

public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    @org.springframework.beans.factory.annotation.Value("${conflict.cors.allowed-origins:http://localhost:5173,http://localhost:3000,https://*.vercel.app}")
    private String allowedOriginsConfig;

    @Bean
    CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration config = new CorsConfiguration();

        java.util.List<String> origins = java.util.Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(
                List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS")
        );
        config.setAllowedHeaders(
                List.of("Authorization", "Content-Type", "X-XSRF-TOKEN", "X-Internal-Api-Key", "Origin", "Accept", "X-Requested-With")
        );
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(req ->
                        req.requestMatchers(
                                        "/ws",
                                        "/ws/**",
                                        "/ws-sockjs",
                                        "/ws-sockjs/**",
                                        "/api/v1/auth/register",
                                        "/api/v1/auth/login",
                                        "/api/v1/auth/verify-otp",
                                        "/api/v1/auth/refresh-token",
                                        "/api/v1/auth/forgot-password",
                                        "/api/v1/auth/verify-otp-forgot-password",
                                        "/api/v1/auth/reset-password",
                                        "/api/v1/internal/zalo/**",
                                        "/api/v1/zalo/simulate",
                                        "/api/v1/webhook/**",
                                        "/v3/api-docs/**",
                                        "/swagger-ui/**"
                                ).permitAll()
                                .anyRequest()
                                .authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
