package com.finance.tracker.config;

import com.finance.tracker.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * ============================================================
 * JWT AUTHENTICATION FILTER
 * ============================================================
 *
 * WHAT IS A FILTER?
 * A Filter is a component that intercepts HTTP requests BEFORE they reach
 * your controller. Think of it as a security guard at the entrance.
 *
 * HOW THIS FILTER WORKS (executed for EVERY request):
 *   1. Check if the request has an "Authorization" header
 *   2. If yes, extract the JWT token from "Bearer <token>"
 *   3. Validate the token (signature + expiration)
 *   4. If valid, load the user and set them as "authenticated"
 *   5. The request continues to the controller
 *   6. If no token or invalid token, the request continues as "unauthenticated"
 *      (Spring Security will then block access to protected endpoints)
 *
 * OncePerRequestFilter ensures this filter runs EXACTLY ONCE per request
 * (some filters could run multiple times due to request forwarding)
 *
 * REQUEST FLOW:
 *   Client → JwtAuthFilter → SecurityConfig check → Controller
 *                ↓
 *   Extract token from "Authorization: Bearer eyJ..."
 *   Validate token → Load user → Set authentication
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Step 1: Get the Authorization header
        final String authHeader = request.getHeader("Authorization");

        // Step 2: Check if header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // No token provided — continue without authentication
            // Spring Security will handle access control later
            filterChain.doFilter(request, response);
            return;
        }

        // Step 3: Extract the token (remove "Bearer " prefix)
        final String jwt = authHeader.substring(7); // "Bearer ".length() = 7
        
        try {
            // Step 4: Extract username from the token
            final String username = jwtUtil.extractUsername(jwt);

            // Step 5: Only proceed if username exists AND user is not already authenticated
            // SecurityContextHolder.getContext().getAuthentication() == null means
            // no one has authenticated this request yet
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Step 6: Load the user from the database
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Step 7: Validate the token
                if (jwtUtil.validateToken(jwt, userDetails)) {

                    // Step 8: Create an authentication token
                    // This tells Spring Security: "This user is authenticated"
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,        // The authenticated user
                                    null,               // Credentials (not needed after auth)
                                    userDetails.getAuthorities()  // Roles/permissions
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    // Step 9: Set the authentication in the SecurityContext
                    // Now Spring Security knows this user is authenticated!
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("Authenticated user: {}", username);
                }
            }
        } catch (Exception e) {
            // Token is invalid (expired, tampered, malformed)
            // Just log and continue — Spring Security will deny access
            log.debug("JWT validation failed: {}", e.getMessage());
        }

        // Step 10: Continue the filter chain (pass to next filter or controller)
        filterChain.doFilter(request, response);
    }
}
