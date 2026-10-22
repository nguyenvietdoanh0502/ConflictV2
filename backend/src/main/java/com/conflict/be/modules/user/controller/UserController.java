package com.conflict.be.modules.user.controller;


import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.user.dto.UpdateProfileRequest;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RestApiV1
@RequiredArgsConstructor
public class UserController {
    public final UserService userService;
    @GetMapping(UrlConstant.User.ME)
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        UserDTO userDTO = userService.getUserByEmail(email);
        return ResponseEntity.ok(ApiResponse.success("Successful", userDTO));
    }

    @PatchMapping(
            value = UrlConstant.User.UPDATE_PROFILE,
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<ApiResponse<UserDTO>> updateCurrentUser(
            Authentication authentication,
            @Valid
            @ModelAttribute
            UpdateProfileRequest request
    ){
        String email = authentication.getName();
        UserDTO updatedUser = userService.updateProfile(
                email,
                request
        );
        return ResponseEntity.ok(
                ApiResponse.success("Profile updated successfully", updatedUser)
        );
    }
}
