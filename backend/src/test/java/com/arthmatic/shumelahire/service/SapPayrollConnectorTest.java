package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.repository.SapPayrollTransmissionDataRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SapPayrollConnectorTest {

    @Mock
    private OfferDataRepository offerRepository;

    @Mock
    private SapPayrollTransmissionDataRepository transmissionRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private SapPayrollConnector connector;

    private Offer mockOffer;
    private Application mockApplication;
    private Applicant mockApplicant;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(connector, "baseUrl", "https://sap.example.com/api");
        ReflectionTestUtils.setField(connector, "clientId", "test-client-id");
        ReflectionTestUtils.setField(connector, "clientSecret", "test-client-secret");
        ReflectionTestUtils.setField(connector, "authUrl", "");
        ReflectionTestUtils.setField(connector, "companyCode", "ZA01");
        ReflectionTestUtils.setField(connector, "payrollArea", "M1");
        ReflectionTestUtils.setField(connector, "restTemplate", restTemplate);

        // Build applicant
        mockApplicant = new Applicant();
        mockApplicant.setId("10");
        mockApplicant.setName("Thabo");
        mockApplicant.setSurname("Mokoena");
        mockApplicant.setEmail("thabo@example.com");
        mockApplicant.setPhone("+27831234567");
        mockApplicant.setIdPassportNumber("9201015800088");
        mockApplicant.setAddress("123 Main Rd, Sandton, Johannesburg");
        mockApplicant.setGender("Male");
        mockApplicant.setCitizenshipStatus("South African");

        // Build application
        mockApplication = new Application();
        mockApplication.setId("100");
        mockApplication.setApplicant(mockApplicant);

        // Build accepted offer
        mockOffer = new Offer();
        mockOffer.setId("200");
        mockOffer.setApplication(mockApplication);
        mockOffer.setOfferNumber("OFF-2026-001");
        mockOffer.setStatus(OfferStatus.ACCEPTED);
        mockOffer.setJobTitle("Senior Software Engineer");
        mockOffer.setDepartment("Engineering");
        mockOffer.setReportingManager("Jane Smith");
        mockOffer.setWorkLocation("Johannesburg");
        mockOffer.setBaseSalary(new BigDecimal("850000"));
        mockOffer.setCurrency("ZAR");
        mockOffer.setSalaryFrequency("ANNUALLY");
        mockOffer.setEmploymentType("PERMANENT");
        mockOffer.setStartDate(LocalDate.of(2026, 3, 1));
        mockOffer.setProbationaryPeriodDays(90);
        mockOffer.setNoticePeriodDays(30);
        mockOffer.setVacationDaysAnnual(21);
        mockOffer.setSickDaysAnnual(30);
        mockOffer.setHealthInsurance(true);
        mockOffer.setRetirementPlan(true);
        mockOffer.setRetirementContributionPercentage(new BigDecimal("7.5"));
        mockOffer.setBonusEligible(true);
        mockOffer.setBonusTargetPercentage(new BigDecimal("15"));
        mockOffer.setBonusMaximumPercentage(new BigDecimal("25"));
        mockOffer.setAcceptedAt(LocalDateTime.of(2026, 2, 20, 10, 0));
    }

    @Test
    void testSendNewHireDataSuccess() {
        // Given
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));
        when(transmissionRepository.findByOfferIdOrderByCreatedAtDesc("200")).thenReturn(Collections.emptyList());

        Map<String, Object> sapResponse = new HashMap<>();
        sapResponse.put("personIdExternal", "EMP-10001");
        when(restTemplate.exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(sapResponse, HttpStatus.CREATED));

        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> {
            SapPayrollTransmission t = inv.getArgument(0);
            if (t.getId() == null) t.setId("1");
            return t;
        });

        // When
        SapPayrollTransmission result = connector.sendNewHireData("200", "42");

        // Then
        assertNotNull(result);
        assertEquals(TransmissionStatus.CONFIRMED, result.getStatus());
        assertEquals("EMP-10001", result.getSapEmployeeNumber());
        assertNotNull(result.getTransmissionId());
        assertTrue(result.getTransmissionId().startsWith("SAP-"));
        assertEquals("ZA01", result.getSapCompanyCode());
        assertEquals("M1", result.getSapPayrollArea());
        assertNotNull(result.getConfirmedAt());

        // Verify SAP payload was sent
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> sentPayload = (Map<String, Object>) requestCaptor.getValue().getBody();
        assertNotNull(sentPayload);

        // Verify personal info
        @SuppressWarnings("unchecked")
        Map<String, Object> personalInfo = (Map<String, Object>) sentPayload.get("personalInfo");
        assertEquals("Thabo", personalInfo.get("firstName"));
        assertEquals("Mokoena", personalInfo.get("lastName"));
        assertEquals("thabo@example.com", personalInfo.get("email"));
        assertEquals("9201015800088", personalInfo.get("nationalId"));

        // Verify employment info
        @SuppressWarnings("unchecked")
        Map<String, Object> employment = (Map<String, Object>) sentPayload.get("employment");
        assertEquals("ZA01", employment.get("companyCode"));
        assertEquals("M1", employment.get("payrollArea"));
        assertEquals("Senior Software Engineer", employment.get("jobTitle"));
        assertEquals("Engineering", employment.get("department"));
        assertEquals("2026-03-01", employment.get("startDate"));
        assertEquals("1", employment.get("employmentType")); // PERMANENT → 1

        // Verify compensation
        @SuppressWarnings("unchecked")
        Map<String, Object> compensation = (Map<String, Object>) sentPayload.get("compensation");
        assertEquals(new BigDecimal("850000.00"), compensation.get("baseSalary"));
        assertEquals("ZAR", compensation.get("currency"));
        assertEquals("A", compensation.get("payFrequency"));
        assertEquals(new BigDecimal("70833.33"), compensation.get("monthlySalary"));

        // Verify bonus info
        @SuppressWarnings("unchecked")
        Map<String, Object> bonus = (Map<String, Object>) compensation.get("bonus");
        assertNotNull(bonus);
        assertTrue((Boolean) bonus.get("eligible"));
        assertEquals(new BigDecimal("15"), bonus.get("targetPercentage"));

        // Verify benefits
        @SuppressWarnings("unchecked")
        Map<String, Object> benefits = (Map<String, Object>) sentPayload.get("benefits");
        assertTrue((Boolean) benefits.get("healthInsurance"));
        assertTrue((Boolean) benefits.get("retirementPlan"));
        assertEquals(new BigDecimal("7.5"), benefits.get("retirementContributionPercentage"));
        assertEquals(21, benefits.get("annualLeaveDays"));

        // Verify headers
        HttpHeaders headers = requestCaptor.getValue().getHeaders();
        assertEquals("ZA01", headers.getFirst("sap-client"));

        // Verify audit log
        verify(auditLogService).saveLog(eq("42"), eq("SAP_TRANSMISSION_SENT"),
                eq("SAP_PAYROLL"), anyString(), contains("SAP Employee: EMP-10001"));
    }

    @Test
    void testSendNewHireDataOfferNotAccepted() {
        // Given
        mockOffer.setStatus(OfferStatus.SENT);
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));

        // When / Then
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> connector.sendNewHireData("200", "42"));
        assertTrue(ex.getMessage().contains("expected ACCEPTED"));
    }

    @Test
    void testSendNewHireDataDuplicateTransmission() {
        // Given
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));

        SapPayrollTransmission existingActive = new SapPayrollTransmission();
        existingActive.setTransmissionId("SAP-EXISTING1");
        existingActive.setStatus(TransmissionStatus.TRANSMITTED);
        when(transmissionRepository.findByOfferIdOrderByCreatedAtDesc("200"))
                .thenReturn(List.of(existingActive));

        // When / Then
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> connector.sendNewHireData("200", "42"));
        assertTrue(ex.getMessage().contains("Active transmission already exists"));
    }

    @Test
    void testSendNewHireDataValidationFailure() {
        // Given — offer with missing mandatory fields
        mockOffer.setStartDate(null);
        mockApplicant.setIdPassportNumber(null);
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));
        when(transmissionRepository.findByOfferIdOrderByCreatedAtDesc("200")).thenReturn(Collections.emptyList());
        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> {
            SapPayrollTransmission t = inv.getArgument(0);
            if (t.getId() == null) t.setId("2");
            return t;
        });

        // When
        SapPayrollTransmission result = connector.sendNewHireData("200", "42");

        // Then
        assertEquals(TransmissionStatus.FAILED, result.getStatus());
        assertTrue(result.getErrorMessage().contains("Validation failed"));
        assertNotNull(result.getValidationErrors());
        assertTrue(result.getValidationErrors().contains("nationalId"));
        assertTrue(result.getValidationErrors().contains("startDate"));

        // Should NOT call SAP API
        verify(restTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(), eq(Map.class));
    }

    @Test
    void testSendNewHireDataApiFailure() {
        // Given
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));
        when(transmissionRepository.findByOfferIdOrderByCreatedAtDesc("200")).thenReturn(Collections.emptyList());
        when(restTemplate.exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("SAP service unavailable"));

        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> {
            SapPayrollTransmission t = inv.getArgument(0);
            if (t.getId() == null) t.setId("3");
            return t;
        });

        // When
        SapPayrollTransmission result = connector.sendNewHireData("200", "42");

        // Then
        assertEquals(TransmissionStatus.FAILED, result.getStatus());
        assertEquals("SAP service unavailable", result.getErrorMessage());
        assertNotNull(result.getNextRetryAt());

        verify(auditLogService).saveLog(eq("42"), eq("SAP_TRANSMISSION_FAILED"),
                eq("SAP_PAYROLL"), anyString(), contains("SAP service unavailable"));
    }

    @Test
    void testGetTransmissionStatusPollsSap() {
        // Given
        SapPayrollTransmission existing = new SapPayrollTransmission();
        existing.setId("10");
        existing.setTransmissionId("SAP-ABC12345");
        existing.setStatus(TransmissionStatus.TRANSMITTED);
        existing.setTransmittedAt(LocalDateTime.now().minusHours(2));

        when(transmissionRepository.findByTransmissionId("SAP-ABC12345")).thenReturn(Optional.of(existing));

        List<Map<String, Object>> results = List.of(Map.of("personIdExternal", "EMP-20002"));
        Map<String, Object> d = Map.of("results", results);
        Map<String, Object> sapResponse = Map.of("d", d);

        when(restTemplate.exchange(contains("SAP-ABC12345"), eq(HttpMethod.GET), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(sapResponse, HttpStatus.OK));

        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        SapPayrollTransmission result = connector.getTransmissionStatus("SAP-ABC12345");

        // Then
        assertEquals(TransmissionStatus.CONFIRMED, result.getStatus());
        assertEquals("EMP-20002", result.getSapEmployeeNumber());
        assertNotNull(result.getConfirmedAt());
    }

    @Test
    void testValidateEmployeeData() {
        // Given — complete valid data
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));

        // When
        Map<String, String> errors = connector.validateEmployeeData("200");

        // Then
        assertTrue(errors.isEmpty(), "Expected no validation errors for complete offer data");
    }

    @Test
    void testValidateEmployeeDataWithMissingFields() {
        // Given
        mockApplicant.setName(null);
        mockApplicant.setEmail(null);
        mockOffer.setBaseSalary(null);
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));

        // When
        Map<String, String> errors = connector.validateEmployeeData("200");

        // Then
        assertFalse(errors.isEmpty());
        assertTrue(errors.containsKey("firstName"));
        assertTrue(errors.containsKey("email"));
        assertTrue(errors.containsKey("baseSalary"));
    }

    @Test
    void testRetryFailedTransmission() {
        // Given
        SapPayrollTransmission failed = new SapPayrollTransmission();
        failed.setId("20");
        failed.setTransmissionId("SAP-RETRY001");
        failed.setStatus(TransmissionStatus.FAILED);
        failed.setRetryCount(0);
        failed.setMaxRetries(3);
        failed.setOffer(mockOffer);

        when(transmissionRepository.findByTransmissionId("SAP-RETRY001")).thenReturn(Optional.of(failed));

        Map<String, Object> sapResponse = Map.of("personIdExternal", "EMP-30003");
        when(restTemplate.exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(sapResponse, HttpStatus.CREATED));

        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        SapPayrollTransmission result = connector.retryFailedTransmission("SAP-RETRY001", "42");

        // Then
        assertEquals(TransmissionStatus.CONFIRMED, result.getStatus());
        assertEquals("EMP-30003", result.getSapEmployeeNumber());
        assertEquals(1, result.getRetryCount());

        verify(auditLogService).saveLog(eq("42"), eq("SAP_RETRY_SUCCESS"),
                eq("SAP_PAYROLL"), anyString(), contains("retry #1"));
    }

    @Test
    void testRetryMaxRetriesExceeded() {
        // Given
        SapPayrollTransmission failed = new SapPayrollTransmission();
        failed.setId("21");
        failed.setTransmissionId("SAP-RETRY002");
        failed.setStatus(TransmissionStatus.FAILED);
        failed.setRetryCount(3);
        failed.setMaxRetries(3);

        when(transmissionRepository.findByTransmissionId("SAP-RETRY002")).thenReturn(Optional.of(failed));

        // When / Then
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> connector.retryFailedTransmission("SAP-RETRY002", "42"));
        assertTrue(ex.getMessage().contains("cannot be retried"));
    }

    @Test
    void testCancelTransmission() {
        // Given
        SapPayrollTransmission pending = new SapPayrollTransmission();
        pending.setId("30");
        pending.setTransmissionId("SAP-CANCEL01");
        pending.setStatus(TransmissionStatus.PENDING);

        when(transmissionRepository.findByTransmissionId("SAP-CANCEL01")).thenReturn(Optional.of(pending));
        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        SapPayrollTransmission result = connector.cancelTransmission("SAP-CANCEL01", "Position filled", "42");

        // Then
        assertEquals(TransmissionStatus.CANCELLED, result.getStatus());
        assertNotNull(result.getCancelledAt());
        assertEquals("42", result.getCancelledBy());
        assertEquals("Position filled", result.getCancellationReason());

        verify(auditLogService).saveLog(eq("42"), eq("SAP_TRANSMISSION_CANCELLED"),
                eq("SAP_PAYROLL"), anyString(), contains("Position filled"));
    }

    @Test
    void testCancelConfirmedTransmission() {
        // Given
        SapPayrollTransmission confirmed = new SapPayrollTransmission();
        confirmed.setId("31");
        confirmed.setTransmissionId("SAP-CANCEL02");
        confirmed.setStatus(TransmissionStatus.CONFIRMED);

        when(transmissionRepository.findByTransmissionId("SAP-CANCEL02")).thenReturn(Optional.of(confirmed));

        // When / Then
        assertThrows(RuntimeException.class,
                () -> connector.cancelTransmission("SAP-CANCEL02", "Too late", "42"));
    }

    @Test
    void testGetPendingTransmissions() {
        // Given
        SapPayrollTransmission t1 = new SapPayrollTransmission();
        t1.setTransmissionId("SAP-P001");
        t1.setStatus(TransmissionStatus.PENDING);

        SapPayrollTransmission t2 = new SapPayrollTransmission();
        t2.setTransmissionId("SAP-P002");
        t2.setStatus(TransmissionStatus.TRANSMITTED);

        when(transmissionRepository.findByStatusIn(anyList())).thenReturn(List.of(t1, t2));

        // When
        List<SapPayrollTransmission> pending = connector.getPendingTransmissions();

        // Then
        assertEquals(2, pending.size());
    }

    @Test
    void testContractTypeMapping() {
        // Given — contract employee
        mockOffer.setEmploymentType("CONTRACT");
        mockOffer.setContractEndDate(LocalDate.of(2026, 12, 31));
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));
        when(transmissionRepository.findByOfferIdOrderByCreatedAtDesc("200")).thenReturn(Collections.emptyList());

        Map<String, Object> sapResponse = Map.of("personIdExternal", "EMP-40004");
        when(restTemplate.exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(sapResponse, HttpStatus.CREATED));

        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> {
            SapPayrollTransmission t = inv.getArgument(0);
            if (t.getId() == null) t.setId("4");
            return t;
        });

        // When
        connector.sendNewHireData("200", "42");

        // Then
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) requestCaptor.getValue().getBody();
        @SuppressWarnings("unchecked")
        Map<String, Object> employment = (Map<String, Object>) payload.get("employment");
        assertEquals("2", employment.get("employmentType")); // CONTRACT → 2
        assertEquals("2026-12-31", employment.get("contractEndDate"));
    }

    @Test
    void testMonthlySalaryConversion() {
        // Given — monthly salary frequency
        mockOffer.setSalaryFrequency("MONTHLY");
        mockOffer.setBaseSalary(new BigDecimal("70000"));
        when(offerRepository.findById("200")).thenReturn(Optional.of(mockOffer));
        when(transmissionRepository.findByOfferIdOrderByCreatedAtDesc("200")).thenReturn(Collections.emptyList());

        Map<String, Object> sapResponse = Map.of("personIdExternal", "EMP-50005");
        when(restTemplate.exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST), any(), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(sapResponse, HttpStatus.CREATED));

        when(transmissionRepository.save(any(SapPayrollTransmission.class))).thenAnswer(inv -> {
            SapPayrollTransmission t = inv.getArgument(0);
            if (t.getId() == null) t.setId("5");
            return t;
        });

        // When
        connector.sendNewHireData("200", "42");

        // Then
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).exchange(contains("/odata/v2/PerPerson"), eq(HttpMethod.POST),
                requestCaptor.capture(), eq(Map.class));

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) requestCaptor.getValue().getBody();
        @SuppressWarnings("unchecked")
        Map<String, Object> compensation = (Map<String, Object>) payload.get("compensation");
        assertEquals("M", compensation.get("payFrequency"));
        // Monthly → monthlySalary should equal baseSalary
        assertEquals(new BigDecimal("70000.00"), compensation.get("monthlySalary"));
    }
}
