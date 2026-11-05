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
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class E2eeKeyService {
    private static final int MIN_KDF_ITERATIONS = 100_000;
    private static final int EXPECTED_SALT_BYTES = 16;
    private static final int EXPECTED_IV_BYTES = 12;
    private static final int MIN_BACKUP_BYTES = 32;
    private static final int MAX_BACKUP_BYTES = 768;

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserE2eeKeyRepository userE2eeKeyRepository;
    private final PasswordEncoder passwordEncoder;

    private User requireActiveUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    private User requireActiveUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (user.isDeleted()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        if (user.getStatus() != AccountStatus.ACTIVE) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }

    @Transactional(readOnly = true)
    public MyE2eeKeyDTO getMyKey(String currentEmail) {
        User user = requireActiveUser(currentEmail);
        Optional<UserE2eeKey> activeOpt = userE2eeKeyRepository.findByUserIdAndActiveTrue(user.getId());
        if (activeOpt.isEmpty()) {
            return MyE2eeKeyDTO.builder()
                    .hasKey(false)
                    .build();
        }
        return mapToMyKeyDTO(activeOpt.get());
    }

    @Transactional
    public MyE2eeKeyDTO createKey(String currentEmail, CreateE2eeKeyRequest request) {
        User user = requireActiveUser(currentEmail);

        validatePublicKey(request.getPublicKey());
        validateKeyBackup(
                request.getEncryptedPrivateKey(),
                request.getKdfSalt(),
                request.getKdfIterations(),
                request.getWrapIv()
        );

        Optional<UserE2eeKey> existingActive = userE2eeKeyRepository.findByUserIdAndActiveTrue(user.getId());
        if (existingActive.isPresent()) {
            String rawPassword = request.getCurrentPassword();
            if (rawPassword == null || rawPassword.isBlank()) {
                throw new AppException(ErrorCode.E2EE_REAUTH_REQUIRED);
            }
            if (user.getPassword() == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
                throw new AppException(ErrorCode.E2EE_PASSWORD_INCORRECT);
            }
            UserE2eeKey oldKey = existingActive.get();
            oldKey.setActive(false);
            userE2eeKeyRepository.saveAndFlush(oldKey);
        }

        int nextVersion = userE2eeKeyRepository.findMaxVersionByUserId(user.getId()) + 1;
        UserE2eeKey newKey = UserE2eeKey.builder()
                .user(user)
                .keyVersion(nextVersion)
                .publicKey(request.getPublicKey().trim())
                .encryptedPrivateKey(request.getEncryptedPrivateKey().trim())
                .kdfSalt(request.getKdfSalt().trim())
                .kdfIterations(request.getKdfIterations())
                .wrapIv(request.getWrapIv().trim())
                .active(true)
                .build();

        UserE2eeKey saved = userE2eeKeyRepository.save(newKey);
        return mapToMyKeyDTO(saved);
    }

    @Transactional
    public MyE2eeKeyDTO updateBackup(String currentEmail, UpdateKeyBackupRequest request) {
        User user = requireActiveUser(currentEmail);
        UserE2eeKey activeKey = userE2eeKeyRepository.findByUserIdAndActiveTrue(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.E2EE_KEY_NOT_FOUND));

        validateKeyBackup(
                request.getEncryptedPrivateKey(),
                request.getKdfSalt(),
                request.getKdfIterations(),
                request.getWrapIv()
        );

        activeKey.setEncryptedPrivateKey(request.getEncryptedPrivateKey().trim());
        activeKey.setKdfSalt(request.getKdfSalt().trim());
        activeKey.setKdfIterations(request.getKdfIterations());
        activeKey.setWrapIv(request.getWrapIv().trim());

        UserE2eeKey saved = userE2eeKeyRepository.save(activeKey);
        return mapToMyKeyDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<PublicKeyDTO> getPublicKeys(String currentEmail, UUID targetUserId) {
        User currentUser = requireActiveUser(currentEmail);
        User targetUser = requireActiveUser(targetUserId);

        if (!currentUser.getId().equals(targetUser.getId())) {
            boolean areFriends = friendshipRepository.existsByUsersAndStatus(
                    currentUser.getId(),
                    targetUser.getId(),
                    FriendshipStatus.ACCEPTED
            );
            if (!areFriends) {
                throw new AppException(ErrorCode.NOT_FRIENDS);
            }
        }

        return userE2eeKeyRepository.findAllByUserIdOrderByKeyVersionAsc(targetUser.getId())
                .stream()
                .map(k -> PublicKeyDTO.builder()
                        .userId(targetUser.getId())
                        .keyVersion(k.getKeyVersion())
                        .publicKey(k.getPublicKey())
                        .active(k.isActive())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<Integer> getActiveVersion(UUID userId) {
        return userE2eeKeyRepository.findByUserIdAndActiveTrue(userId)
                .map(UserE2eeKey::getKeyVersion);
    }

    private void validatePublicKey(String publicKeyBase64) {
        if (publicKeyBase64 == null || publicKeyBase64.isBlank()) {
            throw new AppException(ErrorCode.E2EE_INVALID_PUBLIC_KEY);
        }
        try {
            byte[] spkiBytes = Base64.getDecoder().decode(publicKeyBase64.trim());
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            PublicKey parsed = keyFactory.generatePublic(new X509EncodedKeySpec(spkiBytes));
            if (!(parsed instanceof ECPublicKey ecPublicKey)) {
                throw new AppException(ErrorCode.E2EE_INVALID_PUBLIC_KEY);
            }
            int fieldSize = ecPublicKey.getParams().getCurve().getField().getFieldSize();
            if (fieldSize != 256) {
                throw new AppException(ErrorCode.E2EE_INVALID_PUBLIC_KEY);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.E2EE_INVALID_PUBLIC_KEY);
        }
    }

    private void validateKeyBackup(
            String encryptedPrivateKey,
            String kdfSalt,
            Integer kdfIterations,
            String wrapIv
    ) {
        if (encryptedPrivateKey == null || kdfSalt == null || kdfIterations == null || wrapIv == null) {
            throw new AppException(ErrorCode.E2EE_INVALID_KEY_BACKUP);
        }
        if (kdfIterations < MIN_KDF_ITERATIONS) {
            throw new AppException(ErrorCode.E2EE_INVALID_KEY_BACKUP);
        }
        try {
            byte[] saltBytes = Base64.getDecoder().decode(kdfSalt.trim());
            byte[] ivBytes = Base64.getDecoder().decode(wrapIv.trim());
            byte[] backupBytes = Base64.getDecoder().decode(encryptedPrivateKey.trim());
            if (saltBytes.length != EXPECTED_SALT_BYTES
                    || ivBytes.length != EXPECTED_IV_BYTES
                    || backupBytes.length < MIN_BACKUP_BYTES
                    || backupBytes.length > MAX_BACKUP_BYTES) {
                throw new AppException(ErrorCode.E2EE_INVALID_KEY_BACKUP);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.E2EE_INVALID_KEY_BACKUP);
        }
    }

    private MyE2eeKeyDTO mapToMyKeyDTO(UserE2eeKey entity) {
        return MyE2eeKeyDTO.builder()
                .hasKey(true)
                .keyVersion(entity.getKeyVersion())
                .publicKey(entity.getPublicKey())
                .encryptedPrivateKey(entity.getEncryptedPrivateKey())
                .kdfSalt(entity.getKdfSalt())
                .kdfIterations(entity.getKdfIterations())
                .wrapIv(entity.getWrapIv())
                .build();
    }
}

