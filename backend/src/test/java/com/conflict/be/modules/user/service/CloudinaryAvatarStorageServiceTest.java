package com.conflict.be.modules.user.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.user.dto.AvatarUploadResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Unit Tests for CloudinaryAvatarStorageService")
class CloudinaryAvatarStorageServiceTest {

    private static final long FIVE_MB = 5L * 1024 * 1024;

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    private CloudinaryAvatarStorageService avatarStorageService;

    @BeforeEach
    void setUp() {
        avatarStorageService = new CloudinaryAvatarStorageService(
                cloudinary,
                "test/avatars"
        );
    }

    @Nested
    @DisplayName("upload Tests")
    class UploadTests {

        @Test
        @DisplayName("Should upload valid JPEG and return secure URL with public id")
        void upload_ValidJpeg_Success() throws IOException {
            UUID userId = UUID.randomUUID();
            MockMultipartFile file = jpegFile();
            when(cloudinary.uploader()).thenReturn(uploader);
            when(uploader.upload(any(), anyMap())).thenReturn(Map.of(
                    "secure_url", "https://cdn.example.com/avatar.jpg",
                    "public_id", "test/avatars/user/avatar-id"
            ));

            AvatarUploadResult result = avatarStorageService.upload(file, userId);

            assertThat(result.getUrl()).isEqualTo("https://cdn.example.com/avatar.jpg");
            assertThat(result.getPublicId()).isEqualTo("test/avatars/user/avatar-id");
            verify(uploader).upload(argThat(value -> value instanceof byte[]), anyMap());
        }

        @Test
        @DisplayName("Should reject a MIME type outside the avatar allowlist")
        void upload_InvalidContentType_ThrowsInvalidAvatarFile() {
            MockMultipartFile file = new MockMultipartFile(
                    "avatar",
                    "avatar.txt",
                    "text/plain",
                    "not-an-image".getBytes()
            );

            assertAppException(file, ErrorCode.INVALID_AVATAR_FILE);
            verifyNoInteractions(cloudinary, uploader);
        }

        @Test
        @DisplayName("Should reject a spoofed PNG whose signature is invalid")
        void upload_InvalidSignature_ThrowsInvalidAvatarFile() {
            MockMultipartFile file = new MockMultipartFile(
                    "avatar",
                    "avatar.png",
                    "image/png",
                    "not-a-real-png".getBytes()
            );

            assertAppException(file, ErrorCode.INVALID_AVATAR_FILE);
            verifyNoInteractions(cloudinary, uploader);
        }

        @Test
        @DisplayName("Should reject an avatar larger than five megabytes")
        void upload_FileTooLarge_ThrowsAvatarTooLarge() {
            MockMultipartFile file = new MockMultipartFile(
                    "avatar",
                    "large.jpg",
                    "image/jpeg",
                    new byte[(int) FIVE_MB + 1]
            );

            assertAppException(file, ErrorCode.AVATAR_TOO_LARGE);
            verifyNoInteractions(cloudinary, uploader);
        }

        @Test
        @DisplayName("Should map Cloudinary upload errors to AVATAR_UPLOAD_FAILED")
        void upload_CloudinaryFails_ThrowsUploadFailed() throws IOException {
            MockMultipartFile file = jpegFile();
            when(cloudinary.uploader()).thenReturn(uploader);
            when(uploader.upload(any(), anyMap())).thenThrow(new IOException("upload failed"));

            assertAppException(file, ErrorCode.AVATAR_UPLOAD_FAILED);
        }

        @Test
        @DisplayName("Should reject a Cloudinary response without required metadata")
        void upload_MissingResponseFields_ThrowsUploadFailed() throws IOException {
            MockMultipartFile file = jpegFile();
            when(cloudinary.uploader()).thenReturn(uploader);
            when(uploader.upload(any(), anyMap())).thenReturn(Map.of("public_id", "avatar-id"));

            assertAppException(file, ErrorCode.AVATAR_UPLOAD_FAILED);
        }
    }

    @Nested
    @DisplayName("delete Tests")
    class DeleteTests {

        @Test
        @DisplayName("Should delete avatar and invalidate its CDN cache")
        void delete_ValidPublicId_Success() throws IOException {
            when(cloudinary.uploader()).thenReturn(uploader);
            when(uploader.destroy(eq("old-public-id"), anyMap()))
                    .thenReturn(Map.of("result", "ok"));

            avatarStorageService.delete("old-public-id");

            verify(uploader).destroy(eq("old-public-id"), argThat(options ->
                    "image".equals(options.get("resource_type"))
                            && Boolean.TRUE.equals(options.get("invalidate"))
            ));
        }

        @Test
        @DisplayName("Should ignore a blank public id")
        void delete_BlankPublicId_DoesNothing() {
            avatarStorageService.delete("   ");

            verifyNoInteractions(cloudinary, uploader);
        }

        @Test
        @DisplayName("Should map Cloudinary delete errors to AVATAR_DELETE_FAILED")
        void delete_CloudinaryFails_ThrowsDeleteFailed() throws IOException {
            when(cloudinary.uploader()).thenReturn(uploader);
            when(uploader.destroy(eq("old-public-id"), anyMap()))
                    .thenThrow(new IOException("delete failed"));

            assertThatThrownBy(() -> avatarStorageService.delete("old-public-id"))
                    .isInstanceOf(AppException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AVATAR_DELETE_FAILED);
        }
    }

    private void assertAppException(MockMultipartFile file, ErrorCode errorCode) {
        assertThatThrownBy(() -> avatarStorageService.upload(file, UUID.randomUUID()))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", errorCode);
    }

    private MockMultipartFile jpegFile() {
        return new MockMultipartFile(
                "avatar",
                "avatar.jpg",
                "image/jpeg",
                new byte[]{
                        (byte) 0xFF,
                        (byte) 0xD8,
                        (byte) 0xFF,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00
                }
        );
    }
}
