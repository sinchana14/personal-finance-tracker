package com.finance.tracker.controller;

import com.finance.tracker.dto.TransactionDTO;
import com.finance.tracker.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * ============================================================
 * TRANSACTION CONTROLLER — CRUD API for Transactions
 * ============================================================
 *
 * IMPORTANT CONCEPT: @AuthenticationPrincipal
 * This annotation injects the currently authenticated user.
 * Spring Security populates this from the JWT token.
 *
 * Flow: JWT Token → JwtAuthFilter extracts username → SecurityContext
 *       → @AuthenticationPrincipal provides it to the controller
 *
 * This is how we know WHICH USER is making the request
 * without them sending their user ID (which could be faked).
 *
 * @RequestParam — Extracts query parameters from the URL
 *   GET /api/transactions?type=EXPENSE&startDate=2026-01-01
 *   → type = "EXPENSE", startDate = 2026-01-01
 *   required = false → parameter is optional
 */
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * GET ALL TRANSACTIONS (with optional filters)
     *
     * GET /api/transactions
     * GET /api/transactions?type=EXPENSE
     * GET /api/transactions?startDate=2026-01-01&endDate=2026-01-31
     * GET /api/transactions?categoryId=3
     */
    @GetMapping
    public ResponseEntity<List<TransactionDTO>> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long categoryId) {

        List<TransactionDTO> transactions = transactionService.getTransactions(
                userDetails.getUsername(), type, startDate, endDate, categoryId);
        return ResponseEntity.ok(transactions);
    }

    /**
     * GET SINGLE TRANSACTION
     *
     * GET /api/transactions/42
     *
     * @PathVariable — Extracts value from the URL path
     *   /api/transactions/{id} → {id} becomes the method parameter
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransactionDTO> getTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        TransactionDTO transaction = transactionService.getTransactionById(id, userDetails.getUsername());
        return ResponseEntity.ok(transaction);
    }

    /**
     * CREATE TRANSACTION
     *
     * POST /api/transactions
     * Body: { "categoryId": 2, "amount": 500, "type": "EXPENSE",
     *         "description": "Lunch", "transactionDate": "2026-05-15" }
     */
    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(
            @Valid @RequestBody TransactionDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        TransactionDTO created = transactionService.createTransaction(dto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * UPDATE TRANSACTION
     *
     * PUT /api/transactions/42
     * Body: { "categoryId": 2, "amount": 600, ... }
     */
    @PutMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        TransactionDTO updated = transactionService.updateTransaction(id, dto, userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE TRANSACTION
     *
     * DELETE /api/transactions/42
     *
     * HTTP 204 No Content — Standard response for successful deletion
     * (no body needed — the resource is gone)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        transactionService.deleteTransaction(id, userDetails.getUsername());
        return ResponseEntity.noContent().build(); // HTTP 204
    }
}
