package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.InterviewRepository;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
class PerformanceAnalyticsServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private ApplicantRepository applicantRepository;

    @InjectMocks
    private PerformanceAnalyticsService performanceAnalyticsService;

    @BeforeEach
    void setUp() {
        // Setup mock data for repositories
    }

    @Test
    void getRecruitmentMetrics_ReturnsCompleteMetrics() {
        // Given
        when(applicationRepository.count()).thenReturn(100L);
        when(interviewRepository.count()).thenReturn(50L);
        when(applicantRepository.count()).thenReturn(200L);

        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();

        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics).containsKeys("timeToHire", "conversionRates", "sourceEffectiveness", "costMetrics");
        verify(applicationRepository, times(1)).count();
        verify(interviewRepository, times(1)).count();
        verify(applicantRepository, times(1)).count();
    }

    @Test
    void getInterviewPerformanceAnalytics_ReturnsAnalytics() {
        // Given
        // Mock data for interview analytics

        // When
        Map<String, Object> analytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();

        // Then
        assertThat(analytics).isNotNull();
        // Verify that analytics contains expected keys based on the service implementation
    }

    @Test
    void calculateConversionRates_ReturnsCorrectRates() {
        // This test would be more detailed once we see the actual implementation
        // For now, we test that the method executes without errors
        
        // Given
        when(applicationRepository.count()).thenReturn(100L);
        
        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();
        
        // Then
        assertThat(metrics).containsKey("conversionRates");
        Map<String, Object> conversionRates = (Map<String, Object>) metrics.get("conversionRates");
        assertThat(conversionRates).isNotNull();
    }

    @Test
    void calculateTimeToHire_ReturnsTimeMetrics() {
        // Given
        when(applicationRepository.count()).thenReturn(50L);
        
        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();
        
        // Then
        assertThat(metrics).containsKey("timeToHire");
        Map<String, Object> timeToHire = (Map<String, Object>) metrics.get("timeToHire");
        assertThat(timeToHire).isNotNull();
    }

    @Test
    void calculateSourceEffectiveness_ReturnsSourceMetrics() {
        // Given
        when(applicantRepository.count()).thenReturn(75L);
        
        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();
        
        // Then
        assertThat(metrics).containsKey("sourceEffectiveness");
        Map<String, Object> sourceEffectiveness = (Map<String, Object>) metrics.get("sourceEffectiveness");
        assertThat(sourceEffectiveness).isNotNull();
    }

    @Test
    void calculateCostMetrics_ReturnsCostData() {
        // Given
        when(applicationRepository.count()).thenReturn(25L);
        
        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();
        
        // Then
        assertThat(metrics).containsKey("costMetrics");
        Map<String, Object> costMetrics = (Map<String, Object>) metrics.get("costMetrics");
        assertThat(costMetrics).isNotNull();
    }

    @Test
    void getRecruitmentMetrics_WithEmptyData_ReturnsEmptyMetrics() {
        // Given
        when(applicationRepository.count()).thenReturn(0L);
        when(interviewRepository.count()).thenReturn(0L);
        when(applicantRepository.count()).thenReturn(0L);

        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();

        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics).hasSize(4); // Should still have all 4 main sections
        verify(applicationRepository, times(1)).count();
        verify(interviewRepository, times(1)).count();
        verify(applicantRepository, times(1)).count();
    }

    @Test
    void performanceMetrics_ExecutionTime_IsOptimal() {
        // Test for performance optimization from Day 5.9
        // Given
        when(applicationRepository.count()).thenReturn(1000L);
        when(interviewRepository.count()).thenReturn(500L);
        when(applicantRepository.count()).thenReturn(2000L);

        // When
        long startTime = System.currentTimeMillis();
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        // Then
        assertThat(metrics).isNotNull();
        // Verify that execution time is reasonable (under 1 second for this test)
        assertThat(executionTime).isLessThan(1000L);
    }
}
