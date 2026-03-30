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
class LinkedInConnectorTest {

    @Mock
    private JobBoardPostingDataRepository repository;

    @Mock
    private JobPostingDataRepository jobPostingRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private LinkedInConnector connector;

    private JobPosting mockJobPosting;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(connector, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(connector, "apiSecret", "test-api-secret");
        ReflectionTestUtils.setField(connector, "orgId", "12345678");
        ReflectionTestUtils.setField(connector, "restTemplate", restTemplate);

        mockJobPosting = new JobPosting();
        mockJobPosting.setId(1L);
        mockJobPosting.setTitle("Senior Java Developer");
        mockJobPosting.setDepartment("Engineering");
        mockJobPosting.setDescription("We are looking for a Senior Java Developer to join our team.");
        mockJobPosting.setLocation("Johannesburg");
        mockJobPosting.setEmploymentType(EmploymentType.FULL_TIME);
        mockJobPosting.setExperienceLevel(ExperienceLevel.SENIOR);
        mockJobPosting.setSalaryMin(new BigDecimal("600000"));
        mockJobPosting.setSalaryMax(new BigDecimal("900000"));
        mockJobPosting.setSalaryCurrency("ZAR");
        mockJobPosting.setRemoteWorkAllowed(false);
        mockJobPosting.setPositionsAvailable(2);
        mockJobPosting.setRequirements("5+ years Java experience");
        mockJobPosting.setResponsibilities("Design and implement backend services");
        mockJobPosting.setQualifications("BSc Computer Science");
        mockJobPosting.setBenefits("Medical aid, retirement fund");
    }

    @Test
    void testGetSupportedType() {
        assertEquals(JobBoardType.LINKEDIN, connector.getSupportedType());
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

        // Mock OAuth token response
        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "mock-oauth-token");
        tokenResponse.put("expires_in", 3600);
        ResponseEntity<Map> tokenEntity = new ResponseEntity<>(tokenResponse, HttpStatus.OK);

        // Mock LinkedIn post response
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("x-restli-id", "LI-98765432");
        ResponseEntity<Map> postEntity = new ResponseEntity<>(new HashMap<>(), responseHeaders, HttpStatus.CREATED);

