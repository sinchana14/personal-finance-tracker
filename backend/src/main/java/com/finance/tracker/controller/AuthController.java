package com.finance.tracker.controller;

import com.finance.tracker.dto.AuthResponse;
import com.finance.tracker.dto.LoginRequest;
import com.finance.tracker.dto.RegisterRequest;
import com.finance.tracker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ============================================================
 * AUTH CONTROLLER — REST API for Authentication
 * ============================================================
 *
 * WHAT IS A REST CONTROLLER?
 * A REST Controller is a class that handles HTTP requests and returns
 * JSON responses. Each method maps to a specific URL + HTTP method.
 *
 * KEY ANNOTATIONS:
 *
 * @RestController = @Controller + @ResponseBody
 *   - @Controller: Marks this as a web controller (handles HTTP)
 *   - @ResponseBody: Return values are serialized to JSON automatically
 *
 * @RequestMapping("/api/auth") — Base URL for all methods in this controller
 *   All endpoints will start with /api/auth/...
 *
 * @PostMapping("/register") — Maps HTTP POST requests to this method
 *   Full URL: POST http://localhost:8080/api/auth/register
 *
 * @RequestBody — Tells Spring to parse the JSON request body into the DTO
 *   Client sends:  {"username": "john", "password": "secret"}
 *   Spring creates: new RegisterRequest("john", "secret")
 *
 * @Valid — Triggers validation annotations on the DTO
 *   If @NotBlank fails → MethodArgumentNotValidException → GlobalExceptionHandler
 *
 * ResponseEntity — Wraps the response with an HTTP status code
 *   ResponseEntity.ok(data)                → HTTP 200 + data
 *   ResponseEntity.status(201).body(data)  → HTTP 201 + data
 *   ResponseEntity.badRequest().body(error) → HTTP 400 + error
 *
 * HTTP STATUS CODES (important ones):
 *   200 OK         — Success
 *   201 Created    — Resource created successfully
 *   400 Bad Request — Invalid input
 *   401 Unauthorized — Not logged in
 *   403 Forbidden   — Logged in but not allowed
 *   404 Not Found   — Resource doesn't exist
 *   500 Server Error — Something broke on the server
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * REGISTER — Create a new account
     *
     * HTTP: POST /api/auth/register
     * Body: { "username": "john", "email": "john@example.com",
     *         "password": "secret123", "fullName": "John Doe" }
     * Response: { "token": "eyJ...", "username": "john", "message": "..." }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * LOGIN — Authenticate and get JWT token
     *
     * HTTP: POST /api/auth/login
     * Body: { "username": "john", "password": "secret123" }
     * Response: { "token": "eyJ...", "username": "john", "message": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder()
                            .message("Invalid username or password")
                            .build());
        }
    }
}
