package com.finance.tracker.model;

/**
 * ============================================================
 * TRANSACTION TYPE ENUM
 * ============================================================
 *
 * WHAT IS AN ENUM?
 * An enum (enumeration) is a special Java type that represents a FIXED SET of constants.
 * Instead of using strings like "INCOME" or "EXPENSE" (which could have typos),
 * we use an enum to guarantee only valid values are used.
 *
 * WHY USE IT?
 *   - Type safety: You can't accidentally set type = "INCME" (typo)
 *   - IDE support: Your editor will auto-complete the valid values
 *   - Database: JPA stores this as a string "INCOME" or "EXPENSE" in the column
 *
 * In the database, this creates a column with @Enumerated(EnumType.STRING):
 *   type VARCHAR(10) -- stores "INCOME" or "EXPENSE"
 */
public enum TransactionType {
    INCOME,   // Money coming IN  (salary, freelance, gifts)
    EXPENSE   // Money going OUT (food, rent, transport)
}
