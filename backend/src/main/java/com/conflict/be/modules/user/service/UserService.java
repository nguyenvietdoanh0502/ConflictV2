package com.conflict.be.modules.user.service;


import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.user.dto.AvatarUploadResult;
import com.conflict.be.modules.user.dto.UpdateProfileRequest;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.dto.UserRegistrationCommand;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final AvatarStorageService avatarStorageService;
    public UserDTO getUserByEmail(String email){
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return mapToDTO(user);
    }
    private User findUserByEmail(String email){
        return userRepository.findByEmail(email).orElseThrow(
                () -> new AppException(
                        ErrorCode.USER_NOT_EXISTED
                )
        );
    }
    private void deleteAvatarQuietly(String publicId){
        try{
            avatarStorageService.delete(publicId);

        }catch (RuntimeException exception){
            log.warn(
                "Avatar cleanup failed for publicId={}",
                    publicId,
                    exception
            );
        }
    }
    public UserDTO updateProfile(String email, UpdateProfileRequest request){
        User user = findUserByEmail(email);
        String normalizedFullName = request.getFullName().trim();
        if (normalizedFullName.length() < 2 || normalizedFullName.length() > 100) {
            throw new AppException(ErrorCode.INVALID_FULL_NAME);
        }

        String oldAvatarPublicId = user.getAvatarPublicId();
        AvatarUploadResult uploadedAvatar = null;
        MultipartFile newAvatar = request.getAvatar();
        if(newAvatar != null && !newAvatar.isEmpty()){
            uploadedAvatar = avatarStorageService.upload(newAvatar,user.getId());
        }
        user.setFullName(normalizedFullName);
        if (request.isDateOfBirthProvided()) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.isAddressProvided()) {
            user.setAddress(normalizeNullableText(request.getAddress()));
        }
        if (request.isGenderProvided()) {
            user.setGender(request.getGender());
        }
        if(uploadedAvatar != null){
            user.setAvatarUrl(uploadedAvatar.getUrl());
            user.setAvatarPublicId(uploadedAvatar.getPublicId());
        }
        User savedUser;
        try{
            savedUser = userRepository.saveAndFlush(user);
        }catch (RuntimeException exception){
            if(uploadedAvatar != null){
                deleteAvatarQuietly(uploadedAvatar.getPublicId());
            }
            throw  exception;
        }
        if (
                uploadedAvatar != null
                && oldAvatarPublicId !=null
                && !oldAvatarPublicId.isBlank()
                && !oldAvatarPublicId.equals(
                        uploadedAvatar.getPublicId()
                )
        ){
            deleteAvatarQuietly(oldAvatarPublicId);
        }
        return mapToDTO(savedUser);
    }
    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .pinCode(user.getPinCode())
                .avatarUrl(user.getAvatarUrl())
                .dateOfBirth(user.getDateOfBirth())
                .address(user.getAddress())
                .gender(user.getGender())
                .build();
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        return normalizedValue.isEmpty() ? null : normalizedValue;
    }
}
