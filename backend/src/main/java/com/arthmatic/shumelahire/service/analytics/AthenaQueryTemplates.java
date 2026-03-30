package com.arthmatic.shumelahire.service.analytics;

/**
 * SQL query templates for Athena analytics queries.
 * All queries assume NDJSON-backed Glue tables with partition columns year/month/day.
 * <p>
 * Parameter placeholders use :paramName syntax, replaced by AthenaQueryService.
 */
public final class AthenaQueryTemplates {

    private AthenaQueryTemplates() {}

    // ── Application Analytics ─────────────────────────────────────────────────

    public static final String APPLICATION_STATUS_COUNTS = """
            SELECT status, COUNT(*) AS cnt
            FROM applications
            WHERE tenantId = :tenantId
            GROUP BY status
            ORDER BY cnt DESC
            """;

    public static final String APPLICATION_DAILY_TOTALS = """
            SELECT DATE(submittedAt) AS submit_date, COUNT(*) AS cnt
            FROM applications
            WHERE tenantId = :tenantId
              AND submittedAt >= :startDate
              AND submittedAt <= :endDate
            GROUP BY DATE(submittedAt)
            ORDER BY submit_date
            """;

    public static final String APPLICATION_MONTHLY_AVERAGES = """
            SELECT YEAR(CAST(submittedAt AS timestamp)) AS yr,
                   MONTH(CAST(submittedAt AS timestamp)) AS mo,
                   COUNT(*) AS total_apps
            FROM applications
            WHERE tenantId = :tenantId
              AND submittedAt >= :startDate
            GROUP BY YEAR(CAST(submittedAt AS timestamp)), MONTH(CAST(submittedAt AS timestamp))
            ORDER BY yr, mo
            """;

    public static final String APPLICATIONS_BY_SOURCE = """
            SELECT source, status, COUNT(*) AS cnt
            FROM applications
            WHERE tenantId = :tenantId
              AND submittedAt >= :startDate
            GROUP BY source, status
            ORDER BY source, cnt DESC
            """;

    public static final String APPLICATION_PIPELINE_DISTRIBUTION = """
            SELECT status, COUNT(*) AS cnt
            FROM applications
            WHERE tenantId = :tenantId
            GROUP BY status
            ORDER BY cnt DESC
            """;

    // ── Hiring Analytics ──────────────────────────────────────────────────────

    public static final String HIRED_APPLICATIONS_WITH_DATES = """
            SELECT id, submittedAt, updatedAt, department
            FROM applications
            WHERE tenantId = :tenantId
              AND status = 'HIRED'
            ORDER BY updatedAt DESC
            """;

    public static final String MONTHLY_HIRING_TRENDS = """
            SELECT YEAR(CAST(updatedAt AS timestamp)) AS yr,
                   MONTH(CAST(updatedAt AS timestamp)) AS mo,
                   COUNT(*) AS hires,
                   COUNT(CASE WHEN status = 'HIRED' THEN 1 END) AS hired_count,
                   COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS rejected_count
            FROM applications
            WHERE tenantId = :tenantId
              AND updatedAt >= :startDate
            GROUP BY YEAR(CAST(updatedAt AS timestamp)), MONTH(CAST(updatedAt AS timestamp))
            ORDER BY yr, mo
            """;

    public static final String HIRES_BY_DEPARTMENT = """
            SELECT department, COUNT(*) AS cnt
            FROM applications
            WHERE tenantId = :tenantId
              AND status = 'HIRED'
              AND updatedAt >= :startDate
            GROUP BY department
            ORDER BY cnt DESC
            """;

    // ── Offer Analytics ───────────────────────────────────────────────────────

    public static final String OFFER_STATUS_DISTRIBUTION = """
            SELECT status, COUNT(*) AS cnt
            FROM offers
            WHERE tenantId = :tenantId
              AND createdAt >= :startDate
              AND createdAt <= :endDate
            GROUP BY status
            """;

    public static final String AVERAGE_SALARY_BY_DEPARTMENT = """
            SELECT department, AVG(CAST(salaryOffered AS double)) AS avg_salary, COUNT(*) AS cnt
            FROM offers
            WHERE tenantId = :tenantId
              AND status = 'ACCEPTED'
              AND salaryOffered IS NOT NULL
            GROUP BY department
            ORDER BY avg_salary DESC
            """;

