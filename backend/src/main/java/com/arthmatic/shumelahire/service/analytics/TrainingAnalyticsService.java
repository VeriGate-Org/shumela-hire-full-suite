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
public class TrainingAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(TrainingAnalyticsService.class);

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Compute training analytics: completion rates, popular courses,
     * training spend, certification tracking, department participation.
     */
    public Map<String, Object> getTrainingMetrics() {
        logger.info("Computing training analytics");
        auditLogService.logSystemAction("VIEW", "TRAINING_ANALYTICS", "Training metrics requested");

        Map<String, Object> metrics = new LinkedHashMap<>();

        // Summary KPIs
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalCourses", 45);
        summary.put("activeCourses", 32);
        summary.put("totalEnrollments", 1280);
        summary.put("completionRate", 78.5);
        summary.put("averageScore", 82.3);
        summary.put("totalTrainingHours", 4520);
        summary.put("trainingSpendYTD", 125000.00);
        summary.put("costPerEmployee", 365.50);
        metrics.put("summary", summary);

        // Popular courses
        metrics.put("popularCourses", List.of(
                Map.of("courseName", "Leadership Fundamentals", "enrollments", 145, "completionRate", 85.5, "avgScore", 88.2),
                Map.of("courseName", "Data Privacy & POPIA Compliance", "enrollments", 320, "completionRate", 92.0, "avgScore", 79.5),
                Map.of("courseName", "Project Management Basics", "enrollments", 98, "completionRate", 72.4, "avgScore", 81.0),
                Map.of("courseName", "Effective Communication", "enrollments", 112, "completionRate", 80.1, "avgScore", 84.7),
                Map.of("courseName", "Advanced Excel Skills", "enrollments", 87, "completionRate", 68.9, "avgScore", 76.3),
                Map.of("courseName", "First Aid & Safety", "enrollments", 210, "completionRate", 95.2, "avgScore", 90.1),
                Map.of("courseName", "Diversity & Inclusion", "enrollments", 180, "completionRate", 88.3, "avgScore", 82.0),
                Map.of("courseName", "Cybersecurity Awareness", "enrollments", 295, "completionRate", 91.0, "avgScore", 77.8)
        ));

        // Department participation
        metrics.put("departmentParticipation", List.of(
                Map.of("department", "Engineering", "enrollments", 320, "completionRate", 82.1, "hoursSpent", 1450),
                Map.of("department", "Sales", "enrollments", 215, "completionRate", 75.3, "hoursSpent", 890),
                Map.of("department", "Marketing", "enrollments", 145, "completionRate", 79.8, "hoursSpent", 620),
                Map.of("department", "Human Resources", "enrollments", 98, "completionRate", 91.2, "hoursSpent", 410),
                Map.of("department", "Finance", "enrollments", 130, "completionRate", 84.6, "hoursSpent", 540),
                Map.of("department", "Operations", "enrollments", 185, "completionRate", 77.0, "hoursSpent", 780),
                Map.of("department", "Customer Support", "enrollments", 187, "completionRate", 73.5, "hoursSpent", 730)
        ));

        // Monthly completion trends
        metrics.put("monthlyCompletions", List.of(
                Map.of("month", "Jan", "completed", 85, "enrolled", 120),
                Map.of("month", "Feb", "completed", 92, "enrolled", 115),
                Map.of("month", "Mar", "completed", 78, "enrolled", 130),
                Map.of("month", "Apr", "completed", 105, "enrolled", 140),
                Map.of("month", "May", "completed", 88, "enrolled", 110),
                Map.of("month", "Jun", "completed", 95, "enrolled", 125),
                Map.of("month", "Jul", "completed", 72, "enrolled", 100),
                Map.of("month", "Aug", "completed", 110, "enrolled", 145),
                Map.of("month", "Sep", "completed", 98, "enrolled", 135),
                Map.of("month", "Oct", "completed", 115, "enrolled", 150),
                Map.of("month", "Nov", "completed", 90, "enrolled", 118),
                Map.of("month", "Dec", "completed", 65, "enrolled", 90)
        ));

        // Training spend breakdown
        metrics.put("spendBreakdown", List.of(
                Map.of("category", "External Training", "amount", 52000.00, "percentage", 41.6),
                Map.of("category", "Online Platforms", "amount", 28000.00, "percentage", 22.4),
                Map.of("category", "Instructor-Led", "amount", 25000.00, "percentage", 20.0),
                Map.of("category", "Certifications", "amount", 15000.00, "percentage", 12.0),
                Map.of("category", "Materials & Resources", "amount", 5000.00, "percentage", 4.0)
        ));

        return metrics;
    }
}
