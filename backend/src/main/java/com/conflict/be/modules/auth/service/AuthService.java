package com.conflict.be.modules.auth.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.core.security.JwtProvider;
import com.conflict.be.modules.auth.dto.*;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.dto.UserRegistrationCommand;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import com.conflict.be.modules.user.service.UserRegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRegistrationService userRegistrationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final OtpService otpService;
    private final MailService mailService;
    private final RateLimiterService rateLimiterService;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    @Value("${conflict.jwt.access-token-expiration}")
    private long jwtExpiration;
    @Value("${conflict.jwt.refresh-token-expiration}")
    private long refreshExpiration;
    @Value("${conflict.jwt.reset-password-expiration}")
    private long resetExpiration;

    public void register(RegisterRequest request) {
        UserRegistrationCommand command = UserRegistrationCommand.builder()
                .email(request.getEmail())
                .hashedPassword(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .build();

        userRegistrationService.registerNewUser(command);

        String otpCode = otpService.generateAndSaveOtp(request.getEmail(), OtpService.OtpType.REGISTER);
        mailService.sendOtpEmail(request.getEmail(), otpCode);
    }

    public AuthResponse login(LoginRequest request, String ipAddress){
        if(!rateLimiterService.isLoginIpAllowed(ipAddress)){
            throw new AppException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }
        String email = request.getEmail();
        if (rateLimiterService.isEmailLocked(email)) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());
        if(existingUserOpt.isEmpty()){
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        User existingUser = existingUserOpt.get();

        if(existingUser.isDeleted()){
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        boolean isPasswordMatch = passwordEncoder.matches(request.getPassword(),existingUser.getPassword());
        if (!isPasswordMatch) {
            rateLimiterService.isLoginEmailAllowed(email);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        rateLimiterService.resetFailedLoginCount(email);

        if(existingUser.getStatus()== AccountStatus.PENDING){
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
        }
        if(existingUser.getStatus()==AccountStatus.BANNED){
            throw new AppException(ErrorCode.ACCOUNT_BANNED);
        }

        UserDTO userDTO = userRegistrationService.mapToDTO(existingUser);
        UserDetails userDetails =
                org.springframework.security.core.userdetails.User.builder()
                        .username(userDTO.getEmail())
                        .password("")
                        .authorities(Collections.emptyList())
                        .build();
        String accessToken = jwtProvider.generateToken(userDetails);
        String refreshToken = jwtProvider.generateRefreshToken(userDetails);
        String redisKey = "refresh:" + userDTO.getEmail();
        redisTemplate.opsForValue().set(redisKey, refreshToken, Duration.ofDays(30));
        return AuthResponse.builder()
                .user(userDTO)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtExpiration / 1000)
                .build();
    }
    public RefreshTokenResponse refreshToken(String request){
        UserDetails userDetails = jwtProvider.validateRefreshToken(request);
        String email = userDetails.getUsername();
        String redisKey = "refresh:" + email;
        String storedToken = redisTemplate.opsForValue().get(redisKey);
        if(storedToken==null || !storedToken.equals(request)){
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REFRESH_TOKEN));
        if (user.isDeleted() || user.getStatus() == AccountStatus.BANNED) {
            redisTemplate.delete(redisKey);
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String newAccessToken = jwtProvider.generateToken(userDetails);
        String newRefreshToken = jwtProvider.generateRefreshToken(userDetails);
        redisTemplate.opsForValue().set(redisKey, newRefreshToken,Duration.ofDays(30));
        return RefreshTokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtExpiration / 1000)
                .build();
    }

    public void logout(HttpServletRequest request){
        String authHeader = request.getHeader("Authorization");
        if(authHeader == null || !authHeader.startsWith("Bearer ")){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String accessToken = authHeader.substring(7);

        String tokenId = jwtProvider.extractJwtId(accessToken);
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        String redisKey = "refresh:" + email;
        redisTemplate.delete(redisKey);
        redisTemplate.opsForValue().set(
                "blacklist:jti:" + tokenId, "true",
                Duration.ofMillis(jwtExpiration));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest changePasswordRequest){
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(()->new AppException(ErrorCode.UNAUTHENTICATED));
        if(!passwordEncoder.matches(changePasswordRequest.getOldPassword(),user.getPassword())){
            throw new AppException(ErrorCode.INVALID_OLD_PASSWORD);
        }
        user.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
    }

    public void forgotPassword(ForgotPasswordRequest request){
        if (!rateLimiterService.isForgotPasswordAllowed(request.getEmail())) {
            throw new AppException(ErrorCode.RATE_LIMIT_EXCEEDED);
        }
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());
        if(existingUserOpt.isPresent()){
            User user = existingUserOpt.get();
            if(user.getStatus()!=AccountStatus.PENDING && user.getStatus()!= AccountStatus.BANNED){
                String otpCode = otpService.generateAndSaveOtp(request.getEmail(), OtpService.OtpType.FORGOT_PASSWORD);
                mailService.sendOtpEmailForResetPassword(request.getEmail(),otpCode);
            }
        }
    }

    public VerifyOtpForgotPasswordResponse verifyOtpForgotPassword(VerifyOtpRequest request){
        boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtpCode(), OtpService.OtpType.FORGOT_PASSWORD);
        if (!isValid) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }
        UserDetails dummyUserDetails = org.springframework.security.core.userdetails.User.builder()
                .username(request.getEmail())
                .password("")
                .authorities(Collections.emptyList())
                .build();

        String resetToken = jwtProvider.generateResetPasswordToken(dummyUserDetails);
        String redisKey = "reset_token:" + request.getEmail();

        redisTemplate.opsForValue().set(
                redisKey,
                resetToken,
                Duration.ofMillis(resetExpiration)
        );
        return VerifyOtpForgotPasswordResponse.builder().resetToken(resetToken).build();
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request){
        String redisKeyToken = "reset_token:" + request.getEmail();
        String storedToken = redisTemplate.opsForValue().get(redisKeyToken);

        if(storedToken == null || !storedToken.equals(request.getResetToken())){
            throw new AppException(ErrorCode.OTP_EXPIRED_OR_INVALID);
        }
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getStatus() == AccountStatus.BANNED) {
            throw new AppException(ErrorCode.ACCOUNT_BANNED);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Cleanup
        redisTemplate.delete(redisKeyToken);
        redisTemplate.delete("refresh:" + request.getEmail());
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtpCode(), OtpService.OtpType.REGISTER);
        if (!isValid) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        UserDTO userDTO = userRegistrationService.verifyUser(request.getEmail());

        UserDetails userDetails =
                org.springframework.security.core.userdetails.User.builder()
                        .username(userDTO.getEmail())
                        .password("")
                        .authorities(Collections.emptyList())
                        .build();

        String accessToken = jwtProvider.generateToken(userDetails);
        String refreshToken = jwtProvider.generateRefreshToken(userDetails);

        String redisKey = "refresh:"+userDTO.getEmail();

        redisTemplate.opsForValue().set(
                redisKey,
                refreshToken,
                Duration.ofMillis(refreshExpiration)
        );
        return AuthResponse.builder()
                .user(userDTO)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtExpiration / 1000)
                .build();
    }
}
