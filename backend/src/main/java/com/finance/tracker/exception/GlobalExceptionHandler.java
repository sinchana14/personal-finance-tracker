package com.finance.tracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================
 * GLOBAL EXCEPTION HANDLER
 * ============================================================
 *
 * WHAT IS @RestControllerAdvice?
 * It's a centralized place to handle ALL exceptions thrown by ANY controller.
 * Instead of try-catch blocks in every controller, you handle errors HERE.
 *
 * HOW IT WORKS:
 *   1. A controller throws an exception
 *   2. Spring intercepts it before sending the response
 *   3. It looks for a matching @ExceptionHandler method in this class
 *   4. That method creates a clean error response for the client
 *
 * BENEFITS:
 *   - Consistent error format across all endpoints
 *   - No duplicate error handling code
 *   - Clean controller code (no try-catch clutter)
 *   - Security (internal stack traces are never sent to the client)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors (when @Valid fails)
     *
     * When a request body has @NotBlank, @Email, @Size etc. and the
     * input violates them, Spring throws MethodArgumentNotValidException.
     *
     * We convert it to a clean error map:
     * {
     *   "timestamp": "2026-05-16T...",
     *   "status": 400,
     *   "error": "Validation Failed",
     *   "errors": {
     *     "username": "Username is required",
     *     "email": "Please provide a valid email"
     *   }
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();
        // Extract each field's error message
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation Failed");
        response.put("errors", fieldErrors);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle resource not found exceptions
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("error", "Not Found");
        response.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle bad request exceptions (custom business logic errors)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            IllegalArgumentException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Bad Request");
        response.put("message", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Catch-all handler for unexpected errors
     * This ensures we NEVER expose internal stack traces to the client
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("error", "Internal Server Error");
        response.put("message", "An unexpected error occurred. Please try again later.");

        // Log the actual error for debugging (server-side only)
        ex.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
