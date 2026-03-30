package com.arthmatic.shumelahire.repository;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.RecruitmentMetrics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Storage-agnostic repository interface for the RecruitmentMetrics entity.
 * <p>
 * Implementations:
 * <ul>
 *   <li>{@code JpaRecruitmentMetricsDataRepository} — delegates to Spring Data JPA (profile: !lambda)</li>
 *   <li>{@code DynamoRecruitmentMetricsRepository} — DynamoDB single-table design (serverless)</li>
 * </ul>
 * <p>
 * All IDs are represented as {@code String} so both JPA (Long) and DynamoDB (String)
 * backends can be supported. JPA wrappers convert between Long and String internally.
 */
public interface RecruitmentMetricsDataRepository {

    // -- CRUD -----------------------------------------------------------------

    Optional<RecruitmentMetrics> findById(String id);

    RecruitmentMetrics save(RecruitmentMetrics entity);

    List<RecruitmentMetrics> saveAll(List<RecruitmentMetrics> entities);

    void deleteById(String id);

    boolean existsById(String id);

    // -- Basic date range queries ---------------------------------------------

    List<RecruitmentMetrics> findByMetricDateBetween(LocalDate startDate, LocalDate endDate);

    List<RecruitmentMetrics> findByMetricCategoryAndMetricDateBetween(
        String metricCategory, LocalDate startDate, LocalDate endDate);

    List<RecruitmentMetrics> findByMetricNameAndMetricDateBetween(
        String metricName, LocalDate startDate, LocalDate endDate);

    List<RecruitmentMetrics> findByDepartmentAndMetricDateBetween(
        String department, LocalDate startDate, LocalDate endDate);

    Optional<RecruitmentMetrics> findByMetricNameAndMetricDateAndDepartment(
        String metricName, LocalDate metricDate, String department);

    // -- Latest metrics -------------------------------------------------------

    List<RecruitmentMetrics> findLatestByMetricNameAndDepartment(
        String metricName, String department, int limit);

    List<RecruitmentMetrics> findLatestByCategoryOrderByDate(String category);

    // -- KPI Dashboard queries ------------------------------------------------

    List<String> findAllKPIMetricNames();

    List<RecruitmentMetrics> findCurrentKPIs();

    List<RecruitmentMetrics> findCurrentKPIsByDepartment(String department);

    // -- Trend analysis -------------------------------------------------------

    List<RecruitmentMetrics> findTrendData(String metricName, String department,
                                           LocalDate startDate, LocalDate endDate);

    List<RecruitmentMetrics> findCategoryTrends(String category,
                                                LocalDate startDate, LocalDate endDate);

    // -- Performance analysis -------------------------------------------------

    List<RecruitmentMetrics> findMetricsBelowTarget();

    List<RecruitmentMetrics> findMetricsAboveTarget();

    List<RecruitmentMetrics> findDecliningMetrics(LocalDate recentDate);

    // -- Aggregation queries --------------------------------------------------

    List<Object[]> getAverageMetricByDepartment(String metricName,
                                                LocalDate startDate, LocalDate endDate);

    List<Object[]> getCategoryStatistics(String category,
                                         LocalDate startDate, LocalDate endDate);

    List<Object[]> getDailyTotals(String metricName,
                                  LocalDate startDate, LocalDate endDate);

    List<Object[]> getMonthlyAverages(String metricName,
                                      LocalDate startDate, LocalDate endDate);

    // -- Comparison queries ---------------------------------------------------

    List<RecruitmentMetrics> findCurrentPeriodMetrics(String metricName, LocalDate currentDate);

    List<RecruitmentMetrics> findPreviousPeriodMetrics(String metricName, LocalDate previousDate);

    // -- Benchmark analysis ---------------------------------------------------

    List<RecruitmentMetrics> findMetricsBelowBenchmark();

    List<Object[]> getBenchmarkComparison(LocalDate startDate, LocalDate endDate);

    // -- Recruiter performance ------------------------------------------------

    List<Object[]> getRecruiterPerformance(LocalDate startDate, LocalDate endDate);

    List<RecruitmentMetrics> findByRecruiterAndDateRange(String recruiterId,
                                                         LocalDate startDate, LocalDate endDate);

    // -- Hiring manager analytics ---------------------------------------------

    List<Object[]> getHiringManagerPerformance(LocalDate startDate, LocalDate endDate);

    // -- Job posting analytics ------------------------------------------------

    List<RecruitmentMetrics> findByJobPostingAndDateRange(String jobPostingId,
                                                          LocalDate startDate, LocalDate endDate);

    List<Object[]> getJobPostingMetrics(LocalDate startDate, LocalDate endDate);

    // -- Search and filtering -------------------------------------------------

    CursorPage<RecruitmentMetrics> searchMetrics(String metricCategory, String metricName,
                                                  String department, String recruiterId,
                                                  String hiringManagerId,
                                                  LocalDate startDate, LocalDate endDate,
                                                  int page, int pageSize);

    // -- Alerts and notifications ---------------------------------------------

    List<RecruitmentMetrics> findMetricsWithSignificantVariance(
        BigDecimal thresholdPercentage, LocalDate recentDate);

    // -- Data quality ---------------------------------------------------------

    long countMissingValues(LocalDate startDate, LocalDate endDate);

    List<Object[]> getDataSourceCounts(LocalDate startDate, LocalDate endDate);

    // -- Cleanup and maintenance ----------------------------------------------

    List<RecruitmentMetrics> findInactiveMetrics();

    List<RecruitmentMetrics> findOldMetrics(LocalDate cutoffDate);
}
