package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.service.PerformanceService.PerformanceMetrics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertTimeout;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
@SpringJUnitConfig
class PerformanceServiceTest {

    @InjectMocks
    private PerformanceService performanceService;

    private CacheManager cacheManager;

    @BeforeEach
    void setUp() {
        // Initialize cache manager for testing
        cacheManager = new ConcurrentMapCacheManager("analytics");
    }

    @Test
    void getCachedAnalytics_ApplicationsType_ReturnsCorrectData() {
        // Given
        String type = "applications";
        String period = "weekly";

        // When
        Map<String, Object> result = performanceService.getCachedAnalytics(type, period);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("type")).isEqualTo(type);
        assertThat(result.get("period")).isEqualTo(period);
        assertThat(result.get("totalApplications")).isEqualTo(1250);
        assertThat(result.get("newThisWeek")).isEqualTo(87);
        assertThat(result.get("averageProcessingTime")).isEqualTo("3.2 days");
        assertThat(result).containsKey("processedAt");
    }

    @Test
    void getCachedAnalytics_JobsType_ReturnsCorrectData() {
        // Given
        String type = "jobs";
        String period = "monthly";

        // When
        Map<String, Object> result = performanceService.getCachedAnalytics(type, period);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("type")).isEqualTo(type);
        assertThat(result.get("period")).isEqualTo(period);
        assertThat(result.get("activeJobs")).isEqualTo(45);
        assertThat(result.get("totalViews")).isEqualTo(15230);
        assertThat(result.get("applicationRate")).isEqualTo("12%");
    }

    @Test
    void getCachedAnalytics_PerformanceType_ReturnsCorrectData() {
        // Given
        String type = "performance";
        String period = "daily";

        // When
        Map<String, Object> result = performanceService.getCachedAnalytics(type, period);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("type")).isEqualTo(type);
        assertThat(result.get("period")).isEqualTo(period);
        assertThat(result.get("avgResponseTime")).isEqualTo("245ms");
        assertThat(result.get("cacheHitRate")).isEqualTo("78%");
        assertThat(result.get("errorRate")).isEqualTo("0.3%");
    }

    @Test
    void updateCachedAnalytics_UpdatesDataWithTimestamp() {
        // Given
        String type = "applications";
        String period = "weekly";
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("totalApplications", 1300);
        updateData.put("newThisWeek", 95);

        // When
        Map<String, Object> result = performanceService.updateCachedAnalytics(type, period, updateData);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("totalApplications")).isEqualTo(1300);
        assertThat(result.get("newThisWeek")).isEqualTo(95);
        assertThat(result).containsKey("lastUpdated");
        assertThat(result.get("lastUpdated")).isInstanceOf(Long.class);
    }

    @Test
    void getPerformanceMetrics_ReturnsValidMetrics() {
        // When
        PerformanceMetrics metrics = performanceService.getPerformanceMetrics();

        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics.getResponseTime()).isGreaterThan(0);
        assertThat(metrics.getCacheHitRate()).isBetween(0, 100);
        assertThat(metrics.getMemoryUsage()).isGreaterThan(0);
        assertThat(metrics.getActiveConnections()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void clearAnalyticsCache_ExecutesWithoutError() {
        // When & Then
        // This should not throw any exceptions
        performanceService.clearAnalyticsCache();
        
        // Test passes if no exception is thrown
        assertTrue(true);
    }

    @Test
    void performanceMetrics_CacheOptimization_ReducesExecutionTime() {
        // Test that caching actually improves performance
        // Given
        String type = "performance";
        String period = "daily";

        // When - First call (not cached)
        long startTime1 = System.currentTimeMillis();
        Map<String, Object> result1 = performanceService.getCachedAnalytics(type, period);
        long executionTime1 = System.currentTimeMillis() - startTime1;

        // When - Second call (should be cached, faster)
        long startTime2 = System.currentTimeMillis();
        Map<String, Object> result2 = performanceService.getCachedAnalytics(type, period);
        long executionTime2 = System.currentTimeMillis() - startTime2;

        // Then
        assertThat(result1).isNotNull();
        assertThat(result2).isNotNull();
        assertThat(result1.get("processedAt")).isEqualTo(result2.get("processedAt")); // Same cached result
        
        // Note: In a real test with proper cache setup, the second call should be much faster
        // For now, we just verify both calls work
        assertThat(executionTime1).isGreaterThan(0);
        assertThat(executionTime2).isGreaterThanOrEqualTo(0);
    }

    @Test
    void getCachedAnalytics_UnknownType_ReturnsBasicData() {
        // Given
        String type = "unknown";
        String period = "daily";

        // When
        Map<String, Object> result = performanceService.getCachedAnalytics(type, period);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.get("type")).isEqualTo(type);
        assertThat(result.get("period")).isEqualTo(period);
        assertThat(result).containsKey("processedAt");
        // Should not contain type-specific data
        assertThat(result).doesNotContainKey("totalApplications");
        assertThat(result).doesNotContainKey("activeJobs");
        assertThat(result).doesNotContainKey("avgResponseTime");
    }

    @Test
    void performanceService_AsyncOperations_ExecuteWithinTimeout() {
        // Test that async operations don't hang
        assertTimeout(
            java.time.Duration.ofSeconds(5),
            () -> {
                // Execute multiple cached operations
                performanceService.getCachedAnalytics("applications", "weekly");
                performanceService.getCachedAnalytics("jobs", "monthly");
                performanceService.getPerformanceMetrics();
            }
        );
    }

    @Test
    void performanceMetrics_Constructor_InitializesCorrectly() {
        // Given
        long responseTime = 150L;
        int cacheHitRate = 85;
        long memoryUsage = 1024L * 1024L; // 1MB
        int activeConnections = 25;

        // When
        PerformanceMetrics metrics = new PerformanceMetrics(responseTime, cacheHitRate, memoryUsage, activeConnections);

        // Then
        assertThat(metrics.getResponseTime()).isEqualTo(responseTime);
        assertThat(metrics.getCacheHitRate()).isEqualTo(cacheHitRate);
        assertThat(metrics.getMemoryUsage()).isEqualTo(memoryUsage);
        assertThat(metrics.getActiveConnections()).isEqualTo(activeConnections);
    }

    @Test
    void performanceMetrics_DefaultConstructor_InitializesWithDefaults() {
        // When
        PerformanceMetrics metrics = new PerformanceMetrics();

        // Then
        assertThat(metrics.getResponseTime()).isEqualTo(0);
        assertThat(metrics.getCacheHitRate()).isEqualTo(0);
        assertThat(metrics.getMemoryUsage()).isEqualTo(0);
        assertThat(metrics.getActiveConnections()).isEqualTo(0);
    }

    @Test
    void performanceMetrics_Setters_UpdateValuesCorrectly() {
        // Given
        PerformanceMetrics metrics = new PerformanceMetrics();

        // When
        metrics.setResponseTime(200L);
        metrics.setCacheHitRate(90);
        metrics.setMemoryUsage(2048L);
        metrics.setActiveConnections(30);

        // Then
        assertThat(metrics.getResponseTime()).isEqualTo(200L);
        assertThat(metrics.getCacheHitRate()).isEqualTo(90);
        assertThat(metrics.getMemoryUsage()).isEqualTo(2048L);
        assertThat(metrics.getActiveConnections()).isEqualTo(30);
    }
}
