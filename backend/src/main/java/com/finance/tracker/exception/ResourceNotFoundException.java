package com.finance.tracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * ============================================================
 * CUSTOM EXCEPTION — Resource Not Found (HTTP 404)
 * ============================================================
 *
 * WHY CUSTOM EXCEPTIONS?
 * Instead of returning generic errors, custom exceptions:
 *   1. Make code more readable: throw new ResourceNotFoundException("User", "id", 5)
 *   2. Return proper HTTP status codes automatically
 *   3. Provide consistent error messages to the frontend
 *
 * @ResponseStatus(HttpStatus.NOT_FOUND) — When this exception is thrown,
 * Spring automatically returns HTTP 404 instead of 500.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
        // Example: "User not found with id: '5'"
        // Example: "Transaction not found with id: '42'"
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
