package com.arthmatic.shumelahire.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.arthmatic.shumelahire.service.PerformanceService;

import java.util.Map;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Performance monitoring and optimization controller
 */
@RestController
@RequestMapping("/api/performance")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class PerformanceController {
    
    @Autowired
    private PerformanceService performanceService;
    
    /**
     * Get cached analytics data
     */
    @GetMapping("/analytics/{type}")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @PathVariable String type,
            @RequestParam(defaultValue = "daily") String period) {
        
        Map<String, Object> analytics = performanceService.getCachedAnalytics(type, period);
        return ResponseEntity.ok(analytics);
    }
    
    /**
     * Get performance metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<PerformanceService.PerformanceMetrics> getMetrics() {
        PerformanceService.PerformanceMetrics metrics = performanceService.getPerformanceMetrics();
        return ResponseEntity.ok(metrics);
    }
    
    /**
     * Get system health information
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        Map<String, Object> health = performanceService.getSystemHealth();
        return ResponseEntity.ok(health);
    }
    
    /**
     * Process report asynchronously
     */
    @PostMapping("/reports/{type}/async")
    public ResponseEntity<Map<String, String>> processReportAsync(@PathVariable String type) {
        CompletableFuture<Map<String, Object>> future = performanceService.processReportAsync(type);
        
        Map<String, String> response = Map.of(
            "status", "processing",
            "message", "Report generation started",
            "reportType", type
        );
        
        return ResponseEntity.accepted().body(response);
    }
    
    /**
     * Warm up application cache
     */
    @PostMapping("/cache/warmup")
    public ResponseEntity<Map<String, String>> warmUpCache() {
        performanceService.warmUpCache();
        
        Map<String, String> response = Map.of(
            "status", "success",
            "message", "Cache warmed up successfully"
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Clear analytics cache
     */
    @DeleteMapping("/cache/analytics")
    public ResponseEntity<Map<String, String>> clearAnalyticsCache() {
        performanceService.clearAnalyticsCache();
        
        Map<String, String> response = Map.of(
            "status", "success",
            "message", "Analytics cache cleared"
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Optimize memory usage
     */
    @PostMapping("/memory/optimize")
    public ResponseEntity<Map<String, String>> optimizeMemory() {
        performanceService.optimizeMemory();
        
        Map<String, String> response = Map.of(
            "status", "success",
            "message", "Memory optimization completed"
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Batch process operations
     */
    @PostMapping("/batch")
    public ResponseEntity<Map<String, String>> batchProcess(@RequestBody List<String> operations) {
        CompletableFuture<List<Map<String, Object>>> future = performanceService.batchProcess(operations);
        
        Map<String, String> response = Map.of(
            "status", "processing",
            "message", "Batch processing started",
            "operationCount", String.valueOf(operations.size())
        );
        
        return ResponseEntity.accepted().body(response);
    }
    
    /**
     * Get comprehensive performance dashboard data
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getPerformanceDashboard() {
        Map<String, Object> dashboard = Map.of(
            "metrics", performanceService.getPerformanceMetrics(),
            "health", performanceService.getSystemHealth(),
            "analytics", Map.of(
                "applications", performanceService.getCachedAnalytics("applications", "daily"),
                "jobs", performanceService.getCachedAnalytics("jobs", "daily"),
                "performance", performanceService.getCachedAnalytics("performance", "hourly")
            )
        );
        
        return ResponseEntity.ok(dashboard);
    }
}
