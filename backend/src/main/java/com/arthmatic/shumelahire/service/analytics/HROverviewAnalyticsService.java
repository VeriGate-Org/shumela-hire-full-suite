package com.arthmatic.shumelahire.service.analytics;

import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class HROverviewAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(HROverviewAnalyticsService.class);

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Compute HR overview metrics: headcount, turnover rate, average tenure,
     * department distribution, gender split, employment type breakdown.
     * Returns mock/sample data as upstream tables may not be populated yet.
     */
    public Map<String, Object> getOverviewMetrics() {
        logger.info("Computing HR overview analytics");
        auditLogService.logSystemAction("VIEW", "HR_ANALYTICS", "HR overview metrics requested");

        Map<String, Object> metrics = new LinkedHashMap<>();

        // Headcount summary
        Map<String, Object> headcount = new LinkedHashMap<>();
        headcount.put("totalEmployees", 342);
        headcount.put("activeEmployees", 318);
        headcount.put("onLeave", 14);
        headcount.put("onProbation", 10);
        headcount.put("newHiresThisMonth", 8);
        headcount.put("terminationsThisMonth", 3);
        metrics.put("headcount", headcount);

        // Turnover rate
        Map<String, Object> turnover = new LinkedHashMap<>();
        turnover.put("annualTurnoverRate", 12.5);
        turnover.put("voluntaryTurnoverRate", 8.2);
        turnover.put("involuntaryTurnoverRate", 4.3);
        turnover.put("monthlyTurnoverRates", List.of(
                Map.of("month", "Jan", "rate", 1.2),
                Map.of("month", "Feb", "rate", 0.9),
                Map.of("month", "Mar", "rate", 1.5),
                Map.of("month", "Apr", "rate", 0.8),
                Map.of("month", "May", "rate", 1.1),
                Map.of("month", "Jun", "rate", 1.3),
                Map.of("month", "Jul", "rate", 0.7),
                Map.of("month", "Aug", "rate", 1.0),
                Map.of("month", "Sep", "rate", 1.4),
                Map.of("month", "Oct", "rate", 0.6),
                Map.of("month", "Nov", "rate", 1.1),
                Map.of("month", "Dec", "rate", 0.9)
        ));
        metrics.put("turnover", turnover);

        // Average tenure
        Map<String, Object> tenure = new LinkedHashMap<>();
        tenure.put("averageTenureYears", 3.8);
        tenure.put("medianTenureYears", 2.9);
        tenure.put("tenureBands", List.of(
                Map.of("band", "< 1 year", "count", 52),
                Map.of("band", "1-2 years", "count", 78),
                Map.of("band", "2-5 years", "count", 112),
                Map.of("band", "5-10 years", "count", 64),
                Map.of("band", "10+ years", "count", 36)
        ));
        metrics.put("tenure", tenure);

        // Department distribution
        metrics.put("departmentDistribution", List.of(
                Map.of("department", "Engineering", "count", 95, "percentage", 27.8),
                Map.of("department", "Sales", "count", 62, "percentage", 18.1),
                Map.of("department", "Marketing", "count", 38, "percentage", 11.1),
                Map.of("department", "Human Resources", "count", 22, "percentage", 6.4),
                Map.of("department", "Finance", "count", 35, "percentage", 10.2),
                Map.of("department", "Operations", "count", 48, "percentage", 14.0),
                Map.of("department", "Customer Support", "count", 42, "percentage", 12.3)
        ));

        // Employment type breakdown
        metrics.put("employmentTypes", List.of(
                Map.of("type", "Full-Time", "count", 280, "percentage", 81.9),
                Map.of("type", "Part-Time", "count", 28, "percentage", 8.2),
                Map.of("type", "Contract", "count", 22, "percentage", 6.4),
                Map.of("type", "Intern", "count", 12, "percentage", 3.5)
        ));

        // Gender split
        metrics.put("genderDistribution", List.of(
                Map.of("gender", "Male", "count", 185, "percentage", 54.1),
                Map.of("gender", "Female", "count", 148, "percentage", 43.3),
                Map.of("gender", "Non-Binary", "count", 9, "percentage", 2.6)
        ));

        // Summary KPIs
        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("costPerHire", 4250.00);
        kpis.put("timeToFillDays", 34);
        kpis.put("offerAcceptanceRate", 87.5);
        kpis.put("employeeSatisfactionScore", 7.8);
        metrics.put("kpis", kpis);

        return metrics;
    }
}
