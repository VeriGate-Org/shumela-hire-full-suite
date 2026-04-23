package com.arthmatic.shumelahire.service.jobboard;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.JobBoardPostingDataRepository;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IndeedConnectorTest {

    @Mock
    private JobBoardPostingDataRepository repository;

    @Mock
    private JobPostingDataRepository jobPostingRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private IndeedConnector connector;

    private JobPosting mockJobPosting;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(connector, "apiToken", "test-api-token");
        ReflectionTestUtils.setField(connector, "employerId", "emp-12345");
        ReflectionTestUtils.setField(connector, "restTemplate", restTemplate);

        mockJobPosting = new JobPosting();
        mockJobPosting.setId("1");
        mockJobPosting.setTitle("DevOps Engineer");
        mockJobPosting.setDepartment("Infrastructure");
        mockJobPosting.setDescription("Join our DevOps team to manage cloud infrastructure.");
        mockJobPosting.setLocation("Cape Town");
        mockJobPosting.setEmploymentType(EmploymentType.CONTRACT);
        mockJobPosting.setExperienceLevel(ExperienceLevel.MID_LEVEL);
        mockJobPosting.setSalaryMin(new BigDecimal("500000"));
        mockJobPosting.setSalaryMax(new BigDecimal("750000"));
        mockJobPosting.setSalaryCurrency("ZAR");
        mockJobPosting.setRemoteWorkAllowed(true);
        mockJobPosting.setPositionsAvailable(1);
        mockJobPosting.setRequirements("3+ years cloud experience");
        mockJobPosting.setResponsibilities("Manage CI/CD pipelines");
    }

    @Test
    void testGetSupportedType() {
        assertEquals(JobBoardType.INDEED, connector.getSupportedType());
    }

    @Test
    void testIsEnabledWithToken() {
        assertTrue(connector.isEnabled());
    }

    @Test
    void testIsEnabledWithoutToken() {
        ReflectionTestUtils.setField(connector, "apiToken", "");
        assertFalse(connector.isEnabled());
    }

    @Test
    void testPostWithFullJobData() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("jobKey", "IND-ABC12345XYZ");
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.CREATED));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId("200");
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertNotNull(result);
        assertEquals(PostingStatus.POSTED, result.getStatus());
        assertEquals("IND-ABC12345XYZ", result.getExternalPostId());
        assertEquals("https://www.indeed.com/viewjob?jk=IND-ABC12345XYZ", result.getExternalUrl());

        // Verify enriched payload
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/jobs"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentBody = (Map<String, Object>) requestCaptor.getValue().getBody();
        assertEquals("DevOps Engineer", sentBody.get("title"));
        assertEquals("CONTRACT", sentBody.get("jobType"));
        assertEquals("MID_LEVEL", sentBody.get("experienceLevel"));
        assertEquals("Infrastructure", sentBody.get("department"));
        assertEquals(1, sentBody.get("openings"));

        // Verify location with remote setting
        @SuppressWarnings("unchecked")
        Map<String, Object> location = (Map<String, Object>) sentBody.get("location");
        assertEquals("Cape Town", location.get("city"));
        assertEquals("FULLY_REMOTE", location.get("remoteType"));

        // Verify salary
        @SuppressWarnings("unchecked")
        Map<String, Object> salary = (Map<String, Object>) sentBody.get("salary");
        assertNotNull(salary);
        assertEquals(500000.0, salary.get("min"));
        assertEquals(750000.0, salary.get("max"));
        assertEquals("ZAR", salary.get("currency"));

        // Verify auth headers
        HttpHeaders sentHeaders = requestCaptor.getValue().getHeaders();
        assertEquals("Bearer test-api-token", sentHeaders.getFirst("Authorization"));
        assertEquals("emp-12345", sentHeaders.getFirst("Indeed-Employer-Id"));
    }

    @Test
    void testPostDescriptionContainsAllFields() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("jobKey", "IND-DESC123");
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.CREATED));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId("201");
            return p;
        });

        // When
        connector.post("1", null);

        // Then
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/jobs"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentBody = (Map<String, Object>) requestCaptor.getValue().getBody();
        String description = (String) sentBody.get("description");

        assertTrue(description.contains("Join our DevOps team"));
        assertTrue(description.contains("Manage CI/CD pipelines"));
        assertTrue(description.contains("3+ years cloud experience"));
    }

    @Test
    void testPostFailure() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Indeed API timeout"));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId("202");
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertEquals(PostingStatus.FAILED, result.getStatus());
        assertEquals("Indeed API timeout", result.getErrorMessage());
    }

    @Test
    void testRemove() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId("50");
        existingPosting.setExternalPostId("IND-REMOVE123");
        existingPosting.setStatus(PostingStatus.POSTED);

        when(repository.findById("50")).thenReturn(Optional.of(existingPosting));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.remove("50");

        // Then
        assertEquals(PostingStatus.REMOVED, result.getStatus());
        verify(restTemplate).exchange(contains("IND-REMOVE123"), eq(HttpMethod.DELETE), any(), eq(Void.class));
    }

    @Test
    void testSyncWithAnalytics() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId("60");
        existingPosting.setExternalPostId("IND-SYNC123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().plusDays(15));

        when(repository.findById("60")).thenReturn(Optional.of(existingPosting));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("impressions", 500);
        analytics.put("clicks", 120);
        analytics.put("applies", 25);
        when(restTemplate.exchange(contains("analytics"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(analytics, HttpStatus.OK));

        Map<String, Object> statusData = new HashMap<>();
        statusData.put("status", "ACTIVE");
        when(restTemplate.exchange(
                argThat(url -> url != null && url.toString().contains("IND-SYNC123") && !url.toString().contains("analytics")),
                eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(statusData, HttpStatus.OK));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync("60");

        // Then
        assertEquals(PostingStatus.POSTED, result.getStatus());
        assertEquals(500, result.getViewCount());
        assertEquals(120, result.getClickCount());
        assertEquals(25, result.getApplicationCount());
    }

    @Test
    void testSyncExpiredPosting() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId("61");
        existingPosting.setExternalPostId("IND-EXPIRED123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().minusDays(2));

        when(repository.findById("61")).thenReturn(Optional.of(existingPosting));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync("61");

        // Then
        assertEquals(PostingStatus.EXPIRED, result.getStatus());
    }
}
