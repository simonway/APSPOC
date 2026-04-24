package com.apspoc.backend.persistence.repository;

import com.apspoc.backend.persistence.entity.AuthUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthUserRepository extends JpaRepository<AuthUserEntity, Short> {
}