        when(restTemplate.exchange(
                contains("linkedin.com/oauth"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(tokenEntity);
        when(restTemplate.exchange(
                contains("simpleJobPostings"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(postEntity);

        // Mock repository save
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(100L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertNotNull(result);
        assertEquals(PostingStatus.POSTED, result.getStatus());
        assertEquals("LI-98765432", result.getExternalPostId());
        assertEquals("https://www.linkedin.com/jobs/view/LI-98765432", result.getExternalUrl());
        assertNotNull(result.getPostedAt());
        assertNotNull(result.getExpiresAt());

        // Verify the LinkedIn API was called with enriched body
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("simpleJobPostings"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentBody = (Map<String, Object>) requestCaptor.getValue().getBody();
        assertEquals("Senior Java Developer", sentBody.get("title"));
        assertEquals("urn:li:organization:12345678", sentBody.get("author"));
        assertEquals("F", sentBody.get("employmentStatus"));
        assertEquals("MID_SENIOR_LEVEL", sentBody.get("seniorityLevel"));
        assertEquals("ON_SITE", sentBody.get("workplaceType"));
        assertEquals(2, sentBody.get("numberOfOpenings"));

        // Verify salary
        @SuppressWarnings("unchecked")
        Map<String, Object> compensation = (Map<String, Object>) sentBody.get("compensation");
        assertNotNull(compensation);
        assertEquals(600000, compensation.get("minAmount"));
        assertEquals(900000, compensation.get("maxAmount"));
        assertEquals("ZAR", compensation.get("currencyCode"));

        // Verify audit log
        verify(auditLogService).saveLog(eq("SYSTEM"), eq("POST_TO_BOARD"),
                eq("JOB_BOARD_POSTING"), anyString(), contains("LinkedIn"));
    }

    @Test
    void testPostWithRemoteJob() {
        // Given
        mockJobPosting.setRemoteWorkAllowed(true);
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "mock-token");
        tokenResponse.put("expires_in", 3600);
        when(restTemplate.exchange(contains("oauth"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(tokenResponse, HttpStatus.OK));

        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("x-restli-id", "LI-REMOTE123");
        when(restTemplate.exchange(contains("simpleJobPostings"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(new HashMap<>(), responseHeaders, HttpStatus.CREATED));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(101L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertEquals(PostingStatus.POSTED, result.getStatus());

        // Verify remote work setting was sent
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("simpleJobPostings"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentBody = (Map<String, Object>) requestCaptor.getValue().getBody();
        assertEquals("REMOTE", sentBody.get("workplaceType"));
    }

    @Test
    void testPostFailure() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        // Mock OAuth to fail — connector should fall back to apiKey
        when(restTemplate.exchange(contains("oauth"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("OAuth failed"));
        when(restTemplate.exchange(contains("simpleJobPostings"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("API Error: Forbidden"));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(102L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertEquals(PostingStatus.FAILED, result.getStatus());
        assertEquals("API Error: Forbidden", result.getErrorMessage());
    }

    @Test
    void testPostJobNotFound() {
        // Given
        when(jobPostingRepository.findById("999")).thenReturn(Optional.empty());

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(103L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("999", null);

        // Then
        assertEquals(PostingStatus.FAILED, result.getStatus());
        assertTrue(result.getErrorMessage().contains("not found"));
    }

    @Test
    void testRemove() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(50L);
        existingPosting.setExternalPostId("LI-REMOVE123");
        existingPosting.setStatus(PostingStatus.POSTED);

        when(repository.findById("50")).thenReturn(Optional.of(existingPosting));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.remove(50L);

        // Then
        assertEquals(PostingStatus.REMOVED, result.getStatus());
        verify(restTemplate).exchange(contains("LI-REMOVE123"), eq(HttpMethod.DELETE), any(), eq(Void.class));
        verify(auditLogService).saveLog(eq("SYSTEM"), eq("REMOVE_POSTING"),
                eq("JOB_BOARD_POSTING"), eq("50"), contains("LinkedIn"));
    }

    @Test
    void testSyncWithAnalytics() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(60L);
        existingPosting.setExternalPostId("LI-SYNC123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().plusDays(15));

        when(repository.findById("60")).thenReturn(Optional.of(existingPosting));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("viewCount", 150);
        analytics.put("clickCount", 42);
        analytics.put("applicationCount", 8);
        when(restTemplate.exchange(contains("analytics"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(analytics, HttpStatus.OK));

        Map<String, Object> statusData = new HashMap<>();
        statusData.put("status", "ACTIVE");
        when(restTemplate.exchange(
                argThat(url -> url != null && url.toString().contains("LI-SYNC123") && !url.toString().contains("analytics")),
                eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(statusData, HttpStatus.OK));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync(60L);

        // Then
        assertEquals(PostingStatus.POSTED, result.getStatus()); // Still active
        assertEquals(150, result.getViewCount());
        assertEquals(42, result.getClickCount());
        assertEquals(8, result.getApplicationCount());
    }

    @Test
    void testSyncExpiredPosting() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(61L);
        existingPosting.setExternalPostId("LI-EXPIRED123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().minusDays(1));

        when(repository.findById("61")).thenReturn(Optional.of(existingPosting));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync(61L);

        // Then
        assertEquals(PostingStatus.EXPIRED, result.getStatus());
    }

    @Test
    void testDescriptionContainsAllFields() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "mock-token");
        tokenResponse.put("expires_in", 3600);
        when(restTemplate.exchange(contains("oauth"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(tokenResponse, HttpStatus.OK));

        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("x-restli-id", "LI-DESC123");
        when(restTemplate.exchange(contains("simpleJobPostings"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(new HashMap<>(), responseHeaders, HttpStatus.CREATED));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(104L);
            return p;
        });

        // When
        connector.post("1", null);

        // Then
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("simpleJobPostings"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentBody = (Map<String, Object>) requestCaptor.getValue().getBody();
        String description = (String) sentBody.get("description");

        assertTrue(description.contains("We are looking for a Senior Java Developer"));
        assertTrue(description.contains("Key Responsibilities"));
        assertTrue(description.contains("Design and implement backend services"));
        assertTrue(description.contains("Requirements"));
        assertTrue(description.contains("5+ years Java experience"));
        assertTrue(description.contains("Qualifications"));
        assertTrue(description.contains("BSc Computer Science"));
        assertTrue(description.contains("Benefits"));
        assertTrue(description.contains("Medical aid"));
    }
}
