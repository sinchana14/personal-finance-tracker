package com.finance.tracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ============================================================
 * TRANSACTION ENTITY — The Core of the App
 * ============================================================
 *
 * This is the most important table. Every income or expense is a Transaction.
 *
 * REAL-WORLD EXAMPLE:
 *   "I spent ₹500 on food at Zomato on May 15, 2026"
 *   →  Transaction {
 *        user: currentUser,
 *        category: Food,
 *        type: EXPENSE,
 *        amount: 500.00,
 *        description: "Zomato order",
 *        transactionDate: 2026-05-15
 *      }
 *
 * KEY CONCEPT — FOREIGN KEYS:
 *   This table has TWO foreign keys:
 *     user_id     → Points to the users table (WHO made this transaction)
 *     category_id → Points to the categories table (WHAT type of transaction)
 *
 *   In JPA, foreign keys are represented as @ManyToOne relationships.
 *   "Many transactions belong to One user"
 *   "Many transactions belong to One category"
 *
 * WHY BigDecimal INSTEAD OF double?
 *   double has floating point precision issues:
 *     0.1 + 0.2 = 0.30000000000000004 (wrong!)
 *   BigDecimal handles money accurately:
 *     new BigDecimal("0.1").add(new BigDecimal("0.2")) = 0.3 (correct!)
 *   RULE: ALWAYS use BigDecimal for money. Never use float or double.
 */
@Entity
@Table(name = "transactions", indexes = {
    // DATABASE INDEXES — Speed up common queries
    // Without indexes, the database scans ALL rows (slow for large tables)
    // With indexes, it uses a B-tree structure to find rows quickly
    @Index(name = "idx_transaction_user", columnList = "user_id"),
    @Index(name = "idx_transaction_date", columnList = "transaction_date"),
    @Index(name = "idx_transaction_type", columnList = "type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * MANY-TO-ONE RELATIONSHIP — Many transactions belong to one user
     *
     * @ManyToOne — This side holds the foreign key (user_id column)
     * @JoinColumn — Specifies the foreign key column name in THIS table
     *
     * fetch = FetchType.LAZY — Don't load the full User object until needed
     *   When you query transactions, you usually don't need all user details.
     *   LAZY loading only fetches the user when you call transaction.getUser()
     *
     * SQL equivalent:
     *   user_id BIGINT NOT NULL,
     *   FOREIGN KEY (user_id) REFERENCES users(id)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * MANY-TO-ONE — Many transactions can have the same category
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * AMOUNT — The transaction amount in currency
     *
     * precision = 12 — Total digits (including decimal places): up to 999,999,999,999
     * scale = 2     — Decimal places: always 2 (for paisa/cents)
     *
     * @DecimalMin("0.01") — Must be at least 0.01 (no zero or negative amounts)
     */
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /**
     * TYPE — INCOME or EXPENSE
     */
    @NotNull(message = "Transaction type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    /**
     * DESCRIPTION — What was this transaction for?
     * Optional but helpful for tracking.
     */
    @Size(max = 255, message = "Description cannot exceed 255 characters")
    @Column(length = 255)
    private String description;

    /**
     * TRANSACTION DATE — When did this transaction happen?
     *
     * LocalDate (not LocalDateTime) because we only care about the DATE,
     * not the exact time. "I spent ₹500 on May 15" — the time doesn't matter.
     *
     * LocalDate stores: 2026-05-15
     * LocalDateTime stores: 2026-05-15T14:30:00
     */
    @NotNull(message = "Transaction date is required")
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
