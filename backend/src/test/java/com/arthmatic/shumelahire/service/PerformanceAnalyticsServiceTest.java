package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import com.arthmatic.shumelahire.entity.InterviewType;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.InterviewRepository;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

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
    }

    @Test
    void getRecruitmentMetrics_ReturnsCompleteMetrics() {
        // Given — stub methods actually called by getRecruitmentMetrics
        when(applicationRepository.findHiredApplicationsWithDates()).thenReturn(Collections.emptyList());
        when(applicationRepository.count()).thenReturn(100L);
        when(applicationRepository.countByStatus(any(ApplicationStatus.class))).thenReturn(0L);
        when(applicationRepository.findApplicationsBySource()).thenReturn(Collections.emptyList());
        when(applicationRepository.findHiresByDepartment()).thenReturn(Collections.emptyList());

        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();

        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics).containsKeys("timeToHire", "conversionRates", "sourceEffectiveness", "costMetrics");
    }

    @Test
    void getInterviewPerformanceAnalytics_ReturnsAnalytics() {
        // Given
        when(interviewRepository.findByType(any(InterviewType.class))).thenReturn(Collections.emptyList());
        when(interviewRepository.findAll()).thenReturn(Collections.emptyList());
        when(interviewRepository.count()).thenReturn(0L);
        when(interviewRepository.findByStatus(any(InterviewStatus.class))).thenReturn(Collections.emptyList());

        // When
        Map<String, Object> analytics = performanceAnalyticsService.getInterviewPerformanceAnalytics();

        // Then
        assertThat(analytics).isNotNull();
        assertThat(analytics).containsKeys("passRatesByStage", "interviewerStats", "feedbackTrends", "schedulingMetrics");
    }

    @Test
    void getRecruitmentMetrics_WithEmptyData_ReturnsEmptyMetrics() {
        // Given
        when(applicationRepository.findHiredApplicationsWithDates()).thenReturn(Collections.emptyList());
        when(applicationRepository.count()).thenReturn(0L);
        when(applicationRepository.countByStatus(any(ApplicationStatus.class))).thenReturn(0L);
        when(applicationRepository.findApplicationsBySource()).thenReturn(Collections.emptyList());
        when(applicationRepository.findHiresByDepartment()).thenReturn(Collections.emptyList());

        // When
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();

        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics).hasSize(4);
    }

    @Test
    void performanceMetrics_ExecutionTime_IsOptimal() {
        // Given
        when(applicationRepository.findHiredApplicationsWithDates()).thenReturn(Collections.emptyList());
        when(applicationRepository.count()).thenReturn(1000L);
        when(applicationRepository.countByStatus(any(ApplicationStatus.class))).thenReturn(0L);
        when(applicationRepository.findApplicationsBySource()).thenReturn(Collections.emptyList());
        when(applicationRepository.findHiresByDepartment()).thenReturn(Collections.emptyList());

        // When
        long startTime = System.currentTimeMillis();
        Map<String, Object> metrics = performanceAnalyticsService.getRecruitmentMetrics();
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;

        // Then
        assertThat(metrics).isNotNull();
        assertThat(executionTime).isLessThan(1000L);
    }
}
