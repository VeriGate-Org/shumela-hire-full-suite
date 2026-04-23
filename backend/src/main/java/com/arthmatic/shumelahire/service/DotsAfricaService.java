package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.VerificationSummaryDTO;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.BackgroundCheckDataRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Dots Africa (Pty) Ltd verification service implementation.
 * NCR-accredited verification agency (NCRCB38).
 *
 * Supports 12 check types: ID verification, credit, criminal, fraud,
 * qualification, reference, employment history, professional body,
 * social media screening, directorship, citizenship, residency.
 */
@Service
@ConditionalOnProperty(name = "background-check.provider", havingValue = "dots-africa")
public class DotsAfricaService implements BackgroundCheckService {

    private static final Logger logger = LoggerFactory.getLogger(DotsAfricaService.class);

    @Value("${dots-africa.base-url:https://api.dotsafrica.com/v1}")
    private String baseUrl;

    @Value("${dots-africa.api-key:}")
    private String apiKey;

    @Value("${dots-africa.client-id:}")
    private String clientId;

    @Autowired
    private BackgroundCheckDataRepository backgroundCheckRepository;

    @Autowired
    private ApplicationDataRepository applicationRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── Available check types ──────────────────────────

    private static final List<Map<String, Object>> CHECK_TYPES = List.of(
            checkType("ID_VERIFICATION", "ID Verification", "Verify South African ID number against DHA records", "24 hours", 45.00),
            checkType("CREDIT_CHECK", "Credit Check", "TransUnion/Experian credit bureau check", "24 hours", 65.00),
            checkType("CRIMINAL_CHECK", "Criminal Record Check", "SAPS criminal record verification", "5-7 days", 120.00),
            checkType("FRAUD_CHECK", "Fraud Check", "SAFPS fraud database screening", "24-48 hours", 85.00),
            checkType("QUALIFICATION_VERIFICATION", "Qualification Verification", "Tertiary qualification verification with SAQA/institution", "5-10 days", 150.00),
            checkType("REFERENCE_CHECK", "Reference Check", "Professional reference verification (2 referees)", "3-5 days", 180.00),
            checkType("EMPLOYMENT_HISTORY", "Employment History", "Verify previous employment with HR departments", "3-5 days", 130.00),
            checkType("PROFESSIONAL_BODY", "Professional Body Check", "Verify registration with professional bodies (SAICA, ECSA, etc.)", "3-5 days", 95.00),
            checkType("SOCIAL_MEDIA_SCREENING", "Social Media Screening", "LinkedIn, Facebook, Twitter screening for brand risk", "48 hours", 75.00),
            checkType("DIRECTORSHIP_CHECK", "Directorship Check", "CIPC company directorship and interest search", "24-48 hours", 55.00),
            checkType("CITIZENSHIP_VERIFICATION", "Citizenship Verification", "DHA citizenship and immigration status check", "3-5 days", 95.00),
            checkType("RESIDENCY_VERIFICATION", "Residency Verification", "Physical address verification via field agent", "5-7 days", 200.00)
    );

    private static Map<String, Object> checkType(String code, String name, String description, String turnaround, double price) {
        Map<String, Object> ct = new LinkedHashMap<>();
        ct.put("code", code);
        ct.put("name", name);
        ct.put("description", description);
        ct.put("turnaround", turnaround);
        ct.put("price", price);
        ct.put("currency", "ZAR");
        return ct;
    }

    // ── Interface implementation ──────────────────────

    @Override
    public BackgroundCheck initiateCheck(String applicationId, String candidateIdNumber,
                                          String candidateName, String candidateEmail,
                                          List<String> checkTypes, boolean consentObtained,
                                          String initiatedBy) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

        // Create internal background check record
        BackgroundCheck check = new BackgroundCheck();
        check.setApplication(application);
        check.setCandidateIdNumber(candidateIdNumber);
        check.setCandidateName(candidateName);
        check.setCandidateEmail(candidateEmail);
        check.setConsentObtained(consentObtained);
        check.setInitiatedBy(initiatedBy);
        check.setProvider("dots-africa");
        check.setStatus(consentObtained ? BackgroundCheckStatus.INITIATED : BackgroundCheckStatus.PENDING_CONSENT);

        // Serialize check types
        try {
            check.setCheckTypes(objectMapper.writeValueAsString(checkTypes));
        } catch (JsonProcessingException e) {
            check.setCheckTypes(checkTypes.toString());
        }

        // Generate internal reference ID
        String referenceId = "DA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        check.setReferenceId(referenceId);

