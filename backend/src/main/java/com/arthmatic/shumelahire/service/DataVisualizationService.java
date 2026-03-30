package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.InterviewDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DataVisualizationService {

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private InterviewDataRepository interviewRepository;

    @Autowired
    private PerformanceAnalyticsService performanceAnalyticsService;

    /**
     * Generate chart data for application status distribution
     */
    public Map<String, Object> getApplicationStatusChart() {
        List<Object[]> statusCounts = applicationRepository.findApplicationCountByStatus();
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("type", "pie");
        chartData.put("title", "Application Status Distribution");
        
        List<String> labels = new ArrayList<>();
        List<Integer> data = new ArrayList<>();
        List<String> colors = Arrays.asList(
            "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#05527E", "#06B6D4", "#84CC16"
        );
        
        for (Object[] row : statusCounts) {
            labels.add((String) row[0]);
            data.add(((Long) row[1]).intValue());
        }
        
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(Map.of(
            "data", data,
            "backgroundColor", colors.subList(0, Math.min(colors.size(), labels.size())),
            "borderWidth", 1
        )));
        
        return chartData;
    }

    /**
     * Generate chart data for applications over time
     */
    public Map<String, Object> getApplicationsTimelineChart(LocalDateTime fromDate) {
        List<Object[]> timeline = applicationRepository.findApplicationCountByDate(fromDate);
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("type", "line");
        chartData.put("title", "Applications Over Time");
        
        List<String> labels = new ArrayList<>();
        List<Integer> data = new ArrayList<>();
        
        for (Object[] row : timeline) {
            labels.add(row[0].toString());
            data.add(((Long) row[1]).intValue());
        }
        
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(Map.of(
            "label", "Applications",
            "data", data,
            "borderColor", "#3B82F6",
            "backgroundColor", "rgba(59, 130, 246, 0.1)",
            "tension", 0.4
        )));
        
        return chartData;
    }

    /**
     * Generate chart data for top positions by application count
     */
    public Map<String, Object> getTopPositionsChart() {
        List<Object[]> positions = applicationRepository.findTopPositionsByApplicationCount();
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("type", "horizontalBar");
        chartData.put("title", "Top Positions by Applications");
        
        List<String> labels = new ArrayList<>();
        List<Integer> data = new ArrayList<>();
        
        // Take top 10 positions
        for (int i = 0; i < Math.min(10, positions.size()); i++) {
            Object[] row = positions.get(i);
            labels.add((String) row[0]);
            data.add(((Long) row[1]).intValue());
        }
        
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(Map.of(
            "label", "Applications",
            "data", data,
            "backgroundColor", "#10B981",
            "borderColor", "#059669",
            "borderWidth", 1
        )));
        
        return chartData;
    }

    /**
     * Generate chart data for recruitment source effectiveness
     */
    public Map<String, Object> getSourceEffectivenessChart() {
        Map<String, Object> analytics = performanceAnalyticsService.getRecruitmentMetrics();
        @SuppressWarnings("unchecked")
        Map<String, Object> sourceData = (Map<String, Object>) analytics.get("sourceEffectiveness");
        @SuppressWarnings("unchecked")
        Map<String, Map<String, Object>> bySource = (Map<String, Map<String, Object>>) sourceData.get("bySource");
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("type", "bar");
        chartData.put("title", "Recruitment Source Effectiveness");
        
        List<String> labels = new ArrayList<>(bySource.keySet());
        List<Integer> applications = new ArrayList<>();
        List<Integer> hires = new ArrayList<>();
        List<Double> conversionRates = new ArrayList<>();
        
        for (String source : labels) {
            Map<String, Object> data = bySource.get(source);
            applications.add(((Number) data.get("totalApplications")).intValue());
            hires.add(((Number) data.get("hires")).intValue());
            conversionRates.add(((Number) data.get("conversionRate")).doubleValue());
        }
        
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(
            Map.of(
                "label", "Applications",
                "data", applications,
                "backgroundColor", "#3B82F6",
                "yAxisID", "y"
            ),
            Map.of(
                "label", "Hires",
                "data", hires,
                "backgroundColor", "#10B981",
                "yAxisID", "y"
            ),
            Map.of(
                "label", "Conversion Rate (%)",
                "data", conversionRates,
                "type", "line",
                "borderColor", "#EF4444",
                "backgroundColor", "transparent",
                "yAxisID", "y1"
            )
        ));
        
        // Add scale configuration
        chartData.put("scales", Map.of(
            "y", Map.of(
                "type", "linear",
                "display", true,
                "position", "left"
            ),
            "y1", Map.of(
                "type", "linear",
                "display", true,
                "position", "right",
                "grid", Map.of("drawOnChartArea", false)
            )
        ));
        
        return chartData;
    }

    /**
     * Generate chart data for interview performance ratings
     */
    public Map<String, Object> getInterviewRatingsChart() {
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("type", "radar");
        chartData.put("title", "Average Interview Ratings by Category");
        
        // Get interview analytics
        Map<String, Object> interviewAnalytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
        @SuppressWarnings("unchecked")
        Map<String, Object> averageScores = (Map<String, Object>) interviewAnalytics.get("averageScores");
        
        List<String> labels = Arrays.asList(
            "Technical", "Communication", "Cultural Fit", "Overall"
        );
        
        List<Double> data = Arrays.asList(
            ((Number) averageScores.get("technicalScore")).doubleValue(),
            ((Number) averageScores.get("communicationScore")).doubleValue(),
            ((Number) averageScores.get("culturalFitScore")).doubleValue(),
            ((Number) averageScores.get("overallRating")).doubleValue()
        );
        
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(Map.of(
            "label", "Average Score",
            "data", data,
            "backgroundColor", "rgba(59, 130, 246, 0.2)",
            "borderColor", "#3B82F6",
            "pointBackgroundColor", "#3B82F6",
            "pointBorderColor", "#ffffff",
            "pointHoverBackgroundColor", "#ffffff",
            "pointHoverBorderColor", "#3B82F6"
        )));
        
        return chartData;
    }

    /**
     * Generate chart data for hiring trends by month
     */
    public Map<String, Object> getHiringTrendsChart() {
        Map<String, Object> trends = performanceAnalyticsService.getHiringTrendsAnalysis();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> monthlyTrends = (List<Map<String, Object>>) trends.get("monthlyTrends");
        
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("type", "line");
        chartData.put("title", "Monthly Hiring Trends");
        
        List<String> labels = new ArrayList<>();
        List<Integer> applications = new ArrayList<>();
        List<Integer> hires = new ArrayList<>();
        
        for (Map<String, Object> trend : monthlyTrends) {
            String month = trend.get("year") + "-" + String.format("%02d", ((Number) trend.get("month")).intValue());
            labels.add(month);
            applications.add(((Number) trend.get("applications")).intValue());
            hires.add(((Number) trend.get("hires")).intValue());
        }
        
        chartData.put("labels", labels);
        chartData.put("datasets", Arrays.asList(
            Map.of(
                "label", "Applications",
                "data", applications,
                "borderColor", "#3B82F6",
                "backgroundColor", "rgba(59, 130, 246, 0.1)",
                "tension", 0.4
            ),
            Map.of(
                "label", "Hires",
                "data", hires,
                "borderColor", "#10B981",
                "backgroundColor", "rgba(16, 185, 129, 0.1)",
                "tension", 0.4
            )
        ));
        
        return chartData;
    }

    /**
     * Generate comprehensive dashboard charts package
     */
    public Map<String, Object> getDashboardCharts(LocalDateTime fromDate) {
        Map<String, Object> dashboardData = new HashMap<>();
        
        dashboardData.put("applicationStatus", getApplicationStatusChart());
        dashboardData.put("applicationsTimeline", getApplicationsTimelineChart(fromDate));
        dashboardData.put("topPositions", getTopPositionsChart());
        dashboardData.put("sourceEffectiveness", getSourceEffectivenessChart());
        dashboardData.put("interviewRatings", getInterviewRatingsChart());
        dashboardData.put("hiringTrends", getHiringTrendsChart());
        
        // Add metadata
        dashboardData.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        dashboardData.put("dateRange", Map.of(
            "from", fromDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
            "to", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
        ));
        
        return dashboardData;
    }

    /**
     * Generate KPI metrics for dashboard widgets
     */
    public Map<String, Object> getKPIWidgets() {
        Map<String, Object> kpis = new HashMap<>();
        
        // Get analytics data
        Map<String, Object> recruitmentMetrics = performanceAnalyticsService.getRecruitmentMetrics();
        Map<String, Object> interviewMetrics = performanceAnalyticsService.getInterviewPerformanceAnalytics();
        
        @SuppressWarnings("unchecked")
        Map<String, Object> timeToHire = (Map<String, Object>) recruitmentMetrics.get("timeToHire");
        @SuppressWarnings("unchecked")
        Map<String, Object> conversionRates = (Map<String, Object>) recruitmentMetrics.get("conversionRates");
        @SuppressWarnings("unchecked")
        Map<String, Object> costMetrics = (Map<String, Object>) recruitmentMetrics.get("costMetrics");
        @SuppressWarnings("unchecked")
        Map<String, Object> schedulingMetrics = (Map<String, Object>) interviewMetrics.get("schedulingMetrics");
        
        // Build KPI widgets
        kpis.put("timeToHire", Map.of(
            "value", timeToHire.get("averageDays"),
            "unit", "days",
            "title", "Avg Time to Hire",
            "trend", "stable",
            "target", 30,
            "color", "blue"
        ));
        
        kpis.put("conversionRate", Map.of(
            "value", conversionRates.get("overallConversion"),
            "unit", "%",
            "title", "Conversion Rate",
            "trend", "up",
            "target", 15.0,
            "color", "green"
        ));
        
        kpis.put("costPerHire", Map.of(
            "value", costMetrics.get("costPerHire"),
            "unit", "$",
            "title", "Cost per Hire",
            "trend", "down",
            "target", 4000.0,
            "color", "purple"
        ));
        
        kpis.put("interviewCompletion", Map.of(
            "value", schedulingMetrics.get("completionRate"),
            "unit", "%",
            "title", "Interview Completion",
            "trend", "up",
            "target", 90.0,
            "color", "orange"
        ));
        
        return kpis;
    }

    /**
     * Generate export data for chart images (for PDF reports)
     */
    public Map<String, Object> getChartExportData(String chartType, LocalDateTime fromDate) {
        switch (chartType.toLowerCase()) {
            case "application-status":
                return getApplicationStatusChart();
            case "applications-timeline":
                return getApplicationsTimelineChart(fromDate);
            case "top-positions":
                return getTopPositionsChart();
            case "source-effectiveness":
                return getSourceEffectivenessChart();
            case "interview-ratings":
                return getInterviewRatingsChart();
            case "hiring-trends":
                return getHiringTrendsChart();
            default:
                return Map.of("error", "Unknown chart type: " + chartType);
        }
    }
}
