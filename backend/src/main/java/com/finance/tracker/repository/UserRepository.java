package com.finance.tracker.repository;

import com.finance.tracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ============================================================
 * USER REPOSITORY — Data Access Layer for Users
 * ============================================================
 *
 * WHAT IS A REPOSITORY?
 * A Repository is an INTERFACE (not a class!) that provides methods
 * to interact with the database. Spring Data JPA automatically creates
 * the implementation at runtime — you don't write any SQL!
 *
 * HOW DOES IT WORK?
 * JpaRepository<User, Long> means:
 *   - User = The entity type this repository manages
 *   - Long = The type of the primary key (id)
 *
 * WHAT DO YOU GET FOR FREE?
 * By extending JpaRepository, you automatically get:
 *   - save(user)           → INSERT or UPDATE
 *   - findById(id)         → SELECT * FROM users WHERE id = ?
 *   - findAll()            → SELECT * FROM users
 *   - deleteById(id)       → DELETE FROM users WHERE id = ?
 *   - count()              → SELECT COUNT(*) FROM users
 *   - existsById(id)       → SELECT EXISTS(...)
 *   ... and many more!
 *
 * CUSTOM QUERIES — Spring Data Query Methods:
 * You can define custom queries just by naming the method correctly!
 * Spring parses the method name and generates SQL automatically.
 *
 *   findByUsername(String username)
 *     → SELECT * FROM users WHERE username = ?
 *
 *   findByEmail(String email)
 *     → SELECT * FROM users WHERE email = ?
 *
 *   existsByUsername(String username)
 *     → SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)
 *
 * The naming convention is:
 *   findBy + FieldName     → SELECT WHERE field = value
 *   existsBy + FieldName   → Check existence
 *   countBy + FieldName    → Count matching records
 *   deleteBy + FieldName   → Delete matching records
 *
 * WHY Optional<User>?
 * Optional is a container that may or may not contain a value.
 * Instead of returning null (which can cause NullPointerException),
 * we return Optional.empty() when no user is found.
 * This forces the caller to handle the "not found" case explicitly.
 */
@Repository // Marks this as a Spring-managed repository component
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their username.
     * Used during login to look up the user.
     *
     * Generated SQL: SELECT * FROM users WHERE username = ?
     */
    Optional<User> findByUsername(String username);

    /**
     * Find a user by their email.
     *
     * Generated SQL: SELECT * FROM users WHERE email = ?
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a username already exists (for registration validation).
     *
     * Generated SQL: SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)
     */
    boolean existsByUsername(String username);

    /**
     * Check if an email already exists (for registration validation).
     *
     * Generated SQL: SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)
     */
    boolean existsByEmail(String email);
}
