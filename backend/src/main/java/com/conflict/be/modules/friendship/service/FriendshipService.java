package com.conflict.be.modules.friendship.service;


import com.conflict.be.core.exception.AppException;
import com.conflict.be.core.exception.ErrorCode;
import com.conflict.be.modules.auth.service.RateLimiterService;
import com.conflict.be.modules.friendship.dto.*;
import com.conflict.be.modules.friendship.entity.Friendship;
import com.conflict.be.modules.friendship.enums.FriendshipStatus;
import com.conflict.be.modules.friendship.repository.FriendshipRepository;
import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import com.conflict.be.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FriendshipService {
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private record FriendPair(User lowUser, User highUser){

    }
    private User requireActiveUser(String email){
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        ()-> new AppException(ErrorCode.USER_NOT_EXISTED)
                );
        if(user.isDeleted()){
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        if(user.getStatus() != AccountStatus.ACTIVE){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return user;
    }
    private FriendPair createFriendPair(
            User firstUser,
            User secondUser
    ){
        String firstPin = firstUser.getPinCode();
        String secondPin = secondUser.getPinCode();
        if(firstPin.compareTo(secondPin)<0){
            return new FriendPair(firstUser, secondUser);
        }
        return new FriendPair(secondUser,firstUser);
    }
    private User getOtherUser(
            Friendship friendship,
            UUID currentUserId
    ){
        if(
                friendship.getLowUser().getId().equals(currentUserId)
        ){
            return friendship.getHighUser();
        }
        if (
                friendship.getHighUser()
                        .getId()
                        .equals(currentUserId)
        ) {
            return friendship.getLowUser();
        }
        throw new AppException(ErrorCode.FRIENDSHIP_FORBIDDEN);
    }
    private FriendUserDTO mapToFriendUserDTO(User user){
        return FriendUserDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
    private FriendRequestDTO mapToFriendRequestDTO(
            Friendship friendship,
            UUID currentUserId
    ){
        User otherUser = getOtherUser(
                friendship,
                currentUserId
        );
        return FriendRequestDTO.builder()
                .requestId(friendship.getId())
                .user(mapToFriendUserDTO(otherUser))
                .status(friendship.getStatus())
                .createdAt(friendship.getCreatedAt())
                .build();
    }
    private FriendDTO mapToFriendDTO(
            Friendship friendship,
            UUID currentUserId
    ){
        User otherUser = getOtherUser(
                friendship,
                currentUserId
        );
        return FriendDTO.builder()
                .friendshipId(friendship.getId())
                .user(mapToFriendUserDTO(otherUser))
                .friendsSince(friendship.getAcceptedAt())
                .build();
    }
    @Transactional
    public FriendRequestDTO sendFriendRequest(
            String currentUserEmail,
            SendFriendRequest request
    ){
        User sender = requireActiveUser(currentUserEmail);
        String normalizedPinCode = request.getPinCode().trim().toUpperCase(Locale.ROOT);
        User receiver = userRepository.findByPinCodeAndStatusAndIsDeletedFalse(normalizedPinCode,AccountStatus.ACTIVE)
                .orElseThrow(
                        ()->new AppException(ErrorCode.PIN_CODE_NOT_FOUND)
                );
        if(sender.getId().equals(receiver.getId())){
            throw new AppException(
                    ErrorCode.CANNOT_FRIEND_SELF
            );
        }
        FriendPair pair = createFriendPair(sender,receiver);
        Optional<Friendship> existingFriendship = friendshipRepository.findByPair(pair.lowUser.getId(),pair.highUser.getId());
        if(existingFriendship.isPresent()){
            Friendship existing = existingFriendship.get();
            if(
                    existing.getStatus() == FriendshipStatus.ACCEPTED
            ){
                throw new AppException(ErrorCode.ALREADY_FRIENDS);
            }
            boolean sentByCurrentUser = existing.getRequestedBy().getId().equals(sender.getId());
            if(sentByCurrentUser){
                throw new AppException(ErrorCode.FRIEND_REQUEST_ALREADY_SENT);
            }
            throw new AppException(ErrorCode.FRIEND_REQUEST_ALREADY_RECEIVED);
        }
        Friendship friendship = Friendship.builder()
                .lowUser(pair.lowUser())
                .highUser(pair.highUser())
                .requestedBy(sender)
                .status(FriendshipStatus.PENDING)
                .build();
        try{
            Friendship saveFriendship = friendshipRepository.saveAndFlush(friendship);
            return mapToFriendRequestDTO(saveFriendship,sender.getId());
        }catch (DataIntegrityViolationException exception){
            throw new AppException(ErrorCode.FRIEND_REQUEST_ALREADY_EXISTS);
        }
    }
    @Transactional
    public FriendDTO acceptFriendRequest(
            String currentUserEmail,
            UUID requestId
    ){
        User currentUser = requireActiveUser(currentUserEmail);
        Friendship friendship = friendshipRepository.findByIdForUpdate(requestId)
                .orElseThrow(()->new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));
        User receiver = getOtherUser(
                friendship,
                friendship.getRequestedBy().getId()
        );
        if(!receiver.getId().equals(currentUser.getId())){
            throw new AppException(ErrorCode.FRIEND_REQUEST_FORBIDDEN);
        }
        if(friendship.getStatus()==FriendshipStatus.ACCEPTED){
            return mapToFriendDTO(friendship,currentUser.getId());
        }
        if(friendship.getStatus() != FriendshipStatus.PENDING){
            throw new AppException(ErrorCode.INVALID_FRIEND_REQUEST_STATE);
        }
        friendship.setStatus(FriendshipStatus.ACCEPTED);
        friendship.setAcceptedAt(Instant.now());
        Friendship savedFriendship = friendshipRepository.save(friendship);
        return mapToFriendDTO(
                savedFriendship,
                currentUser.getId()
        );
    }
    @Transactional
    public void removePendingRequest(
            String currentUserEmail,
            UUID requestId
    ){
        User currentUser = requireActiveUser(currentUserEmail);
        Friendship friendship = friendshipRepository.findByIdForUpdate(requestId)
                .orElseThrow(()->new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND));
        getOtherUser(friendship, currentUser.getId());
        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_FRIEND_REQUEST_STATE);
        }
        friendshipRepository.delete(friendship);
    }
    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getIncomingRequest(
            String currentUserEmail
    ){
        User currentUser = requireActiveUser(currentUserEmail);
        return friendshipRepository.findIncomingRequests(currentUser.getId(),FriendshipStatus.PENDING)
                .stream().map(friendship -> mapToFriendRequestDTO(friendship,currentUser.getId())).toList();
    }
    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getOutgoingRequest(
            String currentUserEmail
    ){
        User currentUser = requireActiveUser(currentUserEmail);
        return friendshipRepository.findOutgoingRequests(currentUser.getId(),FriendshipStatus.PENDING)
                .stream().map(friendship -> mapToFriendRequestDTO(friendship,currentUser.getId())).toList();
    }
    @Transactional(readOnly = true)
    public List<FriendDTO> getFriends(
            String currentUserEmail
    ){
        User currentUser = requireActiveUser(currentUserEmail);
        return friendshipRepository.findFriendships(currentUser.getId(),FriendshipStatus.ACCEPTED)
                .stream().map(friendship -> mapToFriendDTO(friendship,currentUser.getId())).toList();
    }
    @Transactional
    public void removeFriend(
            String currentUserEmail,
            UUID requestId
    ){
        User currentUser = requireActiveUser(currentUserEmail);
        Friendship friendship = friendshipRepository.findByIdForUpdate(requestId)
                .orElseThrow(()->new AppException(ErrorCode.FRIENDSHIP_NOT_FOUND));
        getOtherUser(friendship, currentUser.getId());
        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new AppException(ErrorCode.INVALID_FRIEND_REQUEST_STATE);
        }
        friendshipRepository.delete(friendship);
    }
}
