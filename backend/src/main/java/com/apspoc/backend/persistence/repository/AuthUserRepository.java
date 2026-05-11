package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.persistence.entity.AuthUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthUserRepository extends JpaRepository<AuthUserEntity, Long> {

    Optional<AuthUserEntity> findByUsername(String username);

    Optional<AuthUserEntity> findFirstByRole(UserRole role);
}