        // Submit to Dots Africa API
        if (consentObtained) {
            try {
                HttpHeaders headers = buildHeaders();

                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("referenceId", referenceId);
                payload.put("clientId", clientId);
                payload.put("candidate", Map.of(
                        "idNumber", candidateIdNumber,
                        "fullName", candidateName,
                        "email", candidateEmail != null ? candidateEmail : ""
                ));
                payload.put("checks", checkTypes);
                payload.put("consentObtained", true);
                payload.put("consentDate", LocalDateTime.now().toString());
                payload.put("callbackUrl", baseUrl.replace("api.dotsafrica.com/v1", "")
                        + "/api/background-checks/webhook");

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

                ResponseEntity<Map> response = restTemplate.exchange(
                        baseUrl + "/screenings",
                        HttpMethod.POST,
                        request,
                        Map.class
                );

                Map<String, Object> body = response.getBody();
                if (body != null) {
                    String screeningId = (String) body.get("screeningId");
                    check.setExternalScreeningId(screeningId);

                    String status = (String) body.get("status");
                    if ("IN_PROGRESS".equals(status)) {
                        check.setStatus(BackgroundCheckStatus.IN_PROGRESS);
                    }
                }

                check.setSubmittedAt(LocalDateTime.now());
                logger.info("Initiated Dots Africa screening {} for application {} — checks: {}",
                        referenceId, applicationId, checkTypes);

            } catch (Exception e) {
                check.setStatus(BackgroundCheckStatus.FAILED);
                check.setErrorMessage(e.getMessage());
                logger.error("Failed to initiate Dots Africa screening for application {}: {}",
                        applicationId, e.getMessage());
            }
        }

