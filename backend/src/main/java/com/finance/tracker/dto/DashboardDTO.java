package com.finance.tracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * ============================================================
 * DASHBOARD DTO — All data needed for the dashboard in one response
 * ============================================================
 *
 * Instead of making 5 API calls to load the dashboard, we bundle
 * everything into ONE response. This is more efficient because:
 *   - Fewer HTTP round trips (each request has overhead)
 *   - Frontend can render everything at once
 *   - Better user experience (no partial loading)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance; // totalIncome - totalExpense

    // Category-wise breakdown for pie chart
    private List<CategoryBreakdown> categoryBreakdown;

    // Monthly trend data for line chart
    private List<MonthlyTrend> monthlyTrend;

    // Budget status for budget alerts
    private List<BudgetStatus> budgetStatuses;

    // Recent transactions
    private List<TransactionDTO> recentTransactions;

    /**
     * Nested DTO for category breakdown
     * Example: { name: "Food", icon: "🍔", color: "#FF5722", amount: 5000, percentage: 40 }
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryBreakdown {
        private String categoryName;
        private String icon;
        private String color;
        private BigDecimal amount;
        private double percentage;
    }

    /**
     * Nested DTO for monthly trend
     * Example: { month: "Jan 2026", income: 50000, expense: 35000 }
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyTrend {
        private String month; // "Jan 2026"
        private int monthNumber;
        private int year;
        private BigDecimal income;
        private BigDecimal expense;
    }

    /**
     * Nested DTO for budget status
     * Example: { category: "Food", limit: 5000, spent: 3200, percentage: 64, overBudget: false }
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BudgetStatus {
        private String categoryName;
        private String icon;
        private String color;
        private BigDecimal limit;
        private BigDecimal spent;
        private double percentage;
        private boolean overBudget;
    }
}
