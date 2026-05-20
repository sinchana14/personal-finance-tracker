package com.finance.tracker.config;

import com.finance.tracker.model.Category;
import com.finance.tracker.model.TransactionType;
import com.finance.tracker.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * ============================================================
 * DATA SEEDER — Pre-loads default categories on startup
 * ============================================================
 *
 * WHAT IS CommandLineRunner?
 * It's a Spring Boot interface with one method: run()
 * Any class implementing it will have its run() method called
 * AUTOMATICALLY after the application starts.
 *
 * Perfect for:
 *   - Loading seed data (default categories, admin users)
 *   - Running database migrations
 *   - Warming up caches
 *
 * @RequiredArgsConstructor (Lombok) — Generates a constructor that
 * takes all 'final' fields as parameters. Spring uses this for
 * Dependency Injection (DI).
 *
 * WHAT IS DEPENDENCY INJECTION?
 * Instead of creating objects yourself (new CategoryRepository()),
 * Spring creates them and "injects" them into your class.
 * This makes your code:
 *   - Testable (you can inject mock objects in tests)
 *   - Loosely coupled (classes don't know how dependencies are created)
 *   - Configurable (Spring manages the lifecycle)
 */
@Component  // Tells Spring: "Create an instance of this class and manage it"
@RequiredArgsConstructor  // Generates constructor for final fields (DI)
@Slf4j  // Generates a 'log' field for logging (log.info, log.error, etc.)
public class DataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        // Only seed if categories table is empty (prevents duplicates on restart)
        if (categoryRepository.count() == 0) {
            log.info("Seeding default categories...");
            seedCategories();
            log.info("Default categories seeded successfully!");
        } else {
            log.info("Categories already exist, skipping seed.");
        }
    }

    private void seedCategories() {
        // EXPENSE categories
        createCategory("Food & Dining", "🍔", "#FF5722", TransactionType.EXPENSE);
        createCategory("Transport", "🚗", "#2196F3", TransactionType.EXPENSE);
        createCategory("Shopping", "🛍️", "#E91E63", TransactionType.EXPENSE);
        createCategory("Entertainment", "🎬", "#9C27B0", TransactionType.EXPENSE);
        createCategory("Bills & Utilities", "💡", "#FF9800", TransactionType.EXPENSE);
        createCategory("Health", "🏥", "#4CAF50", TransactionType.EXPENSE);
        createCategory("Education", "📚", "#3F51B5", TransactionType.EXPENSE);
        createCategory("Rent", "🏠", "#795548", TransactionType.EXPENSE);
        createCategory("Groceries", "🛒", "#009688", TransactionType.EXPENSE);
        createCategory("Other Expense", "📦", "#607D8B", TransactionType.EXPENSE);

        // INCOME categories
        createCategory("Salary", "💰", "#4CAF50", TransactionType.INCOME);
        createCategory("Freelance", "💻", "#00BCD4", TransactionType.INCOME);
        createCategory("Investment", "📈", "#8BC34A", TransactionType.INCOME);
        createCategory("Gift", "🎁", "#FF4081", TransactionType.INCOME);
        createCategory("Other Income", "💵", "#FFC107", TransactionType.INCOME);
    }

    private void createCategory(String name, String icon, String color, TransactionType type) {
        Category category = Category.builder()
                .name(name)
                .icon(icon)
                .color(color)
                .type(type)
                .isDefault(true)
                .build();
        categoryRepository.save(category);
        log.debug("Created category: {} {}", icon, name);
    }
}
