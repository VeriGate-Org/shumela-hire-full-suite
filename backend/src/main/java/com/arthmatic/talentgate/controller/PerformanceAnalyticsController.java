package com.arthmatic.talentgate.controller;

import com.arthmatic.talentgate.service.PerformanceAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
public class PerformanceAnalyticsController {

    @Autowired
    private PerformanceAnalyticsService performanceAnalyticsService;

    /**
     * Get comprehensive recruitment metrics including time to hire, conversion rates, 
     * source effectiveness, and cost analysis
     */
    @GetMapping("/recruitment-metrics")
    public ResponseEntity<Map<String, Object>> getRecruitmentMetrics() {
        try {
            Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve recruitment metrics", 
                           "message", e.getMessage()));
        }
    }

    /**
     * Get interview performance analytics including pass rates, interviewer effectiveness,
     * feedback trends, and scheduling efficiency
     */
    @GetMapping("/interview-performance")
    public ResponseEntity<Map<String, Object>> getInterviewPerformanceAnalytics() {
        try {
            Map<String, Object> analytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve interview performance analytics", 
                           "message", e.getMessage()));
        }
    }

    /**
     * Get hiring trends analysis including monthly patterns, department trends,
     * position analysis, and seasonal patterns
     */
    @GetMapping("/hiring-trends")
    public ResponseEntity<Map<String, Object>> getHiringTrendsAnalysis() {
        try {
            Map<String, Object> trends = performanceAnalyticsService.getHiringTrendsAnalysis();
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve hiring trends analysis", 
                           "message", e.getMessage()));
        }
    }

    /**
     * Get candidate quality metrics including quality distribution, skills gap analysis,
     * experience breakdown, and education trends
     */
    @GetMapping("/candidate-quality")
    public ResponseEntity<Map<String, Object>> getCandidateQualityMetrics() {
        try {
            Map<String, Object> quality = performanceAnalyticsService.getCandidateQualityMetrics();
            return ResponseEntity.ok(quality);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve candidate quality metrics", 
                           "message", e.getMessage()));
        }
    }

    /**
     * Get recruitment efficiency metrics including bottlenecks, stage durations,
     * automation impact, and resource utilization
     */
    @GetMapping("/efficiency-metrics")
    public ResponseEntity<Map<String, Object>> getRecruitmentEfficiencyMetrics() {
        try {
            Map<String, Object> efficiency = performanceAnalyticsService.getRecruitmentEfficiencyMetrics();
            return ResponseEntity.ok(efficiency);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve efficiency metrics", 
                           "message", e.getMessage()));
        }
    }

    /**
     * Get comprehensive dashboard data combining key metrics from all categories
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getPerformanceDashboard() {
        try {
            Map<String, Object> dashboard = Map.of(
                "recruitmentMetrics", performanceAnalyticsService.getRecruitmentMetrics(),
                "interviewPerformance", performanceAnalyticsService.getInterviewPerformanceAnalytics(),
                "hiringTrends", performanceAnalyticsService.getHiringTrendsAnalysis(),
                "candidateQuality", performanceAnalyticsService.getCandidateQualityMetrics(),
                "efficiencyMetrics", performanceAnalyticsService.getRecruitmentEfficiencyMetrics()
            );
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve performance dashboard data", 
                           "message", e.getMessage()));
        }
    }

    /**
     * Get key performance indicators (KPIs) for executive reporting
     */
    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKeyPerformanceIndicators() {
        try {
            Map<String, Object> recruitmentMetrics = performanceAnalyticsService.getRecruitmentMetrics();
            Map<String, Object> interviewAnalytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
            Map<String, Object> efficiencyMetrics = performanceAnalyticsService.getRecruitmentEfficiencyMetrics();

            Map<String, Object> kpis = Map.of(
                "timeToHire", ((Map<String, Object>) recruitmentMetrics.get("timeToHire")).get("averageDays"),
                "costPerHire", ((Map<String, Object>) recruitmentMetrics.get("costMetrics")).get("costPerHire"),
                "overallConversionRate", ((Map<String, Object>) recruitmentMetrics.get("conversionRates")).get("overallConversion"),
                "interviewCompletionRate", ((Map<String, Object>) interviewAnalytics.get("schedulingMetrics")).get("completionRate"),
                "averageInterviewRating", ((Map<String, Object>) interviewAnalytics.get("feedbackTrends")).get("averageOverallRating"),
                "processEfficiency", ((Map<String, Object>) ((Map<String, Object>) efficiencyMetrics.get("resourceMetrics")).get("metrics")).get("processEfficiency")
            );

            return ResponseEntity.ok(kpis);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve KPIs", 
                           "message", e.getMessage()));
        }
    }

    /**
     * Get real-time performance summary for monitoring
     */
    @GetMapping("/real-time-summary")
    public ResponseEntity<Map<String, Object>> getRealTimeSummary() {
        try {
            Map<String, Object> recruitmentMetrics = performanceAnalyticsService.getRecruitmentMetrics();
            Map<String, Object> interviewAnalytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
            
            Map<String, Object> timeToHire = (Map<String, Object>) recruitmentMetrics.get("timeToHire");
            Map<String, Object> conversionRates = (Map<String, Object>) recruitmentMetrics.get("conversionRates");
            Map<String, Object> schedulingMetrics = (Map<String, Object>) interviewAnalytics.get("schedulingMetrics");
            Map<String, Object> feedbackTrends = (Map<String, Object>) interviewAnalytics.get("feedbackTrends");

            Map<String, Object> summary = Map.of(
                "activeMetrics", Map.of(
                    "avgTimeToHire", timeToHire.get("averageDays"),
                    "overallConversionRate", conversionRates.get("overallConversion"),
                    "totalInterviews", schedulingMetrics.get("totalInterviews"),
                    "interviewCompletionRate", schedulingMetrics.get("completionRate")
                ),
                "qualityMetrics", Map.of(
                    "averageRating", feedbackTrends.get("averageOverallRating"),
                    "averageTechnicalScore", feedbackTrends.get("averageTechnicalScore"),
                    "averageCommunicationScore", feedbackTrends.get("averageCommunicationScore"),
                    "averageCulturalScore", feedbackTrends.get("averageCulturalScore")
                ),
                "timestamp", java.time.LocalDateTime.now()
            );

            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to retrieve real-time summary", 
                           "message", e.getMessage()));
        }
    }
}
