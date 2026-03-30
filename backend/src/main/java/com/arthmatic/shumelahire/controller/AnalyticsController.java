package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.RecruitmentMetrics;
import com.arthmatic.shumelahire.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'EXECUTIVE')")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    // Dashboard endpoints
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardMetrics(
            @RequestParam(required = false) String department,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        if (date == null) {
            date = LocalDate.now();
        }
        Map<String, Object> dashboard = analyticsService.getDashboardMetrics(department, date);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getCurrentKPIs(
            @RequestParam(required = false) String department) {
        
        LocalDate today = LocalDate.now();
        Map<String, Object> dashboard = analyticsService.getDashboardMetrics(department, today);
        return ResponseEntity.ok(Map.of("kpis", dashboard.get("kpis")));
    }

    // Detailed analytics
    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> getDetailedAnalytics(
            @RequestParam String category,
            @RequestParam(required = false) String department,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> analytics = analyticsService.getDetailedAnalytics(
            category, department, startDate, endDate);
        return ResponseEntity.ok(analytics);
    }

    // Performance reports
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceReport(
            @RequestParam Long userId,
            @RequestParam String userType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> report = analyticsService.getPerformanceReport(
            userId, userType, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    // Report generation
    @PostMapping("/reports/{reportType}")
    public ResponseEntity<List<Map<String, Object>>> generateReport(
            @PathVariable String reportType,
            @RequestBody Map<String, Object> parameters) {
        
        try {
            // Convert date strings to LocalDate if needed
            if (parameters.containsKey("startDate") && parameters.get("startDate") instanceof String) {
                parameters.put("startDate", LocalDate.parse((String) parameters.get("startDate")));
            }
            if (parameters.containsKey("endDate") && parameters.get("endDate") instanceof String) {
                parameters.put("endDate", LocalDate.parse((String) parameters.get("endDate")));
            }
            
            List<Map<String, Object>> report = analyticsService.generateReport(reportType, parameters);
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Metrics calculation and management
    @PostMapping("/calculate")
    public ResponseEntity<String> calculateMetrics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String department) {
        
        try {
            analyticsService.calculateAndStoreMetrics(date, department);
            return ResponseEntity.ok("Metrics calculated successfully for " + date);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                              .body("Error calculating metrics: " + e.getMessage());
        }
    }

    // Search and filtering
    @GetMapping("/metrics/search")
    public ResponseEntity<Page<RecruitmentMetrics>> searchMetrics(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Long recruiterId,
            @RequestParam(required = false) Long hiringManagerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "metricDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : 
                   Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<RecruitmentMetrics> metrics = analyticsService.searchMetrics(
            category, name, department, recruiterId, hiringManagerId,
            startDate, endDate, pageable);
        
        return ResponseEntity.ok(metrics);
    }

    // Trend analysis
    @GetMapping("/trends/{metricName}")
    public ResponseEntity<Map<String, Object>> getMetricTrends(
            @PathVariable String metricName,
            @RequestParam(required = false) String department,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        String category = "TRENDS";
        Map<String, Object> trends = analyticsService.getDetailedAnalytics(
            category, department, startDate, endDate);
        return ResponseEntity.ok(trends);
    }

    // Department comparison
    @GetMapping("/comparison/departments")
    public ResponseEntity<Map<String, Object>> getDepartmentComparison(
            @RequestParam String metricName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> comparison = analyticsService.getDetailedAnalytics(
            "COMPARISON", null, startDate, endDate);
        return ResponseEntity.ok(comparison);
    }

    // Quick stats for cards/widgets
    @GetMapping("/quick-stats")
    public ResponseEntity<Map<String, Object>> getQuickStats(
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "7") int days) {
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        Map<String, Object> dashboard = analyticsService.getDashboardMetrics(department, endDate);
        
        // Extract quick stats
        Map<String, Object> quickStats = Map.of(
            "period", startDate + " to " + endDate,
            "department", department != null ? department : "All Departments",
            "alerts", dashboard.get("alerts"),
            "kpis", dashboard.get("kpis")
        );
        
        return ResponseEntity.ok(quickStats);
    }

    // Export functionality
    @GetMapping("/export/{format}")
    public ResponseEntity<Map<String, Object>> exportData(
            @PathVariable String format,
            @RequestParam String category,
            @RequestParam(required = false) String department,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        // For now, return the data - in production this would generate actual files
        Map<String, Object> data = analyticsService.getDetailedAnalytics(
            category, department, startDate, endDate);
        
        Map<String, Object> exportResult = Map.of(
            "format", format,
            "category", category,
            "department", department != null ? department : "All",
            "period", startDate + " to " + endDate,
            "data", data,
            "exportedAt", LocalDate.now().toString()
        );
        
        return ResponseEntity.ok(exportResult);
    }

    // Benchmark analysis
    @GetMapping("/benchmarks")
    public ResponseEntity<Map<String, Object>> getBenchmarkAnalysis(
            @RequestParam(required = false) String department,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> benchmarks = analyticsService.getDetailedAnalytics(
            "BENCHMARKS", department, startDate, endDate);
        return ResponseEntity.ok(benchmarks);
    }

    // Alerts and notifications
    @GetMapping("/alerts")
    public ResponseEntity<List<Map<String, Object>>> getAlerts(
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "7") int days) {
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);
        
        Map<String, Object> dashboard = analyticsService.getDashboardMetrics(department, endDate);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> alerts = (List<Map<String, Object>>) dashboard.get("alerts");
        
        return ResponseEntity.ok(alerts != null ? alerts : List.of());
    }

    // Health check for analytics system
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getAnalyticsHealth() {
        Map<String, Object> health = Map.of(
            "status", "healthy",
            "lastCalculation", LocalDate.now().toString(),
            "availableReports", List.of(
                "EXECUTIVE_SUMMARY",
                "DEPARTMENT_PERFORMANCE", 
                "RECRUITER_SCORECARD",
                "PIPELINE_ANALYSIS"
            ),
            "availableCategories", List.of(
                "APPLICATIONS", "INTERVIEWS", "OFFERS", 
                "PIPELINE", "EFFICIENCY", "KPI"
            )
        );
        
        return ResponseEntity.ok(health);
    }

    // Exception handling
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                           .body(Map.of(
                               "error", "Analytics error: " + e.getMessage(),
                               "timestamp", LocalDate.now().toString()
                           ));
    }
}
