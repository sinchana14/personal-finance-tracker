package com.finance.tracker.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * ============================================================
 * JWT UTILITY — Creates and validates JSON Web Tokens
 * ============================================================
 *
 * WHAT IS JWT?
 * JWT (JSON Web Token) is a compact, URL-safe token format for securely
 * transmitting information between parties.
 *
 * A JWT looks like this:
 *   eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2huIn0.abc123signature
 *   |---- Header ----|.|----- Payload ------|.|- Signature -|
 *
 * Three parts separated by dots:
 *   1. HEADER:    Algorithm used (HS256) + token type (JWT)
 *   2. PAYLOAD:   The actual data (username, expiry time, etc.)
 *   3. SIGNATURE: Ensures the token hasn't been tampered with
 *
 * HOW JWT AUTHENTICATION WORKS:
 *   1. User logs in with username + password
 *   2. Server verifies credentials
 *   3. Server creates a JWT signed with a SECRET KEY
 *   4. Server sends the JWT to the client
 *   5. Client stores the JWT (in localStorage or cookie)
 *   6. Client sends JWT in every request header: "Authorization: Bearer <token>"
 *   7. Server validates the JWT signature and extracts the username
 *   8. If valid, the request is authenticated!
 *
 * WHY JWT INSTEAD OF SESSIONS?
 *   Sessions: Server stores state (which user is logged in) — requires memory
 *   JWT: Stateless — all info is IN the token. Server just validates the signature.
 *   JWT is better for REST APIs because REST is supposed to be stateless.
 *
 * @Value — Injects values from application.properties
 *   ${jwt.secret}     → reads the jwt.secret property
 *   ${jwt.expiration} → reads the jwt.expiration property
 */
@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long jwtExpiration;

    public JwtUtil(@Value("${jwt.secret}") String secret,
                   @Value("${jwt.expiration}") long expiration) {
        // Create a cryptographic key from our secret string
        // The key must be at least 256 bits for HS256 algorithm
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.jwtExpiration = expiration;
    }

    /**
     * GENERATE TOKEN — Create a new JWT for a user
     *
     * The token contains:
     *   - subject: the username (who this token belongs to)
     *   - issuedAt: when the token was created
     *   - expiration: when the token expires
     *   - signature: proof that WE created this token
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)            // Custom data (empty for now)
                .subject(subject)          // Username
                .issuedAt(new Date())      // Current time
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration)) // Expiry
                .signWith(secretKey)       // Sign with our secret key
                .compact();                // Build the token string
    }

    /**
     * EXTRACT USERNAME from a token
     * Parses the token and returns the "subject" claim (username)
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * EXTRACT EXPIRATION DATE from a token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Generic method to extract any claim from a token
     * Uses Java's Function interface for flexibility
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parse the token and extract ALL claims
     * This also VALIDATES the signature — if the token was tampered with,
     * this will throw a JwtException
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)   // Verify using our secret key
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * CHECK IF TOKEN IS EXPIRED
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * VALIDATE TOKEN — Is this token valid for this user?
     * Two checks:
     *   1. Does the username in the token match the UserDetails?
     *   2. Has the token expired?
     */
    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
