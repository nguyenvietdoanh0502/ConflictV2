package com.conflict.be.modules.user.service;

import com.conflict.be.modules.user.dto.AvatarUploadResult;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface AvatarStorageService {

    AvatarUploadResult upload(
            MultipartFile file,
            UUID userId
    );

    void delete(String publicId);
}