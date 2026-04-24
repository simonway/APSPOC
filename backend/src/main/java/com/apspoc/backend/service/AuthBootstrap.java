package com.apspoc.backend.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AuthBootstrap implements ApplicationRunner {

    private final AuthService authService;

    public AuthBootstrap(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void run(ApplicationArguments args) {
        authService.ensureDefaultUser();
    }
}