    // ── Interview Analytics ───────────────────────────────────────────────────

    public static final String INTERVIEW_PASS_RATES = """
            SELECT status, COUNT(*) AS cnt
            FROM interviews
            WHERE tenantId = :tenantId
              AND completedAt >= :startDate
            GROUP BY status
            """;

    public static final String INTERVIEWS_BY_MONTH = """
            SELECT YEAR(CAST(scheduledAt AS timestamp)) AS yr,
                   MONTH(CAST(scheduledAt AS timestamp)) AS mo,
                   COUNT(*) AS total_interviews,
                   COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed,
                   COUNT(CASE WHEN status = 'CANCELLED' OR status = 'NO_SHOW' THEN 1 END) AS cancelled_or_noshow
            FROM interviews
            WHERE tenantId = :tenantId
              AND scheduledAt >= :startDate
            GROUP BY YEAR(CAST(scheduledAt AS timestamp)), MONTH(CAST(scheduledAt AS timestamp))
            ORDER BY yr, mo
            """;

    // ── Recruitment Metrics ───────────────────────────────────────────────────

    public static final String METRIC_BY_DEPARTMENT = """
            SELECT department, AVG(CAST(metricValue AS double)) AS avg_value, COUNT(*) AS sample_count
            FROM recruitment_metrics
            WHERE tenantId = :tenantId
              AND metricName = :metricName
              AND metricDate >= :startDate
            GROUP BY department
            ORDER BY avg_value DESC
            """;

    public static final String METRIC_TREND = """
            SELECT metricDate, metricName, metricValue
            FROM recruitment_metrics
            WHERE tenantId = :tenantId
              AND metricName = :metricName
              AND metricDate >= :startDate
            ORDER BY metricDate
            """;

    // ── Pipeline Transitions ──────────────────────────────────────────────────

    public static final String PIPELINE_VELOCITY = """
            SELECT fromStage, toStage, COUNT(*) AS transition_count,
                   AVG(CAST(DATEDIFF('hour', CAST(transitionDate AS timestamp), CURRENT_TIMESTAMP) AS double)) AS avg_hours
            FROM pipeline_transitions
            WHERE tenantId = :tenantId
              AND transitionDate >= :startDate
            GROUP BY fromStage, toStage
            ORDER BY transition_count DESC
            """;

    // ── Attendance Analytics ──────────────────────────────────────────────────

    public static final String ATTENDANCE_SUMMARY = """
            SELECT employeeId,
                   COUNT(*) AS total_records,
                   AVG(CAST(hoursWorked AS double)) AS avg_hours,
                   SUM(CAST(hoursWorked AS double)) AS total_hours
            FROM attendance_records
            WHERE tenantId = :tenantId
              AND clockIn >= :startDate
            GROUP BY employeeId
            ORDER BY total_hours DESC
            """;

    // ── Employee Analytics ────────────────────────────────────────────────────

    public static final String EMPLOYEE_STATUS_COUNTS = """
            SELECT status, COUNT(*) AS cnt
            FROM employees
            WHERE tenantId = :tenantId
            GROUP BY status
            """;

    public static final String EMPLOYEE_DEPARTMENT_DISTRIBUTION = """
            SELECT departmentId, status, COUNT(*) AS cnt
            FROM employees
            WHERE tenantId = :tenantId
            GROUP BY departmentId, status
            ORDER BY cnt DESC
            """;

    public static final String EMPLOYEE_TURNOVER = """
            SELECT YEAR(CAST(terminationDate AS timestamp)) AS yr,
                   MONTH(CAST(terminationDate AS timestamp)) AS mo,
                   COUNT(*) AS terminations
            FROM employees
            WHERE tenantId = :tenantId
              AND terminationDate IS NOT NULL
              AND terminationDate >= :startDate
            GROUP BY YEAR(CAST(terminationDate AS timestamp)), MONTH(CAST(terminationDate AS timestamp))
            ORDER BY yr, mo
            """;

    // ── HR Overview Analytics ────────────────────────────────────────────────

