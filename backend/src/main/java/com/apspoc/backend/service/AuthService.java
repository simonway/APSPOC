package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.AuthCredentialsUpdateRequest;
import com.apspoc.backend.api.dto.AuthLoginRequest;
import com.apspoc.backend.api.dto.AuthSessionResponse;
import com.apspoc.backend.config.AuthProperties;
import com.apspoc.backend.domain.UserRole;
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

    public static final String AUTHENTICATED_USER_ID_SESSION_KEY = "aps.authenticatedUserId";
    public static final String AUTHENTICATED_USER_SESSION_KEY = "aps.authenticatedUser";
    public static final String AUTHENTICATED_ROLE_SESSION_KEY = "aps.authenticatedRole";

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
    public void ensureDefaultUsers() {
        ensureSeedUser(authProperties.admin(), UserRole.ADMIN);
        ensureSeedUser(authProperties.planner(), UserRole.PLANNER);
        ensureSeedUser(authProperties.approver(), UserRole.APPROVER);
        ensureSeedUser(authProperties.viewer(), UserRole.VIEWER);
    }

    public AuthSessionResponse login(AuthLoginRequest request, HttpSession session) {
        AuthUserEntity authUser = authUserRepository.findByUsername(normalizeUsername(request.username()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
        if (!credentialsMatch(authUser, request)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        refreshSession(session, authUser);
        return toSessionResponse(authUser);
    }

    public AuthSessionResponse getSession(HttpSession session) {
        if (session == null) {
            return new AuthSessionResponse(false, null, null);
        }

        Object userId = session.getAttribute(AUTHENTICATED_USER_ID_SESSION_KEY);
        Object username = session.getAttribute(AUTHENTICATED_USER_SESSION_KEY);
        UserRole role = parseRole(session.getAttribute(AUTHENTICATED_ROLE_SESSION_KEY));
        if (!(userId instanceof Long authenticatedUserId) || !(username instanceof String authenticatedUsername) || authenticatedUsername.isBlank()) {
            return new AuthSessionResponse(false, null, null);
        }

        if (role == null) {
            role = authUserRepository.findById(authenticatedUserId)
                    .map(AuthUserEntity::getRole)
                    .orElse(null);
        }
        if (role == null) {
            return new AuthSessionResponse(false, null, null);
        }

        return new AuthSessionResponse(true, authenticatedUsername, role.name());
    }

    public boolean isAuthenticated(HttpSession session) {
        return getSession(session).authenticated();
    }

    public AuthenticatedUser requireAuthenticatedUser(HttpSession session) {
        AuthSessionResponse authSession = getSession(session);
        if (!authSession.authenticated() || authSession.username() == null || authSession.username().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        UserRole role = parseRole(authSession.role());
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Object userId = session.getAttribute(AUTHENTICATED_USER_ID_SESSION_KEY);
        if (!(userId instanceof Long authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return new AuthenticatedUser(authenticatedUserId, authSession.username(), role);
    }

    public AuthenticatedUser requireAnyRole(HttpSession session, UserRole... allowedRoles) {
        AuthenticatedUser authenticatedUser = requireAuthenticatedUser(session);
        for (UserRole allowedRole : allowedRoles) {
            if (authenticatedUser.role() == allowedRole) {
                return authenticatedUser;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to perform this action.");
    }

    public String requireAuthenticatedUsername(HttpSession session) {
        return requireAuthenticatedUser(session).username();
    }

    public void logout(HttpSession session) {
        if (session != null) {
            session.invalidate();
        }
    }

    @Transactional
    public AuthSessionResponse updateCredentials(AuthCredentialsUpdateRequest request, HttpSession session) {
        AuthenticatedUser authenticatedUser = requireAuthenticatedUser(session);
        AuthUserEntity authUser = authUserRepository.findById(authenticatedUser.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required"));
        if (!passwordEncoder.matches(request.currentPassword(), authUser.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        String normalizedUsername = normalizeUsername(request.username());
        if (normalizedUsername.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must not be blank");
        }

        authUserRepository.findByUsername(normalizedUsername)
                .filter(existing -> !existing.getId().equals(authUser.getId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is already in use");
                });

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
            refreshSession(session, authUser);
        }

        return toSessionResponse(authUser);
    }

    private void ensureSeedUser(AuthProperties.SeedUser seedUser, UserRole role) {
        if (seedUser == null) {
            return;
        }
        if (authUserRepository.findFirstByRole(role).isPresent()) {
            return;
        }

        AuthUserEntity authUser = authUserRepository.findByUsername(normalizeUsername(seedUser.username()))
                .orElseGet(AuthUserEntity::new);
        authUser.setUsername(normalizeUsername(seedUser.username()));
        authUser.setRole(role);
        if (authUser.getPasswordHash() == null || authUser.getPasswordHash().isBlank()) {
            authUser.setPasswordHash(passwordEncoder.encode(seedUser.password()));
        }
        authUser.setUpdatedAt(Instant.now());
        authUserRepository.save(authUser);
    }

    private void refreshSession(HttpSession session, AuthUserEntity authUser) {
        session.setAttribute(AUTHENTICATED_USER_ID_SESSION_KEY, authUser.getId());
        session.setAttribute(AUTHENTICATED_USER_SESSION_KEY, authUser.getUsername());
        session.setAttribute(AUTHENTICATED_ROLE_SESSION_KEY, authUser.getRole().name());
        session.setMaxInactiveInterval(authProperties.sessionTimeoutMinutes() * 60);
    }

    private AuthSessionResponse toSessionResponse(AuthUserEntity authUser) {
        return new AuthSessionResponse(true, authUser.getUsername(), authUser.getRole().name());
    }

    private boolean credentialsMatch(AuthUserEntity authUser, AuthLoginRequest request) {
        return authUser.getUsername().equals(normalizeUsername(request.username()))
                && passwordEncoder.matches(request.password(), authUser.getPasswordHash());
    }

    private UserRole parseRole(Object value) {
        if (value instanceof UserRole role) {
            return role;
        }
        if (value instanceof String roleName) {
            try {
                return UserRole.valueOf(roleName.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                return null;
            }
        }
        return null;
    }

    private String normalizeUsername(String username) {
        return username == null ? "" : username.trim();
    }

    public record AuthenticatedUser(
            Long userId,
            String username,
            UserRole role
    ) {
    }
}
