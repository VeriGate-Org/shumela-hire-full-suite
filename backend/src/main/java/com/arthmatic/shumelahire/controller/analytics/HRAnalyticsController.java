package com.arthmatic.shumelahire.controller.analytics;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.service.analytics.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@FeatureGate("ADVANCED_ANALYTICS")
@PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
public class HRAnalyticsController {

    @Autowired
    private HROverviewAnalyticsService hrOverviewAnalyticsService;

    @Autowired
    private AttendanceAnalyticsService attendanceAnalyticsService;

    @Autowired
    @Qualifier("analyticsTrainingAnalyticsService")
    private TrainingAnalyticsService trainingAnalyticsService;

    @Autowired
    private EngagementAnalyticsService engagementAnalyticsService;

    @Autowired
    private ComplianceAnalyticsService complianceAnalyticsService;

    @Autowired
    private PerformanceReviewAnalyticsService performanceAnalyticsService;

    @GetMapping("/hr-overview")
    public ResponseEntity<Map<String, Object>> getHROverview() {
        Map<String, Object> metrics = hrOverviewAnalyticsService.getOverviewMetrics();
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/attendance")
    public ResponseEntity<Map<String, Object>> getAttendanceAnalytics() {
        Map<String, Object> metrics = attendanceAnalyticsService.getAttendanceMetrics();
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/training")
    public ResponseEntity<Map<String, Object>> getTrainingAnalytics() {
        Map<String, Object> metrics = trainingAnalyticsService.getTrainingMetrics();
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/engagement")
    public ResponseEntity<Map<String, Object>> getEngagementAnalytics() {
        Map<String, Object> metrics = engagementAnalyticsService.getEngagementMetrics();
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/compliance")
    public ResponseEntity<Map<String, Object>> getComplianceAnalytics() {
        Map<String, Object> metrics = complianceAnalyticsService.getComplianceMetrics();
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/performance-reviews")
    public ResponseEntity<Map<String, Object>> getPerformanceAnalytics() {
        Map<String, Object> metrics = performanceAnalyticsService.getPerformanceMetrics();
        return ResponseEntity.ok(metrics);
    }
}
