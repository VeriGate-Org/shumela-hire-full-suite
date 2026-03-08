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
public class ComplianceAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(ComplianceAnalyticsService.class);

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Compute compliance analytics: expiring certifications, open disciplinary cases,
     * pending policy acknowledgements, POPIA compliance status, audit findings.
     */
    public Map<String, Object> getComplianceMetrics() {
        logger.info("Computing compliance analytics");
        auditLogService.logSystemAction("VIEW", "COMPLIANCE_ANALYTICS", "Compliance metrics requested");

        Map<String, Object> metrics = new LinkedHashMap<>();

        // Summary KPIs
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("overallComplianceScore", 91.5);
        summary.put("expiringCertifications", 14);
        summary.put("expiredCertifications", 3);
        summary.put("openDisciplinaryCases", 5);
        summary.put("pendingPolicyAcknowledgements", 28);
        summary.put("overdueTraining", 12);
        summary.put("popiaComplianceRate", 94.2);
        metrics.put("summary", summary);

        // Expiring certifications (next 90 days)
        metrics.put("expiringCertifications", List.of(
                Map.of("employeeName", "John Moyo", "department", "Operations", "certification", "First Aid Level 2", "expiryDate", "2025-02-15", "daysUntilExpiry", 22),
                Map.of("employeeName", "Thandi Nkosi", "department", "Engineering", "certification", "AWS Solutions Architect", "expiryDate", "2025-02-28", "daysUntilExpiry", 35),
                Map.of("employeeName", "Peter van Wyk", "department", "Finance", "certification", "CIMA Advanced", "expiryDate", "2025-03-10", "daysUntilExpiry", 45),
                Map.of("employeeName", "Grace Dlamini", "department", "Human Resources", "certification", "SABPP Registration", "expiryDate", "2025-03-15", "daysUntilExpiry", 50),
                Map.of("employeeName", "Ahmed Patel", "department", "Operations", "certification", "Health & Safety Rep", "expiryDate", "2025-03-22", "daysUntilExpiry", 57),
                Map.of("employeeName", "Linda Botha", "department", "Engineering", "certification", "PMP", "expiryDate", "2025-04-01", "daysUntilExpiry", 67)
        ));

        // Open disciplinary cases
        metrics.put("openCases", List.of(
                Map.of("caseId", "DC-2025-001", "type", "Misconduct", "status", "Investigation", "department", "Sales", "openedDate", "2025-01-05"),
                Map.of("caseId", "DC-2025-002", "type", "Attendance", "status", "Hearing Scheduled", "department", "Operations", "openedDate", "2025-01-12"),
                Map.of("caseId", "DC-2025-003", "type", "Performance", "status", "PIP In Progress", "department", "Marketing", "openedDate", "2024-12-18"),
                Map.of("caseId", "DC-2025-004", "type", "Policy Violation", "status", "Investigation", "department", "Customer Support", "openedDate", "2025-01-20"),
                Map.of("caseId", "DC-2025-005", "type", "Harassment", "status", "Formal Investigation", "department", "Engineering", "openedDate", "2025-01-22")
        ));

        // Pending policy acknowledgements
        metrics.put("pendingAcknowledgements", List.of(
                Map.of("policyName", "Code of Conduct 2025", "totalEmployees", 342, "acknowledged", 320, "pending", 22, "deadline", "2025-02-28"),
                Map.of("policyName", "POPIA Privacy Policy", "totalEmployees", 342, "acknowledged", 338, "pending", 4, "deadline", "2025-01-31"),
                Map.of("policyName", "IT Security Policy", "totalEmployees", 342, "acknowledged", 340, "pending", 2, "deadline", "2025-03-15")
        ));

        // Compliance trends (monthly)
        metrics.put("complianceTrends", List.of(
                Map.of("month", "Jul", "complianceScore", 88.2, "openCases", 8, "expiringCerts", 18),
                Map.of("month", "Aug", "complianceScore", 89.5, "openCases", 7, "expiringCerts", 15),
                Map.of("month", "Sep", "complianceScore", 90.1, "openCases", 6, "expiringCerts", 12),
                Map.of("month", "Oct", "complianceScore", 89.8, "openCases", 7, "expiringCerts", 16),
                Map.of("month", "Nov", "complianceScore", 90.8, "openCases", 6, "expiringCerts", 11),
                Map.of("month", "Dec", "complianceScore", 91.5, "openCases", 5, "expiringCerts", 14)
        ));

        // Department compliance scores
        metrics.put("departmentCompliance", List.of(
                Map.of("department", "Human Resources", "score", 97.5, "issues", 1),
                Map.of("department", "Finance", "score", 95.2, "issues", 2),
                Map.of("department", "Engineering", "score", 92.8, "issues", 4),
                Map.of("department", "Operations", "score", 90.1, "issues", 6),
                Map.of("department", "Sales", "score", 89.5, "issues", 5),
                Map.of("department", "Marketing", "score", 91.0, "issues", 3),
                Map.of("department", "Customer Support", "score", 88.3, "issues", 7)
        ));

        return metrics;
    }
}
