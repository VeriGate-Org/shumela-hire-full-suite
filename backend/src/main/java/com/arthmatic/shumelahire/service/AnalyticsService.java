package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.*;
import com.arthmatic.shumelahire.service.analytics.AthenaQueryService;
import com.arthmatic.shumelahire.service.analytics.AthenaQueryTemplates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AnalyticsService {

    @Autowired
    private RecruitmentMetricsDataRepository metricsRepository;

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private JobPostingDataRepository jobPostingRepository;

    @Autowired
    private InterviewDataRepository interviewRepository;

    @Autowired
    private OfferDataRepository offerRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private AthenaQueryService athenaQueryService;

    private boolean useAthena() {
        return athenaQueryService != null;
    }

    private Map<String, String> tenantParams() {
        return Map.of("tenantId", TenantContext.getCurrentTenant());
    }

    // Core metrics calculation
    public void calculateAndStoreMetrics(LocalDate date, String department) {
        try {
            // Application metrics
            calculateApplicationMetrics(date, department);
            
            // Interview metrics
            calculateInterviewMetrics(date, department);
            
            // Offer metrics
            calculateOfferMetrics(date, department);
            
            // Pipeline metrics
            calculatePipelineMetrics(date, department);
            
            // Efficiency metrics
            calculateEfficiencyMetrics(date, department);
            
            auditLogService.logSystemAction(
                "METRICS_CALCULATED",
                "Analytics",
                String.format("Metrics calculated for %s on %s", department, date)
            );
        } catch (Exception e) {
            auditLogService.logSystemAction(
                "METRICS_CALCULATION_FAILED",
                "Analytics",
                String.format("Failed to calculate metrics for %s on %s: %s", department, date, e.getMessage())
            );
            throw e;
        }
    }

    private void calculateApplicationMetrics(LocalDate date, String department) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        // Total applications received
        Long totalApplications = applicationRepository.countBySubmittedAtBetween(startOfDay, endOfDay);
        saveMetric(date, "APPLICATIONS", "total_applications", MetricType.COUNT, 
                  BigDecimal.valueOf(totalApplications), department);
        
        // Applications by department
        if (department != null) {
            Long deptApplications = applicationRepository.countByDepartmentAndSubmittedAtBetween(
                department, startOfDay, endOfDay);
            saveMetric(date, "APPLICATIONS", "department_applications", MetricType.COUNT,
                      BigDecimal.valueOf(deptApplications), department);
        }
        
        // Application to interview conversion rate
        Long interviewedApplications = applicationRepository.countByStatusAndSubmittedAtBetween(
            ApplicationStatus.INTERVIEW_SCHEDULED, startOfDay, endOfDay);
        if (totalApplications > 0) {
            BigDecimal conversionRate = BigDecimal.valueOf(interviewedApplications)
                .divide(BigDecimal.valueOf(totalApplications), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            saveMetric(date, "APPLICATIONS", "interview_conversion_rate", MetricType.PERCENTAGE,
                      conversionRate, department);
        }
        
        // Average time to first response
        List<Application> applications = applicationRepository.findBySubmittedAtBetween(startOfDay, endOfDay);
        if (!applications.isEmpty()) {
            double avgHours = applications.stream()
                .filter(app -> app.getUpdatedAt() != null)
                .mapToLong(app -> java.time.Duration.between(app.getSubmittedAt(), app.getUpdatedAt()).toHours())
                .average()
                .orElse(0.0);
            saveMetric(date, "APPLICATIONS", "avg_response_time_hours", MetricType.DURATION,
                      BigDecimal.valueOf(avgHours), department);
        }
    }

    private void calculateInterviewMetrics(LocalDate date, String department) {
        // Interviews conducted
        Long interviewsToday = interviewRepository.countByScheduledAtBetween(
            date.atStartOfDay(), date.atTime(23, 59, 59));
        saveMetric(date, "INTERVIEWS", "interviews_conducted", MetricType.COUNT,
                  BigDecimal.valueOf(interviewsToday), department);
        
        // No-show rate
        Long totalScheduled = interviewRepository.countByScheduledAtBetween(
            date.atStartOfDay(), date.atTime(23, 59, 59));
        Long noShows = interviewRepository.findByScheduledAtBetween(
            date.atStartOfDay(), date.atTime(23, 59, 59)).stream()
            .filter(i -> i.getStatus() == InterviewStatus.NO_SHOW)
            .count();

        if (totalScheduled > 0) {
            BigDecimal noShowRate = BigDecimal.valueOf(noShows)
                .divide(BigDecimal.valueOf(totalScheduled), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            saveMetric(date, "INTERVIEWS", "no_show_rate", MetricType.PERCENTAGE,
                      noShowRate, department);
        }

        // Average interview score
        List<Interview> completedInterviews = interviewRepository.findByScheduledAtBetween(
            date.atStartOfDay(), date.atTime(23, 59, 59)).stream()
            .filter(i -> i.getStatus() == InterviewStatus.COMPLETED)
            .toList();
        
        if (!completedInterviews.isEmpty()) {
            double avgScore = completedInterviews.stream()
                .filter(interview -> interview.getRating() != null)
                .mapToDouble(interview -> interview.getRating().doubleValue())
                .average()
                .orElse(0.0);
            saveMetric(date, "INTERVIEWS", "avg_interview_score", MetricType.QUALITY,
                      BigDecimal.valueOf(avgScore), department);
        }
    }

    private void calculateOfferMetrics(LocalDate date, String department) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        // Offers made
        Long offersMade = offerRepository.countByOfferSentAtBetween(startOfDay, endOfDay);
        saveMetric(date, "OFFERS", "offers_made", MetricType.COUNT,
                  BigDecimal.valueOf(offersMade), department);
        
        // Offer acceptance rate
        Long offersAccepted = offerRepository.countByStatusAndDateRange(
            OfferStatus.ACCEPTED, startOfDay, endOfDay);
        Long offersResponded = offerRepository.countByStatusAndDateRange(
            OfferStatus.ACCEPTED, startOfDay, endOfDay) +
            offerRepository.countByStatusAndDateRange(
            OfferStatus.DECLINED, startOfDay, endOfDay);
        
        if (offersResponded > 0) {
            BigDecimal acceptanceRate = BigDecimal.valueOf(offersAccepted)
                .divide(BigDecimal.valueOf(offersResponded), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
            saveMetric(date, "OFFERS", "acceptance_rate", MetricType.PERCENTAGE,
                      acceptanceRate, department);
        }
        
        // Average time to offer acceptance
        Double avgTimeToAcceptance = offerRepository.getAverageTimeToAcceptanceHours(startOfDay, endOfDay);
        if (avgTimeToAcceptance != null) {
            saveMetric(date, "OFFERS", "avg_time_to_acceptance_hours", MetricType.DURATION,
                      BigDecimal.valueOf(avgTimeToAcceptance), department);
        }
        
        // Average offer amount
        List<Offer> acceptedOffers = offerRepository.findByOfferType(OfferType.FULL_TIME_PERMANENT).stream()
            .filter(o -> o.getStatus() == OfferStatus.ACCEPTED && o.getBaseSalary() != null)
            .toList();
        BigDecimal avgOfferAmount = acceptedOffers.isEmpty() ? null :
            acceptedOffers.stream().map(Offer::getBaseSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(acceptedOffers.size()), RoundingMode.HALF_UP);
        if (avgOfferAmount != null) {
            saveMetric(date, "OFFERS", "avg_offer_amount", MetricType.COST,
                      avgOfferAmount, department);
        }
    }

    private void calculatePipelineMetrics(LocalDate date, String department) {
        // Calculate pipeline velocity and conversion rates
        LocalDateTime weekAgo = date.minusDays(7).atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        // Pipeline conversion rates
        List<Object[]> pipelineRows = applicationRepository.getPipelineDistribution();
        Map<String, Long> stageDistribution = new LinkedHashMap<>();
        for (Object[] row : pipelineRows) {
            stageDistribution.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        Long totalActive = stageDistribution.values().stream().mapToLong(Long::longValue).sum();
        if (totalActive > 0) {
            for (Map.Entry<String, Long> entry : stageDistribution.entrySet()) {
                BigDecimal percentage = BigDecimal.valueOf(entry.getValue())
                    .divide(BigDecimal.valueOf(totalActive), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
                saveMetric(date, "PIPELINE", "stage_" + entry.getKey().toLowerCase() + "_percentage",
                          MetricType.PERCENTAGE, percentage, department);
            }
        }
        
        // Time in stage analysis
        List<PipelineTransition> recentTransitions = applicationRepository.findTransitionsByDateRange(
            weekAgo, endOfDay);
        
        if (!recentTransitions.isEmpty()) {
            double avgTimeInStage = recentTransitions.stream()
                .filter(t -> t.getDurationInPreviousStageHours() != null)
                .mapToDouble(PipelineTransition::getDurationInPreviousStageHours)
                .average()
                .orElse(0.0);
            saveMetric(date, "PIPELINE", "avg_time_per_stage_hours", MetricType.DURATION,
                      BigDecimal.valueOf(avgTimeInStage), department);
        }
    }

    private void calculateEfficiencyMetrics(LocalDate date, String department) {
        LocalDateTime startOfMonth = date.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);
        
        // Cost per hire (estimated)
        Long hiresThisMonth = applicationRepository.countByStatusAndSubmittedAtBetween(
            ApplicationStatus.HIRED, startOfMonth, endOfDay);
        
        if (hiresThisMonth > 0) {
            // Estimated cost per hire based on time investment and average salary costs
            BigDecimal estimatedCostPerHire = BigDecimal.valueOf(25000); // Placeholder calculation
            saveMetric(date, "EFFICIENCY", "cost_per_hire", MetricType.COST,
                      estimatedCostPerHire, department);
        }
        
        // Time to fill
        List<Application> hiredApplications = applicationRepository.findByStatusAndSubmittedAtBetween(
            ApplicationStatus.HIRED, startOfMonth, endOfDay);
        
        if (!hiredApplications.isEmpty()) {
            double avgTimeToFill = hiredApplications.stream()
                .mapToLong(app -> java.time.temporal.ChronoUnit.DAYS.between(
                    app.getSubmittedAt().toLocalDate(), 
                    app.getUpdatedAt().toLocalDate()))
                .average()
                .orElse(0.0);
            saveMetric(date, "EFFICIENCY", "time_to_fill_days", MetricType.DURATION,
                      BigDecimal.valueOf(avgTimeToFill), department);
        }
        
        // Source effectiveness
        // This would require source tracking - placeholder for now
        saveMetric(date, "EFFICIENCY", "source_effectiveness_score", MetricType.QUALITY,
                  BigDecimal.valueOf(75), department);
    }

    private void saveMetric(LocalDate date, String category, String name, MetricType type, 
                           BigDecimal value, String department) {
        // Check if metric already exists
        Optional<RecruitmentMetrics> existing = metricsRepository.findByMetricNameAndMetricDateAndDepartment(
            name, date, department);
        
        RecruitmentMetrics metric;
        if (existing.isPresent()) {
            metric = existing.get();
            metric.setMetricValue(value);
        } else {
            metric = new RecruitmentMetrics(date, type, category, name, value);
            metric.setDepartment(department);
        }
        
        // Calculate trend and variance
        updateMetricTrends(metric);
        
        metricsRepository.save(metric);
    }

    private void updateMetricTrends(RecruitmentMetrics metric) {
        // Find previous period value
        LocalDate previousDate = metric.getMetricDate().minusDays(1);
        Optional<RecruitmentMetrics> previousMetric = metricsRepository.findByMetricNameAndMetricDateAndDepartment(
            metric.getMetricName(), previousDate, metric.getDepartment());
        
        if (previousMetric.isPresent()) {
            metric.setPreviousPeriodValue(previousMetric.get().getMetricValue());
            
            BigDecimal change = metric.getPeriodOverPeriodChange();
            metric.setVariancePercentage(change);
            
            // Determine trend direction
            if (change.abs().compareTo(BigDecimal.valueOf(2)) < 0) {
                metric.setTrendDirection(TrendDirection.STABLE);
            } else if (change.compareTo(BigDecimal.ZERO) > 0) {
                metric.setTrendDirection(TrendDirection.UP);
            } else {
                metric.setTrendDirection(TrendDirection.DOWN);
            }
        }
    }

    // ── Athena-backed analytics queries ──────────────────────────────────────

    /**
     * Get application status counts using Athena when available, falls back to in-memory.
     */
    public List<Map<String, String>> getApplicationStatusCounts() {
        if (useAthena()) {
            return athenaQueryService.executeQuery(
                    AthenaQueryTemplates.APPLICATION_STATUS_COUNTS, tenantParams());
        }
        // Fallback: delegate to existing repository-based approach
        return List.of();
    }

    /**
     * Get daily application totals from Athena.
     */
    public List<Map<String, String>> getApplicationDailyTotals(LocalDate startDate, LocalDate endDate) {
        if (useAthena()) {
            Map<String, String> params = new HashMap<>(tenantParams());
            params.put("startDate", startDate.toString());
            params.put("endDate", endDate.toString());
            return athenaQueryService.executeQuery(
                    AthenaQueryTemplates.APPLICATION_DAILY_TOTALS, params);
        }
        return List.of();
    }

    /**
     * Get offer status distribution from Athena.
     */
    public List<Map<String, String>> getOfferStatusDistribution(LocalDate startDate, LocalDate endDate) {
        if (useAthena()) {
            Map<String, String> params = new HashMap<>(tenantParams());
            params.put("startDate", startDate.toString());
            params.put("endDate", endDate.toString());
            return athenaQueryService.executeQuery(
                    AthenaQueryTemplates.OFFER_STATUS_DISTRIBUTION, params);
        }
        return List.of();
    }

    /**
     * Get average salary by department from Athena.
     */
    public List<Map<String, String>> getAverageSalaryByDepartment() {
        if (useAthena()) {
            return athenaQueryService.executeQuery(
                    AthenaQueryTemplates.AVERAGE_SALARY_BY_DEPARTMENT, tenantParams());
        }
        return List.of();
    }

    /**
     * Get average metric by department from Athena.
     */
    public List<Map<String, String>> getAverageMetricByDepartmentAthena(String metricName, LocalDate startDate) {
        if (useAthena()) {
            Map<String, String> params = new HashMap<>(tenantParams());
            params.put("metricName", metricName);
            params.put("startDate", startDate.toString());
            return athenaQueryService.executeQuery(
                    AthenaQueryTemplates.METRIC_BY_DEPARTMENT, params);
        }
        return List.of();
    }

    /**
     * Get pipeline velocity from Athena.
     */
    public List<Map<String, String>> getPipelineVelocity(LocalDate startDate) {
        if (useAthena()) {
            Map<String, String> params = new HashMap<>(tenantParams());
            params.put("startDate", startDate.toString());
            return athenaQueryService.executeQuery(
                    AthenaQueryTemplates.PIPELINE_VELOCITY, params);
        }
        return List.of();
    }

    // Dashboard and reporting methods
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics(String department, LocalDate date) {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Current KPIs
        List<RecruitmentMetrics> kpis = department != null ? 
            metricsRepository.findCurrentKPIsByDepartment(department) :
            metricsRepository.findCurrentKPIs();
        
        Map<String, Object> kpiData = kpis.stream()
            .collect(Collectors.toMap(
                RecruitmentMetrics::getMetricName,
                metric -> Map.of(
                    "value", metric.getMetricValue(),
                    "trend", metric.getTrendDirection(),
                    "variance", metric.getVariancePercentage(),
                    "status", metric.getPerformanceStatus()
                )
            ));
        
        dashboard.put("kpis", kpiData);
        
        // Recent trends
        LocalDate weekAgo = date.minusDays(7);
        List<RecruitmentMetrics> trendData = metricsRepository.findByMetricDateBetween(weekAgo, date);
        dashboard.put("trends", processTrendData(trendData));
        
        // Performance alerts
        List<RecruitmentMetrics> alerts = metricsRepository.findMetricsBelowTarget();
        dashboard.put("alerts", alerts.stream()
            .limit(5)
            .map(this::createAlertData)
            .collect(Collectors.toList()));
        
        return dashboard;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDetailedAnalytics(String category, String department, 
                                                   LocalDate startDate, LocalDate endDate) {
        Map<String, Object> analytics = new HashMap<>();
        
        // Category trends
        List<RecruitmentMetrics> categoryData = metricsRepository.findCategoryTrends(
            category, startDate, endDate);
        analytics.put("trends", processTrendData(categoryData));
        
        // Statistics
        List<Object[]> stats = metricsRepository.getCategoryStatistics(category, startDate, endDate);
        analytics.put("statistics", processStatistics(stats));
        
        // Department comparison
        if (department == null) {
            List<Object[]> deptComparison = metricsRepository.getAverageMetricByDepartment(
                category + "_total", startDate, endDate);
            analytics.put("departmentComparison", processDepartmentData(deptComparison));
        }
        
        return analytics;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPerformanceReport(String userId, String userType, 
                                                   LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        
        List<Object[]> performance;
        if ("recruiter".equals(userType)) {
            performance = metricsRepository.getRecruiterPerformance(startDate, endDate);
        } else if ("hiring_manager".equals(userType)) {
            performance = metricsRepository.getHiringManagerPerformance(startDate, endDate);
        } else {
            performance = new ArrayList<>();
        }
        
        report.put("performance", processPerformanceData(performance, userId));
        
        // Individual metrics
        List<RecruitmentMetrics> userMetrics = userType.equals("recruiter") ?
            metricsRepository.findByRecruiterAndDateRange(userId, startDate, endDate) :
            new ArrayList<>();
        
        report.put("metrics", userMetrics);
        
        return report;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> generateReport(String reportType, Map<String, Object> parameters) {
        LocalDate startDate = (LocalDate) parameters.get("startDate");
        LocalDate endDate = (LocalDate) parameters.get("endDate");
        String department = (String) parameters.get("department");
        
        List<Map<String, Object>> reportData = new ArrayList<>();
        
        switch (reportType) {
            case "EXECUTIVE_SUMMARY":
                reportData.add(generateExecutiveSummary(startDate, endDate, department));
                break;
            case "DEPARTMENT_PERFORMANCE":
                reportData.addAll(generateDepartmentReport(startDate, endDate));
                break;
            case "RECRUITER_SCORECARD":
                reportData.addAll(generateRecruiterScorecard(startDate, endDate));
                break;
            case "PIPELINE_ANALYSIS":
                reportData.add(generatePipelineAnalysis(startDate, endDate, department));
                break;
            default:
                throw new IllegalArgumentException("Unknown report type: " + reportType);
        }
        
        return reportData;
    }

    // Helper methods for data processing
    private Map<String, Object> processTrendData(List<RecruitmentMetrics> metrics) {
        Map<String, List<Map<String, Object>>> trends = new HashMap<>();
        
        for (RecruitmentMetrics metric : metrics) {
            trends.computeIfAbsent(metric.getMetricName(), k -> new ArrayList<>())
                  .add(Map.of(
                      "date", metric.getMetricDate().toString(),
                      "value", metric.getMetricValue(),
                      "trend", metric.getTrendDirection()
                  ));
        }
        
        return Map.of("data", trends);
    }

    private Map<String, Object> createAlertData(RecruitmentMetrics metric) {
        return Map.of(
            "metric", metric.getMetricName(),
            "value", metric.getMetricValue(),
            "target", metric.getTargetValue(),
            "variance", metric.getTargetVariance(),
            "department", metric.getDepartment(),
            "date", metric.getMetricDate()
        );
    }

    private List<Map<String, Object>> processStatistics(List<Object[]> stats) {
        return stats.stream()
            .map(stat -> Map.of(
                "metric", stat[0],
                "average", stat[1],
                "maximum", stat[2],
                "minimum", stat[3]
            ))
            .collect(Collectors.toList());
    }

    private List<Map<String, Object>> processDepartmentData(List<Object[]> deptData) {
        return deptData.stream()
            .map(data -> Map.of(
                "department", data[0],
                "value", data[1]
            ))
            .collect(Collectors.toList());
    }

    private Map<String, Object> processPerformanceData(List<Object[]> performance, String userId) {
        Map<String, Object> result = new HashMap<>();
        
        Map<String, BigDecimal> userMetrics = new HashMap<>();
        Map<String, BigDecimal> averageMetrics = new HashMap<>();
        
        for (Object[] row : performance) {
            Long id = (Long) row[0];
            String metric = (String) row[1];
            BigDecimal value = (BigDecimal) row[2];
            
            if (id.equals(userId)) {
                userMetrics.put(metric, value);
            }
            
            averageMetrics.merge(metric, value, 
                (existing, newVal) -> existing.add(newVal).divide(BigDecimal.valueOf(2), RoundingMode.HALF_UP));
        }
        
        result.put("userMetrics", userMetrics);
        result.put("averageMetrics", averageMetrics);
        
        return result;
    }

    // Report generation methods
    private Map<String, Object> generateExecutiveSummary(LocalDate startDate, LocalDate endDate, String department) {
        Map<String, Object> summary = new HashMap<>();
        
        // Key metrics summary
        List<RecruitmentMetrics> keyMetrics = metricsRepository.findByMetricCategoryAndMetricDateBetween(
            "KPI", startDate, endDate);
        
        summary.put("period", startDate + " to " + endDate);
        summary.put("department", department);
        summary.put("keyMetrics", keyMetrics);
        summary.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        
        return summary;
    }

    private List<Map<String, Object>> generateDepartmentReport(LocalDate startDate, LocalDate endDate) {
        List<Object[]> deptPerformance = metricsRepository.getAverageMetricByDepartment(
            "total_applications", startDate, endDate);
        
        return deptPerformance.stream()
            .map(data -> Map.of(
                "department", data[0],
                "performance", data[1],
                "period", startDate + " to " + endDate
            ))
            .collect(Collectors.toList());
    }

    private List<Map<String, Object>> generateRecruiterScorecard(LocalDate startDate, LocalDate endDate) {
        List<Object[]> recruiterData = metricsRepository.getRecruiterPerformance(startDate, endDate);
        
        return recruiterData.stream()
            .map(data -> Map.of(
                "recruiterId", data[0],
                "metric", data[1],
                "value", data[2],
                "period", startDate + " to " + endDate
            ))
            .collect(Collectors.toList());
    }

    private Map<String, Object> generatePipelineAnalysis(LocalDate startDate, LocalDate endDate, String department) {
        Map<String, Object> analysis = new HashMap<>();
        
        List<RecruitmentMetrics> pipelineMetrics = metricsRepository.findByMetricCategoryAndMetricDateBetween(
            "PIPELINE", startDate, endDate);
        
        analysis.put("pipelineMetrics", pipelineMetrics);
        analysis.put("period", startDate + " to " + endDate);
        analysis.put("department", department);
        
        return analysis;
    }

    // Search and pagination
    @Transactional(readOnly = true)
    public Page<RecruitmentMetrics> searchMetrics(String category, String name, String department,
                                                 String recruiterId, String hiringManagerId,
                                                 LocalDate startDate, LocalDate endDate,
                                                 Pageable pageable) {
        CursorPage<RecruitmentMetrics> result = metricsRepository.searchMetrics(
            category, name, department,
            recruiterId != null ? recruiterId : null,
            hiringManagerId != null ? hiringManagerId : null,
            startDate, endDate,
            pageable.getPageNumber(), pageable.getPageSize());
        return new PageImpl<>(result.content(), pageable, result.content().size());
    }
}