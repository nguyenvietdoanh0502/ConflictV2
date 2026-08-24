package com.conflict.be.core.config;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary(
        @Value("${conflict.cloudinary.cloud-name}")
        String cloudName,

        @Value("${conflict.cloudinary.api-key}")
        String apiKey,

        @Value("${conflict.cloudinary.api-secret}")
        String apiSecret
    ){
        return  new Cloudinary(
                ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key",apiKey,
                        "api_secret", apiSecret,
                        "secure",true
                )
        );
    }
}
