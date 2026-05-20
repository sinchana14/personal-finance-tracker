package com.finance.tracker.security;

import com.finance.tracker.model.User;
import com.finance.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * ============================================================
 * CUSTOM USER DETAILS SERVICE
 * ============================================================
 *
 * WHAT IS UserDetailsService?
 * It's a Spring Security interface with ONE method: loadUserByUsername()
 * Spring Security calls this method during authentication to load user data
 * from YOUR database.
 *
 * HOW IT FITS INTO THE AUTH FLOW:
 *   1. User sends login request (username + password)
 *   2. Spring Security calls loadUserByUsername(username)
 *   3. This method loads the user from our database
 *   4. Spring Security compares the provided password with the stored hash
 *   5. If they match → authentication success
 *   6. If not → authentication failure
 *
 * WHY DO WE NEED THIS?
 * Spring Security doesn't know about YOUR database or YOUR User entity.
 * This class is the BRIDGE between Spring Security and your data.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Load a user by username from the database
     *
     * We convert our User entity to Spring Security's UserDetails object.
     * UserDetails is what Spring Security understands.
     *
     * Our User entity → Spring Security's UserDetails:
     *   user.getUsername()     → username
     *   user.getPasswordHash() → password (hashed)
     *   new ArrayList<>()     → authorities (roles/permissions — empty for now)
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with username: " + username));

        // Convert our User entity to Spring Security's User object
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                new ArrayList<>()  // No roles/authorities for now
        );
    }
}
