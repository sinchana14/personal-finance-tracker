package com.finance.tracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ============================================================
 * USER ENTITY — Maps to the "users" table in the database
 * ============================================================
 *
 * WHAT IS AN ENTITY?
 * An Entity is a Java class that represents a TABLE in your database.
 * Each INSTANCE of this class represents a ROW in that table.
 * Each FIELD represents a COLUMN.
 *
 * Example:
 *   Java Object                    →  Database Row
 *   User(id=1, username="john")    →  | 1 | john | ... |
 *
 * KEY ANNOTATIONS EXPLAINED:
 *
 * @Entity      — Tells JPA "this class maps to a database table"
 * @Table       — Specifies the table name (defaults to class name if omitted)
 * @Id          — Marks the primary key column
 * @GeneratedValue — Database auto-generates this value (like AUTO_INCREMENT in SQL)
 * @Column      — Customizes column properties (unique, nullable, length, etc.)
 *
 * LOMBOK ANNOTATIONS (reduce boilerplate):
 * @Data        — Generates getters, setters, toString, equals, hashCode
 * @NoArgsConstructor  — Generates empty constructor: new User()
 * @AllArgsConstructor — Generates full constructor: new User(id, username, ...)
 * @Builder     — Generates a builder pattern: User.builder().username("john").build()
 */
@Entity
@Table(name = "users") // "user" is a reserved keyword in some databases, so we use "users"
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    /**
     * PRIMARY KEY — Uniquely identifies each user
     *
     * @GeneratedValue(strategy = GenerationType.IDENTITY)
     * This tells the database to auto-increment this value.
     * First user gets id=1, second gets id=2, etc.
     *
     * GenerationType options:
     *   IDENTITY — Database handles it (most common for MySQL, H2)
     *   SEQUENCE — Uses a database sequence (common for PostgreSQL)
     *   AUTO     — Let Hibernate decide
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * USERNAME — Must be unique and not empty
     *
     * @NotBlank  — Validation: cannot be null, empty, or whitespace
     * @Size      — Validation: must be between 3 and 50 characters
     * @Column(unique = true) — Database constraint: no two users can have same username
     */
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    /**
     * EMAIL — Must be a valid email format and unique
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email")
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    /**
     * PASSWORD HASH — We NEVER store plain text passwords!
     * The password is hashed using BCrypt before storage.
     * BCrypt is a one-way hash — you can verify a password against it,
     * but you can never reverse it back to the original password.
     */
    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String passwordHash;

    /**
     * FULL NAME — Display name for the user
     */
    @NotBlank(message = "Full name is required")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String fullName;

    /**
     * TIMESTAMPS — Automatically managed by Hibernate
     *
     * @CreationTimestamp — Set once when the entity is first saved
     * @UpdateTimestamp   — Updated every time the entity is modified
     *
     * These are incredibly useful for:
     *   - Audit trails (when was this record created?)
     *   - Debugging (when was it last changed?)
     *   - Sorting (show newest first)
     */
    @CreationTimestamp
    @Column(updatable = false) // Once set, never change the creation timestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * RELATIONSHIPS — One User has Many Transactions
     *
     * @OneToMany — One user can have many transactions
     * mappedBy = "user" — The Transaction entity owns the relationship
     *                      (it has the foreign key column "user_id")
     * cascade = CascadeType.ALL — When you delete a user, delete their transactions too
     * orphanRemoval = true — If a transaction is removed from this list, delete it from DB
     *
     * fetch = FetchType.LAZY — Don't load transactions until they're actually accessed
     *   LAZY  = Load on demand (better performance, default for collections)
     *   EAGER = Load immediately with the user (can cause performance issues)
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default // Tells Lombok's @Builder to use this default value
    private List<Transaction> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Budget> budgets = new ArrayList<>();
}
