package com.arthmatic.shumelahire.service.integration.lms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Mock LMS connector implementation for development and testing.
 * Returns simulated course and enrollment data.
 */
@Service
@ConditionalOnProperty(name = "lms.enabled", matchIfMissing = true)
public class MockLmsConnector implements LmsConnector {

    private static final Logger logger = LoggerFactory.getLogger(MockLmsConnector.class);

    @Override
    public boolean testConnection(String baseUrl, String apiKey) {
        logger.info("Testing mock LMS connection to: {}", baseUrl);
        // Simulate connection test - always succeeds for mock
        if (baseUrl == null || baseUrl.isBlank()) {
            logger.warn("LMS base URL is blank, connection test failed");
            return false;
        }
        try {
            // Simulate a brief delay
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        logger.info("Mock LMS connection test successful for: {}", baseUrl);
        return true;
    }

    @Override
    public List<Map<String, Object>> syncCourses(String baseUrl, String apiKey) {
        logger.info("Syncing mock courses from LMS: {}", baseUrl);

        List<Map<String, Object>> courses = new ArrayList<>();

        courses.add(Map.of(
                "externalId", "LMS-C001",
                "title", "Introduction to Leadership",
                "category", "Management",
                "duration", "8 hours",
                "status", "published"
        ));
        courses.add(Map.of(
                "externalId", "LMS-C002",
                "title", "Data Privacy Essentials",
                "category", "Compliance",
                "duration", "4 hours",
                "status", "published"
        ));
        courses.add(Map.of(
                "externalId", "LMS-C003",
                "title", "Project Management Professional Prep",
                "category", "Professional Development",
                "duration", "40 hours",
                "status", "published"
        ));
        courses.add(Map.of(
                "externalId", "LMS-C004",
                "title", "Cybersecurity Awareness 2025",
                "category", "IT & Security",
                "duration", "3 hours",
                "status", "published"
        ));
        courses.add(Map.of(
                "externalId", "LMS-C005",
                "title", "Effective Communication Workshop",
                "category", "Soft Skills",
                "duration", "6 hours",
                "status", "draft"
        ));
        courses.add(Map.of(
                "externalId", "LMS-C006",
                "title", "Advanced Excel for HR Professionals",
                "category", "Technical",
                "duration", "12 hours",
                "status", "published"
        ));
        courses.add(Map.of(
                "externalId", "LMS-C007",
                "title", "Diversity and Inclusion Training",
                "category", "HR & Culture",
                "duration", "5 hours",
                "status", "published"
        ));
        courses.add(Map.of(
                "externalId", "LMS-C008",
                "title", "First Aid & Workplace Safety",
                "category", "Health & Safety",
                "duration", "16 hours",
                "status", "published"
        ));

        logger.info("Mock LMS sync returned {} courses", courses.size());
        return courses;
    }

    @Override
    public List<Map<String, Object>> syncEnrollments(String baseUrl, String apiKey) {
        logger.info("Syncing mock enrollments from LMS: {}", baseUrl);

        List<Map<String, Object>> enrollments = new ArrayList<>();

        enrollments.add(Map.of(
                "courseId", "LMS-C001",
                "employeeEmail", "sarah.johnson@example.com",
                "enrolledAt", "2024-11-01",
                "completedAt", "2024-12-15",
                "score", 88,
                "status", "completed"
        ));
        enrollments.add(Map.of(
                "courseId", "LMS-C002",
                "employeeEmail", "michael.chen@example.com",
                "enrolledAt", "2024-12-01",
                "completedAt", "",
                "score", 0,
                "status", "in_progress"
        ));
        enrollments.add(Map.of(
                "courseId", "LMS-C003",
                "employeeEmail", "amara.okafor@example.com",
                "enrolledAt", "2025-01-05",
                "completedAt", "",
                "score", 0,
                "status", "in_progress"
        ));
        enrollments.add(Map.of(
                "courseId", "LMS-C004",
                "employeeEmail", "david.smith@example.com",
                "enrolledAt", "2024-10-15",
                "completedAt", "2024-10-20",
                "score", 95,
                "status", "completed"
        ));
        enrollments.add(Map.of(
                "courseId", "LMS-C007",
                "employeeEmail", "lisa.mbeki@example.com",
                "enrolledAt", "2025-01-10",
                "completedAt", "2025-01-18",
                "score", 91,
                "status", "completed"
        ));

        logger.info("Mock LMS sync returned {} enrollments", enrollments.size());
        return enrollments;
    }
}
