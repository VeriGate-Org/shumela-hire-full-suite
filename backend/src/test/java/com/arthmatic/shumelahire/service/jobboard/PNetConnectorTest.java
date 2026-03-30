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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PNetConnectorTest {

    @Mock
    private JobBoardPostingDataRepository repository;

    @Mock
    private JobPostingDataRepository jobPostingRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private PNetConnector connector;

    private JobPosting mockJobPosting;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(connector, "apiKey", "test-pnet-api-key");
        ReflectionTestUtils.setField(connector, "restTemplate", restTemplate);

        mockJobPosting = new JobPosting();
        mockJobPosting.setId(1L);
        mockJobPosting.setTitle("Data Analyst");
        mockJobPosting.setDepartment("Business Intelligence");
        mockJobPosting.setDescription("Analyse business data and create reports for stakeholders.");
        mockJobPosting.setLocation("Durban");
        mockJobPosting.setEmploymentType(EmploymentType.FULL_TIME);
        mockJobPosting.setExperienceLevel(ExperienceLevel.MID_LEVEL);
        mockJobPosting.setSalaryMin(new BigDecimal("400000"));
        mockJobPosting.setSalaryMax(new BigDecimal("600000"));
        mockJobPosting.setSalaryCurrency("ZAR");
        mockJobPosting.setRemoteWorkAllowed(false);
        mockJobPosting.setPositionsAvailable(1);
        mockJobPosting.setRequirements("SQL, Python, Power BI experience");
        mockJobPosting.setResponsibilities("Data modelling, dashboard creation, stakeholder reporting");
        mockJobPosting.setQualifications("BCom or BSc with analytics focus");
        mockJobPosting.setApplicationDeadline(LocalDateTime.of(2026, 3, 31, 23, 59));
    }

    @Test
    void testGetSupportedType() {
        assertEquals(JobBoardType.PNET, connector.getSupportedType());
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
    void testPostWithFullXmlPayload() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        String xmlResponse = "<response><jobId>PNET-DATA123</jobId><status>active</status></response>";
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(xmlResponse, HttpStatus.CREATED));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(300L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertNotNull(result);
        assertEquals(PostingStatus.POSTED, result.getStatus());
        assertEquals("PNET-DATA123", result.getExternalPostId());
        assertEquals("https://www.pnet.co.za/jobs/PNET-DATA123", result.getExternalUrl());

        // Verify XML payload was sent
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/jobs"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(String.class));

        String sentXml = (String) requestCaptor.getValue().getBody();

        // Verify XML contains full job data
        assertTrue(sentXml.contains("<title>Data Analyst</title>"));
        assertTrue(sentXml.contains("<department>Business Intelligence</department>"));
        assertTrue(sentXml.contains("<location>Durban</location>"));
        assertTrue(sentXml.contains("<country>ZA</country>"));
        assertTrue(sentXml.contains("<contractType>Permanent</contractType>"));
        assertTrue(sentXml.contains("<experienceYears>3-5</experienceYears>"));
        assertTrue(sentXml.contains("<currency>ZAR</currency>"));
        assertTrue(sentXml.contains("<min>400000</min>"));
        assertTrue(sentXml.contains("<max>600000</max>"));
        assertTrue(sentXml.contains("<positions>1</positions>"));
        assertTrue(sentXml.contains("<closingDate>2026-03-31</closingDate>"));

        // Verify description is in CDATA
        assertTrue(sentXml.contains("<description><![CDATA["));
        assertTrue(sentXml.contains("Analyse business data"));
        assertTrue(sentXml.contains("Data modelling"));
        assertTrue(sentXml.contains("SQL, Python"));
        assertTrue(sentXml.contains("BCom or BSc"));

        // Verify correct content type header
        HttpHeaders sentHeaders = requestCaptor.getValue().getHeaders();
        assertEquals(MediaType.APPLICATION_XML, sentHeaders.getContentType());
        assertEquals("test-pnet-api-key", sentHeaders.getFirst("X-API-Key"));
    }

    @Test
    void testPostWithXmlSpecialCharacters() {
        // Given
        mockJobPosting.setTitle("Data Analyst & Reporting Lead <Senior>");
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        String xmlResponse = "<response><jobId>PNET-ESC123</jobId></response>";
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(xmlResponse, HttpStatus.CREATED));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(301L);
            return p;
        });

        // When
        connector.post("1", null);

        // Then
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/jobs"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(String.class));

        String sentXml = (String) requestCaptor.getValue().getBody();

        // Verify XML special characters are escaped
        assertTrue(sentXml.contains("&amp;"));
        assertTrue(sentXml.contains("&lt;Senior&gt;"));
        assertFalse(sentXml.contains("<Senior>")); // Should be escaped in title
    }

    @Test
    void testPostFailure() {
        // Given
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                .thenThrow(new RuntimeException("PNet API unavailable"));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(302L);
            return p;
        });

        // When
        JobBoardPosting result = connector.post("1", null);

        // Then
        assertEquals(PostingStatus.FAILED, result.getStatus());
        assertEquals("PNet API unavailable", result.getErrorMessage());
    }

    @Test
    void testRemove() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(50L);
        existingPosting.setExternalPostId("PNET-REMOVE123");
        existingPosting.setStatus(PostingStatus.POSTED);

        when(repository.findById("50")).thenReturn(Optional.of(existingPosting));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.remove(50L);

        // Then
        assertEquals(PostingStatus.REMOVED, result.getStatus());
        verify(restTemplate).exchange(contains("PNET-REMOVE123"), eq(HttpMethod.DELETE), any(), eq(Void.class));
    }

    @Test
    void testSyncWithAnalytics() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(60L);
        existingPosting.setExternalPostId("PNET-SYNC123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().plusDays(15));

        when(repository.findById("60")).thenReturn(Optional.of(existingPosting));

        String xmlResponse = "<job><views>300</views><clicks>85</clicks><applications>15</applications><status>active</status></job>";
        when(restTemplate.exchange(contains("PNET-SYNC123"), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(xmlResponse, HttpStatus.OK));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync(60L);

        // Then
        assertEquals(PostingStatus.POSTED, result.getStatus());
        assertEquals(300, result.getViewCount());
        assertEquals(85, result.getClickCount());
        assertEquals(15, result.getApplicationCount());
    }

    @Test
    void testSyncExpiredFromRemote() {
        // Given
        JobBoardPosting existingPosting = new JobBoardPosting();
        existingPosting.setId(61L);
        existingPosting.setExternalPostId("PNET-EXP123");
        existingPosting.setStatus(PostingStatus.POSTED);
        existingPosting.setExpiresAt(LocalDateTime.now().plusDays(5));

        when(repository.findById("61")).thenReturn(Optional.of(existingPosting));

        String xmlResponse = "<job><views>100</views><clicks>20</clicks><applications>5</applications><status>expired</status></job>";
        when(restTemplate.exchange(contains("PNET-EXP123"), eq(HttpMethod.GET), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(xmlResponse, HttpStatus.OK));

        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        JobBoardPosting result = connector.sync(61L);

        // Then
        assertEquals(PostingStatus.EXPIRED, result.getStatus());
    }

    @Test
    void testContractTypeMapping() {
        // Given — test Part-Time mapping
        mockJobPosting.setEmploymentType(EmploymentType.PART_TIME);
        when(jobPostingRepository.findById("1")).thenReturn(Optional.of(mockJobPosting));

        String xmlResponse = "<response><jobId>PNET-PT123</jobId></response>";
        when(restTemplate.exchange(contains("/jobs"), eq(HttpMethod.POST), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>(xmlResponse, HttpStatus.CREATED));
        when(repository.save(any(JobBoardPosting.class))).thenAnswer(inv -> {
            JobBoardPosting p = inv.getArgument(0);
            p.setId(303L);
            return p;
        });

        // When
        connector.post("1", null);

        // Then
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/jobs"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(String.class));

        String sentXml = (String) requestCaptor.getValue().getBody();
        assertTrue(sentXml.contains("<contractType>Part-Time</contractType>"));
    }
}
