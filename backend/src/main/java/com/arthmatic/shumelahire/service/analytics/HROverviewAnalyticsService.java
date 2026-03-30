package com.arthmatic.shumelahire.service.analytics;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class HROverviewAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(HROverviewAnalyticsService.class);

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private AthenaQueryService athenaQueryService;

    public Map<String, Object> getOverviewMetrics() {
        logger.info("Computing HR overview analytics");
        auditLogService.logSystemAction("VIEW", "HR_ANALYTICS", "HR overview metrics requested");

        if (useAthena()) {
            try {
                return getOverviewMetricsFromAthena();
            } catch (Exception e) {
                logger.warn("Athena query failed, falling back to mock data: {}", e.getMessage());
            }
        }

        return getOverviewMetricsMock();
    }

    private Map<String, Object> getOverviewMetricsFromAthena() {
        String tenantId = TenantContext.requireCurrentTenant();
        Map<String, String> params = Map.of("tenantId", tenantId);
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        LocalDate yearStart = LocalDate.now().withDayOfYear(1);

        Map<String, Object> metrics = new LinkedHashMap<>();

        // Headcount from employee status counts
        Map<String, Object> headcount = new LinkedHashMap<>();
        List<Map<String, String>> statusRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.EMPLOYEE_HEADCOUNT, params);

        int total = 0;
        int active = 0;
        int onLeave = 0;
        int onProbation = 0;
        for (Map<String, String> row : statusRows) {
            int cnt = parseInt(row.get("cnt"));
            String status = row.getOrDefault("status", "");
            total += cnt;
            switch (status.toUpperCase()) {
                case "ACTIVE" -> active = cnt;
                case "ON_LEAVE" -> onLeave = cnt;
                case "PROBATION" -> onProbation = cnt;
            }
        }
        headcount.put("totalEmployees", total);
        headcount.put("activeEmployees", active);
        headcount.put("onLeave", onLeave);
        headcount.put("onProbation", onProbation);

        // New hires this month
        List<Map<String, String>> newHires = athenaQueryService.executeQuery(
                AthenaQueryTemplates.EMPLOYEE_NEW_HIRES,
                Map.of("tenantId", tenantId, "startDate", monthStart.toString()));
        headcount.put("newHiresThisMonth", newHires.isEmpty() ? 0 : parseInt(newHires.get(0).get("cnt")));

        // Terminations this month
        List<Map<String, String>> terminations = athenaQueryService.executeQuery(
                AthenaQueryTemplates.EMPLOYEE_TERMINATIONS_PERIOD,
                Map.of("tenantId", tenantId, "startDate", monthStart.toString()));
        headcount.put("terminationsThisMonth", terminations.isEmpty() ? 0 : parseInt(terminations.get(0).get("cnt")));

        metrics.put("headcount", headcount);

        // Turnover — monthly rates for the last 12 months
        Map<String, Object> turnover = new LinkedHashMap<>();
        LocalDate twelveMonthsAgo = LocalDate.now().minusMonths(12);
        List<Map<String, String>> turnoverRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.EMPLOYEE_MONTHLY_TURNOVER,
                Map.of("tenantId", tenantId, "startDate", twelveMonthsAgo.toString()));

        int totalTerminations = 0;
        List<Map<String, Object>> monthlyRates = new ArrayList<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM");
        for (Map<String, String> row : turnoverRows) {
            int mo = parseInt(row.get("mo"));
            int yr = parseInt(row.get("yr"));
            int terms = parseInt(row.get("terminations"));
            totalTerminations += terms;
            double rate = total > 0 ? (terms * 100.0 / total) : 0;
            LocalDate monthDate = LocalDate.of(yr, mo, 1);
            monthlyRates.add(Map.of("month", monthDate.format(monthFmt), "rate", Math.round(rate * 10) / 10.0));
        }
        double annualRate = total > 0 ? (totalTerminations * 100.0 / total) : 0;
        turnover.put("annualTurnoverRate", Math.round(annualRate * 10) / 10.0);
        turnover.put("monthlyTurnoverRates", monthlyRates);
        metrics.put("turnover", turnover);

        // Tenure bands
        Map<String, Object> tenure = new LinkedHashMap<>();
        List<Map<String, String>> tenureBands = athenaQueryService.executeQuery(
                AthenaQueryTemplates.EMPLOYEE_TENURE_BANDS, params);
        List<Map<String, Object>> tenureBandList = new ArrayList<>();
        for (Map<String, String> row : tenureBands) {
            tenureBandList.add(Map.of("band", row.getOrDefault("band", "Unknown"), "count", parseInt(row.get("cnt"))));
        }
        tenure.put("tenureBands", tenureBandList);
        metrics.put("tenure", tenure);

        // Department distribution
        List<Map<String, String>> deptRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.EMPLOYEE_DEPARTMENT_DISTRIBUTION, params);
        Map<String, Integer> deptCounts = new LinkedHashMap<>();
        for (Map<String, String> row : deptRows) {
            String dept = row.getOrDefault("departmentId", "Unknown");
            deptCounts.merge(dept, parseInt(row.get("cnt")), Integer::sum);
        }
        List<Map<String, Object>> deptDist = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : deptCounts.entrySet()) {
            double pct = total > 0 ? Math.round(entry.getValue() * 1000.0 / total) / 10.0 : 0;
            deptDist.add(Map.of("department", entry.getKey(), "count", entry.getValue(), "percentage", pct));
        }
        metrics.put("departmentDistribution", deptDist);

        // Employment type breakdown
        List<Map<String, String>> empTypeRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.EMPLOYEE_EMPLOYMENT_TYPE_DISTRIBUTION, params);
        int activeTotal = active > 0 ? active : total;
        List<Map<String, Object>> empTypes = new ArrayList<>();
        for (Map<String, String> row : empTypeRows) {
            int cnt = parseInt(row.get("cnt"));
            double pct = activeTotal > 0 ? Math.round(cnt * 1000.0 / activeTotal) / 10.0 : 0;
            empTypes.add(Map.of("type", row.getOrDefault("employmentType", "Unknown"), "count", cnt, "percentage", pct));
        }
        metrics.put("employmentTypes", empTypes);

        // KPIs from recruitment metrics
        Map<String, Object> kpis = new LinkedHashMap<>();
        try {
            List<Map<String, String>> costPerHire = athenaQueryService.executeQuery(
                    AthenaQueryTemplates.METRIC_BY_DEPARTMENT,
                    Map.of("tenantId", tenantId, "metricName", "COST_PER_HIRE", "startDate", yearStart.toString()));
            double avgCost = costPerHire.stream()
                    .mapToDouble(r -> parseDouble(r.get("avg_value")))
                    .average().orElse(0);
            kpis.put("costPerHire", Math.round(avgCost * 100) / 100.0);

            List<Map<String, String>> timeToFill = athenaQueryService.executeQuery(
                    AthenaQueryTemplates.METRIC_BY_DEPARTMENT,
                    Map.of("tenantId", tenantId, "metricName", "TIME_TO_FILL", "startDate", yearStart.toString()));
            double avgTtf = timeToFill.stream()
                    .mapToDouble(r -> parseDouble(r.get("avg_value")))
                    .average().orElse(0);
            kpis.put("timeToFillDays", (int) Math.round(avgTtf));
        } catch (Exception e) {
            logger.debug("Could not fetch KPI metrics from Athena: {}", e.getMessage());
        }
        metrics.put("kpis", kpis);

        return metrics;
    }

    private Map<String, Object> getOverviewMetricsMock() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        Map<String, Object> headcount = new LinkedHashMap<>();
        headcount.put("totalEmployees", 342);
        headcount.put("activeEmployees", 318);
        headcount.put("onLeave", 14);
        headcount.put("onProbation", 10);
        headcount.put("newHiresThisMonth", 8);
        headcount.put("terminationsThisMonth", 3);
        metrics.put("headcount", headcount);

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

        metrics.put("departmentDistribution", List.of(
                Map.of("department", "Engineering", "count", 95, "percentage", 27.8),
                Map.of("department", "Sales", "count", 62, "percentage", 18.1),
                Map.of("department", "Marketing", "count", 38, "percentage", 11.1),
                Map.of("department", "Human Resources", "count", 22, "percentage", 6.4),
                Map.of("department", "Finance", "count", 35, "percentage", 10.2),
                Map.of("department", "Operations", "count", 48, "percentage", 14.0),
                Map.of("department", "Customer Support", "count", 42, "percentage", 12.3)
        ));

        metrics.put("employmentTypes", List.of(
                Map.of("type", "Full-Time", "count", 280, "percentage", 81.9),
                Map.of("type", "Part-Time", "count", 28, "percentage", 8.2),
                Map.of("type", "Contract", "count", 22, "percentage", 6.4),
                Map.of("type", "Intern", "count", 12, "percentage", 3.5)
        ));

        metrics.put("genderDistribution", List.of(
                Map.of("gender", "Male", "count", 185, "percentage", 54.1),
                Map.of("gender", "Female", "count", 148, "percentage", 43.3),
                Map.of("gender", "Non-Binary", "count", 9, "percentage", 2.6)
        ));

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("costPerHire", 4250.00);
        kpis.put("timeToFillDays", 34);
        kpis.put("offerAcceptanceRate", 87.5);
        kpis.put("employeeSatisfactionScore", 7.8);
        metrics.put("kpis", kpis);

        return metrics;
    }

    private boolean useAthena() {
        return athenaQueryService != null;
    }

    private static int parseInt(String value) {
        if (value == null || value.isBlank()) return 0;
        try { return Integer.parseInt(value); } catch (NumberFormatException e) { return 0; }
    }

    private static double parseDouble(String value) {
        if (value == null || value.isBlank()) return 0.0;
        try { return Double.parseDouble(value); } catch (NumberFormatException e) { return 0.0; }
    }
}
