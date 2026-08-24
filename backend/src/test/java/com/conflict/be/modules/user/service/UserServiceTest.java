package com.conflict.be.modules.user.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.user.dto.AvatarUploadResult;
import com.conflict.be.modules.user.dto.UpdateProfileRequest;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.Gender;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests for UserService")
class UserServiceTest {

    private static final String EMAIL = "profile@example.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private AvatarStorageService avatarStorageService;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("Should include profile details when getting the current user")
    void getUserByEmail_IncludesProfileDetails() {
        User user = createUser();
        user.setDateOfBirth(LocalDate.of(1998, 4, 12));
        user.setAddress("123 Nguyen Hue, Ho Chi Minh City");
        user.setGender(Gender.OTHER);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        UserDTO result = userService.getUserByEmail(EMAIL);

        assertThat(result.getDateOfBirth()).isEqualTo(LocalDate.of(1998, 4, 12));
        assertThat(result.getAddress()).isEqualTo("123 Nguyen Hue, Ho Chi Minh City");
        assertThat(result.getGender()).isEqualTo(Gender.OTHER);
    }

    @Nested
    @DisplayName("updateProfile Tests")
    class UpdateProfileTests {

        @Test
        @DisplayName("Should update and trim full name without changing avatar")
        void updateProfile_FullNameOnly_Success() {
            User user = createUser();
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFullName("  Updated User  ");

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(userRepository.saveAndFlush(user)).thenReturn(user);

            UserDTO result = userService.updateProfile(EMAIL, request);

            assertThat(result.getFullName()).isEqualTo("Updated User");
            assertThat(result.getAvatarUrl()).isEqualTo("https://cdn.example.com/old.jpg");
            assertThat(user.getAvatarPublicId()).isEqualTo("old-public-id");
            verifyNoInteractions(avatarStorageService);
            verify(userRepository).saveAndFlush(user);
        }

        @Test
        @DisplayName("Should preserve optional profile details when they are omitted")
        void updateProfile_OmittedProfileDetails_PreservesExistingValues() {
            User user = createUser();
            user.setDateOfBirth(LocalDate.of(1998, 4, 12));
            user.setAddress("123 Nguyen Hue, Ho Chi Minh City");
            user.setGender(Gender.OTHER);
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFullName("Updated User");

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(userRepository.saveAndFlush(user)).thenReturn(user);

            UserDTO result = userService.updateProfile(EMAIL, request);

            assertThat(result.getDateOfBirth()).isEqualTo(LocalDate.of(1998, 4, 12));
            assertThat(result.getAddress()).isEqualTo("123 Nguyen Hue, Ho Chi Minh City");
            assertThat(result.getGender()).isEqualTo(Gender.OTHER);
        }

        @Test
        @DisplayName("Should reject a full name that is too short after trimming")
        void updateProfile_TrimmedFullNameTooShort_ThrowsInvalidFullName() {
            User user = createUser();
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFullName(" A ");
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> userService.updateProfile(EMAIL, request))
                    .isInstanceOf(AppException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_FULL_NAME);

            verify(userRepository, never()).saveAndFlush(any(User.class));
            verifyNoInteractions(avatarStorageService);
        }

        @Test
        @DisplayName("Should update date of birth, address and gender")
        void updateProfile_ProfileDetails_Success() {
            User user = createUser();
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFullName("Updated User");
            request.setDateOfBirth(LocalDate.of(2000, 8, 24));
            request.setAddress("  456 Le Loi, Da Nang  ");
            request.setGender(Gender.FEMALE);

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(userRepository.saveAndFlush(user)).thenReturn(user);

            UserDTO result = userService.updateProfile(EMAIL, request);

            assertThat(user.getDateOfBirth()).isEqualTo(LocalDate.of(2000, 8, 24));
            assertThat(user.getAddress()).isEqualTo("456 Le Loi, Da Nang");
            assertThat(user.getGender()).isEqualTo(Gender.FEMALE);
            assertThat(result.getDateOfBirth()).isEqualTo(LocalDate.of(2000, 8, 24));
            assertThat(result.getAddress()).isEqualTo("456 Le Loi, Da Nang");
            assertThat(result.getGender()).isEqualTo(Gender.FEMALE);
            verifyNoInteractions(avatarStorageService);
            verify(userRepository).saveAndFlush(user);
        }

        @Test
        @DisplayName("Should clear optional profile details when empty values are provided")
        void updateProfile_EmptyProfileDetails_ClearsExistingValues() {
            User user = createUser();
            user.setDateOfBirth(LocalDate.of(1998, 4, 12));
            user.setAddress("123 Nguyen Hue, Ho Chi Minh City");
            user.setGender(Gender.OTHER);
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFullName("Updated User");
            request.setDateOfBirth(null);
            request.setAddress("   ");
            request.setGender(null);

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(userRepository.saveAndFlush(user)).thenReturn(user);

            UserDTO result = userService.updateProfile(EMAIL, request);

            assertThat(result.getDateOfBirth()).isNull();
            assertThat(result.getAddress()).isNull();
            assertThat(result.getGender()).isNull();
        }

