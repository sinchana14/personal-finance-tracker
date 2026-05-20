package com.finance.tracker.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * ============================================================
 * SECURITY CONFIGURATION — The "Rules" for who can access what
 * ============================================================
 *
 * WHAT IS @Configuration?
 * Marks this class as a source of bean definitions (objects Spring manages).
 * Methods annotated with @Bean return objects that Spring stores and reuses.
 *
 * WHAT IS @EnableWebSecurity?
 * Activates Spring Security's web security features.
 * Without this, ALL endpoints would be open (no security).
 *
 * KEY CONCEPTS:
 *
 * 1. AUTHENTICATION = "Who are you?" (login/verify identity)
 * 2. AUTHORIZATION  = "What can you do?" (access control)
 *
 * 3. FILTER CHAIN = A sequence of security checks each request goes through
 *    Request → CORS → CSRF → JWT Filter → Auth Check → Controller
 *
 * 4. STATELESS SESSION = No server-side sessions
 *    We use JWT tokens instead, so the server doesn't store any state
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    /**
     * SECURITY FILTER CHAIN — Defines the security rules
     *
     * This is where you specify:
     *   - Which endpoints are PUBLIC (no login needed)
     *   - Which endpoints are PROTECTED (login required)
     *   - How authentication works (JWT)
     *   - CSRF and CORS settings
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF (Cross-Site Request Forgery) Protection
            // We DISABLE it because:
            //   - CSRF protection is for browser-based form submissions
            //   - Our API uses JWT tokens (which are immune to CSRF)
            //   - CSRF tokens don't work well with REST APIs
            .csrf(csrf -> csrf.disable())

            // AUTHORIZATION RULES — Who can access which endpoints
            .authorizeHttpRequests(auth -> auth
                // PUBLIC endpoints — No login needed
                .requestMatchers("/api/auth/**").permitAll()     // Login & Register
                .requestMatchers("/h2-console/**").permitAll()   // H2 Database Console (dev only)
                .requestMatchers("/swagger-ui/**").permitAll()   // API Documentation
                .requestMatchers("/v3/api-docs/**").permitAll()  // OpenAPI spec
                .requestMatchers("/error").permitAll()           // Error page

                // EVERYTHING ELSE requires authentication
                .anyRequest().authenticated()
            )

            // SESSION MANAGEMENT — Stateless (no sessions, use JWT)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // AUTHENTICATION PROVIDER — How to verify credentials
            .authenticationProvider(authenticationProvider())

            // ADD JWT FILTER — Run our JWT filter BEFORE Spring's default auth filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

            // Allow H2 console to use frames (it uses iframes internally)
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }

    /**
     * PASSWORD ENCODER — BCrypt hashing
     *
     * BCrypt is a one-way hash function designed for passwords:
     *   "password123" → "$2a$10$dXJ3SW6G7P50lGmMQoeE..."
     *
     * WHY BCrypt?
     *   - One-way: Can't reverse the hash back to the password
     *   - Salt: Each hash includes a random salt (same password → different hash)
     *   - Slow: Intentionally slow to make brute-force attacks impractical
     *   - Adjustable: The "strength" parameter (10) controls slowness
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AUTHENTICATION PROVIDER — Connects UserDetailsService + PasswordEncoder
     *
     * DaoAuthenticationProvider:
     *   1. Receives username + password from login request
     *   2. Calls UserDetailsService to load user from database
     *   3. Uses PasswordEncoder to compare provided password with stored hash
     *   4. Returns success or failure
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * AUTHENTICATION MANAGER — Entry point for authentication
     * Used by the AuthController to authenticate login requests
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
