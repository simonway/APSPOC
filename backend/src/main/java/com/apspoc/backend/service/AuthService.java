package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.AuthCredentialsUpdateRequest;
import com.apspoc.backend.api.dto.AuthLoginRequest;
import com.apspoc.backend.api.dto.AuthSessionResponse;
import com.apspoc.backend.config.AuthProperties;
import com.apspoc.backend.persistence.entity.AuthUserEntity;
import com.apspoc.backend.persistence.repository.AuthUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;
import java.time.Instant;

@Service
public class AuthService {

    public static final String AUTHENTICATED_USER_SESSION_KEY = "aps.authenticatedUser";

    private final AuthProperties authProperties;
    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthProperties authProperties,
            AuthUserRepository authUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authProperties = authProperties;
        this.authUserRepository = authUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void ensureDefaultUser() {
        if (authUserRepository.existsById(AuthUserEntity.SINGLETON_ID)) {
            return;
        }

        AuthUserEntity authUser = new AuthUserEntity(AuthUserEntity.SINGLETON_ID);
        authUser.setUsername(normalizeUsername(authProperties.username()));
        authUser.setPasswordHash(passwordEncoder.encode(authProperties.password()));
        authUser.setUpdatedAt(Instant.now());
        authUserRepository.save(authUser);
    }

    public AuthSessionResponse login(AuthLoginRequest request, HttpSession session) {
        AuthUserEntity authUser = loadAuthUser();
        if (!credentialsMatch(authUser, request)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        session.setAttribute(AUTHENTICATED_USER_SESSION_KEY, authUser.getUsername());
        session.setMaxInactiveInterval(authProperties.sessionTimeoutMinutes() * 60);
        return new AuthSessionResponse(true, authUser.getUsername());
    }

    public AuthSessionResponse getSession(HttpSession session) {
        if (session == null) {
            return new AuthSessionResponse(false, null);
        }

        Object username = session.getAttribute(AUTHENTICATED_USER_SESSION_KEY);
        if (!(username instanceof String authenticatedUser) || authenticatedUser.isBlank()) {
            return new AuthSessionResponse(false, null);
        }

        return new AuthSessionResponse(true, authenticatedUser);
    }

    public boolean isAuthenticated(HttpSession session) {
        return getSession(session).authenticated();
    }

    public void logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
    }

    @Transactional
    public AuthSessionResponse updateCredentials(AuthCredentialsUpdateRequest request, HttpSession session) {
        AuthUserEntity authUser = loadAuthUser();
        if (!passwordEncoder.matches(request.currentPassword(), authUser.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        String normalizedUsername = normalizeUsername(request.username());
        if (normalizedUsername.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must not be blank");
        }

        authUser.setUsername(normalizedUsername);

        String requestedPassword = request.newPassword();
        if (requestedPassword != null && !requestedPassword.isBlank()) {
            if (requestedPassword.length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 6 characters");
            }
            authUser.setPasswordHash(passwordEncoder.encode(requestedPassword));
        }

        authUser.setUpdatedAt(Instant.now());
        authUserRepository.save(authUser);

        if (session != null) {
            session.setAttribute(AUTHENTICATED_USER_SESSION_KEY, normalizedUsername);
            session.setMaxInactiveInterval(authProperties.sessionTimeoutMinutes() * 60);
        }

        return new AuthSessionResponse(true, normalizedUsername);
    }

    private boolean credentialsMatch(AuthUserEntity authUser, AuthLoginRequest request) {
        return authUser.getUsername().equals(normalizeUsername(request.username()))
                && passwordEncoder.matches(request.password(), authUser.getPasswordHash());
    }

    private AuthUserEntity loadAuthUser() {
        return authUserRepository.findById(AuthUserEntity.SINGLETON_ID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Authentication user is not initialized"));
    }

    private String normalizeUsername(String username) {
        return username == null ? "" : username.trim();
    }
}
