package com.arthmatic.shumelahire.service.analytics;

import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Engagement analytics service.
 * Currently returns mock data — Glue tables for surveys, recognitions,
 * and sentiment data are not yet in the analytics pipeline. Once those entities
 * flow through DynamoDB Streams → S3, the mock data will be replaced with real Athena queries.
 */
@Service
@Transactional(readOnly = true)
public class EngagementAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(EngagementAnalyticsService.class);

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private AthenaQueryService athenaQueryService;

    public Map<String, Object> getEngagementMetrics() {
        logger.info("Computing engagement analytics");
        auditLogService.logSystemAction("VIEW", "ENGAGEMENT_ANALYTICS", "Engagement metrics requested");

        // No Glue tables for engagement entities yet — return mock data.
        // When surveys, recognitions, and sentiment_responses tables are added
        // to the analytics pipeline, this method will query Athena.
        return getEngagementMetricsMock();
    }

    private Map<String, Object> getEngagementMetricsMock() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("overallEngagementScore", 7.4);
        summary.put("eNPSScore", 32);
        summary.put("surveyParticipationRate", 82.5);
        summary.put("totalSurveysCompleted", 268);
        summary.put("totalRecognitionsGiven", 456);
        summary.put("recognitionsThisMonth", 38);
        summary.put("averageSentimentScore", 3.8);
        metrics.put("summary", summary);

        metrics.put("surveyParticipation", List.of(
                Map.of("department", "Engineering", "invitedCount", 95, "respondedCount", 82, "participationRate", 86.3),
                Map.of("department", "Sales", "invitedCount", 62, "respondedCount", 48, "participationRate", 77.4),
                Map.of("department", "Marketing", "invitedCount", 38, "respondedCount", 33, "participationRate", 86.8),
                Map.of("department", "Human Resources", "invitedCount", 22, "respondedCount", 21, "participationRate", 95.5),
                Map.of("department", "Finance", "invitedCount", 35, "respondedCount", 30, "participationRate", 85.7),
                Map.of("department", "Operations", "invitedCount", 48, "respondedCount", 36, "participationRate", 75.0),
                Map.of("department", "Customer Support", "invitedCount", 42, "respondedCount", 32, "participationRate", 76.2)
        ));

        Map<String, Object> recognition = new LinkedHashMap<>();
        recognition.put("totalRecognitions", 456);
        recognition.put("topRecognitionCategories", List.of(
                Map.of("category", "Teamwork", "count", 125),
                Map.of("category", "Innovation", "count", 98),
                Map.of("category", "Customer Focus", "count", 87),
                Map.of("category", "Leadership", "count", 72),
                Map.of("category", "Going Above & Beyond", "count", 74)
        ));
        recognition.put("topRecognizedEmployees", List.of(
                Map.of("employeeName", "Sarah Johnson", "department", "Engineering", "recognitionsReceived", 12),
                Map.of("employeeName", "Michael Chen", "department", "Sales", "recognitionsReceived", 10),
                Map.of("employeeName", "Amara Okafor", "department", "Customer Support", "recognitionsReceived", 9),
                Map.of("employeeName", "David Smith", "department", "Operations", "recognitionsReceived", 8),
                Map.of("employeeName", "Lisa Mbeki", "department", "Marketing", "recognitionsReceived", 8)
        ));
        metrics.put("recognition", recognition);

        metrics.put("engagementTrends", List.of(
                Map.of("quarter", "Q1 2024", "engagementScore", 7.1, "eNPS", 28, "participationRate", 78.0),
                Map.of("quarter", "Q2 2024", "engagementScore", 7.3, "eNPS", 30, "participationRate", 80.5),
                Map.of("quarter", "Q3 2024", "engagementScore", 7.2, "eNPS", 29, "participationRate", 81.0),
                Map.of("quarter", "Q4 2024", "engagementScore", 7.4, "eNPS", 32, "participationRate", 82.5)
        ));

        metrics.put("engagementDrivers", List.of(
                Map.of("driver", "Work-Life Balance", "score", 7.8, "trend", "UP"),
                Map.of("driver", "Career Growth", "score", 6.9, "trend", "STABLE"),
                Map.of("driver", "Management Quality", "score", 7.5, "trend", "UP"),
                Map.of("driver", "Compensation & Benefits", "score", 6.5, "trend", "DOWN"),
                Map.of("driver", "Team Collaboration", "score", 8.0, "trend", "UP"),
                Map.of("driver", "Company Culture", "score", 7.6, "trend", "STABLE")
        ));

        return metrics;
    }
}
