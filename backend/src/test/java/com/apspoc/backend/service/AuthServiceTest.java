package com.apspoc.backend.service;

import com.apspoc.backend.api.dto.AuthCredentialsUpdateRequest;
import com.apspoc.backend.api.dto.AuthLoginRequest;
import com.apspoc.backend.api.dto.AuthSessionResponse;
import com.apspoc.backend.config.AuthProperties;
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
                new AuthProperties("admin", "admin123", 480),
                authUserRepository,
                passwordEncoder
        );
    }

    @Test
    void ensureDefaultUserSeedsConfiguredAdminAccountWhenMissing() {
        when(authUserRepository.existsById(AuthUserEntity.SINGLETON_ID)).thenReturn(false);
        when(authUserRepository.save(any(AuthUserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.ensureDefaultUser();

        ArgumentCaptor<AuthUserEntity> captor = ArgumentCaptor.forClass(AuthUserEntity.class);
        verify(authUserRepository).save(captor.capture());
        AuthUserEntity saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("admin");
        assertThat(passwordEncoder.matches("admin123", saved.getPasswordHash())).isTrue();
        assertThat(saved.getUpdatedAt()).isNotNull();
    }

    @Test
    void loginCreatesAuthenticatedSessionWhenCredentialsMatch() {
        MockHttpSession session = new MockHttpSession();
        when(authUserRepository.findById(AuthUserEntity.SINGLETON_ID)).thenReturn(Optional.of(authUser("admin", "admin123")));

        AuthSessionResponse response = authService.login(new AuthLoginRequest("admin", "admin123"), session);

        assertThat(response.authenticated()).isTrue();
        assertThat(response.username()).isEqualTo("admin");
        assertThat(session.getAttribute(AuthService.AUTHENTICATED_USER_SESSION_KEY)).isEqualTo("admin");
    }

    @Test
    void updateCredentialsPersistsNewUsernameAndPasswordAndRefreshesSession() {
        MockHttpSession session = new MockHttpSession();
        AuthUserEntity existing = authUser("admin", "admin123");
        when(authUserRepository.findById(AuthUserEntity.SINGLETON_ID)).thenReturn(Optional.of(existing));
        when(authUserRepository.save(any(AuthUserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuthSessionResponse response = authService.updateCredentials(
                new AuthCredentialsUpdateRequest("planner-admin", "admin123", "planner456"),
                session
        );

        assertThat(response.authenticated()).isTrue();
        assertThat(response.username()).isEqualTo("planner-admin");
        assertThat(existing.getUsername()).isEqualTo("planner-admin");
        assertThat(passwordEncoder.matches("planner456", existing.getPasswordHash())).isTrue();
        assertThat(session.getAttribute(AuthService.AUTHENTICATED_USER_SESSION_KEY)).isEqualTo("planner-admin");
    }

    @Test
    void updateCredentialsRejectsWrongCurrentPassword() {
        when(authUserRepository.findById(AuthUserEntity.SINGLETON_ID)).thenReturn(Optional.of(authUser("admin", "admin123")));

        assertThatThrownBy(() -> authService.updateCredentials(
                new AuthCredentialsUpdateRequest("planner-admin", "bad-password", "planner456"),
                new MockHttpSession()
        ))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Current password is incorrect");
    }

    private AuthUserEntity authUser(String username, String rawPassword) {
        AuthUserEntity entity = new AuthUserEntity(AuthUserEntity.SINGLETON_ID);
        entity.setUsername(username);
        entity.setPasswordHash(passwordEncoder.encode(rawPassword));
        return entity;
    }
}
