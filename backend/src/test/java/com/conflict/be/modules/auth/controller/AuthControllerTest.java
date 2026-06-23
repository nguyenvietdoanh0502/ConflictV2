package com.conflict.be.modules.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.conflict.be.modules.auth.service.MailService;
import com.conflict.be.modules.auth.service.OtpService;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.auth.dto.RegisterRequest;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Integration Tests for AuthController")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private MailService mailService;

    @MockBean
    private OtpService otpService;

    @Nested
    @DisplayName("Success Patterns")
    class SuccessPatterns {

        @Test
        @DisplayName("Should register a new user successfully and return message")
        void testRegister_Success() throws Exception {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("test@example.com");
            request.setPassword("Password123!");
            request.setConfirmPassword("Password123!");
            request.setFullName("Test User");

            Mockito.when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
            
            User savedUser = User.builder()
                    .id(UUID.randomUUID())
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .pinCode("RML-123456")
                    .status(AccountStatus.PENDING)
                    .build();

            Mockito.when(userRepository.save(any(User.class))).thenReturn(savedUser);
            Mockito.when(otpService.generateAndSaveOtp(any())).thenReturn("123456");

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status").value("success"))
                    .andExpect(jsonPath("$.message").value("OTP has been sent to your email"))
                    .andExpect(jsonPath("$.data").doesNotExist());
        }
    }

    @Nested
    @DisplayName("Failure Patterns")
    class FailurePatterns {

        @Test
        @DisplayName("Should return 400 Bad Request when the email is already registered")
        void testRegister_UserExisted() throws Exception {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("test@example.com");
            request.setPassword("Password123!");
            request.setConfirmPassword("Password123!");
            request.setFullName("Test User");

            User existingUser = User.builder()
                    .id(UUID.randomUUID())
                    .email(request.getEmail())
                    .status(AccountStatus.ACTIVE)
                    .build();

            Mockito.when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.errorCode").value("USER_EXISTED"))
                    .andExpect(jsonPath("$.message").value("User existed"));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when the password is shorter than 8 characters")
        void testRegister_InvalidPassword() throws Exception {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("test@example.com");
            request.setPassword("short"); // Less than 8 chars
            request.setConfirmPassword("short");
            request.setFullName("Test User");

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.errorCode").value("WEAK_PASSWORD"));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when the email format is invalid")
        void testRegister_InvalidEmail() throws Exception {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("invalid-email");
            request.setPassword("Password123!");
            request.setConfirmPassword("Password123!");
            request.setFullName("Test User");

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.errorCode").value("INVALID_EMAIL"));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when password and confirm password do not match")
        void testRegister_PasswordMismatch() throws Exception {
            // Arrange
            RegisterRequest request = new RegisterRequest();
            request.setEmail("test@example.com");
            request.setPassword("Password123!");
            request.setConfirmPassword("differentPassword123!");
            request.setFullName("Test User");

            // Act & Assert
            mockMvc.perform(post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.errorCode").value("PASSWORD_MISMATCH"));
        }
    }
}

