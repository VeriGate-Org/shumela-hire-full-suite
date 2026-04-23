package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.OfferDataRepository;
import com.arthmatic.shumelahire.repository.SapPayrollTransmissionDataRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * SAP Payroll Connector — integrates with SAP SuccessFactors Employee Central
 * or SAP HCM via OData API for new hire payroll onboarding.
 *
 * Supports OAuth 2.0 client credentials flow for authentication against
 * SAP's API gateway. Maps ShumelaHire Offer + Applicant data to SAP's
 * employee master record creation endpoint.
 */
@Service
@ConditionalOnProperty(name = "sap.payroll.enabled", havingValue = "true")
public class SapPayrollConnector implements SapPayrollService {

    private static final Logger log = LoggerFactory.getLogger(SapPayrollConnector.class);
    private static final DateTimeFormatter SAP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${sap.payroll.base-url:}")
    private String baseUrl;

    @Value("${sap.payroll.client-id:}")
    private String clientId;

    @Value("${sap.payroll.client-secret:}")
    private String clientSecret;

    @Value("${sap.payroll.auth-url:}")
    private String authUrl;

    @Value("${sap.payroll.company-code:}")
    private String companyCode;

    @Value("${sap.payroll.payroll-area:}")
    private String payrollArea;

    @Autowired
    private OfferDataRepository offerRepository;

    @Autowired
    private SapPayrollTransmissionDataRepository transmissionRepository;

    @Autowired
    private AuditLogService auditLogService;

    private RestTemplate restTemplate = new RestTemplate();

    // OAuth token cache
    private String cachedAccessToken;
    private long tokenExpiresAt = 0;

    @Override
    public SapPayrollTransmission sendNewHireData(String offerId, String initiatedBy) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        if (offer.getStatus() != OfferStatus.ACCEPTED) {
            throw new RuntimeException("Cannot transmit to SAP: offer status is " + offer.getStatus()
                    + ", expected ACCEPTED");
        }

        // Check for existing active transmission
        List<SapPayrollTransmission> existing = transmissionRepository.findByOfferIdOrderByCreatedAtDesc(offerId);
        Optional<SapPayrollTransmission> active = existing.stream()
                .filter(t -> t.getStatus().isActive() || t.getStatus() == TransmissionStatus.CONFIRMED)
                .findFirst();
        if (active.isPresent()) {
            throw new RuntimeException("Active transmission already exists for offer " + offerId
                    + ": " + active.get().getTransmissionId());
        }

        // Create transmission record
        SapPayrollTransmission transmission = new SapPayrollTransmission();
        transmission.setOffer(offer);
        transmission.setTransmissionId(generateTransmissionId());
        transmission.setStatus(TransmissionStatus.PENDING);
        transmission.setInitiatedBy(initiatedBy);
        transmission.setSapCompanyCode(companyCode);
        transmission.setSapPayrollArea(payrollArea);

        // Validate before transmitting
        Map<String, String> validationErrors = validateOfferData(offer);
        if (!validationErrors.isEmpty()) {
            try {
                transmission.setValidationErrors(objectMapper.writeValueAsString(validationErrors));
            } catch (Exception e) {
                transmission.setValidationErrors(validationErrors.toString());
            }
            transmission.setStatus(TransmissionStatus.FAILED);
            transmission.setErrorMessage("Validation failed: " + validationErrors.size() + " error(s)");
            transmission = transmissionRepository.save(transmission);

            auditLogService.saveLog(String.valueOf(initiatedBy), "SAP_VALIDATION_FAILED",
                    "SAP_PAYROLL", transmission.getId(),
                    "SAP payroll validation failed for offer " + offerId);
            return transmission;
        }

        // Build SAP payload
        Map<String, Object> sapPayload = buildSapPayload(offer);
        try {
            transmission.setPayloadJson(objectMapper.writeValueAsString(sapPayload));
        } catch (Exception e) {
            log.warn("Failed to serialize SAP payload", e);
        }

        transmission.setStatus(TransmissionStatus.VALIDATING);
        transmission = transmissionRepository.save(transmission);

