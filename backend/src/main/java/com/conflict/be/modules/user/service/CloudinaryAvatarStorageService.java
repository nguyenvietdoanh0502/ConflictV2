package com.conflict.be.modules.user.service;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.user.dto.AvatarUploadResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class CloudinaryAvatarStorageService implements AvatarStorageService{

    private static final long MAX_AVATAR_SIZE = 5L * 1024 * 1024;

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of(
                    "image/jpeg",
                    "image/png",
                    "image/webp"
            );
    private final Cloudinary cloudinary;
    private String folder;
    public CloudinaryAvatarStorageService(
            Cloudinary cloudinary,

            @Value(
                    "${conflict.cloudinary.folder:conflict/avatars}"
            )
            String folder
    ) {
        this.cloudinary = cloudinary;
        this.folder = folder;
    }
    @Override
    public AvatarUploadResult upload(MultipartFile file, UUID userId) {
        validateAvatar(file);

        String publicId = folder + "/" + userId + "/" + UUID.randomUUID();
        Map<?, ?> uploadResult;

        try{
            uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", publicId,
                            "resource_type","image",
                            "overwrite",false,
                            "transformation",
                            "c_fill,g_auto,h_512,w_512"
                    )
            );
        }catch (Exception exception){
            log.error(
                    "Unable to upload avatar for user{}",
                    userId,
                    exception
            );
            throw new AppException(
                    ErrorCode.AVATAR_UPLOAD_FAILED
            );
        }
        Object secureUrl = uploadResult.get("secure_url");
        Object uploadPublicId = uploadResult.get("public_id");
        if(secureUrl == null || uploadPublicId==null){
            log.error(
                    "Cloudinary response is missing secure_url or public_id"
            );
            throw new AppException(
                    ErrorCode.AVATAR_UPLOAD_FAILED
            );
        }
        return AvatarUploadResult.builder().url(secureUrl.toString()).publicId(uploadPublicId.toString()).build();

    }

    @Override
    public void delete(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }
        try{
            cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap(
                            "resource_type","image",
                            "invalidate",true
                    )
            );
        }catch (Exception exception){
            log.error(
                    "Unable to delete Cloudinary avatar {}",
                    publicId,
                    exception
            );
            throw new AppException(
                    ErrorCode.AVATAR_DELETE_FAILED
            );
        }
    }
    private void validateAvatar (MultipartFile file){
        if(file==null || file.isEmpty()){
            throw  new AppException(
                    ErrorCode.INVALID_AVATAR_FILE
            );
        }
        if(file.getSize()>MAX_AVATAR_SIZE){
            throw new AppException(
                    ErrorCode.AVATAR_TOO_LARGE
            );
        }
        String contentType = file.getContentType();

        if(
                contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))
        ){
            throw new AppException(
                    ErrorCode.INVALID_AVATAR_FILE
            );
        }
        validateFileSignature(file);
    }
    private void validateFileSignature(MultipartFile file){
        try(
                InputStream inputStream = file.getInputStream();
                ){
            byte[] header = inputStream.readNBytes(12);
            if(!hasAllowedSignature(header)){
                throw new AppException(
                        ErrorCode.INVALID_AVATAR_FILE
                );
            }
        }catch (IOException exception){
            log.error("Unable to read uploaded avatar", exception);
            throw new AppException(ErrorCode.AVATAR_UPLOAD_FAILED);
        }
    }
    private boolean hasAllowedSignature(byte[] header){
        return isJpeg(header) || isPng(header) || isWebp(header);
    }
    private boolean isJpeg(byte[] header) {
        return header.length >= 3
                && (header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF;
    }

    private boolean isPng(byte[] header) {
        return header.length >= 8
                && (header[0] & 0xFF) == 0x89
                && (header[1] & 0xFF) == 0x50
                && (header[2] & 0xFF) == 0x4E
                && (header[3] & 0xFF) == 0x47
                && (header[4] & 0xFF) == 0x0D
                && (header[5] & 0xFF) == 0x0A
                && (header[6] & 0xFF) == 0x1A
                && (header[7] & 0xFF) == 0x0A;
    }

    private boolean isWebp(byte[] header) {
        return header.length >= 12
                && header[0] == 'R'
                && header[1] == 'I'
                && header[2] == 'F'
                && header[3] == 'F'
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P';
    }
}
