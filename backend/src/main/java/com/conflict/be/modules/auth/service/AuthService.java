package com.conflict.be.modules.auth.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.core.security.JwtProvider;
import com.conflict.be.modules.auth.dto.AuthResponse;
import com.conflict.be.modules.auth.dto.RegisterRequest;
import com.conflict.be.modules.auth.dto.VerifyOtpRequest;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.dto.UserRegistrationCommand;
import com.conflict.be.modules.user.service.UserRegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRegistrationService userRegistrationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final OtpService otpService;
    private final MailService mailService;

    @Value("${conflict.jwt.access-token-expiration}")
    private long jwtExpiration;

    public void register(RegisterRequest request) {
        UserRegistrationCommand command = UserRegistrationCommand.builder()
                .email(request.getEmail())
                .hashedPassword(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .build();

        userRegistrationService.registerNewUser(command);

        String otpCode = otpService.generateAndSaveOtp(request.getEmail());
        mailService.sendOtpEmail(request.getEmail(), otpCode);
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtpCode());
        if (!isValid) {
            throw new AppException(ErrorCode.INVALID_KEY); // Or a specific OTP_INVALID ErrorCode
        }

        UserDTO userDTO = userRegistrationService.verifyUser(request.getEmail());

        UserDetails userDetails =
                org.springframework.security.core.userdetails.User.builder()
                        .username(userDTO.getEmail())
                        .password("") // Empty as we just need it for JWT subject extraction
                        .authorities(Collections.emptyList())
                        .build();

        String accessToken = jwtProvider.generateToken(userDetails);
        String refreshToken = jwtProvider.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .user(userDTO)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtExpiration / 1000)
                .build();
    }
}