        BackgroundCheck saved = backgroundCheckRepository.save(check);
        auditLogService.saveLog(String.valueOf(initiatedBy), "INITIATE_BACKGROUND_CHECK",
                "BACKGROUND_CHECK", saved.getId().toString(),
                "Initiated background check " + referenceId + " for application " + applicationId
                        + " — checks: " + checkTypes);
        return saved;
    }

    @Override
    public BackgroundCheck getCheckStatus(String referenceId) {
        BackgroundCheck check = backgroundCheckRepository.findByReferenceId(referenceId)
                .orElseThrow(() -> new RuntimeException("Background check not found: " + referenceId));

        // If still active, poll the provider for latest status
        if (check.getStatus().isActive() && check.getExternalScreeningId() != null) {
            try {
                HttpHeaders headers = buildHeaders();
                HttpEntity<Void> request = new HttpEntity<>(headers);

                ResponseEntity<Map> response = restTemplate.exchange(
                        baseUrl + "/screenings/" + check.getExternalScreeningId(),
                        HttpMethod.GET,
                        request,
                        Map.class
                );

                Map<String, Object> body = response.getBody();
                if (body != null) {
                    updateCheckFromProvider(check, body);
                    check = backgroundCheckRepository.save(check);
                }
            } catch (Exception e) {
                logger.warn("Failed to poll Dots Africa status for {}: {}", referenceId, e.getMessage());
            }
        }

        return check;
    }

    @Override
    public BackgroundCheck getCheckResults(String referenceId) {
        return backgroundCheckRepository.findByReferenceId(referenceId)
                .orElseThrow(() -> new RuntimeException("Background check not found: " + referenceId));
    }

    @Override
    public byte[] downloadReport(String referenceId) {
        BackgroundCheck check = backgroundCheckRepository.findByReferenceId(referenceId)
                .orElseThrow(() -> new RuntimeException("Background check not found: " + referenceId));

        if (check.getExternalScreeningId() == null) {
            throw new RuntimeException("No external screening ID — report not available");
        }

        try {
            HttpHeaders headers = buildHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_PDF));
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<byte[]> response = restTemplate.exchange(
                    baseUrl + "/screenings/" + check.getExternalScreeningId() + "/report",
                    HttpMethod.GET,
                    request,
                    byte[].class
            );

            logger.info("Downloaded Dots Africa report for screening {}", referenceId);
            return response.getBody();
        } catch (Exception e) {
            logger.error("Failed to download report for screening {}: {}", referenceId, e.getMessage());
            throw new RuntimeException("Failed to download verification report: " + e.getMessage());
        }
    }

    @Override
    public void handleWebhookEvent(Map<String, Object> event) {
        String eventType = (String) event.get("eventType");
        String screeningId = (String) event.get("screeningId");
        String referenceId = (String) event.get("referenceId");

        logger.info("Received Dots Africa webhook: type={}, screeningId={}, referenceId={}",
                eventType, screeningId, referenceId);

        // Try to find by reference ID first, then by external screening ID
        Optional<BackgroundCheck> checkOpt = referenceId != null
                ? backgroundCheckRepository.findByReferenceId(referenceId)
                : backgroundCheckRepository.findByExternalScreeningId(screeningId);

        if (checkOpt.isEmpty()) {
            logger.warn("No background check found for webhook: screeningId={}, referenceId={}",
                    screeningId, referenceId);
            return;
        }

        BackgroundCheck check = checkOpt.get();

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) event.getOrDefault("data", Collections.emptyMap());

        switch (eventType != null ? eventType : "") {
            case "screening.in_progress":
                check.setStatus(BackgroundCheckStatus.IN_PROGRESS);
                break;

            case "screening.partial_results":
                check.setStatus(BackgroundCheckStatus.PARTIAL_RESULTS);
                if (data.get("results") != null) {
                    try {
                        check.setResultsJson(objectMapper.writeValueAsString(data.get("results")));
                    } catch (JsonProcessingException e) {
                        logger.warn("Could not serialize partial results: {}", e.getMessage());
                    }
                }
                break;

            case "screening.completed":
                check.setStatus(BackgroundCheckStatus.COMPLETED);
                check.setCompletedAt(LocalDateTime.now());

                // Set overall result
                String overallResultStr = (String) data.get("overallResult");
                if (overallResultStr != null) {
                    try {
                        check.setOverallResult(BackgroundCheckResult.valueOf(overallResultStr.toUpperCase()));
                    } catch (IllegalArgumentException e) {
                        check.setOverallResult(BackgroundCheckResult.PENDING_REVIEW);
                    }
                }

                // Set detailed results
                if (data.get("results") != null) {
                    try {
                        check.setResultsJson(objectMapper.writeValueAsString(data.get("results")));
                    } catch (JsonProcessingException e) {
                        logger.warn("Could not serialize results: {}", e.getMessage());
                    }
                }

                // Set report URL
                if (data.get("reportUrl") != null) {
                    check.setReportUrl((String) data.get("reportUrl"));
                }

                logger.info("Background check {} completed — result: {}", check.getReferenceId(), overallResultStr);
                break;

            case "screening.failed":
                check.setStatus(BackgroundCheckStatus.FAILED);
                check.setErrorMessage((String) data.getOrDefault("reason", "Check failed at provider"));
                logger.error("Background check {} failed: {}", check.getReferenceId(), data.get("reason"));
                break;

            default:
                logger.warn("Unhandled Dots Africa webhook event type: {}", eventType);
                return;
        }

        backgroundCheckRepository.save(check);
        auditLogService.saveLog("SYSTEM", "WEBHOOK_" + (eventType != null ? eventType.toUpperCase() : "UNKNOWN"),
                "BACKGROUND_CHECK", check.getId().toString(),
                "Dots Africa webhook: " + eventType + " for " + check.getReferenceId());
    }

    @Override
    public BackgroundCheck cancelCheck(String referenceId, String reason) {
        BackgroundCheck check = backgroundCheckRepository.findByReferenceId(referenceId)
                .orElseThrow(() -> new RuntimeException("Background check not found: " + referenceId));

        if (!check.canBeCancelled()) {
            throw new RuntimeException("Background check cannot be cancelled in status: " + check.getStatus());
        }

        // Cancel at provider if submitted
        if (check.getExternalScreeningId() != null) {
            try {
                HttpHeaders headers = buildHeaders();
                Map<String, String> body = Map.of("reason", reason != null ? reason : "Cancelled by client");
                HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

                restTemplate.exchange(
                        baseUrl + "/screenings/" + check.getExternalScreeningId() + "/cancel",
                        HttpMethod.POST,
                        request,
                        Void.class
                );
            } catch (Exception e) {
                logger.warn("Failed to cancel Dots Africa screening {}: {}", referenceId, e.getMessage());
            }
        }

        check.setStatus(BackgroundCheckStatus.CANCELLED);
        check.setCancelledAt(LocalDateTime.now());
        check.setNotes(reason);

        BackgroundCheck saved = backgroundCheckRepository.save(check);
        auditLogService.saveLog("SYSTEM", "CANCEL_BACKGROUND_CHECK",
                "BACKGROUND_CHECK", saved.getId().toString(),
                "Cancelled background check " + referenceId + ": " + reason);
        return saved;
    }

    @Override
    public List<Map<String, Object>> getAvailableCheckTypes() {
        return CHECK_TYPES;
    }

    @Override
    public Map<String, VerificationSummaryDTO> getVerificationSummaries(List<String> applicationIds) {
        if (applicationIds == null || applicationIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<String> stringIds = applicationIds;
        List<Application> applications = applicationRepository.findAllByIds(stringIds);
        List<BackgroundCheck> allChecks = backgroundCheckRepository.findByApplicationIdIn(stringIds);

        // Group checks by application ID
        Map<String, List<BackgroundCheck>> checksByApp = new HashMap<>();
        for (BackgroundCheck bc : allChecks) {
            checksByApp.computeIfAbsent(bc.getApplication().getId(), k -> new ArrayList<>()).add(bc);
        }

        Map<String, VerificationSummaryDTO> result = new HashMap<>();
        for (Application app : applications) {
            JobPosting jobPosting = app.getJobPosting();
            List<String> requiredTypes = List.of();
            boolean enforce = false;

            if (jobPosting != null) {
                enforce = Boolean.TRUE.equals(jobPosting.getEnforceCheckCompletion());
                String requiredJson = jobPosting.getRequiredCheckTypes();
                if (requiredJson != null && !requiredJson.isBlank()) {
                    try {
                        requiredTypes = objectMapper.readValue(requiredJson,
                                objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                    } catch (JsonProcessingException e) {
                        // skip malformed
                    }
                }
            }

            List<BackgroundCheck> appChecks = checksByApp.getOrDefault(app.getId(), List.of());
            result.put(app.getId(), new VerificationSummaryDTO(app.getId(), requiredTypes, enforce, appChecks));
        }

        return result;
    }

    @Override
    public void enforceBackgroundCheckCompletion(Application application) {
        JobPosting jobPosting = application.getJobPosting();
        if (jobPosting == null || !Boolean.TRUE.equals(jobPosting.getEnforceCheckCompletion())) {
            return;
        }

        String requiredCheckTypesJson = jobPosting.getRequiredCheckTypes();
        if (requiredCheckTypesJson == null || requiredCheckTypesJson.isBlank()) {
            return;
        }

        List<String> requiredTypes;
        try {
            requiredTypes = objectMapper.readValue(requiredCheckTypesJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return;
        }

        if (requiredTypes.isEmpty()) {
            return;
        }

        List<BackgroundCheck> checks = backgroundCheckRepository
                .findByApplicationIdOrderByCreatedAtDesc(application.getId());

        Set<String> completedClearTypes = new HashSet<>();
        for (BackgroundCheck check : checks) {
            if (check.getStatus() == BackgroundCheckStatus.COMPLETED
                    && check.getOverallResult() == BackgroundCheckResult.CLEAR) {
                try {
                    List<String> checkTypes = objectMapper.readValue(
                            check.getCheckTypes() != null ? check.getCheckTypes() : "[]",
                            objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                    completedClearTypes.addAll(checkTypes);
                } catch (JsonProcessingException e) {
                    // skip malformed entries
                }
            }
        }

        List<String> missing = requiredTypes.stream()
                .filter(t -> !completedClearTypes.contains(t))
                .toList();

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "Cannot progress past Background Check stage. The following required verification checks " +
                    "are not completed with CLEAR result: " + String.join(", ", missing));
        }
    }

    // ── Internal helpers ──────────────────────────────

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", apiKey);
        headers.set("X-Client-Id", clientId);
        return headers;
    }

    private void updateCheckFromProvider(BackgroundCheck check, Map<String, Object> providerData) {
        String status = (String) providerData.get("status");
        if (status != null) {
            switch (status.toUpperCase()) {
                case "IN_PROGRESS":
                    check.setStatus(BackgroundCheckStatus.IN_PROGRESS);
                    break;
                case "PARTIAL":
                case "PARTIAL_RESULTS":
                    check.setStatus(BackgroundCheckStatus.PARTIAL_RESULTS);
                    break;
                case "COMPLETED":
                    check.setStatus(BackgroundCheckStatus.COMPLETED);
                    check.setCompletedAt(LocalDateTime.now());

                    String result = (String) providerData.get("overallResult");
                    if (result != null) {
                        try {
                            check.setOverallResult(BackgroundCheckResult.valueOf(result.toUpperCase()));
                        } catch (IllegalArgumentException e) {
                            check.setOverallResult(BackgroundCheckResult.PENDING_REVIEW);
                        }
                    }
                    break;
                case "FAILED":
                    check.setStatus(BackgroundCheckStatus.FAILED);
                    break;
            }
        }

        // Update results if available
        if (providerData.get("results") != null) {
            try {
                check.setResultsJson(objectMapper.writeValueAsString(providerData.get("results")));
            } catch (JsonProcessingException e) {
                logger.warn("Could not serialize provider results: {}", e.getMessage());
            }
        }

        // Update report URL if available
        if (providerData.get("reportUrl") != null) {
            check.setReportUrl((String) providerData.get("reportUrl"));
        }
    }
}