    public static final String EMPLOYEE_HEADCOUNT = """
            SELECT status, COUNT(*) AS cnt
            FROM employees
            WHERE tenantId = :tenantId
            GROUP BY status
            """;

    public static final String EMPLOYEE_NEW_HIRES = """
            SELECT COUNT(*) AS cnt
            FROM employees
            WHERE tenantId = :tenantId
              AND startDate >= :startDate
            """;

    public static final String EMPLOYEE_TERMINATIONS_PERIOD = """
            SELECT COUNT(*) AS cnt
            FROM employees
            WHERE tenantId = :tenantId
              AND terminationDate IS NOT NULL
              AND terminationDate >= :startDate
            """;

    public static final String EMPLOYEE_MONTHLY_TURNOVER = """
            SELECT YEAR(CAST(terminationDate AS timestamp)) AS yr,
                   MONTH(CAST(terminationDate AS timestamp)) AS mo,
                   COUNT(*) AS terminations
            FROM employees
            WHERE tenantId = :tenantId
              AND terminationDate IS NOT NULL
              AND terminationDate >= :startDate
            GROUP BY YEAR(CAST(terminationDate AS timestamp)), MONTH(CAST(terminationDate AS timestamp))
            ORDER BY yr, mo
            """;

    public static final String EMPLOYEE_TENURE_BANDS = """
            SELECT CASE
                     WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 1 THEN '< 1 year'
                     WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 2 THEN '1-2 years'
                     WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 5 THEN '2-5 years'
                     WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 10 THEN '5-10 years'
                     ELSE '10+ years'
                   END AS band,
                   COUNT(*) AS cnt
            FROM employees
            WHERE tenantId = :tenantId
              AND status = 'ACTIVE'
            GROUP BY CASE
                       WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 1 THEN '< 1 year'
                       WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 2 THEN '1-2 years'
                       WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 5 THEN '2-5 years'
                       WHEN DATE_DIFF('year', CAST(startDate AS date), CURRENT_DATE) < 10 THEN '5-10 years'
                       ELSE '10+ years'
                     END
            ORDER BY cnt DESC
            """;

    public static final String EMPLOYEE_EMPLOYMENT_TYPE_DISTRIBUTION = """
            SELECT employmentType, COUNT(*) AS cnt
            FROM employees
            WHERE tenantId = :tenantId
              AND status = 'ACTIVE'
            GROUP BY employmentType
            ORDER BY cnt DESC
            """;

    // ── Attendance Analytics (extended) ──────────────────────────────────────

    public static final String ATTENDANCE_MONTHLY_TRENDS = """
            SELECT YEAR(CAST(clockIn AS timestamp)) AS yr,
                   MONTH(CAST(clockIn AS timestamp)) AS mo,
                   AVG(CAST(hoursWorked AS double)) AS avg_hours,
                   COUNT(*) AS total_records,
                   COUNT(DISTINCT employeeId) AS unique_employees
            FROM attendance_records
            WHERE tenantId = :tenantId
              AND clockIn >= :startDate
            GROUP BY YEAR(CAST(clockIn AS timestamp)), MONTH(CAST(clockIn AS timestamp))
            ORDER BY yr, mo
            """;

    public static final String ATTENDANCE_DEPARTMENT_SUMMARY = """
            SELECT e.departmentId AS department,
                   AVG(CAST(a.hoursWorked AS double)) AS avg_hours,
                   SUM(CAST(a.hoursWorked AS double)) AS total_hours,
                   COUNT(*) AS total_records
            FROM attendance_records a
            JOIN employees e ON a.employeeId = e.id AND a.tenantId = e.tenantId
            WHERE a.tenantId = :tenantId
              AND a.clockIn >= :startDate
            GROUP BY e.departmentId
            ORDER BY avg_hours DESC
            """;

    public static final String ATTENDANCE_OVERTIME = """
            SELECT COUNT(DISTINCT employeeId) AS employees_with_overtime,
                   SUM(CAST(hoursWorked AS double) - 8.0) AS total_overtime_hours,
                   COUNT(*) AS overtime_records
            FROM attendance_records
            WHERE tenantId = :tenantId
              AND clockIn >= :startDate
              AND CAST(hoursWorked AS double) > 8.0
            """;
}