        // Transmit to SAP
        try {
            String accessToken = getAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            headers.set("sap-client", companyCode);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(sapPayload, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/odata/v2/PerPerson",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            transmission.setStatus(TransmissionStatus.TRANSMITTED);
            transmission.setTransmittedAt(LocalDateTime.now());

            if (response.getBody() != null) {
                try {
                    transmission.setResponseJson(objectMapper.writeValueAsString(response.getBody()));
                } catch (Exception e) {
                    log.warn("Failed to serialize SAP response", e);
                }

                // Extract SAP employee number if returned immediately
                Object empNumber = response.getBody().get("personIdExternal");
                if (empNumber == null) {
                    empNumber = response.getBody().get("employeeNumber");
                }
                if (empNumber != null) {
                    transmission.setSapEmployeeNumber(String.valueOf(empNumber));
                    transmission.setStatus(TransmissionStatus.CONFIRMED);
                    transmission.setConfirmedAt(LocalDateTime.now());
                }
            }

            transmission = transmissionRepository.save(transmission);

            auditLogService.saveLog(String.valueOf(initiatedBy), "SAP_TRANSMISSION_SENT",
                    "SAP_PAYROLL", transmission.getId(),
                    "SAP payroll transmission sent for offer " + offerId
                    + (transmission.getSapEmployeeNumber() != null
                        ? " — SAP Employee: " + transmission.getSapEmployeeNumber()
                        : ""));

        } catch (Exception e) {
            log.error("SAP transmission failed for offer {}: {}", offerId, e.getMessage());
            transmission.setStatus(TransmissionStatus.FAILED);
            transmission.setErrorMessage(e.getMessage());
            transmission.setNextRetryAt(LocalDateTime.now().plusMinutes(15));
            transmission = transmissionRepository.save(transmission);

            auditLogService.saveLog(String.valueOf(initiatedBy), "SAP_TRANSMISSION_FAILED",
                    "SAP_PAYROLL", transmission.getId(),
                    "SAP payroll transmission failed for offer " + offerId + ": " + e.getMessage());
        }

        return transmission;
    }

    @Override
    public SapPayrollTransmission getTransmissionStatus(String transmissionId) {
        SapPayrollTransmission transmission = transmissionRepository.findByTransmissionId(transmissionId)
                .orElseThrow(() -> new RuntimeException("Transmission not found: " + transmissionId));

        // Only poll SAP if transmission is in a non-terminal state
        if (transmission.getStatus() == TransmissionStatus.TRANSMITTED) {
            try {
                String accessToken = getAccessToken();

                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(accessToken);
                headers.set("sap-client", companyCode);
                headers.setAccept(List.of(MediaType.APPLICATION_JSON));

                HttpEntity<Void> request = new HttpEntity<>(headers);

                ResponseEntity<Map> response = restTemplate.exchange(
                        baseUrl + "/odata/v2/PerPerson?$filter=customString1 eq '" + transmissionId + "'",
                        HttpMethod.GET,
                        request,
                        Map.class
                );

                if (response.getBody() != null) {
                    try {
                        transmission.setResponseJson(objectMapper.writeValueAsString(response.getBody()));
                    } catch (Exception e) {
                        log.warn("Failed to serialize SAP status response", e);
                    }

                    @SuppressWarnings("unchecked")
                    Map<String, Object> d = (Map<String, Object>) response.getBody().get("d");
                    if (d != null) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> results = (List<Map<String, Object>>) d.get("results");
                        if (results != null && !results.isEmpty()) {
                            Map<String, Object> employee = results.get(0);
                            Object empNumber = employee.get("personIdExternal");
                            if (empNumber != null) {
                                transmission.setSapEmployeeNumber(String.valueOf(empNumber));
                                transmission.setStatus(TransmissionStatus.CONFIRMED);
                                transmission.setConfirmedAt(LocalDateTime.now());
                            }
                        }
                    }

                    transmission = transmissionRepository.save(transmission);
                }

            } catch (Exception e) {
                log.warn("Failed to poll SAP for transmission {}: {}", transmissionId, e.getMessage());
            }
        }

