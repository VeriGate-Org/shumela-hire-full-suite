package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.VerificationSummaryDTO;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.BackgroundCheck;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.BackgroundCheckDataRepository;
import com.arthmatic.shumelahire.service.BackgroundCheckService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.arthmatic.shumelahire.annotation.FeatureGate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/background-checks")
@FeatureGate("BACKGROUND_CHECKS")
/*
 * Authorisation note — corrected 23 August 2026.
 *
 * Every method here was gated on hasAnyRole('ADMIN', 'RECRUITER', 'TA_MANAGER'). TA_MANAGER is not
 * a role this system has: the vocabulary is ADMIN, HR_MANAGER, RECRUITER, HIRING_MANAGER,
 * INTERVIEWER, EMPLOYEE, EXECUTIVE, APPLICANT. So one of the three named roles could never match,
 * and the gate silently admitted two — excluding HR_MANAGER entirely, and excluding the hiring
 * manager who owns the vacancy from seeing verification results on her own candidate.
 *
 * The split below is deliberate rather than simply widening: reading a result is not the same act
 * as commissioning one. Each check costs money (R45-R200 through the provider catalogue), so
 * initiating and cancelling stay with the roles that own the recruitment process, while the hiring
 * manager can see the outcome. That is also the more defensible story: the recruitment function
 * commissions the screening, the hiring manager sees what came back.
 *
 * Two other controllers still gate on the phantom role — RecruitmentLifecycleController and
 * SapPayrollController. Left alone here because neither is exercised by the demonstration and a
 * blind widen is worse than a known gap.
 */
public class BackgroundCheckController {

    private static final Logger logger = LoggerFactory.getLogger(BackgroundCheckController.class);

    @Autowired
    private BackgroundCheckService backgroundCheckService;

    @Autowired
    private BackgroundCheckDataRepository backgroundCheckRepository;

    @Autowired
    private ApplicationDataRepository applicationRepository;

    /**
     * Initiate a background check for an application.
     */
    @PostMapping("/applications/{applicationId}/initiate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<BackgroundCheck> initiateCheck(
            @PathVariable String applicationId,
            @RequestBody Map<String, Object> request) {

        String candidateIdNumber = (String) request.get("candidateIdNumber");
        String candidateName = (String) request.get("candidateName");
        String candidateEmail = (String) request.get("candidateEmail");
        Boolean consentObtained = (Boolean) request.getOrDefault("consentObtained", false);
        String initiatedBy = request.get("initiatedBy") != null ? request.get("initiatedBy").toString() : null;

        @SuppressWarnings("unchecked")
        List<String> checkTypes = (List<String>) request.get("checkTypes");

        if (candidateIdNumber == null || candidateIdNumber.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (checkTypes == null || checkTypes.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        BackgroundCheck check = backgroundCheckService.initiateCheck(
                applicationId, candidateIdNumber, candidateName, candidateEmail,
                checkTypes, consentObtained, initiatedBy);

        return ResponseEntity.status(HttpStatus.CREATED).body(check);
    }

    /**
     * Get the status of a background check.
     */
    @GetMapping("/{referenceId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<BackgroundCheck> getStatus(@PathVariable String referenceId) {
        BackgroundCheck check = backgroundCheckService.getCheckStatus(referenceId);
        return ResponseEntity.ok(check);
    }

    /**
     * Get the results of a completed background check.
     */
    @GetMapping("/{referenceId}/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<BackgroundCheck> getResults(@PathVariable String referenceId) {
        BackgroundCheck check = backgroundCheckService.getCheckResults(referenceId);
        return ResponseEntity.ok(check);
    }

    /**
     * Download the verification report PDF.
     */
    @GetMapping("/{referenceId}/report")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String referenceId) {
        byte[] report = backgroundCheckService.downloadReport(referenceId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("verification-report-" + referenceId + ".pdf")
                .build());

        return new ResponseEntity<>(report, headers, HttpStatus.OK);
    }

    /**
     * Handle incoming webhook events from the verification provider.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody Map<String, Object> event) {
        logger.info("Received background check webhook event: {}", event.get("eventType"));
        backgroundCheckService.handleWebhookEvent(event);
        return ResponseEntity.ok().build();
    }

    /**
     * Cancel a background check.
     */
    @PostMapping("/{referenceId}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<BackgroundCheck> cancelCheck(
            @PathVariable String referenceId,
            @RequestBody(required = false) Map<String, String> request) {
        String reason = request != null ? request.get("reason") : "Cancelled by user";
        BackgroundCheck check = backgroundCheckService.cancelCheck(referenceId, reason);
        return ResponseEntity.ok(check);
    }

    /**
     * Get available check types from the verification provider.
     */
    @GetMapping("/check-types")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getCheckTypes() {
        return ResponseEntity.ok(backgroundCheckService.getAvailableCheckTypes());
    }

    /**
     * Get required check types for an application's job posting.
     */
    @GetMapping("/applications/{applicationId}/required-check-types")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Map<String, Object>> getRequiredCheckTypes(@PathVariable String applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        JobPosting jobPosting = application.getJobPosting();
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("requiredCheckTypes", jobPosting.getRequiredCheckTypes());
        result.put("enforceCheckCompletion", jobPosting.getEnforceCheckCompletion());
        return ResponseEntity.ok(result);
    }

    /**
     * Get verification summaries for multiple applications (batch).
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Map<String, VerificationSummaryDTO>> getVerificationSummaries(
            @RequestParam List<String> applicationIds) {
        Map<String, VerificationSummaryDTO> summaries = backgroundCheckService.getVerificationSummaries(applicationIds);
        return ResponseEntity.ok(summaries);
    }

    /**
     * Get all background checks for an application.
     */
    @GetMapping("/applications/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<BackgroundCheck>> getByApplication(@PathVariable String applicationId) {
        List<BackgroundCheck> checks = backgroundCheckRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId);
        return ResponseEntity.ok(checks);
    }
}
