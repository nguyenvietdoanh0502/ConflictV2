package com.conflict.be.modules.user.dto;


import com.conflict.be.modules.user.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "MISSING_FULL_NAME")
    @Size(
            min = 2,
            max = 100,
            message = "INVALID_FULL_NAME"
    )
    private String fullName;

    @PastOrPresent(message = "INVALID_DATE_OF_BIRTH")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate dateOfBirth;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean dateOfBirthProvided;

    @Size(max = 255, message = "INVALID_ADDRESS")
    private String address;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean addressProvided;

    private Gender gender;

    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean genderProvided;

    private MultipartFile avatar;

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
        this.dateOfBirthProvided = true;
    }

    public boolean isDateOfBirthProvided() {
        return dateOfBirthProvided;
    }

    public void setAddress(String address) {
        this.address = address;
        this.addressProvided = true;
    }

    public boolean isAddressProvided() {
        return addressProvided;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
        this.genderProvided = true;
    }

    public boolean isGenderProvided() {
        return genderProvided;
    }

}
