package com.finance.tracker.service;

import com.finance.tracker.dto.TransactionDTO;
import com.finance.tracker.exception.ResourceNotFoundException;
import com.finance.tracker.model.Category;
import com.finance.tracker.model.Transaction;
import com.finance.tracker.model.TransactionType;
import com.finance.tracker.model.User;
import com.finance.tracker.repository.CategoryRepository;
import com.finance.tracker.repository.TransactionRepository;
import com.finance.tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ============================================================
 * TRANSACTION SERVICE — CRUD operations for transactions
 * ============================================================
 *
 * This service demonstrates the full CRUD lifecycle:
 *   C = Create (add new transaction)
 *   R = Read   (get transactions with filters)
 *   U = Update (modify existing transaction)
 *   D = Delete (remove a transaction)
 *
 * @Transactional — Wraps methods in a database transaction
 *   If anything fails, ALL changes are rolled back (atomicity)
 *   Example: If saving a transaction fails after updating the budget,
 *   the budget update is also rolled back.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    /**
     * CREATE — Add a new transaction
     *
     * Flow: DTO → Entity → Save → DTO
     *   1. Receive TransactionDTO from controller (what the client sent)
     *   2. Look up the User and Category entities
     *   3. Create a Transaction entity
     *   4. Save to database
     *   5. Convert back to DTO for the response
     */
    @Transactional
    public TransactionDTO createTransaction(TransactionDTO dto, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", dto.getCategoryId()));

        Transaction transaction = Transaction.builder()
                .user(user)
                .category(category)
                .amount(dto.getAmount())
                .type(TransactionType.valueOf(dto.getType()))
                .description(dto.getDescription())
                .transactionDate(dto.getTransactionDate())
                .build();

        Transaction saved = transactionRepository.save(transaction);
        log.info("Transaction created: {} {} ₹{}", saved.getType(), category.getName(), saved.getAmount());
        return toDTO(saved);
    }

    /**
     * READ — Get all transactions for a user with optional filters
     */
    public List<TransactionDTO> getTransactions(String username, String type,
                                                 LocalDate startDate, LocalDate endDate,
                                                 Long categoryId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<Transaction> transactions;

        if (type != null && startDate != null && endDate != null) {
            transactions = transactionRepository
                    .findByUserIdAndTypeAndTransactionDateBetweenOrderByTransactionDateDesc(
                            user.getId(), TransactionType.valueOf(type), startDate, endDate);
        } else if (type != null) {
            transactions = transactionRepository
                    .findByUserIdAndTypeOrderByTransactionDateDesc(
                            user.getId(), TransactionType.valueOf(type));
        } else if (startDate != null && endDate != null) {
            transactions = transactionRepository
                    .findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
                            user.getId(), startDate, endDate);
        } else if (categoryId != null) {
            transactions = transactionRepository
                    .findByUserIdAndCategoryIdOrderByTransactionDateDesc(
                            user.getId(), categoryId);
        } else {
            transactions = transactionRepository
                    .findByUserIdOrderByTransactionDateDesc(user.getId());
        }

        // Convert List<Transaction> → List<TransactionDTO> using Java Streams
        return transactions.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * READ — Get a single transaction by ID
     */
    public TransactionDTO getTransactionById(Long id, String username) {
        Transaction transaction = findTransactionByIdAndUser(id, username);
        return toDTO(transaction);
    }

    /**
     * UPDATE — Modify an existing transaction
     */
    @Transactional
    public TransactionDTO updateTransaction(Long id, TransactionDTO dto, String username) {
        Transaction transaction = findTransactionByIdAndUser(id, username);

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", dto.getCategoryId()));

        // Update fields
        transaction.setCategory(category);
        transaction.setAmount(dto.getAmount());
        transaction.setType(TransactionType.valueOf(dto.getType()));
        transaction.setDescription(dto.getDescription());
        transaction.setTransactionDate(dto.getTransactionDate());

        Transaction updated = transactionRepository.save(transaction);
        log.info("Transaction updated: id={}", id);
        return toDTO(updated);
    }

    /**
     * DELETE — Remove a transaction
     */
    @Transactional
    public void deleteTransaction(Long id, String username) {
        Transaction transaction = findTransactionByIdAndUser(id, username);
        transactionRepository.delete(transaction);
        log.info("Transaction deleted: id={}", id);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Find a transaction ensuring it belongs to the requesting user
     * This is SECURITY — prevents users from accessing others' transactions
     */
    private Transaction findTransactionByIdAndUser(Long id, String username) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", id));

        if (!transaction.getUser().getUsername().equals(username)) {
            throw new ResourceNotFoundException("Transaction", "id", id);
        }

        return transaction;
    }

    /**
     * Convert Entity → DTO
     * We include category details in the response for the frontend
     */
    private TransactionDTO toDTO(Transaction transaction) {
        return TransactionDTO.builder()
                .id(transaction.getId())
                .categoryId(transaction.getCategory().getId())
                .categoryName(transaction.getCategory().getName())
                .categoryIcon(transaction.getCategory().getIcon())
                .categoryColor(transaction.getCategory().getColor())
                .amount(transaction.getAmount())
                .type(transaction.getType().name())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }
}
