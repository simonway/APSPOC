package com.apspoc.backend.api;

import com.apspoc.backend.api.dto.AuthCredentialsUpdateRequest;
import com.apspoc.backend.api.dto.AuthLoginRequest;
import com.apspoc.backend.api.dto.AuthSessionResponse;
import com.apspoc.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthSessionResponse login(@Valid @RequestBody AuthLoginRequest request, HttpSession session) {
        return authService.login(request, session);
    }

    @GetMapping("/session")
    public AuthSessionResponse session(HttpServletRequest request) {
        return authService.getSession(request.getSession(false));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request) {
        authService.logout(request.getSession(false));
    }

    @PutMapping("/credentials")
    public AuthSessionResponse updateCredentials(
            @Valid @RequestBody AuthCredentialsUpdateRequest request,
            HttpSession session
    ) {
        return authService.updateCredentials(request, session);
    }
}
