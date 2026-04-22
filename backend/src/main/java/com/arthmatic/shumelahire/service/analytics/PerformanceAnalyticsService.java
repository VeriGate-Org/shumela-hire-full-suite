package com.arthmatic.shumelahire.service.analytics;

import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class PerformanceAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceAnalyticsService.class);

    @Autowired
    private AuditLogService auditLogService;

    public Map<String, Object> getPerformanceMetrics() {
        logger.info("Computing performance analytics");
        auditLogService.logSystemAction("VIEW", "PERFORMANCE_ANALYTICS", "Performance metrics requested");

        Map<String, Object> metrics = new LinkedHashMap<>();

        // Summary stats
        metrics.put("averageRating", 3.7);
        metrics.put("reviewCompletionRate", 78.5);
        metrics.put("goalAchievementRate", 72.3);
        metrics.put("activePips", 3);
        metrics.put("totalReviews", 45);
        metrics.put("completedReviews", 35);

        // Average rating by department
        List<Map<String, Object>> ratingByDept = new ArrayList<>();
        ratingByDept.add(Map.of("department", "Water Operations", "avgRating", 3.9, "count", 12));
        ratingByDept.add(Map.of("department", "Finance", "avgRating", 3.5, "count", 8));
        ratingByDept.add(Map.of("department", "Human Resources", "avgRating", 4.1, "count", 6));
        ratingByDept.add(Map.of("department", "IT & Systems", "avgRating", 3.8, "count", 5));
        ratingByDept.add(Map.of("department", "Engineering", "avgRating", 3.6, "count", 9));
        ratingByDept.add(Map.of("department", "Administration", "avgRating", 3.4, "count", 5));
        metrics.put("avgRatingByDepartment", ratingByDept);

        // Rating distribution (1-5)
        List<Map<String, Object>> ratingDist = new ArrayList<>();
        ratingDist.add(Map.of("name", "1 - Poor", "value", 2));
        ratingDist.add(Map.of("name", "2 - Below Average", "value", 5));
        ratingDist.add(Map.of("name", "3 - Meets Expectations", "value", 18));
        ratingDist.add(Map.of("name", "4 - Exceeds", "value", 12));
        ratingDist.add(Map.of("name", "5 - Outstanding", "value", 8));
        metrics.put("ratingDistribution", ratingDist);

        // Review status breakdown
        List<Map<String, Object>> statusBreakdown = new ArrayList<>();
        statusBreakdown.add(Map.of("name", "Pending", "value", 10));
        statusBreakdown.add(Map.of("name", "Employee Submitted", "value", 8));
        statusBreakdown.add(Map.of("name", "Manager Submitted", "value", 5));
        statusBreakdown.add(Map.of("name", "Completed", "value", 35));
        metrics.put("reviewStatusBreakdown", statusBreakdown);

        // Top performers
        List<Map<String, Object>> topPerformers = new ArrayList<>();
        topPerformers.add(Map.of("name", "Nomvula Dlamini", "department", "Human Resources", "rating", 4.8, "role", "HR Manager"));
        topPerformers.add(Map.of("name", "Sipho Mthembu", "department", "Water Operations", "rating", 4.7, "role", "Operations Manager"));
        topPerformers.add(Map.of("name", "Thabo Nkosi", "department", "Engineering", "rating", 4.5, "role", "Senior Engineer"));
        topPerformers.add(Map.of("name", "Zanele Khumalo", "department", "Finance", "rating", 4.4, "role", "Financial Analyst"));
        topPerformers.add(Map.of("name", "Ayanda Mkhize", "department", "IT & Systems", "rating", 4.3, "role", "Systems Administrator"));
        topPerformers.add(Map.of("name", "Johan van der Merwe", "department", "Water Operations", "rating", 4.2, "role", "Plant Supervisor"));
        topPerformers.add(Map.of("name", "Lindiwe Ngcobo", "department", "Administration", "rating", 4.1, "role", "Office Manager"));
        topPerformers.add(Map.of("name", "Pieter Botha", "department", "Engineering", "rating", 4.0, "role", "Civil Engineer"));
        topPerformers.add(Map.of("name", "Bongani Zulu", "department", "Water Operations", "rating", 3.9, "role", "Water Technician"));
        topPerformers.add(Map.of("name", "Mandla Cele", "department", "Finance", "rating", 3.8, "role", "Accountant"));
        metrics.put("topPerformers", topPerformers);

        // PIP stats
        Map<String, Object> pipStats = new LinkedHashMap<>();
        pipStats.put("active", 3);
        pipStats.put("completedSuccessfully", 5);
        pipStats.put("terminated", 1);
        pipStats.put("averageDurationDays", 67);
        metrics.put("pipStats", pipStats);

        return metrics;
    }
}
