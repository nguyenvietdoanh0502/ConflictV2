package com.conflict.be.modules.user.dto;


import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AvatarUploadResult {
    String url;
    String publicId;
}
