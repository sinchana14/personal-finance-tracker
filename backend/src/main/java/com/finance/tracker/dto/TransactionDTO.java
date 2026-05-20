package com.finance.tracker.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * ============================================================
 * TRANSACTION DTO — What the client sends/receives
 * ============================================================
 *
 * Note: The client sends categoryId (a number), not the full Category object.
 * The server looks up the Category entity using this ID.
 *
 * Similarly, userId is NOT sent by the client — the server gets it from
 * the JWT token (the logged-in user). This prevents users from creating
 * transactions for other users!
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionDTO {

    private Long id; // null for creation, set for updates

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;  // For response — human-readable category
    private String categoryIcon;
    private String categoryColor;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    @NotBlank(message = "Type is required (INCOME or EXPENSE)")
    private String type;

    @Size(max = 255)
    private String description;

    @NotNull(message = "Date is required")
    private LocalDate transactionDate;
}
