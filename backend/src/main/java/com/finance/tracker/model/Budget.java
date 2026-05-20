package com.finance.tracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ============================================================
 * BUDGET ENTITY — Monthly spending limits per category
 * ============================================================
 *
 * A budget lets users set spending limits for specific categories each month.
 *
 * EXAMPLE:
 *   "I want to spend no more than ₹5000 on Food in May 2026"
 *   →  Budget {
 *        user: currentUser,
 *        category: Food,
 *        amountLimit: 5000.00,
 *        month: 5,
 *        year: 2026
 *      }
 *
 * HOW IT'S USED:
 *   1. User sets a budget: "₹5000 for Food in May"
 *   2. App tracks total Food expenses in May
 *   3. If total > ₹5000, the app shows an ALERT
 *   4. Dashboard shows progress bars: "₹3200 / ₹5000 (64%)"
 *
 * UNIQUE CONSTRAINT:
 *   A user can have only ONE budget per category per month.
 *   You can't set TWO food budgets for May 2026.
 *   This is enforced by @Table(uniqueConstraints = ...)
 */
@Entity
@Table(name = "budgets", uniqueConstraints = {
    // COMPOSITE UNIQUE CONSTRAINT — The combination of these 3 columns must be unique
    // This means: One user + One category + One month/year = Only one budget
    @UniqueConstraint(
        name = "uk_budget_user_category_period",
        columnNames = {"user_id", "category_id", "budget_month", "budget_year"}
    )
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * AMOUNT LIMIT — The maximum spending allowed for this category/month
     */
    @NotNull(message = "Budget amount is required")
    @DecimalMin(value = "0.01", message = "Budget must be greater than 0")
    @Column(name = "amount_limit", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountLimit;

    /**
     * MONTH — 1 (January) to 12 (December)
     * @Min and @Max ensure valid month values
     */
    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    @Column(name = "budget_month", nullable = false)
    private Integer month;

    /**
     * YEAR — e.g., 2026
     */
    @NotNull(message = "Year is required")
    @Min(value = 2020, message = "Year must be 2020 or later")
    @Column(name = "budget_year", nullable = false)
    private Integer year;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
