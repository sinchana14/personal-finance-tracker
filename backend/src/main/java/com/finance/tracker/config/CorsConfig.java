package com.finance.tracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * ============================================================
 * CORS CONFIGURATION — Cross-Origin Resource Sharing
 * ============================================================
 *
 * WHAT IS CORS?
 * When your frontend (http://localhost:3000) tries to call your backend
 * (http://localhost:8080), the browser BLOCKS the request by default.
 * This is called the "Same-Origin Policy" — a security feature.
 *
 * CORS allows your backend to explicitly say:
 *   "Yes, I trust requests from http://localhost:3000"
 *
 * WITHOUT CORS CONFIG:
 *   Frontend → Backend → Browser blocks! ❌ "CORS error"
 *
 * WITH CORS CONFIG:
 *   Frontend → Backend → Backend says "localhost:3000 is allowed" → ✅ Success
 *
 * WHAT WE CONFIGURE:
 *   - allowedOrigins: Which frontend URLs can call our API
 *   - allowedMethods: Which HTTP methods are allowed (GET, POST, PUT, DELETE)
 *   - allowedHeaders: Which headers can be sent (Authorization, Content-Type)
 *   - allowCredentials: Whether to allow cookies/auth headers
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")          // Apply to all /api/ endpoints
                .allowedOrigins(allowedOrigins)  // Frontend URLs from application.properties
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")            // Allow all headers
                .allowCredentials(true)          // Allow Authorization header
                .maxAge(3600);                   // Cache CORS preflight for 1 hour
    }
}
