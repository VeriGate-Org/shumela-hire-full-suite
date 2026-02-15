package com.example.recruitment.repository;

import com.example.recruitment.entity.RecruitmentMetrics;
import com.example.recruitment.entity.MetricType;
import com.example.recruitment.entity.TrendDirection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecruitmentMetricsRepository extends JpaRepository<RecruitmentMetrics, Long> {

    // Basic queries
    List<RecruitmentMetrics> findByMetricDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<RecruitmentMetrics> findByMetricCategoryAndMetricDateBetween(
        String metricCategory, LocalDate startDate, LocalDate endDate);
    
    List<RecruitmentMetrics> findByMetricNameAndMetricDateBetween(
        String metricName, LocalDate startDate, LocalDate endDate);
    
    List<RecruitmentMetrics> findByDepartmentAndMetricDateBetween(
        String department, LocalDate startDate, LocalDate endDate);
    
    Optional<RecruitmentMetrics> findByMetricNameAndMetricDateAndDepartment(
        String metricName, LocalDate metricDate, String department);

    // Latest metrics
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricName = :metricName " +
           "AND rm.department = :department AND rm.isActive = true " +
           "ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findLatestByMetricNameAndDepartment(
        @Param("metricName") String metricName, @Param("department") String department,
        Pageable pageable);

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricCategory = :category " +
           "AND rm.isActive = true ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findLatestByCategoryOrderByDate(@Param("category") String category);

    // KPI Dashboard queries
    @Query("SELECT DISTINCT rm.metricName FROM RecruitmentMetrics rm WHERE rm.metricCategory = 'KPI' " +
           "AND rm.isActive = true ORDER BY rm.metricName")
    List<String> findAllKPIMetricNames();

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricCategory = 'KPI' " +
           "AND rm.metricDate = (SELECT MAX(rm2.metricDate) FROM RecruitmentMetrics rm2 " +
           "WHERE rm2.metricName = rm.metricName AND rm2.isActive = true) " +
           "AND rm.isActive = true")
    List<RecruitmentMetrics> findCurrentKPIs();

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricCategory = 'KPI' " +
           "AND rm.department = :department " +
           "AND rm.metricDate = (SELECT MAX(rm2.metricDate) FROM RecruitmentMetrics rm2 " +
           "WHERE rm2.metricName = rm.metricName AND rm2.department = :department AND rm2.isActive = true) " +
           "AND rm.isActive = true")
    List<RecruitmentMetrics> findCurrentKPIsByDepartment(@Param("department") String department);

    // Trend analysis
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricName = :metricName " +
           "AND rm.department = :department AND rm.metricDate BETWEEN :startDate AND :endDate " +
           "AND rm.isActive = true ORDER BY rm.metricDate ASC")
    List<RecruitmentMetrics> findTrendData(@Param("metricName") String metricName,
                                          @Param("department") String department,
                                          @Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricCategory = :category " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate " +
           "AND rm.isActive = true ORDER BY rm.metricDate ASC, rm.metricName ASC")
    List<RecruitmentMetrics> findCategoryTrends(@Param("category") String category,
                                               @Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate);

    // Performance analysis
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.targetValue IS NOT NULL " +
           "AND rm.metricValue < rm.targetValue AND rm.isActive = true " +
           "ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findMetricsBelowTarget();

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.targetValue IS NOT NULL " +
           "AND rm.metricValue > rm.targetValue AND rm.isActive = true " +
           "ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findMetricsAboveTarget();

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.trendDirection = 'DOWN' " +
           "AND rm.metricDate >= :recentDate AND rm.isActive = true " +
           "ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findDecliningMetrics(@Param("recentDate") LocalDate recentDate);

    // Aggregation queries
    @Query("SELECT rm.department, AVG(rm.metricValue) FROM RecruitmentMetrics rm " +
           "WHERE rm.metricName = :metricName AND rm.metricDate BETWEEN :startDate AND :endDate " +
           "AND rm.isActive = true GROUP BY rm.department")
    List<Object[]> getAverageMetricByDepartment(@Param("metricName") String metricName,
                                               @Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate);

    @Query("SELECT rm.metricName, AVG(rm.metricValue), MAX(rm.metricValue), MIN(rm.metricValue) " +
           "FROM RecruitmentMetrics rm WHERE rm.metricCategory = :category " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "GROUP BY rm.metricName")
    List<Object[]> getCategoryStatistics(@Param("category") String category,
                                        @Param("startDate") LocalDate startDate,
                                        @Param("endDate") LocalDate endDate);

    @Query("SELECT DATE(rm.metricDate), SUM(rm.metricValue) FROM RecruitmentMetrics rm " +
           "WHERE rm.metricName = :metricName AND rm.metricDate BETWEEN :startDate AND :endDate " +
           "AND rm.isActive = true GROUP BY DATE(rm.metricDate) ORDER BY DATE(rm.metricDate)")
    List<Object[]> getDailyTotals(@Param("metricName") String metricName,
                                 @Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate);

    @Query("SELECT YEAR(rm.metricDate), MONTH(rm.metricDate), AVG(rm.metricValue) " +
           "FROM RecruitmentMetrics rm WHERE rm.metricName = :metricName " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "GROUP BY YEAR(rm.metricDate), MONTH(rm.metricDate) " +
           "ORDER BY YEAR(rm.metricDate), MONTH(rm.metricDate)")
    List<Object[]> getMonthlyAverages(@Param("metricName") String metricName,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate);

    // Comparison queries
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricName = :metricName " +
           "AND rm.metricDate = :currentDate AND rm.isActive = true")
    List<RecruitmentMetrics> findCurrentPeriodMetrics(@Param("metricName") String metricName,
                                                      @Param("currentDate") LocalDate currentDate);

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricName = :metricName " +
           "AND rm.metricDate = :previousDate AND rm.isActive = true")
    List<RecruitmentMetrics> findPreviousPeriodMetrics(@Param("metricName") String metricName,
                                                       @Param("previousDate") LocalDate previousDate);

    // Benchmark analysis
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.benchmarkValue IS NOT NULL " +
           "AND rm.metricValue < rm.benchmarkValue AND rm.isActive = true " +
           "ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findMetricsBelowBenchmark();

    @Query("SELECT rm.metricName, AVG(rm.metricValue) as avgValue, rm.benchmarkValue " +
           "FROM RecruitmentMetrics rm WHERE rm.benchmarkValue IS NOT NULL " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "GROUP BY rm.metricName, rm.benchmarkValue")
    List<Object[]> getBenchmarkComparison(@Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);

    // Recruiter performance
    @Query("SELECT rm.recruiterId, rm.metricName, AVG(rm.metricValue) " +
           "FROM RecruitmentMetrics rm WHERE rm.recruiterId IS NOT NULL " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "GROUP BY rm.recruiterId, rm.metricName")
    List<Object[]> getRecruiterPerformance(@Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.recruiterId = :recruiterId " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findByRecruiterAndDateRange(@Param("recruiterId") Long recruiterId,
                                                         @Param("startDate") LocalDate startDate,
                                                         @Param("endDate") LocalDate endDate);

    // Hiring manager analytics
    @Query("SELECT rm.hiringManagerId, rm.metricName, AVG(rm.metricValue) " +
           "FROM RecruitmentMetrics rm WHERE rm.hiringManagerId IS NOT NULL " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "GROUP BY rm.hiringManagerId, rm.metricName")
    List<Object[]> getHiringManagerPerformance(@Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

    // Job posting analytics
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.jobPostingId = :jobPostingId " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "ORDER BY rm.metricDate DESC")
    List<RecruitmentMetrics> findByJobPostingAndDateRange(@Param("jobPostingId") Long jobPostingId,
                                                          @Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT rm.jobPostingId, rm.metricName, SUM(rm.metricValue) " +
           "FROM RecruitmentMetrics rm WHERE rm.jobPostingId IS NOT NULL " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "GROUP BY rm.jobPostingId, rm.metricName")
    List<Object[]> getJobPostingMetrics(@Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate);

    // Search and filtering
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE " +
           "(:metricCategory IS NULL OR rm.metricCategory = :metricCategory) AND " +
           "(:metricName IS NULL OR rm.metricName LIKE %:metricName%) AND " +
           "(:department IS NULL OR rm.department = :department) AND " +
           "(:recruiterId IS NULL OR rm.recruiterId = :recruiterId) AND " +
           "(:hiringManagerId IS NULL OR rm.hiringManagerId = :hiringManagerId) AND " +
           "(:startDate IS NULL OR rm.metricDate >= :startDate) AND " +
           "(:endDate IS NULL OR rm.metricDate <= :endDate) AND " +
           "rm.isActive = true")
    Page<RecruitmentMetrics> searchMetrics(@Param("metricCategory") String metricCategory,
                                          @Param("metricName") String metricName,
                                          @Param("department") String department,
                                          @Param("recruiterId") Long recruiterId,
                                          @Param("hiringManagerId") Long hiringManagerId,
                                          @Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate,
                                          Pageable pageable);

    // Alerts and notifications
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.targetValue IS NOT NULL " +
           "AND ABS(rm.metricValue - rm.targetValue) / rm.targetValue > :thresholdPercentage " +
           "AND rm.metricDate >= :recentDate AND rm.isActive = true")
    List<RecruitmentMetrics> findMetricsWithSignificantVariance(
        @Param("thresholdPercentage") BigDecimal thresholdPercentage,
        @Param("recentDate") LocalDate recentDate);

    // Data quality
    @Query("SELECT COUNT(rm) FROM RecruitmentMetrics rm WHERE rm.metricValue IS NULL " +
           "AND rm.metricDate BETWEEN :startDate AND :endDate")
    Long countMissingValues(@Param("startDate") LocalDate startDate,
                           @Param("endDate") LocalDate endDate);

    @Query("SELECT rm.dataSource, COUNT(rm) FROM RecruitmentMetrics rm " +
           "WHERE rm.metricDate BETWEEN :startDate AND :endDate AND rm.isActive = true " +
           "GROUP BY rm.dataSource")
    List<Object[]> getDataSourceCounts(@Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);

    // Cleanup and maintenance
    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.isActive = false")
    List<RecruitmentMetrics> findInactiveMetrics();

    @Query("SELECT rm FROM RecruitmentMetrics rm WHERE rm.metricDate < :cutoffDate")
    List<RecruitmentMetrics> findOldMetrics(@Param("cutoffDate") LocalDate cutoffDate);
}