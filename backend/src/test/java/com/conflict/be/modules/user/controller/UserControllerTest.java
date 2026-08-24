package com.conflict.be.modules.user.controller;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.auth.service.MailService;
import com.conflict.be.modules.user.dto.UpdateProfileRequest;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.enums.Gender;
import com.conflict.be.modules.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Integration Tests for UserController")
class UserControllerTest {

    private static final String EMAIL = "profile@example.com";
    private static final String CURRENT_USER_URL = "/api/v1/users/me";
    private static final String UPDATE_PROFILE_URL = "/api/v1/user/update-profile";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private MailService mailService;

    @Nested
    @DisplayName("getCurrentUser Tests")
    class GetCurrentUserTests {

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should return all current user profile fields")
        void getCurrentUser_Authenticated_ReturnsProfileDetails() throws Exception {
            UserDTO currentUser = UserDTO.builder()
                    .id(UUID.randomUUID())
                    .email(EMAIL)
                    .fullName("Current User")
                    .pinCode("RML-123456")
                    .avatarUrl("https://cdn.example.com/avatar.png")
                    .dateOfBirth(LocalDate.of(1998, 4, 12))
                    .address("123 Nguyen Hue, Ho Chi Minh City")
                    .gender(Gender.OTHER)
                    .build();
            when(userService.getUserByEmail(EMAIL)).thenReturn(currentUser);

            mockMvc.perform(get(CURRENT_USER_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.email").value(EMAIL))
                    .andExpect(jsonPath("$.data.dateOfBirth").value("1998-04-12"))
                    .andExpect(jsonPath("$.data.address")
                            .value("123 Nguyen Hue, Ho Chi Minh City"))
                    .andExpect(jsonPath("$.data.gender").value("OTHER"));

            verify(userService).getUserByEmail(EMAIL);
        }
    }

    @Nested
    @DisplayName("updateCurrentUser Tests")
    class UpdateCurrentUserTests {

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should bind multipart data and return the updated profile")
        void updateCurrentUser_ValidMultipart_Success() throws Exception {
            MockMultipartFile avatar = new MockMultipartFile(
                    "avatar",
                    "avatar.png",
                    "image/png",
                    new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47}
            );
            UserDTO updatedUser = UserDTO.builder()
                    .id(UUID.randomUUID())
                    .email(EMAIL)
                    .fullName("Updated User")
                    .pinCode("RML-123456")
                    .avatarUrl("https://cdn.example.com/new.png")
                    .dateOfBirth(LocalDate.of(2000, 8, 24))
                    .address("456 Le Loi, Da Nang")
                    .gender(Gender.FEMALE)
                    .build();
            when(userService.updateProfile(eq(EMAIL), any(UpdateProfileRequest.class)))
                    .thenReturn(updatedUser);

            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .file(avatar)
                            .param("fullName", "Updated User")
                            .param("dateOfBirth", "2000-08-24")
                            .param("address", "456 Le Loi, Da Nang")
                            .param("gender", "FEMALE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("success"))
                    .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                    .andExpect(jsonPath("$.data.email").value(EMAIL))
                    .andExpect(jsonPath("$.data.fullName").value("Updated User"))
                    .andExpect(jsonPath("$.data.dateOfBirth").value("2000-08-24"))
                    .andExpect(jsonPath("$.data.address").value("456 Le Loi, Da Nang"))
                    .andExpect(jsonPath("$.data.gender").value("FEMALE"))
                    .andExpect(jsonPath("$.data.avatarUrl")
                            .value("https://cdn.example.com/new.png"));

            ArgumentCaptor<UpdateProfileRequest> requestCaptor =
                    ArgumentCaptor.forClass(UpdateProfileRequest.class);
            verify(userService).updateProfile(eq(EMAIL), requestCaptor.capture());
            assertThat(requestCaptor.getValue().getFullName()).isEqualTo("Updated User");
            assertThat(requestCaptor.getValue().getDateOfBirth())
                    .isEqualTo(LocalDate.of(2000, 8, 24));
            assertThat(requestCaptor.getValue().getAddress()).isEqualTo("456 Le Loi, Da Nang");
            assertThat(requestCaptor.getValue().getGender()).isEqualTo(Gender.FEMALE);
            assertThat(requestCaptor.getValue().isDateOfBirthProvided()).isTrue();
            assertThat(requestCaptor.getValue().isAddressProvided()).isTrue();
            assertThat(requestCaptor.getValue().isGenderProvided()).isTrue();
            assertThat(requestCaptor.getValue().getAvatar().getOriginalFilename())
                    .isEqualTo("avatar.png");
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should allow updating full name without an avatar part")
        void updateCurrentUser_FullNameOnly_Success() throws Exception {
            UserDTO updatedUser = UserDTO.builder()
                    .id(UUID.randomUUID())
                    .email(EMAIL)
                    .fullName("Name Only")
                    .avatarUrl("https://cdn.example.com/old.png")
                    .build();
            when(userService.updateProfile(eq(EMAIL), any(UpdateProfileRequest.class)))
                    .thenReturn(updatedUser);

            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Name Only"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.fullName").value("Name Only"))
                    .andExpect(jsonPath("$.data.avatarUrl")
                            .value("https://cdn.example.com/old.png"));

            ArgumentCaptor<UpdateProfileRequest> requestCaptor =
                    ArgumentCaptor.forClass(UpdateProfileRequest.class);
            verify(userService).updateProfile(eq(EMAIL), requestCaptor.capture());
            assertThat(requestCaptor.getValue().getAvatar()).isNull();
            assertThat(requestCaptor.getValue().isDateOfBirthProvided()).isFalse();
            assertThat(requestCaptor.getValue().isAddressProvided()).isFalse();
            assertThat(requestCaptor.getValue().isGenderProvided()).isFalse();
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should bind empty optional fields so they can be cleared")
        void updateCurrentUser_EmptyProfileDetails_MarksFieldsAsProvided() throws Exception {
            UserDTO updatedUser = UserDTO.builder()
                    .id(UUID.randomUUID())
                    .email(EMAIL)
                    .fullName("Updated User")
                    .build();
            when(userService.updateProfile(eq(EMAIL), any(UpdateProfileRequest.class)))
                    .thenReturn(updatedUser);

            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Updated User")
                            .param("dateOfBirth", "")
                            .param("address", "")
                            .param("gender", ""))
                    .andExpect(status().isOk());

            ArgumentCaptor<UpdateProfileRequest> requestCaptor =
                    ArgumentCaptor.forClass(UpdateProfileRequest.class);
            verify(userService).updateProfile(eq(EMAIL), requestCaptor.capture());
            UpdateProfileRequest request = requestCaptor.getValue();
            assertThat(request.isDateOfBirthProvided()).isTrue();
            assertThat(request.isAddressProvided()).isTrue();
            assertThat(request.isGenderProvided()).isTrue();
            assertThat(request.getDateOfBirth()).isNull();
            assertThat(request.getAddress()).isEmpty();
            assertThat(request.getGender()).isNull();
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should return MISSING_FULL_NAME when full name is absent")
        void updateCurrentUser_MissingFullName_ReturnsBadRequest() throws Exception {
            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.errorCode").value("MISSING_FULL_NAME"));

            verifyNoInteractions(userService);
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should return INVALID_FULL_NAME when full name is too short")
        void updateCurrentUser_ShortFullName_ReturnsBadRequest() throws Exception {
            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "A"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("INVALID_FULL_NAME"));

            verifyNoInteractions(userService);
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should return INVALID_DATE_OF_BIRTH for a future date")
        void updateCurrentUser_FutureDateOfBirth_ReturnsBadRequest() throws Exception {
            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Updated User")
                            .param("dateOfBirth", LocalDate.now().plusDays(1).toString()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("INVALID_DATE_OF_BIRTH"));

            verifyNoInteractions(userService);
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should return INVALID_DATE_OF_BIRTH for an invalid date format")
        void updateCurrentUser_InvalidDateFormat_ReturnsBadRequest() throws Exception {
            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Updated User")
                            .param("dateOfBirth", "24-08-2000"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("INVALID_DATE_OF_BIRTH"));

            verifyNoInteractions(userService);
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should return INVALID_ADDRESS when address exceeds 255 characters")
        void updateCurrentUser_AddressTooLong_ReturnsBadRequest() throws Exception {
            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Updated User")
                            .param("address", "A".repeat(256)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("INVALID_ADDRESS"));

            verifyNoInteractions(userService);
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should return INVALID_GENDER for an unsupported enum value")
        void updateCurrentUser_InvalidGender_ReturnsBadRequest() throws Exception {
            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Updated User")
                            .param("gender", "UNKNOWN"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errorCode").value("INVALID_GENDER"));

            verifyNoInteractions(userService);
        }

        @Test
        @WithMockUser(username = EMAIL)
        @DisplayName("Should map USER_NOT_EXISTED from service to 404")
        void updateCurrentUser_UserNotFound_ReturnsNotFound() throws Exception {
            when(userService.updateProfile(eq(EMAIL), any(UpdateProfileRequest.class)))
                    .thenThrow(new AppException(ErrorCode.USER_NOT_EXISTED));

            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Updated User"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.errorCode").value("USER_NOT_EXISTED"));
        }

        @Test
        @DisplayName("Should reject an unauthenticated update request")
        void updateCurrentUser_Unauthenticated_IsRejected() throws Exception {
            mockMvc.perform(multipart(HttpMethod.PATCH, UPDATE_PROFILE_URL)
                            .param("fullName", "Updated User"))
                    .andExpect(status().isForbidden());

            verifyNoInteractions(userService);
        }
    }
}
