package com.finance.tracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================
 * REGISTER REQUEST DTO
 * ============================================================
 *
 * WHAT IS A DTO?
 * DTO = Data Transfer Object
 * It's a simple object used to transfer data between the client and server.
 *
 * WHY NOT USE THE ENTITY DIRECTLY?
 *   1. Security: The User entity has passwordHash, createdAt, etc.
 *      You don't want the client to see or set those fields.
 *   2. Validation: DTOs can have different validation rules than entities.
 *   3. Decoupling: If you change the entity, the API contract stays the same.
 *
 * ANALOGY:
 *   Entity = Your full medical record (private, internal)
 *   DTO    = The form you fill at the doctor's office (only what's needed)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    private String fullName;
}
