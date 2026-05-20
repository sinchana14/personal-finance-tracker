package com.finance.tracker.repository;

import com.finance.tracker.model.Category;
import com.finance.tracker.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ============================================================
 * CATEGORY REPOSITORY
 * ============================================================
 *
 * Provides database access for Category entities.
 * Demonstrates more advanced Spring Data query method naming.
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    /**
     * Find all categories of a specific type (INCOME or EXPENSE)
     *
     * Generated SQL: SELECT * FROM categories WHERE type = ?
     */
    List<Category> findByType(TransactionType type);

    /**
     * Find a category by name (case-insensitive search would need @Query)
     */
    Optional<Category> findByName(String name);

    /**
     * Find all default categories
     *
     * Generated SQL: SELECT * FROM categories WHERE is_default = true
     */
    List<Category> findByIsDefaultTrue();

    /**
     * Check if a category with this name exists
     */
    boolean existsByName(String name);
}
