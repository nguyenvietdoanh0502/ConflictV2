package com.conflict.be.modules.e2ee.service;

import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.e2ee.dto.CreateE2eeKeyRequest;
import com.conflict.be.modules.e2ee.dto.MyE2eeKeyDTO;
import com.conflict.be.modules.e2ee.dto.PublicKeyDTO;
import com.conflict.be.modules.e2ee.dto.UpdateKeyBackupRequest;
import com.conflict.be.modules.e2ee.entity.UserE2eeKey;
import com.conflict.be.modules.e2ee.repository.UserE2eeKeyRepository;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.friendship.repository.FriendshipRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.spec.ECGenParameterSpec;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class E2eeKeyServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private UserE2eeKeyRepository userE2eeKeyRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private E2eeKeyService e2eeKeyService;

    private User alice;
    private User bob;
    private String validP256SpkiBase64;
    private String validBackupBase64;
    private String validSaltBase64;
    private String validIvBase64;

    @BeforeEach
    void setUp() throws Exception {
        alice = User.builder()
                .id(UUID.randomUUID())
                .email("alice@unisync.edu.vn")
                .password("$2a$10$hashedPassword")
                .fullName("Alice")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        bob = User.builder()
                .id(UUID.randomUUID())
                .email("bob@unisync.edu.vn")
                .password("$2a$10$hashedPassword")
                .fullName("Bob")
                .status(AccountStatus.ACTIVE)
                .isDeleted(false)
                .build();

        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
        kpg.initialize(new ECGenParameterSpec("secp256r1"));
        KeyPair kp = kpg.generateKeyPair();
        validP256SpkiBase64 = Base64.getEncoder().encodeToString(kp.getPublic().getEncoded());
        validBackupBase64 = Base64.getEncoder().encodeToString(new byte[154]);
        validSaltBase64 = Base64.getEncoder().encodeToString(new byte[16]);
        validIvBase64 = Base64.getEncoder().encodeToString(new byte[12]);
    }

    @Test
    @DisplayName("getMyKey trả về hasKey=false khi chưa thiết lập khóa")
    void getMyKey_whenNone_returnsHasKeyFalse() {
        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));
        when(userE2eeKeyRepository.findByUserIdAndActiveTrue(alice.getId())).thenReturn(Optional.empty());

        MyE2eeKeyDTO dto = e2eeKeyService.getMyKey(alice.getEmail());

        assertFalse(dto.isHasKey());
        assertNull(dto.getKeyVersion());
    }

    @Test
    @DisplayName("createKey lần đầu tạo version 1 không cần mật khẩu")
    void createKey_firstTime_createsVersion1() {
        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));
        when(userE2eeKeyRepository.findByUserIdAndActiveTrue(alice.getId())).thenReturn(Optional.empty());
        when(userE2eeKeyRepository.findMaxVersionByUserId(alice.getId())).thenReturn(0);
        when(userE2eeKeyRepository.save(any(UserE2eeKey.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateE2eeKeyRequest req = CreateE2eeKeyRequest.builder()
                .publicKey(validP256SpkiBase64)
                .encryptedPrivateKey(validBackupBase64)
                .kdfSalt(validSaltBase64)
                .kdfIterations(600000)
                .wrapIv(validIvBase64)
                .build();

        MyE2eeKeyDTO res = e2eeKeyService.createKey(alice.getEmail(), req);

        assertTrue(res.isHasKey());
        assertEquals(1, res.getKeyVersion());
        assertEquals(validP256SpkiBase64, res.getPublicKey());
    }

    @Test
    @DisplayName("createKey đặt lại khóa khi đã có active key mà thiếu mật khẩu thì ném E2EE_REAUTH_REQUIRED")
    void createKey_replaceWithoutPassword_throwsReauthRequired() {
        UserE2eeKey existing = UserE2eeKey.builder().user(alice).keyVersion(1).active(true).build();
        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));
        when(userE2eeKeyRepository.findByUserIdAndActiveTrue(alice.getId())).thenReturn(Optional.of(existing));

        CreateE2eeKeyRequest req = CreateE2eeKeyRequest.builder()
                .publicKey(validP256SpkiBase64)
                .encryptedPrivateKey(validBackupBase64)
                .kdfSalt(validSaltBase64)
                .kdfIterations(600000)
                .wrapIv(validIvBase64)
                .build();

        AppException ex = assertThrows(AppException.class, () -> e2eeKeyService.createKey(alice.getEmail(), req));
        assertEquals(ErrorCode.E2EE_REAUTH_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("createKey đặt lại khóa với mật khẩu đúng sẽ hủy kích hoạt khóa cũ và tạo version 2")
    void createKey_replaceWithCorrectPassword_createsVersion2() {
        UserE2eeKey existing = UserE2eeKey.builder().user(alice).keyVersion(1).active(true).build();
        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));
        when(userE2eeKeyRepository.findByUserIdAndActiveTrue(alice.getId())).thenReturn(Optional.of(existing));
        when(passwordEncoder.matches("CorrectPass123!", alice.getPassword())).thenReturn(true);
        when(userE2eeKeyRepository.findMaxVersionByUserId(alice.getId())).thenReturn(1);
        when(userE2eeKeyRepository.save(any(UserE2eeKey.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateE2eeKeyRequest req = CreateE2eeKeyRequest.builder()
                .publicKey(validP256SpkiBase64)
                .encryptedPrivateKey(validBackupBase64)
                .kdfSalt(validSaltBase64)
                .kdfIterations(600000)
                .wrapIv(validIvBase64)
                .currentPassword("CorrectPass123!")
                .build();

        MyE2eeKeyDTO res = e2eeKeyService.createKey(alice.getEmail(), req);

        assertFalse(existing.isActive());
        verify(userE2eeKeyRepository).saveAndFlush(existing);
        assertEquals(2, res.getKeyVersion());
    }

    @Test
    @DisplayName("createKey từ chối public key không phải P-256")
    void createKey_invalidPublicKey_throwsInvalidPublicKey() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
        kpg.initialize(new ECGenParameterSpec("secp384r1"));
        String p384Base64 = Base64.getEncoder().encodeToString(kpg.generateKeyPair().getPublic().getEncoded());

        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));

        CreateE2eeKeyRequest req = CreateE2eeKeyRequest.builder()
                .publicKey(p384Base64)
                .encryptedPrivateKey(validBackupBase64)
                .kdfSalt(validSaltBase64)
                .kdfIterations(600000)
                .wrapIv(validIvBase64)
                .build();

        AppException ex = assertThrows(AppException.class, () -> e2eeKeyService.createKey(alice.getEmail(), req));
        assertEquals(ErrorCode.E2EE_INVALID_PUBLIC_KEY, ex.getErrorCode());
    }

    @Test
    @DisplayName("updateBackup cập nhật bản sao lưu khi đổi PIN")
    void updateBackup_updatesActiveKey() {
        UserE2eeKey existing = UserE2eeKey.builder()
                .user(alice)
                .keyVersion(1)
                .publicKey(validP256SpkiBase64)
                .active(true)
                .build();
        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));
        when(userE2eeKeyRepository.findByUserIdAndActiveTrue(alice.getId())).thenReturn(Optional.of(existing));
        when(userE2eeKeyRepository.save(any(UserE2eeKey.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateKeyBackupRequest req = UpdateKeyBackupRequest.builder()
                .encryptedPrivateKey(validBackupBase64)
                .kdfSalt(validSaltBase64)
                .kdfIterations(600000)
                .wrapIv(validIvBase64)
                .build();

        MyE2eeKeyDTO res = e2eeKeyService.updateBackup(alice.getEmail(), req);
        assertEquals(1, res.getKeyVersion());
        assertEquals(validBackupBase64, res.getEncryptedPrivateKey());
    }

    @Test
    @DisplayName("getPublicKeys chặn người chưa kết bạn với lỗi NOT_FRIENDS")
    void getPublicKeys_notFriends_throwsNotFriends() {
        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(friendshipRepository.existsByUsersAndStatus(alice.getId(), bob.getId(), FriendshipStatus.ACCEPTED))
                .thenReturn(false);

        AppException ex = assertThrows(AppException.class,
                () -> e2eeKeyService.getPublicKeys(alice.getEmail(), bob.getId()));
        assertEquals(ErrorCode.NOT_FRIENDS, ex.getErrorCode());
    }

    @Test
    @DisplayName("getPublicKeys trả danh sách khóa công khai theo thứ tự version cho bạn bè")
    void getPublicKeys_friends_returnsOrderedPublicKeys() {
        when(userRepository.findByEmail(alice.getEmail())).thenReturn(Optional.of(alice));
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
        when(friendshipRepository.existsByUsersAndStatus(alice.getId(), bob.getId(), FriendshipStatus.ACCEPTED))
                .thenReturn(true);
        UserE2eeKey v1 = UserE2eeKey.builder().user(bob).keyVersion(1).publicKey("pk1").active(false).build();
        UserE2eeKey v2 = UserE2eeKey.builder().user(bob).keyVersion(2).publicKey("pk2").active(true).build();
        when(userE2eeKeyRepository.findAllByUserIdOrderByKeyVersionAsc(bob.getId())).thenReturn(List.of(v1, v2));

        List<PublicKeyDTO> keys = e2eeKeyService.getPublicKeys(alice.getEmail(), bob.getId());

        assertEquals(2, keys.size());
        assertFalse(keys.get(0).isActive());
        assertTrue(keys.get(1).isActive());
        assertEquals("pk2", keys.get(1).getPublicKey());
    }
}

