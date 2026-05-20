package com.finance.tracker.service;

import com.finance.tracker.dto.DashboardDTO;
import com.finance.tracker.dto.TransactionDTO;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.model.*;
import com.finance.tracker.repository.BudgetRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * ============================================================
 * DASHBOARD SERVICE — Aggregates data for the dashboard
 * ============================================================
 *
 * This is the most complex service because it:
 *   1. Calculates totals (income, expense, balance)
 *   2. Gets category breakdown (for pie chart)
 *   3. Gets monthly trends (for line chart)
 *   4. Gets budget statuses (for progress bars)
 *   5. Gets recent transactions
 *
 * All in ONE method call to minimize API round-trips.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    /**
     * Get complete dashboard data for a user
     */
    public DashboardDTO getDashboardData(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        Long userId = user.getId();
        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();

        // 1. Calculate totals
        BigDecimal totalIncome = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.INCOME);
        BigDecimal totalExpense = transactionRepository.sumAmountByUserIdAndType(userId, TransactionType.EXPENSE);
        BigDecimal balance = totalIncome.subtract(totalExpense);

        // 2. Category breakdown (current month expenses for pie chart)
        LocalDate monthStart = LocalDate.of(currentYear, currentMonth, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        List<Object[]> categoryData = transactionRepository.sumByCategory(
                userId, TransactionType.EXPENSE, monthStart, monthEnd);

        BigDecimal monthlyExpenseTotal = categoryData.stream()
                .map(row -> (BigDecimal) row[1])
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<DashboardDTO.CategoryBreakdown> categoryBreakdown = categoryData.stream()
                .map(row -> {
                    Category cat = (Category) row[0];
                    BigDecimal amount = (BigDecimal) row[1];
                    double percentage = monthlyExpenseTotal.compareTo(BigDecimal.ZERO) > 0
                            ? amount.divide(monthlyExpenseTotal, 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100)).doubleValue()
                            : 0;
                    return DashboardDTO.CategoryBreakdown.builder()
                            .categoryName(cat.getName())
                            .icon(cat.getIcon())
                            .color(cat.getColor())
                            .amount(amount)
                            .percentage(percentage)
                            .build();
                })
                .collect(Collectors.toList());

        // 3. Monthly trend (last 6 months)
        List<DashboardDTO.MonthlyTrend> monthlyTrend = getMonthlyTrend(userId);

        // 4. Budget statuses (current month)
        List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, currentMonth, currentYear);
        List<DashboardDTO.BudgetStatus> budgetStatuses = budgets.stream()
                .map(budget -> {
                    BigDecimal spent = transactionRepository.sumByCategoryAndMonth(
                            userId, budget.getCategory().getId(), currentMonth, currentYear);
                    double percentage = budget.getAmountLimit().compareTo(BigDecimal.ZERO) > 0
                            ? spent.divide(budget.getAmountLimit(), 4, RoundingMode.HALF_UP)
                                   .multiply(BigDecimal.valueOf(100)).doubleValue()
                            : 0;
                    return DashboardDTO.BudgetStatus.builder()
                            .categoryName(budget.getCategory().getName())
                            .icon(budget.getCategory().getIcon())
                            .color(budget.getCategory().getColor())
                            .limit(budget.getAmountLimit())
                            .spent(spent)
                            .percentage(percentage)
                            .overBudget(spent.compareTo(budget.getAmountLimit()) > 0)
                            .build();
                })
                .collect(Collectors.toList());

        // 5. Recent transactions (last 5)
        List<TransactionDTO> recentTransactions = transactionRepository
                .findByUserIdOrderByTransactionDateDesc(userId)
                .stream()
                .limit(5)
                .map(t -> TransactionDTO.builder()
                        .id(t.getId())
                        .categoryId(t.getCategory().getId())
                        .categoryName(t.getCategory().getName())
                        .categoryIcon(t.getCategory().getIcon())
                        .categoryColor(t.getCategory().getColor())
                        .amount(t.getAmount())
                        .type(t.getType().name())
                        .description(t.getDescription())
                        .transactionDate(t.getTransactionDate())
                        .build())
                .collect(Collectors.toList());

        return DashboardDTO.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .categoryBreakdown(categoryBreakdown)
                .monthlyTrend(monthlyTrend)
                .budgetStatuses(budgetStatuses)
                .recentTransactions(recentTransactions)
                .build();
    }

    /**
     * Get monthly income & expense trend for the last 6 months
     */
    private List<DashboardDTO.MonthlyTrend> getMonthlyTrend(Long userId) {
        List<Object[]> incomeTrend = transactionRepository.getMonthlyTotals(userId, TransactionType.INCOME);
        List<Object[]> expenseTrend = transactionRepository.getMonthlyTotals(userId, TransactionType.EXPENSE);

        // Build a map of month → income/expense for easy lookup
        List<DashboardDTO.MonthlyTrend> trends = new ArrayList<>();
        LocalDate now = LocalDate.now();

        for (int i = 5; i >= 0; i--) {
            LocalDate date = now.minusMonths(i);
            int month = date.getMonthValue();
            int year = date.getYear();
            String monthName = Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + year;

            BigDecimal income = findMonthlyTotal(incomeTrend, year, month);
            BigDecimal expense = findMonthlyTotal(expenseTrend, year, month);

            trends.add(DashboardDTO.MonthlyTrend.builder()
                    .month(monthName)
                    .monthNumber(month)
                    .year(year)
                    .income(income)
                    .expense(expense)
                    .build());
        }

        return trends;
    }

    private BigDecimal findMonthlyTotal(List<Object[]> data, int year, int month) {
        return data.stream()
                .filter(row -> ((Number) row[0]).intValue() == year && ((Number) row[1]).intValue() == month)
                .map(row -> (BigDecimal) row[2])
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }
}
