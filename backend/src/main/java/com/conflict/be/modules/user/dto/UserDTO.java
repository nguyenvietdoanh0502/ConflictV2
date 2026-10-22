package com.conflict.be.modules.user.dto;

import com.conflict.be.modules.user.enums.Gender;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class UserDTO {
    private UUID id;
    private String email;
    private String fullName;
    private String pinCode;
    private String avatarUrl;
    private LocalDate dateOfBirth;
    private String address;
    private Gender gender;
}
