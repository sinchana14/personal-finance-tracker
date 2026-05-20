package com.finance.tracker.service;

import com.finance.tracker.dto.BudgetDTO;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.model.Budget;
import com.finance.tracker.model.Category;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.BudgetRepository;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Budget Service — Create, read, and track budget progress
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Create or update a budget for a specific category/month
     */
    @Transactional
    public BudgetDTO createOrUpdateBudget(BudgetDTO dto, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", dto.getCategoryId()));

        // Check if budget already exists for this user+category+month+year
        Budget budget = budgetRepository
                .findByUserIdAndCategoryIdAndMonthAndYear(
                        user.getId(), dto.getCategoryId(), dto.getMonth(), dto.getYear())
                .orElse(Budget.builder()
                        .user(user)
                        .category(category)
                        .month(dto.getMonth())
                        .year(dto.getYear())
                        .build());

        budget.setAmountLimit(dto.getAmountLimit());
        Budget saved = budgetRepository.save(budget);
        log.info("Budget set: {} ₹{} for {}/{}", category.getName(), dto.getAmountLimit(), dto.getMonth(), dto.getYear());
        return toDTO(saved, user.getId());
    }

    /**
     * Get all budgets for a user in a specific month/year
     */
    public List<BudgetDTO> getBudgets(String username, Integer month, Integer year) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<Budget> budgets;
        if (month != null && year != null) {
            budgets = budgetRepository.findByUserIdAndMonthAndYear(user.getId(), month, year);
        } else {
            budgets = budgetRepository.findByUserIdOrderByYearDescMonthDesc(user.getId());
        }

        return budgets.stream()
                .map(b -> toDTO(b, user.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Convert Budget entity to DTO with spending tracking data
     */
    private BudgetDTO toDTO(Budget budget, Long userId) {
        // Calculate actual spending for this category/month
        BigDecimal spent = transactionRepository.sumByCategoryAndMonth(
                userId, budget.getCategory().getId(), budget.getMonth(), budget.getYear());

        double percentage = budget.getAmountLimit().compareTo(BigDecimal.ZERO) > 0
                ? spent.divide(budget.getAmountLimit(), 4, RoundingMode.HALF_UP)
                       .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0;

        return BudgetDTO.builder()
                .id(budget.getId())
                .categoryId(budget.getCategory().getId())
                .categoryName(budget.getCategory().getName())
                .categoryIcon(budget.getCategory().getIcon())
                .categoryColor(budget.getCategory().getColor())
                .amountLimit(budget.getAmountLimit())
                .month(budget.getMonth())
                .year(budget.getYear())
                .spent(spent)
                .percentage(percentage)
                .overBudget(spent.compareTo(budget.getAmountLimit()) > 0)
                .build();
    }
}
