package com.finance.tracker.repository;

import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * ============================================================
 * TRANSACTION REPOSITORY — The Most Complex Repository
 * ============================================================
 *
 * This repository demonstrates:
 * 1. Simple query methods (auto-generated from method name)
 * 2. Complex queries using @Query with JPQL
 *
 * WHAT IS JPQL?
 * JPQL = Java Persistence Query Language
 * It's like SQL, but operates on ENTITIES instead of TABLES.
 * Instead of "SELECT * FROM transactions", you write "SELECT t FROM Transaction t"
 * The benefit: JPQL is database-independent (works with MySQL, PostgreSQL, H2, etc.)
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Find all transactions for a specific user, ordered by date (newest first)
     *
     * "OrderByTransactionDateDesc" → ORDER BY transaction_date DESC
     *
     * Generated SQL:
     *   SELECT * FROM transactions
     *   WHERE user_id = ?
     *   ORDER BY transaction_date DESC
     */
    List<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId);

    /**
     * Find transactions by user and type (INCOME or EXPENSE)
     */
    List<Transaction> findByUserIdAndTypeOrderByTransactionDateDesc(Long userId, TransactionType type);

    /**
     * Find transactions by user within a date range
     *
     * "Between" → WHERE transaction_date BETWEEN ? AND ?
     */
    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long userId, LocalDate startDate, LocalDate endDate);

    /**
     * Find transactions by user, type, and date range (for filtering)
     */
    List<Transaction> findByUserIdAndTypeAndTransactionDateBetweenOrderByTransactionDateDesc(
            Long userId, TransactionType type, LocalDate startDate, LocalDate endDate);

    /**
     * Find transactions by user and category
     */
    List<Transaction> findByUserIdAndCategoryIdOrderByTransactionDateDesc(Long userId, Long categoryId);

    /**
     * ============================================================
     * CUSTOM JPQL QUERIES — For complex operations
     * ============================================================
     *
     * When method names get too long or complex, use @Query with JPQL.
     *
     * JPQL SYNTAX:
     *   SELECT t FROM Transaction t    — "t" is an alias for Transaction entity
     *   WHERE t.user.id = :userId      — :userId is a named parameter
     *   t.type = :type                 — filter by type
     *
     * @Param("userId") — Binds the method parameter to the JPQL :userId parameter
     */

    /**
     * Calculate total amount for a user's transactions of a specific type
     * Used for dashboard: "Total Income: ₹50,000" / "Total Expenses: ₹35,000"
     *
     * COALESCE(SUM(...), 0) — If there are no transactions, return 0 instead of null
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type = :type")
    BigDecimal sumAmountByUserIdAndType(@Param("userId") Long userId,
                                        @Param("type") TransactionType type);

    /**
     * Calculate total spending for a specific category in a specific month
     * Used for budget tracking: "You spent ₹3,200 out of ₹5,000 on Food"
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.category.id = :categoryId " +
           "AND t.type = 'EXPENSE' " +
           "AND MONTH(t.transactionDate) = :month " +
           "AND YEAR(t.transactionDate) = :year")
    BigDecimal sumByCategoryAndMonth(@Param("userId") Long userId,
                                     @Param("categoryId") Long categoryId,
                                     @Param("month") int month,
                                     @Param("year") int year);

    /**
     * Get total amount grouped by category for a user in a date range
     * Used for the pie chart: "Food: 40%, Transport: 25%, Entertainment: 20%..."
     *
     * This returns a List of Object arrays:
     *   [0] = Category object
     *   [1] = Total amount (BigDecimal)
     */
    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.type = :type " +
           "AND t.transactionDate BETWEEN :startDate AND :endDate " +
           "GROUP BY t.category " +
           "ORDER BY SUM(t.amount) DESC")
    List<Object[]> sumByCategory(@Param("userId") Long userId,
                                  @Param("type") TransactionType type,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate);

    /**
     * Get monthly totals for a user (for the line chart / trend)
     * Returns: [[2026, 1, 15000], [2026, 2, 18000], ...]
     *   [0] = year, [1] = month, [2] = total amount
     */
    @Query("SELECT YEAR(t.transactionDate), MONTH(t.transactionDate), SUM(t.amount) " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId " +
           "AND t.type = :type " +
           "GROUP BY YEAR(t.transactionDate), MONTH(t.transactionDate) " +
           "ORDER BY YEAR(t.transactionDate), MONTH(t.transactionDate)")
    List<Object[]> getMonthlyTotals(@Param("userId") Long userId,
                                     @Param("type") TransactionType type);
}
