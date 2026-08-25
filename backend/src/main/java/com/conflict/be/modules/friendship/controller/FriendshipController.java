package com.conflict.be.modules.friendship.controller;


import com.conflict.be.core.common.ApiResponse;
import com.conflict.be.core.common.annotation.RestApiV1;
import com.conflict.be.core.constant.UrlConstant;
import com.conflict.be.modules.friendship.dto.FriendDTO;
import com.conflict.be.modules.friendship.dto.FriendRequestDTO;
import com.conflict.be.modules.friendship.dto.SendFriendRequest;
import com.conflict.be.modules.friendship.service.FriendshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RestApiV1
@RequiredArgsConstructor
public class FriendshipController {
    private final FriendshipService friendshipService;
    @PostMapping(UrlConstant.Friendship.REQUESTS)
    public ResponseEntity<ApiResponse<FriendRequestDTO>> sendFriendRequest (
            Authentication authentication,
            @Valid @RequestBody SendFriendRequest request
            ){
        FriendRequestDTO result = friendshipService.sendFriendRequest(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Friend request sent",result));
    }
    @GetMapping(UrlConstant.Friendship.INCOMING)
    public ResponseEntity<ApiResponse<List<FriendRequestDTO>>> getIncomingRequest (
            Authentication authentication
    ){
        List<FriendRequestDTO> result = friendshipService.getIncomingRequest(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    @GetMapping(UrlConstant.Friendship.OUTGOING)
    public ResponseEntity<ApiResponse<List<FriendRequestDTO>>> getOutgoingRequest(
            Authentication authentication
    ){
        List<FriendRequestDTO> result = friendshipService.getOutgoingRequest(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    @PatchMapping("/friends/requests/{id}/accept")
    public ResponseEntity<ApiResponse<FriendDTO>> acceptFriendRequest (
            Authentication authentication,
            @PathVariable UUID id
            ){
        FriendDTO result = friendshipService.acceptFriendRequest(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Friend request accepted",result));
    }
    @DeleteMapping("/friends/requests/{id}")
    public ResponseEntity<ApiResponse<Void>> removingPendingRequest(
        Authentication authentication,
        @PathVariable UUID id
    ){
        friendshipService.removePendingRequest(authentication.getName(),id);
        return ResponseEntity.ok(ApiResponse.success("Friend request removed",null));
    }
    @GetMapping(UrlConstant.Friendship.FRIENDS)
    public ResponseEntity<ApiResponse<List<FriendDTO>>> getFriends(
            Authentication authentication
    ){
        List<FriendDTO> result = friendshipService.getFriends(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    @DeleteMapping("/friends/{id}")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            Authentication authentication,
            @PathVariable UUID id
    ){
        friendshipService.removeFriend(authentication.getName(),id);
        return ResponseEntity.ok(ApiResponse.success("Friend removed",null));
    }

}
