package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.BackgroundCheckDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

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

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DotsAfricaServiceTest {

    @Mock
    private BackgroundCheckDataRepository backgroundCheckRepository;

    @Mock
    private ApplicationDataRepository applicationRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private DotsAfricaService service;

    private Application mockApplication;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "baseUrl", "https://api.dotsafrica.com/v1");
        ReflectionTestUtils.setField(service, "apiKey", "test-dots-api-key");
        ReflectionTestUtils.setField(service, "clientId", "test-client-id");
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);

        mockApplication = new Application();
        mockApplication.setId(1L);
    }

    @Test
    void testInitiateCheckWithConsent() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("screeningId", "SCR-12345");
        responseBody.put("status", "IN_PROGRESS");
        when(restTemplate.exchange(contains("/screenings"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(responseBody, HttpStatus.CREATED));

        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> {
            BackgroundCheck bc = inv.getArgument(0);
            bc.setId(100L);
            return bc;
        });

        List<String> checkTypes = List.of("ID_VERIFICATION", "CRIMINAL_CHECK", "CREDIT_CHECK");

        // When
        BackgroundCheck result = service.initiateCheck(
                1L, "9501015800088", "John Smith", "john@example.com",
                checkTypes, true, 42L);

        // Then
        assertNotNull(result);
        assertEquals(BackgroundCheckStatus.IN_PROGRESS, result.getStatus());
        assertEquals("SCR-12345", result.getExternalScreeningId());
        assertEquals("9501015800088", result.getCandidateIdNumber());
        assertEquals("John Smith", result.getCandidateName());
        assertEquals("dots-africa", result.getProvider());
        assertTrue(result.getConsentObtained());
        assertNotNull(result.getReferenceId());
        assertTrue(result.getReferenceId().startsWith("DA-"));
        assertNotNull(result.getSubmittedAt());

        // Verify API payload
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/screenings"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentBody = (Map<String, Object>) requestCaptor.getValue().getBody();
        assertNotNull(sentBody.get("referenceId"));
        assertEquals("test-client-id", sentBody.get("clientId"));
        assertTrue(((Boolean) sentBody.get("consentObtained")));

        @SuppressWarnings("unchecked")
        Map<String, String> candidate = (Map<String, String>) sentBody.get("candidate");
        assertEquals("9501015800088", candidate.get("idNumber"));
        assertEquals("John Smith", candidate.get("fullName"));

        // Verify headers
        HttpHeaders headers = requestCaptor.getValue().getHeaders();
        assertEquals("test-dots-api-key", headers.getFirst("X-API-Key"));
        assertEquals("test-client-id", headers.getFirst("X-Client-Id"));

        // Verify audit log
        verify(auditLogService).saveLog(eq("42"), eq("INITIATE_BACKGROUND_CHECK"),
                eq("BACKGROUND_CHECK"), anyString(), contains("background check"));
    }

    @Test
    void testInitiateCheckWithoutConsent() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));
        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> {
            BackgroundCheck bc = inv.getArgument(0);
            bc.setId(101L);
            return bc;
        });

        // When
        BackgroundCheck result = service.initiateCheck(
                1L, "9501015800088", "John Smith", null,
                List.of("ID_VERIFICATION"), false, 42L);

        // Then
        assertEquals(BackgroundCheckStatus.PENDING_CONSENT, result.getStatus());
        assertFalse(result.getConsentObtained());

        // Should NOT call Dots Africa API without consent
        verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Map.class));
    }

    @Test
    void testInitiateCheckApiFailure() {
        // Given
        when(applicationRepository.findById("1")).thenReturn(Optional.of(mockApplication));
        when(restTemplate.exchange(contains("/screenings"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Dots Africa API unavailable"));

        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> {
            BackgroundCheck bc = inv.getArgument(0);
            bc.setId(102L);
            return bc;
        });

        // When
        BackgroundCheck result = service.initiateCheck(
                1L, "9501015800088", "John Smith", "john@example.com",
                List.of("ID_VERIFICATION"), true, 42L);

        // Then
        assertEquals(BackgroundCheckStatus.FAILED, result.getStatus());
        assertEquals("Dots Africa API unavailable", result.getErrorMessage());
    }

    @Test
    void testGetCheckStatusPollsProvider() {
        // Given
        BackgroundCheck existing = new BackgroundCheck();
        existing.setId(200L);
        existing.setReferenceId("DA-ABC123");
        existing.setExternalScreeningId("SCR-55555");
        existing.setStatus(BackgroundCheckStatus.IN_PROGRESS);

        when(backgroundCheckRepository.findByReferenceId("DA-ABC123")).thenReturn(Optional.of(existing));

        Map<String, Object> providerResponse = new HashMap<>();
        providerResponse.put("status", "COMPLETED");
        providerResponse.put("overallResult", "CLEAR");
        providerResponse.put("reportUrl", "https://api.dotsafrica.com/reports/55555.pdf");
        when(restTemplate.exchange(contains("SCR-55555"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(providerResponse, HttpStatus.OK));

        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        BackgroundCheck result = service.getCheckStatus("DA-ABC123");

        // Then
        assertEquals(BackgroundCheckStatus.COMPLETED, result.getStatus());
        assertEquals(BackgroundCheckResult.CLEAR, result.getOverallResult());
        assertEquals("https://api.dotsafrica.com/reports/55555.pdf", result.getReportUrl());
    }

    @Test
    void testHandleWebhookCompleted() {
        // Given
        BackgroundCheck existing = new BackgroundCheck();
        existing.setId(300L);
        existing.setReferenceId("DA-WEBHOOK1");
        existing.setStatus(BackgroundCheckStatus.IN_PROGRESS);

        when(backgroundCheckRepository.findByReferenceId("DA-WEBHOOK1")).thenReturn(Optional.of(existing));
        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> results = Map.of(
                "ID_VERIFICATION", Map.of("status", "CLEAR", "details", "ID verified"),
                "CRIMINAL_CHECK", Map.of("status", "CLEAR", "details", "No records found")
        );

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "screening.completed");
        event.put("referenceId", "DA-WEBHOOK1");
        event.put("screeningId", "SCR-77777");
        event.put("data", Map.of(
                "overallResult", "CLEAR",
                "results", results,
                "reportUrl", "https://api.dotsafrica.com/reports/77777.pdf"
        ));

        // When
        service.handleWebhookEvent(event);

        // Then
        ArgumentCaptor<BackgroundCheck> checkCaptor = ArgumentCaptor.forClass(BackgroundCheck.class);
        verify(backgroundCheckRepository).save(checkCaptor.capture());

        BackgroundCheck saved = checkCaptor.getValue();
        assertEquals(BackgroundCheckStatus.COMPLETED, saved.getStatus());
        assertEquals(BackgroundCheckResult.CLEAR, saved.getOverallResult());
        assertNotNull(saved.getCompletedAt());
        assertEquals("https://api.dotsafrica.com/reports/77777.pdf", saved.getReportUrl());
        assertNotNull(saved.getResultsJson());

        // Verify audit log
        verify(auditLogService).saveLog(eq("SYSTEM"), contains("WEBHOOK"),
                eq("BACKGROUND_CHECK"), eq("300"), contains("Dots Africa"));
    }

    @Test
    void testHandleWebhookFailed() {
        // Given
        BackgroundCheck existing = new BackgroundCheck();
        existing.setId(301L);
        existing.setReferenceId("DA-WEBHOOK2");
        existing.setStatus(BackgroundCheckStatus.IN_PROGRESS);

        when(backgroundCheckRepository.findByReferenceId("DA-WEBHOOK2")).thenReturn(Optional.of(existing));
        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "screening.failed");
        event.put("referenceId", "DA-WEBHOOK2");
        event.put("data", Map.of("reason", "Invalid ID number provided"));

        // When
        service.handleWebhookEvent(event);

        // Then
        ArgumentCaptor<BackgroundCheck> checkCaptor = ArgumentCaptor.forClass(BackgroundCheck.class);
        verify(backgroundCheckRepository).save(checkCaptor.capture());

        assertEquals(BackgroundCheckStatus.FAILED, checkCaptor.getValue().getStatus());
        assertEquals("Invalid ID number provided", checkCaptor.getValue().getErrorMessage());
    }

    @Test
    void testHandleWebhookPartialResults() {
        // Given
        BackgroundCheck existing = new BackgroundCheck();
        existing.setId(302L);
        existing.setReferenceId("DA-WEBHOOK3");
        existing.setStatus(BackgroundCheckStatus.IN_PROGRESS);

        when(backgroundCheckRepository.findByReferenceId("DA-WEBHOOK3")).thenReturn(Optional.of(existing));
        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "screening.partial_results");
        event.put("referenceId", "DA-WEBHOOK3");
        event.put("data", Map.of("results", Map.of("ID_VERIFICATION", Map.of("status", "CLEAR"))));

        // When
        service.handleWebhookEvent(event);

        // Then
        ArgumentCaptor<BackgroundCheck> checkCaptor = ArgumentCaptor.forClass(BackgroundCheck.class);
        verify(backgroundCheckRepository).save(checkCaptor.capture());

        assertEquals(BackgroundCheckStatus.PARTIAL_RESULTS, checkCaptor.getValue().getStatus());
        assertNotNull(checkCaptor.getValue().getResultsJson());
    }

    @Test
    void testCancelCheck() {
        // Given
        BackgroundCheck existing = new BackgroundCheck();
        existing.setId(400L);
        existing.setReferenceId("DA-CANCEL1");
        existing.setExternalScreeningId("SCR-99999");
        existing.setStatus(BackgroundCheckStatus.IN_PROGRESS);

        when(backgroundCheckRepository.findByReferenceId("DA-CANCEL1")).thenReturn(Optional.of(existing));
        when(backgroundCheckRepository.save(any(BackgroundCheck.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        BackgroundCheck result = service.cancelCheck("DA-CANCEL1", "Position filled");

        // Then
        assertEquals(BackgroundCheckStatus.CANCELLED, result.getStatus());
        assertNotNull(result.getCancelledAt());
        assertEquals("Position filled", result.getNotes());

        // Verify cancel API called
        verify(restTemplate).exchange(contains("cancel"), eq(HttpMethod.POST), any(), eq(Void.class));
    }

    @Test
    void testCancelCheckAlreadyCompleted() {
        // Given
        BackgroundCheck existing = new BackgroundCheck();
        existing.setId(401L);
        existing.setReferenceId("DA-CANCEL2");
        existing.setStatus(BackgroundCheckStatus.COMPLETED);

        when(backgroundCheckRepository.findByReferenceId("DA-CANCEL2")).thenReturn(Optional.of(existing));

        // When / Then
        assertThrows(RuntimeException.class, () ->
                service.cancelCheck("DA-CANCEL2", "Too late"));
    }

    @Test
    void testGetAvailableCheckTypes() {
        // When
        List<Map<String, Object>> checkTypes = service.getAvailableCheckTypes();

        // Then
        assertNotNull(checkTypes);
        assertEquals(12, checkTypes.size());

        // Verify first check type structure
        Map<String, Object> first = checkTypes.get(0);
        assertEquals("ID_VERIFICATION", first.get("code"));
        assertEquals("ID Verification", first.get("name"));
        assertNotNull(first.get("description"));
        assertNotNull(first.get("turnaround"));
        assertNotNull(first.get("price"));
        assertEquals("ZAR", first.get("currency"));

        // Verify all expected check types are present
        List<String> codes = checkTypes.stream()
                .map(ct -> (String) ct.get("code"))
                .toList();
        assertTrue(codes.contains("CRIMINAL_CHECK"));
        assertTrue(codes.contains("CREDIT_CHECK"));
        assertTrue(codes.contains("QUALIFICATION_VERIFICATION"));
        assertTrue(codes.contains("REFERENCE_CHECK"));
        assertTrue(codes.contains("EMPLOYMENT_HISTORY"));
        assertTrue(codes.contains("SOCIAL_MEDIA_SCREENING"));
    }

    @Test
    void testDownloadReport() {
        // Given
        BackgroundCheck existing = new BackgroundCheck();
        existing.setId(500L);
        existing.setReferenceId("DA-REPORT1");
        existing.setExternalScreeningId("SCR-88888");
        existing.setStatus(BackgroundCheckStatus.COMPLETED);

        when(backgroundCheckRepository.findByReferenceId("DA-REPORT1")).thenReturn(Optional.of(existing));

        byte[] pdfBytes = "fake-pdf-content".getBytes();
        when(restTemplate.exchange(contains("report"), eq(HttpMethod.GET), any(), eq(byte[].class)))
                .thenReturn(new ResponseEntity<>(pdfBytes, HttpStatus.OK));

        // When
        byte[] result = service.downloadReport("DA-REPORT1");

        // Then
        assertNotNull(result);
        assertEquals("fake-pdf-content", new String(result));
    }
}
