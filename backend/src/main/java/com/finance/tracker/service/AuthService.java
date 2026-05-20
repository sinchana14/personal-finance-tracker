package com.finance.tracker.service;

import com.finance.tracker.dto.AuthResponse;
import com.finance.tracker.dto.LoginRequest;
import com.finance.tracker.dto.RegisterRequest;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.UserRepository;
import com.finance.tracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * ============================================================
 * AUTH SERVICE — Business logic for authentication
 * ============================================================
 *
 * WHAT IS A SERVICE?
 * The Service layer contains BUSINESS LOGIC — the "brains" of your app.
 *
 * Architecture layers:
 *   Controller → Service → Repository → Database
 *   (HTTP)       (Logic)   (Data Access)  (Storage)
 *
 * WHY SEPARATE SERVICE FROM CONTROLLER?
 *   1. Single Responsibility: Controllers handle HTTP, Services handle logic
 *   2. Reusability: Multiple controllers/endpoints can use the same service
 *   3. Testability: You can test business logic without HTTP
 *   4. Clean Code: Controllers stay thin and readable
 *
 * @Service — Tells Spring this is a service component (same as @Component
 *            but more descriptive about its role)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    /**
     * REGISTER — Create a new user account
     *
     * Steps:
     *   1. Check if username/email already exists
     *   2. Hash the password (NEVER store plain text!)
     *   3. Create and save the User entity
     *   4. Generate a JWT token
     *   5. Return the token to the client
     */
    public AuthResponse register(RegisterRequest request) {
        // Validation: Check for duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Validation: Check for duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create the User entity using the Builder pattern
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword())) // Hash!
                .fullName(request.getFullName())
                .build();

        // Save to database (JPA generates the SQL INSERT)
        userRepository.save(user);
        log.info("New user registered: {}", user.getUsername());

        // Generate JWT token for immediate login after registration
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .message("Registration successful!")
                .build();
    }

    /**
     * LOGIN — Authenticate an existing user
     *
     * Steps:
     *   1. AuthenticationManager verifies username + password
     *   2. If valid, load user details
     *   3. Generate a JWT token
     *   4. Return the token
     */
    public AuthResponse login(LoginRequest request) {
        // This does the actual authentication:
        // - Calls UserDetailsService to load user from DB
        // - Uses PasswordEncoder to verify the password
        // - Throws AuthenticationException if credentials are wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // If we reach here, authentication was successful
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        // Get user details for the response
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        log.info("User logged in: {}", request.getUsername());

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .message("Login successful!")
                .build();
    }
}