        return transmission;
    }

    @Override
    public Map<String, String> validateEmployeeData(String offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found: " + offerId));

        return validateOfferData(offer);
    }

    @Override
    public SapPayrollTransmission retryFailedTransmission(String transmissionId, String userId) {
        SapPayrollTransmission transmission = transmissionRepository.findByTransmissionId(transmissionId)
                .orElseThrow(() -> new RuntimeException("Transmission not found: " + transmissionId));

        if (!transmission.canBeRetried()) {
            throw new RuntimeException("Transmission " + transmissionId + " cannot be retried. Status: "
                    + transmission.getStatus() + ", retries: " + transmission.getRetryCount()
                    + "/" + transmission.getMaxRetries());
        }

        transmission.incrementRetryCount();
        transmission.setStatus(TransmissionStatus.PENDING);
        transmission.setErrorMessage(null);
        transmission.setNextRetryAt(null);
        transmission = transmissionRepository.save(transmission);

        // Re-attempt transmission
        Offer offer = transmission.getOffer();
        Map<String, Object> sapPayload;

        // Try to reuse existing payload, otherwise rebuild
        if (transmission.getPayloadJson() != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> existing = objectMapper.readValue(transmission.getPayloadJson(), Map.class);
                sapPayload = existing;
            } catch (Exception e) {
                sapPayload = buildSapPayload(offer);
            }
        } else {
            sapPayload = buildSapPayload(offer);
        }

        try {
            String accessToken = getAccessToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            headers.set("sap-client", companyCode);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(sapPayload, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/odata/v2/PerPerson",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            transmission.setStatus(TransmissionStatus.TRANSMITTED);
            transmission.setTransmittedAt(LocalDateTime.now());

            if (response.getBody() != null) {
                try {
                    transmission.setResponseJson(objectMapper.writeValueAsString(response.getBody()));
                } catch (Exception e) {
                    log.warn("Failed to serialize retry response", e);
                }

                Object empNumber = response.getBody().get("personIdExternal");
                if (empNumber == null) empNumber = response.getBody().get("employeeNumber");
                if (empNumber != null) {
                    transmission.setSapEmployeeNumber(String.valueOf(empNumber));
                    transmission.setStatus(TransmissionStatus.CONFIRMED);
                    transmission.setConfirmedAt(LocalDateTime.now());
                }
            }

            transmission = transmissionRepository.save(transmission);

            auditLogService.saveLog(userId, "SAP_RETRY_SUCCESS",
                    "SAP_PAYROLL", transmission.getId(),
                    "SAP payroll retry #" + transmission.getRetryCount() + " for transmission " + transmissionId);

        } catch (Exception e) {
            log.error("SAP retry failed for {}: {}", transmissionId, e.getMessage());
            transmission.setStatus(TransmissionStatus.FAILED);
            transmission.setErrorMessage(e.getMessage());
            transmission.setNextRetryAt(LocalDateTime.now().plusMinutes(15 * (long) Math.pow(2, transmission.getRetryCount())));
            transmission = transmissionRepository.save(transmission);

            auditLogService.saveLog(userId, "SAP_RETRY_FAILED",
                    "SAP_PAYROLL", transmission.getId(),
                    "SAP payroll retry #" + transmission.getRetryCount() + " failed: " + e.getMessage());
        }

        return transmission;
    }

    @Override
    public List<SapPayrollTransmission> getPendingTransmissions() {
        return transmissionRepository.findByStatusIn(List.of(
                TransmissionStatus.PENDING,
                TransmissionStatus.VALIDATING,
                TransmissionStatus.TRANSMITTED,
                TransmissionStatus.RETRY_PENDING
        ));
    }

    @Override
    public SapPayrollTransmission cancelTransmission(String transmissionId, String reason, String userId) {
        SapPayrollTransmission transmission = transmissionRepository.findByTransmissionId(transmissionId)
                .orElseThrow(() -> new RuntimeException("Transmission not found: " + transmissionId));

        if (!transmission.canBeCancelled()) {
            throw new RuntimeException("Transmission " + transmissionId + " cannot be cancelled. Status: "
                    + transmission.getStatus());
        }

        transmission.setStatus(TransmissionStatus.CANCELLED);
        transmission.setCancelledAt(LocalDateTime.now());
        transmission.setCancelledBy(userId);
        transmission.setCancellationReason(reason);
        transmission = transmissionRepository.save(transmission);

        auditLogService.saveLog(userId, "SAP_TRANSMISSION_CANCELLED",
                "SAP_PAYROLL", transmission.getId(),
                "SAP payroll transmission cancelled: " + reason);

        return transmission;
    }

    // === Private helpers ===

    private Map<String, Object> buildSapPayload(Offer offer) {
        Application application = offer.getApplication();
        Applicant applicant = application.getApplicant();

        Map<String, Object> payload = new LinkedHashMap<>();

        // Personal information
        Map<String, Object> personalInfo = new LinkedHashMap<>();
        personalInfo.put("firstName", applicant.getName());
        personalInfo.put("lastName", applicant.getSurname());
        personalInfo.put("email", applicant.getEmail());
        personalInfo.put("phone", applicant.getPhone());
        personalInfo.put("nationalId", applicant.getIdPassportNumber());
        personalInfo.put("address", applicant.getAddress());
        personalInfo.put("gender", applicant.getGender());
        personalInfo.put("citizenship", applicant.getCitizenshipStatus());
        payload.put("personalInfo", personalInfo);

        // Employment information
        Map<String, Object> employment = new LinkedHashMap<>();
        employment.put("companyCode", companyCode);
        employment.put("payrollArea", payrollArea);
        employment.put("jobTitle", offer.getJobTitle());
        employment.put("department", offer.getDepartment());
        employment.put("costCenter", offer.getDepartment()); // Default: department as cost center
        employment.put("reportingManager", offer.getReportingManager());
        employment.put("workLocation", offer.getWorkLocation());
        employment.put("employmentType", mapEmploymentType(offer.getEmploymentType()));
        employment.put("startDate", offer.getStartDate() != null
                ? offer.getStartDate().format(SAP_DATE_FORMAT)
                : LocalDate.now().plusDays(30).format(SAP_DATE_FORMAT));

        if (offer.getContractEndDate() != null) {
            employment.put("contractEndDate", offer.getContractEndDate().format(SAP_DATE_FORMAT));
        }
        if (offer.getProbationaryPeriodDays() != null) {
            employment.put("probationaryPeriodMonths",
                    Math.max(1, offer.getProbationaryPeriodDays() / 30));
        }
        if (offer.getNoticePeriodDays() != null) {
            employment.put("noticePeriodDays", offer.getNoticePeriodDays());
        }
        payload.put("employment", employment);

        // Compensation
        Map<String, Object> compensation = new LinkedHashMap<>();
        compensation.put("baseSalary", offer.getBaseSalary().setScale(2, RoundingMode.HALF_UP));
        compensation.put("currency", offer.getCurrency());
        compensation.put("payFrequency", mapPayFrequency(offer.getSalaryFrequency()));

        // Convert to monthly for SAP if annual
        if ("ANNUALLY".equals(offer.getSalaryFrequency())) {
            compensation.put("monthlySalary",
                    offer.getBaseSalary().divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP));
        } else {
            compensation.put("monthlySalary", offer.getBaseSalary().setScale(2, RoundingMode.HALF_UP));
        }

        if (offer.getBonusEligible() != null && offer.getBonusEligible()) {
            Map<String, Object> bonus = new LinkedHashMap<>();
            bonus.put("eligible", true);
            bonus.put("targetPercentage", offer.getBonusTargetPercentage());
            bonus.put("maximumPercentage", offer.getBonusMaximumPercentage());
            compensation.put("bonus", bonus);
        }

        if (offer.getSigningBonus() != null) {
            compensation.put("signingBonus", offer.getSigningBonus().setScale(2, RoundingMode.HALF_UP));
        }

        if (offer.getRelocationAllowance() != null) {
            compensation.put("relocationAllowance",
                    offer.getRelocationAllowance().setScale(2, RoundingMode.HALF_UP));
        }
        payload.put("compensation", compensation);

        // Benefits
        Map<String, Object> benefits = new LinkedHashMap<>();
        benefits.put("healthInsurance", offer.getHealthInsurance() != null && offer.getHealthInsurance());
        benefits.put("retirementPlan", offer.getRetirementPlan() != null && offer.getRetirementPlan());
        if (offer.getRetirementContributionPercentage() != null) {
            benefits.put("retirementContributionPercentage", offer.getRetirementContributionPercentage());
        }
        if (offer.getVacationDaysAnnual() != null) {
            benefits.put("annualLeaveDays", offer.getVacationDaysAnnual());
        }
        if (offer.getSickDaysAnnual() != null) {
            benefits.put("sickLeaveDays", offer.getSickDaysAnnual());
        }
        payload.put("benefits", benefits);

        // Metadata
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("sourceSystem", "ShumelaHire");
        metadata.put("offerId", offer.getId());
        metadata.put("offerNumber", offer.getOfferNumber());
        metadata.put("applicationId", application.getId());
        metadata.put("createdAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        payload.put("metadata", metadata);

        return payload;
    }

    private Map<String, String> validateOfferData(Offer offer) {
        Map<String, String> errors = new LinkedHashMap<>();

        Application application = offer.getApplication();
        if (application == null) {
            errors.put("application", "Offer has no linked application");
            return errors;
        }

        Applicant applicant = application.getApplicant();
        if (applicant == null) {
            errors.put("applicant", "Application has no linked applicant");
            return errors;
        }

        // Mandatory personal fields
        if (applicant.getName() == null || applicant.getName().isBlank()) {
            errors.put("firstName", "Applicant first name is required");
        }
        if (applicant.getSurname() == null || applicant.getSurname().isBlank()) {
            errors.put("lastName", "Applicant surname is required");
        }
        if (applicant.getEmail() == null || applicant.getEmail().isBlank()) {
            errors.put("email", "Applicant email is required");
        }
        if (applicant.getIdPassportNumber() == null || applicant.getIdPassportNumber().isBlank()) {
            errors.put("nationalId", "ID/Passport number is required for SAP employee creation");
        }

        // Mandatory offer fields
        if (offer.getBaseSalary() == null || offer.getBaseSalary().compareTo(BigDecimal.ZERO) <= 0) {
            errors.put("baseSalary", "Base salary must be greater than zero");
        }
        if (offer.getJobTitle() == null || offer.getJobTitle().isBlank()) {
            errors.put("jobTitle", "Job title is required");
        }
        if (offer.getDepartment() == null || offer.getDepartment().isBlank()) {
            errors.put("department", "Department is required");
        }
        if (offer.getStartDate() == null) {
            errors.put("startDate", "Start date is required for payroll setup");
        }
        if (offer.getCurrency() == null || offer.getCurrency().isBlank()) {
            errors.put("currency", "Currency is required");
        }

        return errors;
    }

    private String mapEmploymentType(String type) {
        if (type == null) return "1"; // Permanent (default)
        return switch (type.toUpperCase()) {
            case "PERMANENT" -> "1";
            case "CONTRACT" -> "2";
            case "TEMPORARY" -> "3";
            case "INTERN" -> "4";
            default -> "1";
        };
    }

    private String mapPayFrequency(String frequency) {
        if (frequency == null) return "M"; // Monthly (default)
        return switch (frequency.toUpperCase()) {
            case "ANNUALLY" -> "A";
            case "MONTHLY" -> "M";
            case "HOURLY" -> "H";
            case "WEEKLY" -> "W";
            case "BIWEEKLY" -> "B";
            default -> "M";
        };
    }

    private String getAccessToken() {
        if (cachedAccessToken != null && System.currentTimeMillis() < tokenExpiresAt - 300_000) {
            return cachedAccessToken;
        }

        if (authUrl == null || authUrl.isBlank()) {
            // Fall back to basic auth or API key mode
            return clientSecret;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(clientId, clientSecret);

            String body = "grant_type=client_credentials&client_id=" + clientId;
            HttpEntity<String> request = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.exchange(
                    authUrl + "/oauth/token",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            if (response.getBody() != null) {
                cachedAccessToken = (String) response.getBody().get("access_token");
                Object expiresIn = response.getBody().get("expires_in");
                if (expiresIn instanceof Number) {
                    tokenExpiresAt = System.currentTimeMillis() + ((Number) expiresIn).longValue() * 1000;
                } else {
                    tokenExpiresAt = System.currentTimeMillis() + 3600_000; // 1 hour default
                }
            }

            return cachedAccessToken;

        } catch (Exception e) {
            log.error("SAP OAuth token acquisition failed: {}", e.getMessage());
            throw new RuntimeException("Failed to obtain SAP access token: " + e.getMessage(), e);
        }
    }

    private String generateTransmissionId() {
        return "SAP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
