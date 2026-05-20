package com.finance.tracker.controller;

import com.finance.tracker.model.Category;
import com.finance.tracker.model.TransactionType;
import com.finance.tracker.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Category Controller — List and create categories
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * GET /api/categories — Get all categories
     * GET /api/categories?type=EXPENSE — Get only expense categories
     */
    @GetMapping
    public ResponseEntity<List<Category>> getCategories(
            @RequestParam(required = false) String type) {

        List<Category> categories;
        if (type != null) {
            categories = categoryService.getCategoriesByType(TransactionType.valueOf(type));
        } else {
            categories = categoryService.getAllCategories();
        }
        return ResponseEntity.ok(categories);
    }

    /**
     * POST /api/categories — Create a custom category
     */
    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        Category created = categoryService.createCategory(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
