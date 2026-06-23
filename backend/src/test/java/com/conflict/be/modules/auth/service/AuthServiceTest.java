package com.conflict.be.modules.auth.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.core.security.JwtProvider;
import com.conflict.be.modules.auth.dto.AuthResponse;
import com.conflict.be.modules.auth.dto.RegisterRequest;
import com.conflict.be.modules.auth.dto.VerifyOtpRequest;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.service.UserRegistrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests for AuthService")
class AuthServiceTest {

    @Mock
    private UserRegistrationService userRegistrationService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtProvider jwtProvider;
    @Mock
    private OtpService otpService;
    @Mock
    private MailService mailService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtExpiration", 3600000L);
    }

    @Nested
    @DisplayName("register Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should process registration and send OTP email")
        void testRegister_Success() {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("test@example.com");
            request.setPassword("Password123!");
            request.setFullName("Test User");

            when(passwordEncoder.encode(anyString())).thenReturn("encoded_pwd");
            when(otpService.generateAndSaveOtp(request.getEmail())).thenReturn("123456");

            // Act
            authService.register(request);

            // Assert
            verify(userRegistrationService).registerNewUser(argThat(command -> 
                command.getEmail().equals(request.getEmail()) &&
                command.getHashedPassword().equals("encoded_pwd") &&
                command.getFullName().equals(request.getFullName())
            ));
            verify(otpService).generateAndSaveOtp(request.getEmail());
            verify(mailService).sendOtpEmail(request.getEmail(), "123456");
        }
    }

    @Nested
    @DisplayName("verifyOtp Tests")
    class VerifyOtpTests {

        @Test
        @DisplayName("Should verify OTP and return AuthResponse when valid")
        void testVerifyOtp_Success() {
            // Arrange
            VerifyOtpRequest request = new VerifyOtpRequest();
            request.setEmail("test@example.com");
            request.setOtpCode("123456");

            UserDTO userDTO = UserDTO.builder()
                    .email(request.getEmail())
                    .fullName("Test User")
                    .build();

            when(otpService.verifyOtp(request.getEmail(), request.getOtpCode())).thenReturn(true);
            when(userRegistrationService.verifyUser(request.getEmail())).thenReturn(userDTO);
            when(jwtProvider.generateToken(any(UserDetails.class))).thenReturn("access_token");
            when(jwtProvider.generateRefreshToken(any(UserDetails.class))).thenReturn("refresh_token");

            // Act
            AuthResponse response = authService.verifyOtp(request);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access_token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh_token");
            assertThat(response.getUser().getEmail()).isEqualTo(request.getEmail());
            verify(otpService).verifyOtp(request.getEmail(), request.getOtpCode());
            verify(userRegistrationService).verifyUser(request.getEmail());
        }

        @Test
        @DisplayName("Should throw INVALID_KEY when OTP is invalid")
        void testVerifyOtp_InvalidOtp() {
            // Arrange
            VerifyOtpRequest request = new VerifyOtpRequest();
            request.setEmail("test@example.com");
            request.setOtpCode("wrong");

            when(otpService.verifyOtp(request.getEmail(), request.getOtpCode())).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.verifyOtp(request))
                    .isInstanceOf(AppException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_KEY);
            
            verify(userRegistrationService, never()).verifyUser(anyString());
        }
    }
}
