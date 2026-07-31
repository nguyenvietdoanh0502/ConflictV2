package com.conflict.be.modules.user.controller;


import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.user.dto.UserDTO;
import com.conflict.be.modules.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
}
