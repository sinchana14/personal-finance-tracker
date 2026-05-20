package com.finance.tracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Budget request/response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetDTO {

    private Long id;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;
    private String categoryIcon;
    private String categoryColor;

    @NotNull(message = "Budget amount is required")
    @DecimalMin(value = "0.01", message = "Budget must be positive")
    private BigDecimal amountLimit;

    @NotNull(message = "Month is required")
    @Min(1) @Max(12)
    private Integer month;

    @NotNull(message = "Year is required")
    @Min(2020)
    private Integer year;

    // Response fields
    private BigDecimal spent;
    private Double percentage;
    private Boolean overBudget;
}
