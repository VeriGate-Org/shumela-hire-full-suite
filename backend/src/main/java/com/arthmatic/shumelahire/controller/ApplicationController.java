package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ApplicationSummaryResponse;
import com.arthmatic.shumelahire.dto.ApplicationCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicationResponse;
import com.arthmatic.shumelahire.dto.ApplicationWithdrawRequest;
import com.arthmatic.shumelahire.dto.CanApplyResponse;
import com.arthmatic.shumelahire.dto.DocumentResponse;
import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.DocumentDataRepository;
import com.arthmatic.shumelahire.service.ApplicantService;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import com.arthmatic.shumelahire.security.ActorResolver;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationController.class);

    private final ApplicationService applicationService;
    private final DocumentDataRepository documentRepository;
    private final ApplicantDataRepository applicantRepository;
    private final ApplicantService applicantService;
    private final ActorResolver actorResolver;

    public ApplicationController(ApplicationService applicationService,
                                 DocumentDataRepository documentRepository,
                                 ApplicantDataRepository applicantRepository,
                                 ApplicantService applicantService,
                                 ActorResolver actorResolver) {
        this.applicationService = applicationService;
        this.documentRepository = documentRepository;
        this.applicantRepository = applicantRepository;
        this.actorResolver = actorResolver;
        this.applicantService = applicantService;
    }

    /**
     * The applicant an application should be filed against.
     *
     * <p>A candidate applying for themselves never supplies this: the public form posts only the
     * job, so {@code applicantId} arrived null and bean validation rejected the request before the
     * controller ran — the whole public application journey ended in a 400 with an empty body.</p>
     *
     * <p>It is resolved from the authenticated principal rather than the payload, because a
     * client-supplied applicant id on an endpoint an applicant can reach is an authorisation hole:
     * it would let any signed-in candidate file an application in somebody else's name. Staff roles
     * capture applications on a candidate's behalf — agency submissions, paper forms — so they may
     * still name the applicant, and for them the field stays required.</p>
     */
    private String resolveApplicantForSubmission(ApplicationCreateRequest request,
                                                 Authentication authentication) {
        if (isApplicant(authentication) || isEmployee(authentication)) {
            String ownId = resolveApplicantId(authentication);
            String supplied = request.getApplicantId();
            if (supplied != null && !supplied.equals(ownId)) {
                throw new AccessDeniedException("Applicants may only apply on their own behalf");
            }
            return ownId;
        }

        // Staff path: unchanged. Somebody has to say who this application is for.
        if (request.getApplicantId() == null) {
            throw new IllegalArgumentException("Applicant ID is required");
        }
        return request.getApplicantId();
    }

    private String resolveApplicantId(Authentication authentication) {
        String email = extractAuthenticatedEmail(authentication);
        if (email == null) {
            throw new AccessDeniedException("Applicant email missing from authentication");
        }
        if (isEmployee(authentication)) {
            return applicantService.resolveOrCreateApplicantIdForEmployee(email);
        }
        return applicantRepository.findByEmail(email)
                .map(Applicant::getId)
                .orElseThrow(() -> new AccessDeniedException("Applicant profile not found for authenticated user"));
    }

    private String extractAuthenticatedEmail(Authentication authentication) {
        if (authentication == null) return null;
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("email");
        }
        if (authentication.getPrincipal() instanceof User user) {
            return user.getEmail();
        }
        return null;
    }

    private boolean isApplicant(Authentication authentication) {
        if (authentication == null) return false;
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if ("ROLE_APPLICANT".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    // Employees get the same self-service application flow as Applicants
    // (browse jobs, apply, track their own applications) — see
    // ApplicantService.resolveOrCreateApplicantIdForEmployee for how their
    // Applicant record gets created on first use.
    private boolean isEmployee(Authentication authentication) {
        if (authentication == null) return false;
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if ("ROLE_EMPLOYEE".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Submit new application
     * POST /api/applications
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT', 'EMPLOYEE')")
    public ResponseEntity<?> submitApplication(@Valid @RequestBody ApplicationCreateRequest request,
                                               Authentication authentication) {
        try {
            request.setApplicantId(resolveApplicantForSubmission(request, authentication));
            logger.info("Submitting application for applicant {} to job {}",
                       request.getApplicantId(), request.getJobAdId());
            ApplicationResponse response = applicationService.submitApplication(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AccessDeniedException e) {
            logger.warn("Rejected application submission: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(e.getMessage()));
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
    public ResponseEntity<?> getApplication(@PathVariable String id) {
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
     * GET /api/applications?search={term}&status={status}&department={department}&page={page}&size={size}&sort={field}
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> searchApplications(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
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

            // Comma-separated, same shape as status. Unlike status there is no enum to validate
            // against — departments are free text on the record — so the values are passed through
            // as given and a department nobody works in simply matches nothing.
            List<String> departments = null;
            if (department != null && !department.isBlank()) {
                departments = Arrays.stream(department.split(","))
                        .map(String::trim)
                        .filter(d -> !d.isEmpty())
                        .collect(Collectors.toList());
                if (departments.isEmpty()) departments = null;
            }

            Page<ApplicationResponse> results =
                    applicationService.searchApplications(search, statuses, departments, pageable);
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
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT', 'EMPLOYEE')")
    public ResponseEntity<?> getApplicationsByApplicant(@PathVariable String applicantId) {
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
    public ResponseEntity<?> getApplicationsByJobAd(@PathVariable String jobAdId) {
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
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
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
     *
     * Includes HIRING_MANAGER alongside the other roles that already have
     * every read endpoint /applications/manage needs (search, statistics,
     * attention, filter-options on ApplicationManagementController) — this
     * is the single-item Reject / Move-to-Screening action on that same
     * page, so a Hiring Manager who can see an application couldn't act on
     * it. Bulk operations and CSV export stay ADMIN/HR_MANAGER(/RECRUITER)
     * only, unchanged — that tier wasn't part of what was asked for.
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> updateApplicationStatus(
            Authentication authentication,
            @PathVariable String id,
            @RequestParam ApplicationStatus status,
            @RequestParam(required = false) String notes) {
        try {
            logger.info("Updating application {} to status {}", id, status);
            ApplicationResponse response = applicationService.updateApplicationStatus(
                    id, status, notes, actorResolver.actingUserId(authentication));
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
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT', 'EMPLOYEE')")
    public ResponseEntity<?> withdrawApplication(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody ApplicationWithdrawRequest request) {
        try {
            logger.info("Withdrawing application {}", id);
            ApplicationResponse response = applicationService.withdrawApplication(
                    id, request, actorResolver.actingUserId(authentication));
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
            Authentication authentication,
            @PathVariable String id,
            @RequestParam Integer rating,
            @RequestParam(required = false) String feedback) {
        try {
            logger.info("Rating application {} with {} stars", id, rating);
            ApplicationResponse response = applicationService.rateApplication(
                    id, rating, feedback, actorResolver.actingUserId(authentication));
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
     * Get documents for an application
     * GET /api/applications/{id}/documents
     */
    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getApplicationDocuments(@PathVariable String id) {
        try {
            List<DocumentResponse> documents = documentRepository.findByApplicationId(id)
                    .stream()
                    .map(DocumentResponse::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            logger.error("Error getting documents for application {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Check if applicant can apply for job
     * GET /api/applications/can-apply?applicantId={id}&jobAdId={id}
     */
    @GetMapping("/can-apply")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT', 'EMPLOYEE')")
    public ResponseEntity<?> canApplicantApplyForJob(
            @RequestParam String applicantId,
            @RequestParam String jobAdId) {
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
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
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
    public ResponseEntity<?> deleteApplication(Authentication authentication, @PathVariable String id) {
        try {
            logger.info("Deleting application {}", id);
            applicationService.deleteApplication(id, actorResolver.actingUserId(authentication));
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
     * Counts for the whole application set.
     * GET /api/applications/summary
     *
     * <p>Separate from the list on purpose: it is not paginated, it returns no records, and every
     * figure on it describes the entire set. The list page's tabs and tiles currently count the
     * twenty rows in hand and present the result as a total.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<ApplicationSummaryResponse> summary() {
        return ResponseEntity.ok(applicationService.summary());
    }

    /**
     * Get application statistics
     * GET /api/applications/statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
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
