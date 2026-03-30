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
class CareerJunctionConnectorTest {

    @Mock
    private JobBoardPostingDataRepository repository;

    @Mock
    private JobPostingDataRepository jobPostingRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private CareerJunctionConnector connector;

    private JobPosting mockJobPosting;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(connector, "apiKey", "test-cj-api-key");
        ReflectionTestUtils.setField(connector, "partnerId", "partner-98765");
        ReflectionTestUtils.setField(connector, "restTemplate", restTemplate);

        mockJobPosting = new JobPosting();
        mockJobPosting.setId(1L);
        mockJobPosting.setTitle("HR Manager");
        mockJobPosting.setDepartment("Human Resources");
        mockJobPosting.setDescription("Lead the HR function across all business units.");
        mockJobPosting.setLocation("Pretoria");
        mockJobPosting.setEmploymentType(EmploymentType.FULL_TIME);
        mockJobPosting.setExperienceLevel(ExperienceLevel.SENIOR);
        mockJobPosting.setSalaryMin(new BigDecimal("700000"));
        mockJobPosting.setSalaryMax(new BigDecimal("950000"));
        mockJobPosting.setSalaryCurrency("ZAR");
        mockJobPosting.setRemoteWorkAllowed(false);
        mockJobPosting.setTravelRequired(true);
        mockJobPosting.setPositionsAvailable(1);
        mockJobPosting.setRequirements("8+ years HR management experience");
        mockJobPosting.setResponsibilities("Strategic HR planning, talent management, employee relations");
        mockJobPosting.setQualifications("Honours degree in HR or Industrial Psychology");
        mockJobPosting.setBenefits("Company car, performance bonus, medical aid");
        mockJobPosting.setApplicationDeadline(LocalDateTime.of(2026, 4, 15, 17, 0));
    }

    @Test
    void testGetSupportedType() {
        assertEquals(JobBoardType.CAREER_JUNCTION, connector.getSupportedType());
    }

    @Test
    void testIsEnabledWithApiKey() {
        assertTrue(connector.isEnabled());
    }

    @Test
    void testIsEnabledWithoutApiKey() {
        ReflectionTestUtils.setField(connector, "apiKey", "");
        assertFalse(connector.isEnabled());
    }

    @Test
    void testPostWithFullJobData() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("jobId", "CJ-HR789012");
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.CREATED));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(400L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertNotNull(result);
        assertEquals(PostingStatus.POSTED, result.getStatus());
        assertEquals("CJ-HR789012", result.getExternalPostId());
        assertEquals("https://www.careerjunction.co.za/jobs/CJ-HR789012", result.getExternalUrl());

        // Verify enriched payload
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/jobs"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentBody = (Map<String, Object>) requestCaptor.getValue().getBody();
        assertEquals("HR Manager", sentBody.get("title"));
        assertEquals("Human Resources", sentBody.get("department"));
        assertEquals("partner-98765", sentBody.get("partnerId"));
        assertEquals("Permanent", sentBody.get("employmentType"));
        assertEquals("Senior", sentBody.get("seniorityLevel"));
        assertEquals(1, sentBody.get("numberOfPositions"));
        assertEquals(true, sentBody.get("travelRequired"));
        assertEquals("2026-04-15", sentBody.get("closingDate"));

        // Verify location
        @SuppressWarnings("unchecked")
        Map<String, Object> location = (Map<String, Object>) sentBody.get("location");
        assertEquals("South Africa", location.get("country"));
        assertEquals("Pretoria", location.get("city"));
        assertNull(location.get("workFromHome")); // Not remote

        // Verify salary
        @SuppressWarnings("unchecked")
        Map<String, Object> salary = (Map<String, Object>) sentBody.get("salary");
        assertNotNull(salary);
        assertEquals(700000, salary.get("min"));
        assertEquals(950000, salary.get("max"));
        assertEquals("ZAR", salary.get("currency"));
        assertEquals("Annual", salary.get("frequency"));

        // Verify auth headers
        HttpHeaders sentHeaders = requestCaptor.getValue().getHeaders();
        assertEquals("test-cj-api-key", sentHeaders.getFirst("X-API-Key"));
        assertEquals("partner-98765", sentHeaders.getFirst("X-Partner-Id"));
    }

    @Test
    void testPostWithRemoteJob() {
        // Given
        mockJobPosting.setRemoteWorkAllowed(true);
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("jobId", "CJ-REMOTE123");
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.CREATED));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(401L);
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
        @SuppressWarnings("unchecked")
        Map<String, Object> location = (Map<String, Object>) sentBody.get("location");
        assertEquals(true, location.get("workFromHome"));
    }

    @Test
    void testPostDescriptionContainsAllFields() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("jobId", "CJ-DESC123");
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.CREATED));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(402L);
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

        assertTrue(description.contains("Lead the HR function"));
        assertTrue(description.contains("Strategic HR planning"));
        assertTrue(description.contains("8+ years HR management"));
        assertTrue(description.contains("Honours degree"));
        assertTrue(description.contains("Company car"));
    }

    @Test
    void testPostFailure() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("CareerJunction API rate limit exceeded"));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(403L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertEquals(PostingStatus.FAILED, result.getStatus());
        assertEquals("CareerJunction API rate limit exceeded", result.getErrorMessage());
    }

    @Test
    void testRemove() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(50L);
        existingPosting.setExternalPostId("CJ-REMOVE123");
        existingPosting.setStatus(PostingStatus.POSTED);

        when(repository.findById("50")).thenReturn(Optional.of(existingPosting));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.remove(50L);

        // Then
        assertEquals(PostingStatus.REMOVED, result.getStatus());
        verify(restTemplate).exchange(contains("CJ-REMOVE123"), eq(HttpMethod.DELETE), any(), eq(Void.class));
        verify(auditLogService).saveLog(eq("SYSTEM"), eq("REMOVE_POSTING"),
                eq("JOB_BOARD_POSTING"), eq("50"), contains("CareerJunction"));
    }

    @Test
    void testSyncWithAnalytics() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(60L);
        existingPosting.setExternalPostId("CJ-SYNC123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().plusDays(15));

        when(repository.findById("60")).thenReturn(Optional.of(existingPosting));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("views", 250);
        analytics.put("clicks", 65);
        analytics.put("applications", 12);
        when(restTemplate.exchange(contains("analytics"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(analytics, HttpStatus.OK));

        Map<String, Object> statusData = new HashMap<>();
        statusData.put("status", "active");
        when(restTemplate.exchange(
                argThat(url -> url != null && url.toString().contains("CJ-SYNC123") && !url.toString().contains("analytics")),
                eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(statusData, HttpStatus.OK));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync(60L);

        // Then
        assertEquals(PostingStatus.POSTED, result.getStatus());
        assertEquals(250, result.getViewCount());
        assertEquals(65, result.getClickCount());
        assertEquals(12, result.getApplicationCount());
    }

    @Test
    void testSyncExpiredFromRemote() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(61L);
        existingPosting.setExternalPostId("CJ-EXP123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().plusDays(5));

        when(repository.findById("61")).thenReturn(Optional.of(existingPosting));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("views", 100);

        Map<String, Object> statusData = new HashMap<>();
        statusData.put("status", "expired");

        // Use doReturn for both stubs to avoid strict stubbing conflicts
        doReturn(new ResponseEntity<>(analytics, HttpStatus.OK))
                .when(restTemplate).exchange(contains("analytics"), eq(HttpMethod.GET), any(), eq(Map.class));
        doReturn(new ResponseEntity<>(statusData, HttpStatus.OK))
                .when(restTemplate).exchange(eq("https://api.careerjunction.co.za/v2/jobs/CJ-EXP123"), eq(HttpMethod.GET), any(), eq(Map.class));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync(61L);

        // Then
        assertEquals(PostingStatus.EXPIRED, result.getStatus());
    }

    @Test
    void testSeniorityLevelMapping() {
        // Given — test Entry Level mapping
        mockJobPosting.setExperienceLevel(ExperienceLevel.ENTRY_LEVEL);
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("jobId", "CJ-ENTRY123");
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.CREATED));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(404L);
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
        assertEquals("Entry", sentBody.get("seniorityLevel"));
    }
}
