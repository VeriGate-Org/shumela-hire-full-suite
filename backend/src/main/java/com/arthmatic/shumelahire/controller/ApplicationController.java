package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ApplicationCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicationResponse;
import com.arthmatic.shumelahire.dto.ApplicationWithdrawRequest;
import com.arthmatic.shumelahire.dto.CanApplyResponse;
import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.service.ApplicationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationController.class);

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Submit new application
     * POST /api/applications
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> submitApplication(@Valid @RequestBody ApplicationCreateRequest request) {
        try {
            logger.info("Submitting application for applicant {} to job {}",
                       request.getApplicantId(), request.getJobAdId());
            ApplicationResponse response = applicationService.submitApplication(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to submit application: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error submitting application", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get application by ID
     * GET /api/applications/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getApplication(@PathVariable Long id) {
        try {
            ApplicationResponse response = applicationService.getApplication(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Application not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting application {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Search applications with pagination
     * GET /api/applications?search={term}&page={page}&size={size}&sort={field}&status={status}
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> searchApplications(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "submittedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            // Parse status param: supports single value or comma-separated list
            List<ApplicationStatus> statuses = null;
            if (status != null && !status.isBlank()) {
                statuses = Arrays.stream(status.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(s -> {
                            try { return ApplicationStatus.valueOf(s); }
                            catch (IllegalArgumentException e) {
                                logger.warn("Ignoring unknown application status: {}", s);
                                return null;
                            }
                        })
                        .filter(s -> s != null)
                        .collect(Collectors.toList());
                if (statuses.isEmpty()) statuses = null;
            }

            Page<ApplicationResponse> results = applicationService.searchApplications(search, statuses, pageable);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error searching applications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get applications by applicant
     * GET /api/applications/applicant/{applicantId}
     */
    @GetMapping("/applicant/{applicantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> getApplicationsByApplicant(@PathVariable Long applicantId) {
        try {
            List<ApplicationResponse> applications = applicationService.getApplicationsByApplicant(applicantId);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error getting applications for applicant {}", applicantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get applications by job ad
     * GET /api/applications/job/{jobAdId}
     */
    @GetMapping("/job/{jobAdId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getApplicationsByJobAd(@PathVariable Long jobAdId) {
        try {
            List<ApplicationResponse> applications = applicationService.getApplicationsByJobAd(jobAdId);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error getting applications for job {}", jobAdId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get applications by status
     * GET /api/applications/status/{status}
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getApplicationsByStatus(@PathVariable ApplicationStatus status) {
        try {
            List<ApplicationResponse> applications = applicationService.getApplicationsByStatus(status);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error getting applications with status {}", status, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Update application status
     * PUT /api/applications/{id}/status
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            @RequestParam(required = false) String notes) {
        try {
            logger.info("Updating application {} to status {}", id, status);
            ApplicationResponse response = applicationService.updateApplicationStatus(id, status, notes);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to update application {} status: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating application {} status", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Withdraw application
     * POST /api/applications/{id}/withdraw
     */
    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> withdrawApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationWithdrawRequest request) {
        try {
            logger.info("Withdrawing application {}", id);
            ApplicationResponse response = applicationService.withdrawApplication(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to withdraw application {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error withdrawing application {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Rate application
     * POST /api/applications/{id}/rate
     */
    @PostMapping("/{id}/rate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> rateApplication(
            @PathVariable Long id,
            @RequestParam Integer rating,
            @RequestParam(required = false) String feedback) {
        try {
            logger.info("Rating application {} with {} stars", id, rating);
            ApplicationResponse response = applicationService.rateApplication(id, rating, feedback);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to rate application {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error rating application {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Check if applicant can apply for job
     * GET /api/applications/can-apply?applicantId={id}&jobAdId={id}
     */
    @GetMapping("/can-apply")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> canApplicantApplyForJob(
            @RequestParam Long applicantId,
            @RequestParam Long jobAdId) {
        try {
            boolean canApply = applicationService.canApplicantApplyForJob(applicantId, jobAdId);
            return ResponseEntity.ok(new CanApplyResponse(canApply));
        } catch (Exception e) {
            logger.error("Error checking if applicant {} can apply for job {}", applicantId, jobAdId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get applications requiring action
     * GET /api/applications/requiring-action
     */
    @GetMapping("/requiring-action")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getApplicationsRequiringAction() {
        try {
            List<ApplicationResponse> applications = applicationService.getApplicationsRequiringAction();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error getting applications requiring action", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get recent applications
     * GET /api/applications/recent?days={days}
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getRecentApplications(@RequestParam(defaultValue = "7") int days) {
        try {
            List<ApplicationResponse> applications = applicationService.getRecentApplications(days);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            logger.error("Error getting recent applications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Delete application
     * DELETE /api/applications/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id) {
        try {
            logger.info("Deleting application {}", id);
            applicationService.deleteApplication(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to delete application {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting application {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get application statistics
     * GET /api/applications/statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getApplicationStatistics() {
        try {
            List<Object[]> statistics = applicationService.getApplicationStatusStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            logger.error("Error getting application statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }
}
