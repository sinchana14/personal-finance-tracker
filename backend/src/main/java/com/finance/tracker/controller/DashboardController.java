package com.finance.tracker.controller;

import com.finance.tracker.dto.DashboardDTO;
import com.finance.tracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard Controller — Single endpoint that returns all dashboard data
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/dashboard — Get complete dashboard data
     *
     * Returns: totals, category breakdown, monthly trends,
     *          budget statuses, and recent transactions
     */
    @GetMapping
    public ResponseEntity<DashboardDTO> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {

        DashboardDTO dashboard = dashboardService.getDashboardData(userDetails.getUsername());
        return ResponseEntity.ok(dashboard);
    }
}