        @Test
        @DisplayName("Should upload new avatar, save it and delete old avatar")
        void updateProfile_WithAvatar_Success() {
            User user = createUser();
            MockMultipartFile avatar = jpegFile();
            UpdateProfileRequest request = requestWith("Updated User", avatar);
            AvatarUploadResult uploaded = AvatarUploadResult.builder()
                    .url("https://cdn.example.com/new.jpg")
                    .publicId("new-public-id")
                    .build();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(avatarStorageService.upload(avatar, user.getId())).thenReturn(uploaded);
            when(userRepository.saveAndFlush(user)).thenReturn(user);

            UserDTO result = userService.updateProfile(EMAIL, request);

            assertThat(result.getFullName()).isEqualTo("Updated User");
            assertThat(result.getAvatarUrl()).isEqualTo(uploaded.getUrl());
            assertThat(user.getAvatarPublicId()).isEqualTo(uploaded.getPublicId());
            verify(avatarStorageService).upload(avatar, user.getId());
            verify(avatarStorageService).delete("old-public-id");
            verify(userRepository).saveAndFlush(user);
        }

        @Test
        @DisplayName("Should not delete a remote avatar when the old public id is absent")
        void updateProfile_NoOldPublicId_DoesNotDeleteOldAvatar() {
            User user = createUser();
            user.setAvatarPublicId(null);
            MockMultipartFile avatar = jpegFile();
            UpdateProfileRequest request = requestWith("Updated User", avatar);
            AvatarUploadResult uploaded = AvatarUploadResult.builder()
                    .url("https://cdn.example.com/new.jpg")
                    .publicId("new-public-id")
                    .build();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(avatarStorageService.upload(avatar, user.getId())).thenReturn(uploaded);
            when(userRepository.saveAndFlush(user)).thenReturn(user);

            UserDTO result = userService.updateProfile(EMAIL, request);

            assertThat(result.getAvatarUrl()).isEqualTo(uploaded.getUrl());
            verify(avatarStorageService).upload(avatar, user.getId());
            verify(avatarStorageService, never()).delete(anyString());
        }

        @Test
        @DisplayName("Should delete the newly uploaded avatar when database save fails")
        void updateProfile_DatabaseFails_CleansUpNewAvatar() {
            User user = createUser();
            MockMultipartFile avatar = jpegFile();
            UpdateProfileRequest request = requestWith("Updated User", avatar);
            AvatarUploadResult uploaded = AvatarUploadResult.builder()
                    .url("https://cdn.example.com/new.jpg")
                    .publicId("new-public-id")
                    .build();
            RuntimeException databaseFailure = new RuntimeException("database failure");

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(avatarStorageService.upload(avatar, user.getId())).thenReturn(uploaded);
            when(userRepository.saveAndFlush(user)).thenThrow(databaseFailure);

            assertThatThrownBy(() -> userService.updateProfile(EMAIL, request))
                    .isSameAs(databaseFailure);

            verify(avatarStorageService).delete("new-public-id");
            verify(avatarStorageService, never()).delete("old-public-id");
        }

        @Test
        @DisplayName("Should keep successful profile update when old avatar cleanup fails")
        void updateProfile_OldAvatarCleanupFails_StillReturnsUpdatedUser() {
            User user = createUser();
            MockMultipartFile avatar = jpegFile();
            UpdateProfileRequest request = requestWith("Updated User", avatar);
            AvatarUploadResult uploaded = AvatarUploadResult.builder()
                    .url("https://cdn.example.com/new.jpg")
                    .publicId("new-public-id")
                    .build();

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(avatarStorageService.upload(avatar, user.getId())).thenReturn(uploaded);
            when(userRepository.saveAndFlush(user)).thenReturn(user);
            doThrow(new AppException(ErrorCode.AVATAR_DELETE_FAILED))
                    .when(avatarStorageService).delete("old-public-id");

            UserDTO result = userService.updateProfile(EMAIL, request);

            assertThat(result.getAvatarUrl()).isEqualTo(uploaded.getUrl());
            verify(avatarStorageService).delete("old-public-id");
        }

        @Test
        @DisplayName("Should stop before saving when avatar upload fails")
        void updateProfile_UploadFails_DoesNotSaveUser() {
            User user = createUser();
            MockMultipartFile avatar = jpegFile();
            UpdateProfileRequest request = requestWith("Updated User", avatar);
            AppException uploadFailure = new AppException(ErrorCode.AVATAR_UPLOAD_FAILED);

            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
            when(avatarStorageService.upload(avatar, user.getId())).thenThrow(uploadFailure);

            assertThatThrownBy(() -> userService.updateProfile(EMAIL, request))
                    .isSameAs(uploadFailure);

            verify(userRepository, never()).saveAndFlush(any(User.class));
            verify(avatarStorageService, never()).delete(anyString());
        }

        @Test
        @DisplayName("Should throw USER_NOT_EXISTED when authenticated user cannot be found")
        void updateProfile_UserNotFound_ThrowsAppException() {
            UpdateProfileRequest request = new UpdateProfileRequest();
            request.setFullName("Updated User");
            when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.updateProfile(EMAIL, request))
                    .isInstanceOf(AppException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_EXISTED);

            verify(userRepository, never()).saveAndFlush(any(User.class));
            verifyNoInteractions(avatarStorageService);
        }
    }

    private User createUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .email(EMAIL)
                .fullName("Old User")
                .pinCode("RML-123456")
                .avatarUrl("https://cdn.example.com/old.jpg")
                .avatarPublicId("old-public-id")
                .build();
    }

    private UpdateProfileRequest requestWith(String fullName, MockMultipartFile avatar) {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName(fullName);
        request.setAvatar(avatar);
        return request;
    }

    private MockMultipartFile jpegFile() {
        return new MockMultipartFile(
                "avatar",
                "avatar.jpg",
                "image/jpeg",
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00}
        );
    }
}
