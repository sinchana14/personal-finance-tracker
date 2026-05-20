package com.finance.tracker.repository;

import com.finance.tracker.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ============================================================
 * BUDGET REPOSITORY
 * ============================================================
 */
@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    /**
     * Find all budgets for a user in a specific month/year
     */
    List<Budget> findByUserIdAndMonthAndYear(Long userId, Integer month, Integer year);

    /**
     * Find a specific budget (user + category + month + year)
     */
    Optional<Budget> findByUserIdAndCategoryIdAndMonthAndYear(
            Long userId, Long categoryId, Integer month, Integer year);

    /**
     * Find all budgets for a user
     */
    List<Budget> findByUserIdOrderByYearDescMonthDesc(Long userId);
}
