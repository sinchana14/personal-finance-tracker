package com.finance.tracker.controller;

import com.finance.tracker.dto.BudgetDTO;
import com.finance.tracker.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Budget Controller — Set and track monthly budgets
 */
@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    /**
     * GET /api/budgets?month=5&year=2026 — Get budgets for a specific month
     * GET /api/budgets — Get all budgets
     */
    @GetMapping
    public ResponseEntity<List<BudgetDTO>> getBudgets(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        List<BudgetDTO> budgets = budgetService.getBudgets(
                userDetails.getUsername(), month, year);
        return ResponseEntity.ok(budgets);
    }

    /**
     * POST /api/budgets — Create or update a budget
     */
    @PostMapping
    public ResponseEntity<BudgetDTO> createBudget(
            @Valid @RequestBody BudgetDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {

        BudgetDTO budget = budgetService.createOrUpdateBudget(dto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(budget);
    }
}
