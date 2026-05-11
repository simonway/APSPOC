package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.AuthCredentialsUpdateRequest;
import com.apspoc.backend.api.dto.AuthLoginRequest;
import com.apspoc.backend.api.dto.AuthSessionResponse;
import com.apspoc.backend.config.AuthProperties;
import com.apspoc.backend.domain.UserRole;
import com.apspoc.backend.persistence.entity.AuthUserEntity;
import com.apspoc.backend.persistence.repository.AuthUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthUserRepository authUserRepository;

    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(
                authProperties(),
                authUserRepository,
                passwordEncoder
        );
    }

    @Test
    void ensureDefaultUsersSeedConfiguredRoleAccountsWhenMissing() {
        when(authUserRepository.findFirstByRole(any())).thenReturn(Optional.empty());
        when(authUserRepository.save(any(AuthUserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.ensureDefaultUsers();

        ArgumentCaptor<AuthUserEntity> captor = ArgumentCaptor.forClass(AuthUserEntity.class);
        verify(authUserRepository, org.mockito.Mockito.times(4)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(AuthUserEntity::getRole, AuthUserEntity::getUsername)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(UserRole.ADMIN, "admin"),
                        org.assertj.core.groups.Tuple.tuple(UserRole.PLANNER, "planner"),
                        org.assertj.core.groups.Tuple.tuple(UserRole.APPROVER, "approver"),
                        org.assertj.core.groups.Tuple.tuple(UserRole.VIEWER, "viewer")
                );
    }

    @Test
    void loginCreatesAuthenticatedSessionWhenCredentialsMatch() {
        MockHttpSession session = new MockHttpSession();
        when(authUserRepository.findByUsername("admin")).thenReturn(Optional.of(authUser(1L, "admin", "admin123", UserRole.ADMIN)));

        AuthSessionResponse response = authService.login(new AuthLoginRequest("admin", "admin123"), session);

        assertThat(response.authenticated()).isTrue();
        assertThat(response.username()).isEqualTo("admin");
        assertThat(response.role()).isEqualTo("ADMIN");
        assertThat(session.getAttribute(AuthService.AUTHENTICATED_USER_ID_SESSION_KEY)).isEqualTo(1L);
        assertThat(session.getAttribute(AuthService.AUTHENTICATED_USER_SESSION_KEY)).isEqualTo("admin");
        assertThat(session.getAttribute(AuthService.AUTHENTICATED_ROLE_SESSION_KEY)).isEqualTo("ADMIN");
    }

    @Test
    void updateCredentialsPersistsNewUsernameAndPasswordAndRefreshesSession() {
        MockHttpSession session = new MockHttpSession();
        AuthUserEntity existing = authUser(1L, "admin", "admin123", UserRole.ADMIN);
        session.setAttribute(AuthService.AUTHENTICATED_USER_ID_SESSION_KEY, 1L);
        session.setAttribute(AuthService.AUTHENTICATED_USER_SESSION_KEY, "admin");
        session.setAttribute(AuthService.AUTHENTICATED_ROLE_SESSION_KEY, "ADMIN");
        when(authUserRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(authUserRepository.findByUsername("planner-admin")).thenReturn(Optional.empty());
        when(authUserRepository.save(any(AuthUserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthSessionResponse response = authService.updateCredentials(
                new AuthCredentialsUpdateRequest("planner-admin", "admin123", "planner456"),
                session
        );

        assertThat(response.authenticated()).isTrue();
        assertThat(response.username()).isEqualTo("planner-admin");
        assertThat(response.role()).isEqualTo("ADMIN");
        assertThat(existing.getUsername()).isEqualTo("planner-admin");
        assertThat(passwordEncoder.matches("planner456", existing.getPasswordHash())).isTrue();
        assertThat(session.getAttribute(AuthService.AUTHENTICATED_USER_SESSION_KEY)).isEqualTo("planner-admin");
    }

    @Test
    void updateCredentialsRejectsWrongCurrentPassword() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthService.AUTHENTICATED_USER_ID_SESSION_KEY, 1L);
        session.setAttribute(AuthService.AUTHENTICATED_USER_SESSION_KEY, "admin");
        session.setAttribute(AuthService.AUTHENTICATED_ROLE_SESSION_KEY, "ADMIN");
        when(authUserRepository.findById(1L)).thenReturn(Optional.of(authUser(1L, "admin", "admin123", UserRole.ADMIN)));

        assertThatThrownBy(() -> authService.updateCredentials(
                new AuthCredentialsUpdateRequest("planner-admin", "bad-password", "planner456"),
                session
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    @Test
    void requireAuthenticatedUsernameReturnsSessionUser() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(AuthService.AUTHENTICATED_USER_ID_SESSION_KEY, 2L);
        session.setAttribute(AuthService.AUTHENTICATED_USER_SESSION_KEY, "planner-admin");
        session.setAttribute(AuthService.AUTHENTICATED_ROLE_SESSION_KEY, "PLANNER");

        assertThat(authService.requireAuthenticatedUsername(session)).isEqualTo("planner-admin");
    }

    private AuthProperties authProperties() {
        return new AuthProperties(
                480,
                new AuthProperties.SeedUser("admin", "admin123"),
                new AuthProperties.SeedUser("planner", "planner123"),
                new AuthProperties.SeedUser("approver", "approver123"),
                new AuthProperties.SeedUser("viewer", "viewer123")
        );
    }

    private AuthUserEntity authUser(Long id, String username, String rawPassword, UserRole role) {
        AuthUserEntity entity = new AuthUserEntity();
        ReflectionTestUtils.setField(entity, "id", id);
        entity.setUsername(username);
        entity.setPasswordHash(passwordEncoder.encode(rawPassword));
        entity.setRole(role);
        return entity;
    }
}
