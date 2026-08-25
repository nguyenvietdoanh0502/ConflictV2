package com.conflict.be.modules.user.repository;

import com.conflict.be.modules.user.entity.User;
import com.conflict.be.modules.user.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPinCode(String pinCode);
    boolean existsByPinCode(String pinCode);
    Optional<User> findByPinCodeAndStatusAndIsDeletedFalse(String pinCode, AccountStatus status);
}
