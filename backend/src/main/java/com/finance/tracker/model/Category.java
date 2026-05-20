package com.finance.tracker.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * ============================================================
 * CATEGORY ENTITY — Maps to the "categories" table
 * ============================================================
 *
 * Categories help users organize their transactions.
 * Examples: Food, Transport, Salary, Entertainment, Rent
 *
 * Each category has:
 *   - A name (e.g., "Food")
 *   - An icon (emoji like "🍔" for display in the frontend)
 *   - A color (hex code like "#FF5733" for charts)
 *   - A type (INCOME or EXPENSE — so "Salary" is INCOME, "Food" is EXPENSE)
 *   - isDefault flag (pre-loaded categories vs user-created ones)
 *
 * DATABASE TABLE CREATED:
 * +----+-----------+------+---------+---------+------------+
 * | id | name      | icon | color   | type    | is_default |
 * +----+-----------+------+---------+---------+------------+
 * | 1  | Salary    | 💰   | #4CAF50 | INCOME  | true       |
 * | 2  | Food      | 🍔   | #FF5722 | EXPENSE | true       |
 * +----+-----------+------+---------+---------+------------+
 */
@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Category name is required")
    @Size(max = 50)
    @Column(unique = true, nullable = false, length = 50)
    private String name;

    /**
     * ICON — Stored as a string (emoji or icon name)
     * We use emojis for simplicity: "🍔", "🚗", "💰"
     * In a production app, you might use icon library names like "fa-car"
     */
    @Column(length = 10)
    private String icon;

    /**
     * COLOR — Hex color code for charts and UI
     * Example: "#FF5722" (deep orange), "#4CAF50" (green)
     */
    @Column(length = 7)
    private String color;

    /**
     * TYPE — Is this category for INCOME or EXPENSE transactions?
     *
     * @Enumerated(EnumType.STRING) — Store the enum NAME as text
     *   STRING → stores "INCOME" (readable, takes more space)
     *   ORDINAL → stores 0 or 1 (smaller, but breaks if you reorder the enum!)
     *   ALWAYS use STRING for safety.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    /**
     * IS_DEFAULT — Was this category pre-loaded by the app?
     * Default categories can't be deleted by users.
     * Users can create their own custom categories (isDefault = false).
     */
    @Builder.Default
    @Column(nullable = false)
    private boolean isDefault = false;

    // Relationships (a category can have many transactions and budgets)
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Transaction> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Budget> budgets = new ArrayList<>();
}
