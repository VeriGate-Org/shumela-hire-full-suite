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
public class AttendanceAnalyticsService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceAnalyticsService.class);

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private AthenaQueryService athenaQueryService;

    public Map<String, Object> getAttendanceMetrics() {
        logger.info("Computing attendance analytics");
        auditLogService.logSystemAction("VIEW", "ATTENDANCE_ANALYTICS", "Attendance metrics requested");

        if (useAthena()) {
            try {
                return getAttendanceMetricsFromAthena();
            } catch (Exception e) {
                logger.warn("Athena query failed, falling back to mock data: {}", e.getMessage());
            }
        }

        return getAttendanceMetricsMock();
    }

    private Map<String, Object> getAttendanceMetricsFromAthena() {
        String tenantId = TenantContext.requireCurrentTenant();
        LocalDate yearStart = LocalDate.now().withDayOfYear(1);
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);

        Map<String, Object> metrics = new LinkedHashMap<>();

        // Overall attendance summary
        List<Map<String, String>> summaryRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.ATTENDANCE_SUMMARY,
                Map.of("tenantId", tenantId, "startDate", monthStart.toString()));

        Map<String, Object> summary = new LinkedHashMap<>();
        double totalHours = 0;
        int totalRecords = 0;
        int uniqueEmployees = summaryRows.size();
        for (Map<String, String> row : summaryRows) {
            totalHours += parseDouble(row.get("total_hours"));
            totalRecords += parseInt(row.get("total_records"));
        }
        double avgHoursPerDay = totalRecords > 0 ? totalHours / totalRecords : 0;
        summary.put("averageHoursPerDay", Math.round(avgHoursPerDay * 10) / 10.0);
        summary.put("averageHoursPerWeek", Math.round(avgHoursPerDay * 5 * 10) / 10.0);
        summary.put("totalWorkingDaysThisMonth", totalRecords > 0 ? totalRecords / Math.max(uniqueEmployees, 1) : 0);
        metrics.put("summary", summary);

        // Monthly trends
        List<Map<String, String>> monthlyRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.ATTENDANCE_MONTHLY_TRENDS,
                Map.of("tenantId", tenantId, "startDate", yearStart.toString()));

        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM");
        List<Map<String, Object>> monthlyTrends = new ArrayList<>();
        for (Map<String, String> row : monthlyRows) {
            int yr = parseInt(row.get("yr"));
            int mo = parseInt(row.get("mo"));
            LocalDate monthDate = LocalDate.of(yr, mo, 1);
            monthlyTrends.add(Map.of(
                    "month", monthDate.format(monthFmt),
                    "avgHours", Math.round(parseDouble(row.get("avg_hours")) * 10) / 10.0,
                    "totalRecords", parseInt(row.get("total_records")),
                    "uniqueEmployees", parseInt(row.get("unique_employees"))
            ));
        }
        metrics.put("monthlyTrends", monthlyTrends);

        // Department-level attendance
        List<Map<String, String>> deptRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.ATTENDANCE_DEPARTMENT_SUMMARY,
                Map.of("tenantId", tenantId, "startDate", monthStart.toString()));

        List<Map<String, Object>> deptAttendance = new ArrayList<>();
        for (Map<String, String> row : deptRows) {
            deptAttendance.add(Map.of(
                    "department", row.getOrDefault("department", "Unknown"),
                    "avgHours", Math.round(parseDouble(row.get("avg_hours")) * 10) / 10.0,
                    "totalHours", Math.round(parseDouble(row.get("total_hours")) * 10) / 10.0,
                    "totalRecords", parseInt(row.get("total_records"))
            ));
        }
        metrics.put("departmentAttendance", deptAttendance);

        // Overtime summary
        List<Map<String, String>> overtimeRows = athenaQueryService.executeQuery(
                AthenaQueryTemplates.ATTENDANCE_OVERTIME,
                Map.of("tenantId", tenantId, "startDate", monthStart.toString()));

        Map<String, Object> overtime = new LinkedHashMap<>();
        if (!overtimeRows.isEmpty()) {
            Map<String, String> ot = overtimeRows.get(0);
            overtime.put("totalOvertimeHoursThisMonth", (int) Math.round(parseDouble(ot.get("total_overtime_hours"))));
            overtime.put("employeesWithOvertime", parseInt(ot.get("employees_with_overtime")));
            int empOt = parseInt(ot.get("employees_with_overtime"));
            double totalOt = parseDouble(ot.get("total_overtime_hours"));
            overtime.put("averageOvertimePerEmployee", empOt > 0 ? Math.round(totalOt / empOt * 10) / 10.0 : 0);
        }
        metrics.put("overtime", overtime);

        return metrics;
    }

    private Map<String, Object> getAttendanceMetricsMock() {
        Map<String, Object> metrics = new LinkedHashMap<>();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("averageHoursPerDay", 8.2);
        summary.put("averageHoursPerWeek", 40.8);
        summary.put("lateArrivalRate", 6.5);
        summary.put("absenceRate", 3.2);
        summary.put("overtimeRate", 12.1);
        summary.put("presentRate", 94.3);
        summary.put("totalWorkingDaysThisMonth", 22);
        metrics.put("summary", summary);

        metrics.put("monthlyTrends", List.of(
                Map.of("month", "Jan", "avgHours", 8.1, "lateRate", 7.2, "absenceRate", 3.5),
                Map.of("month", "Feb", "avgHours", 8.3, "lateRate", 5.8, "absenceRate", 2.9),
                Map.of("month", "Mar", "avgHours", 8.0, "lateRate", 6.9, "absenceRate", 3.8),
                Map.of("month", "Apr", "avgHours", 8.4, "lateRate", 5.2, "absenceRate", 2.7),
                Map.of("month", "May", "avgHours", 8.2, "lateRate", 6.1, "absenceRate", 3.0),
                Map.of("month", "Jun", "avgHours", 8.1, "lateRate", 6.8, "absenceRate", 3.3),
                Map.of("month", "Jul", "avgHours", 7.9, "lateRate", 7.5, "absenceRate", 4.1),
                Map.of("month", "Aug", "avgHours", 8.3, "lateRate", 5.9, "absenceRate", 2.8),
                Map.of("month", "Sep", "avgHours", 8.2, "lateRate", 6.3, "absenceRate", 3.1),
                Map.of("month", "Oct", "avgHours", 8.4, "lateRate", 5.5, "absenceRate", 2.6),
                Map.of("month", "Nov", "avgHours", 8.1, "lateRate", 6.7, "absenceRate", 3.4),
                Map.of("month", "Dec", "avgHours", 7.8, "lateRate", 8.0, "absenceRate", 4.5)
        ));

        metrics.put("departmentAttendance", List.of(
                Map.of("department", "Engineering", "avgHours", 8.5, "lateRate", 4.2, "absenceRate", 2.1),
                Map.of("department", "Sales", "avgHours", 8.8, "lateRate", 3.8, "absenceRate", 2.5),
                Map.of("department", "Marketing", "avgHours", 8.0, "lateRate", 7.1, "absenceRate", 3.8),
                Map.of("department", "Human Resources", "avgHours", 8.3, "lateRate", 5.0, "absenceRate", 2.9),
                Map.of("department", "Finance", "avgHours", 8.4, "lateRate", 4.5, "absenceRate", 2.3),
                Map.of("department", "Operations", "avgHours", 8.6, "lateRate", 3.2, "absenceRate", 1.8),
                Map.of("department", "Customer Support", "avgHours", 7.9, "lateRate", 8.5, "absenceRate", 4.2)
        ));

        metrics.put("dayOfWeekDistribution", List.of(
                Map.of("day", "Monday", "avgHours", 8.4, "lateRate", 8.1),
                Map.of("day", "Tuesday", "avgHours", 8.3, "lateRate", 5.5),
                Map.of("day", "Wednesday", "avgHours", 8.2, "lateRate", 5.2),
                Map.of("day", "Thursday", "avgHours", 8.1, "lateRate", 6.0),
                Map.of("day", "Friday", "avgHours", 7.8, "lateRate", 7.8)
        ));

        Map<String, Object> overtime = new LinkedHashMap<>();
        overtime.put("totalOvertimeHoursThisMonth", 485);
        overtime.put("employeesWithOvertime", 72);
        overtime.put("averageOvertimePerEmployee", 6.7);
        overtime.put("topOvertimeDepartment", "Engineering");
        metrics.put("overtime", overtime);

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
