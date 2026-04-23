package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.dto.CursorPage;
import com.arthmatic.shumelahire.entity.MetricType;
import com.arthmatic.shumelahire.entity.RecruitmentMetrics;
import com.arthmatic.shumelahire.entity.TrendDirection;
import com.arthmatic.shumelahire.repository.RecruitmentMetricsDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.RecruitmentMetricsItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the RecruitmentMetrics entity.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     RECRUITMENT_METRICS#{id}
 *   GSI1PK: METRIC_TYPE#{tenantId}#{metricType}      GSI1SK: RECRUITMENT_METRICS#{metricDate}
 *   GSI6PK: METRIC_DATE#{tenantId}                    GSI6SK: RECRUITMENT_METRICS#{metricDate}
 * </pre>
 */
@Repository
public class DynamoRecruitmentMetricsRepository extends DynamoRepository<RecruitmentMetricsItem, RecruitmentMetrics>
        implements RecruitmentMetricsDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public DynamoRecruitmentMetricsRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, RecruitmentMetricsItem.class);
    }

    @Override
    protected String entityType() {
        return "RECRUITMENT_METRICS";
    }

    // -- Basic date range queries ---------------------------------------------

    @Override
    public List<RecruitmentMetrics> findByMetricDateBetween(LocalDate startDate, LocalDate endDate) {
        String tenantId = currentTenantId();
        String skStart = "RECRUITMENT_METRICS#" + startDate.format(DATE_FMT);
        String skEnd = "RECRUITMENT_METRICS#" + endDate.format(DATE_FMT) + "~"; // ~ sorts after all dates
        return queryGsiRange("GSI6", "METRIC_DATE#" + tenantId, skStart, skEnd, null, 10000)
                .content();
    }

    @Override
    public List<RecruitmentMetrics> findByMetricCategoryAndMetricDateBetween(
            String metricCategory, LocalDate startDate, LocalDate endDate) {
        return findByMetricDateBetween(startDate, endDate).stream()
                .filter(m -> metricCategory.equals(m.getMetricCategory()))
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findByMetricNameAndMetricDateBetween(
            String metricName, LocalDate startDate, LocalDate endDate) {
        return findByMetricDateBetween(startDate, endDate).stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findByDepartmentAndMetricDateBetween(
            String department, LocalDate startDate, LocalDate endDate) {
        return findByMetricDateBetween(startDate, endDate).stream()
                .filter(m -> department.equals(m.getDepartment()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<RecruitmentMetrics> findByMetricNameAndMetricDateAndDepartment(
            String metricName, LocalDate metricDate, String department) {
        return findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> metricDate.equals(m.getMetricDate()))
                .filter(m -> Objects.equals(department, m.getDepartment()))
                .findFirst();
    }

    // -- Latest metrics -------------------------------------------------------

    @Override
    public List<RecruitmentMetrics> findLatestByMetricNameAndDepartment(
            String metricName, String department, int limit) {
        return findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> department.equals(m.getDepartment()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findLatestByCategoryOrderByDate(String category) {
        return findAll().stream()
                .filter(m -> category.equals(m.getMetricCategory()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .collect(Collectors.toList());
    }

    // -- KPI Dashboard queries ------------------------------------------------

    @Override
    public List<String> findAllKPIMetricNames() {
        return findAll().stream()
                .filter(m -> "KPI".equals(m.getMetricCategory()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .map(RecruitmentMetrics::getMetricName)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findCurrentKPIs() {
        List<RecruitmentMetrics> kpis = findAll().stream()
                .filter(m -> "KPI".equals(m.getMetricCategory()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .collect(Collectors.toList());

        // Group by metric name and get the latest date for each
        Map<String, RecruitmentMetrics> latestByName = new HashMap<>();
        for (RecruitmentMetrics m : kpis) {
            latestByName.merge(m.getMetricName(), m, (existing, candidate) ->
                    candidate.getMetricDate().isAfter(existing.getMetricDate()) ? candidate : existing);
        }
        return new ArrayList<>(latestByName.values());
    }

    @Override
    public List<RecruitmentMetrics> findCurrentKPIsByDepartment(String department) {
        List<RecruitmentMetrics> kpis = findAll().stream()
                .filter(m -> "KPI".equals(m.getMetricCategory()))
                .filter(m -> department.equals(m.getDepartment()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .collect(Collectors.toList());

        Map<String, RecruitmentMetrics> latestByName = new HashMap<>();
        for (RecruitmentMetrics m : kpis) {
            latestByName.merge(m.getMetricName(), m, (existing, candidate) ->
                    candidate.getMetricDate().isAfter(existing.getMetricDate()) ? candidate : existing);
        }
        return new ArrayList<>(latestByName.values());
    }

    // -- Trend analysis -------------------------------------------------------

    @Override
    public List<RecruitmentMetrics> findTrendData(String metricName, String department,
                                                   LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> department.equals(m.getDepartment()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate))
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findCategoryTrends(String category,
                                                        LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(m -> category.equals(m.getMetricCategory()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate)
                        .thenComparing(RecruitmentMetrics::getMetricName))
                .collect(Collectors.toList());
    }

    // -- Performance analysis -------------------------------------------------

    @Override
    public List<RecruitmentMetrics> findMetricsBelowTarget() {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getTargetValue() != null)
                .filter(m -> m.getMetricValue().compareTo(m.getTargetValue()) < 0)
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findMetricsAboveTarget() {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getTargetValue() != null)
                .filter(m -> m.getMetricValue().compareTo(m.getTargetValue()) > 0)
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findDecliningMetrics(LocalDate recentDate) {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> TrendDirection.DOWN.equals(m.getTrendDirection()))
                .filter(m -> !m.getMetricDate().isBefore(recentDate))
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .collect(Collectors.toList());
    }

    // -- Aggregation queries --------------------------------------------------

    @Override
    public List<Object[]> getAverageMetricByDepartment(String metricName,
                                                        LocalDate startDate, LocalDate endDate) {
        Map<String, List<RecruitmentMetrics>> byDept = findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .filter(m -> m.getDepartment() != null)
                .collect(Collectors.groupingBy(RecruitmentMetrics::getDepartment));

        List<Object[]> results = new ArrayList<>();
        byDept.forEach((dept, metrics) -> {
            BigDecimal avg = metrics.stream()
                    .map(RecruitmentMetrics::getMetricValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(metrics.size()), 4, java.math.RoundingMode.HALF_UP);
            results.add(new Object[]{dept, avg});
        });
        return results;
    }

    @Override
    public List<Object[]> getCategoryStatistics(String category,
                                                 LocalDate startDate, LocalDate endDate) {
        Map<String, List<RecruitmentMetrics>> byName = findAll().stream()
                .filter(m -> category.equals(m.getMetricCategory()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.groupingBy(RecruitmentMetrics::getMetricName));

        List<Object[]> results = new ArrayList<>();
        byName.forEach((name, metrics) -> {
            BigDecimal avg = metrics.stream().map(RecruitmentMetrics::getMetricValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(metrics.size()), 4, java.math.RoundingMode.HALF_UP);
            BigDecimal max = metrics.stream().map(RecruitmentMetrics::getMetricValue)
                    .max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            BigDecimal min = metrics.stream().map(RecruitmentMetrics::getMetricValue)
                    .min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO);
            results.add(new Object[]{name, avg, max, min});
        });
        return results;
    }

    @Override
    public List<Object[]> getDailyTotals(String metricName,
                                          LocalDate startDate, LocalDate endDate) {
        Map<LocalDate, BigDecimal> byDate = findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.groupingBy(RecruitmentMetrics::getMetricDate,
                        Collectors.reducing(BigDecimal.ZERO, RecruitmentMetrics::getMetricValue, BigDecimal::add)));

        return byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getMonthlyAverages(String metricName,
                                              LocalDate startDate, LocalDate endDate) {
        Map<String, List<RecruitmentMetrics>> byMonth = findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.groupingBy(m ->
                        m.getMetricDate().getYear() + "-" + String.format("%02d", m.getMetricDate().getMonthValue())));

        return byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    String[] parts = e.getKey().split("-");
                    BigDecimal avg = e.getValue().stream().map(RecruitmentMetrics::getMetricValue)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(e.getValue().size()), 4, java.math.RoundingMode.HALF_UP);
                    return new Object[]{Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), avg};
                })
                .collect(Collectors.toList());
    }

    // -- Comparison queries ---------------------------------------------------

    @Override
    public List<RecruitmentMetrics> findCurrentPeriodMetrics(String metricName, LocalDate currentDate) {
        return findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> currentDate.equals(m.getMetricDate()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findPreviousPeriodMetrics(String metricName, LocalDate previousDate) {
        return findAll().stream()
                .filter(m -> metricName.equals(m.getMetricName()))
                .filter(m -> previousDate.equals(m.getMetricDate()))
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .collect(Collectors.toList());
    }

    // -- Benchmark analysis ---------------------------------------------------

    @Override
    public List<RecruitmentMetrics> findMetricsBelowBenchmark() {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getBenchmarkValue() != null)
                .filter(m -> m.getMetricValue().compareTo(m.getBenchmarkValue()) < 0)
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getBenchmarkComparison(LocalDate startDate, LocalDate endDate) {
        Map<String, List<RecruitmentMetrics>> byName = findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getBenchmarkValue() != null)
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.groupingBy(m -> m.getMetricName() + "|" + m.getBenchmarkValue()));

        List<Object[]> results = new ArrayList<>();
        byName.forEach((key, metrics) -> {
            String metricName = key.split("\\|")[0];
            BigDecimal benchmark = metrics.get(0).getBenchmarkValue();
            BigDecimal avg = metrics.stream().map(RecruitmentMetrics::getMetricValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(metrics.size()), 4, java.math.RoundingMode.HALF_UP);
            results.add(new Object[]{metricName, avg, benchmark});
        });
        return results;
    }

    // -- Recruiter performance ------------------------------------------------

    @Override
    public List<Object[]> getRecruiterPerformance(LocalDate startDate, LocalDate endDate) {
        Map<String, List<RecruitmentMetrics>> byRecruiterAndMetric = findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getRecruiterId() != null)
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.groupingBy(m -> m.getRecruiterId() + "|" + m.getMetricName()));

        List<Object[]> results = new ArrayList<>();
        byRecruiterAndMetric.forEach((key, metrics) -> {
            String[] parts = key.split("\\|");
            String recruiterId = parts[0];
            String metricName = parts[1];
            BigDecimal avg = metrics.stream().map(RecruitmentMetrics::getMetricValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(metrics.size()), 4, java.math.RoundingMode.HALF_UP);
            results.add(new Object[]{recruiterId, metricName, avg});
        });
        return results;
    }

    @Override
    public List<RecruitmentMetrics> findByRecruiterAndDateRange(String recruiterId,
                                                                 LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> recruiterId.equals(m.getRecruiterId()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .collect(Collectors.toList());
    }

    // -- Hiring manager analytics ---------------------------------------------

    @Override
    public List<Object[]> getHiringManagerPerformance(LocalDate startDate, LocalDate endDate) {
        Map<String, List<RecruitmentMetrics>> byManagerAndMetric = findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getHiringManagerId() != null)
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.groupingBy(m -> m.getHiringManagerId() + "|" + m.getMetricName()));

        List<Object[]> results = new ArrayList<>();
        byManagerAndMetric.forEach((key, metrics) -> {
            String[] parts = key.split("\\|");
            String managerId = parts[0];
            String metricName = parts[1];
            BigDecimal avg = metrics.stream().map(RecruitmentMetrics::getMetricValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(metrics.size()), 4, java.math.RoundingMode.HALF_UP);
            results.add(new Object[]{managerId, metricName, avg});
        });
        return results;
    }

    // -- Job posting analytics ------------------------------------------------

    @Override
    public List<RecruitmentMetrics> findByJobPostingAndDateRange(String jobPostingId,
                                                                  LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> jobPostingId.equals(m.getJobPostingId()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .sorted(Comparator.comparing(RecruitmentMetrics::getMetricDate).reversed())
                .collect(Collectors.toList());
    }

    @Override
    public List<Object[]> getJobPostingMetrics(LocalDate startDate, LocalDate endDate) {
        Map<String, List<RecruitmentMetrics>> byJobAndMetric = findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getJobPostingId() != null)
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.groupingBy(m -> m.getJobPostingId() + "|" + m.getMetricName()));

        List<Object[]> results = new ArrayList<>();
        byJobAndMetric.forEach((key, metrics) -> {
            String[] parts = key.split("\\|");
            String jobPostingId = parts[0];
            String metricName = parts[1];
            BigDecimal sum = metrics.stream().map(RecruitmentMetrics::getMetricValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            results.add(new Object[]{jobPostingId, metricName, sum});
        });
        return results;
    }

    // -- Search and filtering -------------------------------------------------

    @Override
    public CursorPage<RecruitmentMetrics> searchMetrics(String metricCategory, String metricName,
                                                         String department, String recruiterId,
                                                         String hiringManagerId,
                                                         LocalDate startDate, LocalDate endDate,
                                                         int page, int pageSize) {
        List<RecruitmentMetrics> all = findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> metricCategory == null || metricCategory.equals(m.getMetricCategory()))
                .filter(m -> metricName == null || (m.getMetricName() != null && m.getMetricName().contains(metricName)))
                .filter(m -> department == null || department.equals(m.getDepartment()))
                .filter(m -> recruiterId == null || recruiterId.equals(m.getRecruiterId()))
                .filter(m -> hiringManagerId == null || hiringManagerId.equals(m.getHiringManagerId()))
                .filter(m -> startDate == null || !m.getMetricDate().isBefore(startDate))
                .filter(m -> endDate == null || !m.getMetricDate().isAfter(endDate))
                .collect(Collectors.toList());

        int start = page * pageSize;
        if (start >= all.size()) {
            return CursorPage.empty();
        }
        int end = Math.min(start + pageSize, all.size());
        List<RecruitmentMetrics> pageContent = all.subList(start, end);
        boolean hasMore = end < all.size();
        return new CursorPage<>(pageContent, hasMore ? String.valueOf(page + 1) : null, hasMore, pageContent.size(), (long) all.size());
    }

    // -- Alerts and notifications ---------------------------------------------

    @Override
    public List<RecruitmentMetrics> findMetricsWithSignificantVariance(
            BigDecimal thresholdPercentage, LocalDate recentDate) {
        return findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> m.getTargetValue() != null && m.getTargetValue().compareTo(BigDecimal.ZERO) != 0)
                .filter(m -> !m.getMetricDate().isBefore(recentDate))
                .filter(m -> {
                    BigDecimal variance = m.getMetricValue().subtract(m.getTargetValue()).abs()
                            .divide(m.getTargetValue(), 4, java.math.RoundingMode.HALF_UP);
                    return variance.compareTo(thresholdPercentage) > 0;
                })
                .collect(Collectors.toList());
    }

    // -- Data quality ---------------------------------------------------------

    @Override
    public long countMissingValues(LocalDate startDate, LocalDate endDate) {
        return findAll().stream()
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .filter(m -> m.getMetricValue() == null)
                .count();
    }

    @Override
    public List<Object[]> getDataSourceCounts(LocalDate startDate, LocalDate endDate) {
        Map<String, Long> bySource = findAll().stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                .filter(m -> !m.getMetricDate().isBefore(startDate) && !m.getMetricDate().isAfter(endDate))
                .filter(m -> m.getDataSource() != null)
                .collect(Collectors.groupingBy(RecruitmentMetrics::getDataSource, Collectors.counting()));

        return bySource.entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList());
    }

    // -- Cleanup and maintenance ----------------------------------------------

    @Override
    public List<RecruitmentMetrics> findInactiveMetrics() {
        return findAll().stream()
                .filter(m -> Boolean.FALSE.equals(m.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public List<RecruitmentMetrics> findOldMetrics(LocalDate cutoffDate) {
        return findAll().stream()
                .filter(m -> m.getMetricDate().isBefore(cutoffDate))
                .collect(Collectors.toList());
    }

    // -- Conversion: RecruitmentMetricsItem <-> RecruitmentMetrics ------------

    @Override
    protected RecruitmentMetrics toEntity(RecruitmentMetricsItem item) {
        var entity = new RecruitmentMetrics();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setTenantId(item.getTenantId());
        if (item.getMetricDate() != null) entity.setMetricDate(LocalDate.parse(item.getMetricDate(), DATE_FMT));
        if (item.getMetricType() != null) entity.setMetricType(MetricType.valueOf(item.getMetricType()));
        entity.setMetricCategory(item.getMetricCategory());
        entity.setMetricName(item.getMetricName());
        if (item.getMetricValue() != null) entity.setMetricValue(new BigDecimal(item.getMetricValue()));
        entity.setDepartment(item.getDepartment());
        if (item.getJobPostingId() != null) entity.setJobPostingId(item.getJobPostingId());
        if (item.getRecruiterId() != null) entity.setRecruiterId(item.getRecruiterId());
        if (item.getHiringManagerId() != null) entity.setHiringManagerId(item.getHiringManagerId());
        if (item.getPeriodStartDate() != null) entity.setPeriodStartDate(LocalDate.parse(item.getPeriodStartDate(), DATE_FMT));
        if (item.getPeriodEndDate() != null) entity.setPeriodEndDate(LocalDate.parse(item.getPeriodEndDate(), DATE_FMT));
        if (item.getTargetValue() != null) entity.setTargetValue(new BigDecimal(item.getTargetValue()));
        if (item.getPreviousPeriodValue() != null) entity.setPreviousPeriodValue(new BigDecimal(item.getPreviousPeriodValue()));
        if (item.getVariancePercentage() != null) entity.setVariancePercentage(new BigDecimal(item.getVariancePercentage()));
        if (item.getTrendDirection() != null) entity.setTrendDirection(TrendDirection.valueOf(item.getTrendDirection()));
        if (item.getBenchmarkValue() != null) entity.setBenchmarkValue(new BigDecimal(item.getBenchmarkValue()));
        entity.setNotes(item.getNotes());
        entity.setDataSource(item.getDataSource());
        entity.setCalculationMethod(item.getCalculationMethod());
        entity.setIsActive(item.getIsActive());
        if (item.getCreatedAt() != null) entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        if (item.getUpdatedAt() != null) entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        if (item.getCreatedBy() != null) entity.setCreatedBy(item.getCreatedBy());
        return entity;
    }

    @Override
    protected RecruitmentMetricsItem toItem(RecruitmentMetrics entity) {
        var item = new RecruitmentMetricsItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String metricDateStr = entity.getMetricDate() != null ? entity.getMetricDate().format(DATE_FMT) : LocalDate.now().format(DATE_FMT);

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("RECRUITMENT_METRICS#" + id);

        // GSI1: Metric type index
        item.setGsi1pk("METRIC_TYPE#" + tenantId + "#" + (entity.getMetricType() != null ? entity.getMetricType().name() : ""));
        item.setGsi1sk("RECRUITMENT_METRICS#" + metricDateStr);

        // GSI6: Date range index
        item.setGsi6pk("METRIC_DATE#" + tenantId);
        item.setGsi6sk("RECRUITMENT_METRICS#" + metricDateStr);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setMetricDate(metricDateStr);
        if (entity.getMetricType() != null) item.setMetricType(entity.getMetricType().name());
        item.setMetricCategory(entity.getMetricCategory());
        item.setMetricName(entity.getMetricName());
        if (entity.getMetricValue() != null) item.setMetricValue(entity.getMetricValue().toPlainString());
        item.setDepartment(entity.getDepartment());
        if (entity.getJobPostingId() != null) item.setJobPostingId(entity.getJobPostingId());
        if (entity.getRecruiterId() != null) item.setRecruiterId(entity.getRecruiterId());
        if (entity.getHiringManagerId() != null) item.setHiringManagerId(entity.getHiringManagerId());
        if (entity.getPeriodStartDate() != null) item.setPeriodStartDate(entity.getPeriodStartDate().format(DATE_FMT));
        if (entity.getPeriodEndDate() != null) item.setPeriodEndDate(entity.getPeriodEndDate().format(DATE_FMT));
        if (entity.getTargetValue() != null) item.setTargetValue(entity.getTargetValue().toPlainString());
        if (entity.getPreviousPeriodValue() != null) item.setPreviousPeriodValue(entity.getPreviousPeriodValue().toPlainString());
        if (entity.getVariancePercentage() != null) item.setVariancePercentage(entity.getVariancePercentage().toPlainString());
        if (entity.getTrendDirection() != null) item.setTrendDirection(entity.getTrendDirection().name());
        if (entity.getBenchmarkValue() != null) item.setBenchmarkValue(entity.getBenchmarkValue().toPlainString());
        item.setNotes(entity.getNotes());
        item.setDataSource(entity.getDataSource());
        item.setCalculationMethod(entity.getCalculationMethod());
        item.setIsActive(entity.getIsActive());
        if (entity.getCreatedAt() != null) item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        if (entity.getUpdatedAt() != null) item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        if (entity.getCreatedBy() != null) item.setCreatedBy(entity.getCreatedBy());

        return item;
    }
}
