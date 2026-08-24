package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.JobPostingCreateRequest;
import com.arthmatic.shumelahire.dto.JobPostingResponse;
import com.arthmatic.shumelahire.dto.VerificationRequirementsRequest;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.JobPostingDataRepository;
import com.arthmatic.shumelahire.repository.RequisitionDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobPostingService {
    
    private static final Logger logger = LoggerFactory.getLogger(JobPostingService.class);

    private final JobPostingDataRepository jobPostingRepository;
    private final AuditLogService auditLogService;
    private final JobAdSyncService jobAdSyncService;
    private final NotificationService notificationService;
    private final RequisitionDataRepository requisitionRepository;
    private final UserDataRepository userRepository;
    /** Optional: the verification provider is feature-flagged, so the bean may be absent. */
    private final ObjectProvider<BackgroundCheckService> backgroundCheckService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public JobPostingService(JobPostingDataRepository jobPostingRepository,
                             AuditLogService auditLogService,
                             JobAdSyncService jobAdSyncService,
                             NotificationService notificationService,
                             RequisitionDataRepository requisitionRepository,
                             UserDataRepository userRepository,
                             ObjectProvider<BackgroundCheckService> backgroundCheckService) {
        this.jobPostingRepository = jobPostingRepository;
        this.auditLogService = auditLogService;
        this.jobAdSyncService = jobAdSyncService;
        this.notificationService = notificationService;
        this.requisitionRepository = requisitionRepository;
        this.userRepository = userRepository;
        this.backgroundCheckService = backgroundCheckService;
    }

    /**
     * Authority level at or above which a submitter approves their own job posting.
     *
     * <p>A Talent Acquisition Manager owns the vacancies they run, so their own submissions do not
     * queue for someone else. A TA Specialist — {@code RECRUITER}, priority 60 — sits below this
     * line and still requires a manager or above to approve. This is the same delegated-authority
     * idea the requisition chain applies by value, applied here by seniority, and it reuses the
     * priority ordering already declared on {@link User.Role}.</p>
     */
    private static final User.Role SELF_APPROVAL_THRESHOLD = User.Role.HIRING_MANAGER;

    /**
     * True when this user may approve their own submission.
     *
     * <p>Unknown users deliberately fall through to requiring approval — the safe direction.</p>
     */
    private boolean holdsSelfApprovalAuthority(String userId) {
        if (userId == null || userId.isBlank()) {
            return false;
        }
        return userRepository.findById(userId)
                .map(User::getRole)
                .filter(role -> role.hasPermission(SELF_APPROVAL_THRESHOLD))
                .isPresent();
    }

    /**
     * Controlled advertising: a posting raised from a requisition may only be advertised once that
     * requisition is approved.
     *
     * <p>Deliberately lenient where no requisition is linked. Postings created before requisition
     * linkage existed, or raised outside the requisition process, publish exactly as before — the
     * control applies to what it can actually verify rather than blocking on absent data.</p>
     */
    private void assertRequisitionAuthorises(JobPosting jobPosting) {
        if (!jobPosting.isRequisitionLinked()) {
            return;
        }
        Requisition requisition = requisitionRepository.findById(jobPosting.getRequisitionId()).orElse(null);
        if (requisition == null) {
            logger.warn("Job posting {} references requisition {} which no longer exists; allowing publish",
                    jobPosting.getId(), jobPosting.getRequisitionId());
            return;
        }
        if (requisition.getStatus() != Requisition.RequisitionStatus.APPROVED) {
            throw new IllegalStateException(String.format(
                    "Job posting cannot be advertised: requisition '%s' is %s, not APPROVED.",
                    requisition.getJobTitle() != null ? requisition.getJobTitle() : requisition.getId(),
                    requisition.getStatus()));
        }
    }
    
    /**
     * Create a new job posting
     */
    public JobPostingResponse createJobPosting(JobPostingCreateRequest request, String createdBy) {
        logger.info("Creating job posting: {} by user {}", request.getTitle(), createdBy);
        
        JobPosting jobPosting = new JobPosting();
        mapRequestToEntity(request, jobPosting);
        jobPosting.setCreatedBy(createdBy);
        jobPosting.setStatus(JobPostingStatus.DRAFT);
        
        // Generate slug
        String slug = generateSlug(request.getTitle());
        jobPosting.setSlug(slug);
        
        JobPosting savedJobPosting = jobPostingRepository.save(jobPosting);
        
        // Log to audit
        auditLogService.logUserAction(createdBy, "JOB_POSTING_CREATED", "JOB_POSTING", 
                                     savedJobPosting.getTitle() + " (ID: " + savedJobPosting.getId() + ")");
        
        logger.info("Job posting created with ID: {}", savedJobPosting.getId());
        
        return JobPostingResponse.fromEntity(savedJobPosting);
    }
    
    /**
     * Update an existing job posting
     */
    public JobPostingResponse updateJobPosting(String id, JobPostingCreateRequest request, String updatedBy) {
        logger.info("Updating job posting: {} by user {}", id, updatedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        // Check if posting can be edited
        if (!jobPosting.canBeEdited()) {
            throw new IllegalStateException("Job posting cannot be edited in current status: " + jobPosting.getStatus());
        }
        
        mapRequestToEntity(request, jobPosting);
        
        // Update slug if title changed
        if (!jobPosting.getTitle().equals(request.getTitle())) {
            String newSlug = generateSlug(request.getTitle());
            jobPosting.setSlug(newSlug);
        }
        
        JobPosting updatedJobPosting = jobPostingRepository.save(jobPosting);
        
        // Log to audit
        auditLogService.logUserAction(updatedBy, "JOB_POSTING_UPDATED", "JOB_POSTING", 
                                     updatedJobPosting.getTitle() + " (ID: " + updatedJobPosting.getId() + ")");
        
        logger.info("Job posting updated: {}", id);
        
        return JobPostingResponse.fromEntity(updatedJobPosting);
    }
    
    /**
     * Sets the verification a requisition demands before a candidate may progress past Background
     * Check.
     *
     * <p>Separate from {@link #updateJobPosting} on purpose. That path refuses an approved or
     * published posting via {@code canBeEdited()}, which is correct — an advertised title, salary
     * band or description must not move under candidates who applied to it. Verification
     * requirements are not part of the advert: they govern how the vacancy is run, and the reason
     * to add one usually appears after approval. Left to the general edit path, the only way to
     * require a criminal check on a live vacancy would be to unpublish and re-advertise it.</p>
     *
     * <p>Widening {@code canBeEdited()} would have been the smaller diff and the wrong change: it
     * would have opened every field on the record to reach two of them.</p>
     *
     * <p>Unknown check codes are refused rather than stored. A typo would otherwise be silently
     * unsatisfiable — no check of that type can ever complete, so every candidate on the requisition
     * would be blocked at Background Check for ever, with no clue why.</p>
     */
    public JobPostingResponse updateVerificationRequirements(String id,
                                                             VerificationRequirementsRequest request,
                                                             String updatedBy) {
        JobPosting jobPosting = findJobPostingById(id);

        List<String> requested = request.getRequiredCheckTypes() == null
                ? List.of()
                : new ArrayList<>(new LinkedHashSet<>(request.getRequiredCheckTypes()));

        List<String> unknown = rejectUnknownCheckTypes(requested);
        if (!unknown.isEmpty()) {
            throw new IllegalArgumentException(
                    "Unknown verification check type(s): " + String.join(", ", unknown));
        }

        boolean enforce = Boolean.TRUE.equals(request.getEnforceCheckCompletion());
        if (enforce && requested.isEmpty()) {
            throw new IllegalArgumentException(
                    "Select at least one check to require before enforcing completion, "
                    + "otherwise the rule would block nobody and imply a control that is not there.");
        }

        String previousTypes = jobPosting.getRequiredCheckTypes();
        boolean previousEnforce = Boolean.TRUE.equals(jobPosting.getEnforceCheckCompletion());

        try {
            jobPosting.setRequiredCheckTypes(objectMapper.writeValueAsString(requested));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not store the verification requirements", e);
        }
        jobPosting.setEnforceCheckCompletion(enforce);
        jobPosting.setUpdatedAt(LocalDateTime.now());

        JobPosting saved = jobPostingRepository.save(jobPosting);

        // Who tightened or relaxed a hiring control, and when, is exactly the question an auditor
        // asks. Record the before and after, not just that something changed.
        auditLogService.logUserAction(updatedBy, "JOB_POSTING_VERIFICATION_REQUIREMENTS_UPDATED",
                "JOB_POSTING",
                String.format("%s (ID: %s): enforcement %s -> %s, required checks %s -> %s",
                        saved.getTitle(), saved.getId(),
                        previousEnforce ? "on" : "off", enforce ? "on" : "off",
                        previousTypes == null || previousTypes.isBlank() ? "[]" : previousTypes,
                        requested));

        logger.info("Verification requirements updated on job posting {} by {}: enforce={}, types={}",
                id, updatedBy, enforce, requested);

        return JobPostingResponse.fromEntity(saved);
    }

    /**
     * Returns the requested codes that the provider catalogue does not recognise.
     *
     * <p>When the verification provider is not wired in there is no catalogue to check against, so
     * nothing is refused — an absent provider must not stop a requisition being configured for the
     * day it is present.</p>
     */
    private List<String> rejectUnknownCheckTypes(List<String> requested) {
        if (requested.isEmpty()) {
            return List.of();
        }
        BackgroundCheckService provider = backgroundCheckService.getIfAvailable();
        if (provider == null) {
            return List.of();
        }
        Set<String> known = provider.getAvailableCheckTypes().stream()
                .map(ct -> String.valueOf(((Map<?, ?>) ct).get("code")))
                .collect(Collectors.toSet());
        return requested.stream().filter(code -> !known.contains(code)).toList();
    }

    /**
     * Get job posting by ID
     */
    @Transactional(readOnly = true)
    public JobPostingResponse getJobPosting(String id) {
        JobPosting jobPosting = findJobPostingById(id);
        return JobPostingResponse.fromEntity(jobPosting);
    }
    
    /**
     * Get job posting by slug
     */
    @Transactional(readOnly = true)
    public JobPostingResponse getJobPostingBySlug(String slug) {
        JobPosting jobPosting = jobPostingRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Job posting not found with slug: " + slug));
        
        // TODO: Add rate-limiting/deduplication (session/IP-based) to prevent view inflation
        // Increment view count for published jobs
        if (jobPosting.getStatus() == JobPostingStatus.PUBLISHED) {
            jobPostingRepository.incrementViewCount(jobPosting.getId());
        }
        
        return JobPostingResponse.fromEntity(jobPosting);
    }
    
    /**
     * Search job postings with pagination
     */
    @Transactional(readOnly = true)
    public Page<JobPostingResponse> searchJobPostings(String searchTerm, Pageable pageable) {
        Page<JobPosting> jobPostings;
        
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            jobPostings = jobPostingRepository.searchJobPostings(searchTerm, pageable);
        } else {
            jobPostings = jobPostingRepository.findAll(pageable);
        }
        
        return jobPostings.map(JobPostingResponse::fromEntity);
    }
    
    /**
     * Advanced search with filters
     */
    @Transactional(readOnly = true)
    public Page<JobPostingResponse> searchJobPostingsWithFilters(
            String searchTerm, String department, EmploymentType employmentType,
            ExperienceLevel experienceLevel, String location, Boolean remoteWork,
            JobPostingStatus status, Pageable pageable) {
        
        Page<JobPosting> jobPostings = jobPostingRepository.findJobsWithFilters(
                searchTerm, department, employmentType, experienceLevel, 
                location, remoteWork, status, pageable);
        
        return jobPostings.map(JobPostingResponse::fromEntity);
    }
    
    /**
     * Get published jobs for public viewing
     */
    @Transactional(readOnly = true)
    public Page<JobPostingResponse> getPublishedJobs(Pageable pageable) {
        Page<JobPosting> jobPostings = jobPostingRepository.findActivePublishedJobs(LocalDateTime.now(), pageable);
        return jobPostings.map(JobPostingResponse::fromEntity);
    }
    
    /**
     * Get job postings by status
     */
    @Transactional(readOnly = true)
    public List<JobPostingResponse> getJobPostingsByStatus(JobPostingStatus status) {
        List<JobPosting> jobPostings = jobPostingRepository.findByStatusOrderByCreatedAtDesc(status);
        return jobPostings.stream()
                .map(JobPostingResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get job postings created by user
     */
    @Transactional(readOnly = true)
    public Page<JobPostingResponse> getJobPostingsByCreator(String createdBy, Pageable pageable) {
        Page<JobPosting> jobPostings = jobPostingRepository.findByCreatedBy(createdBy, pageable);
        return jobPostings.map(JobPostingResponse::fromEntity);
    }
    
    /**
     * Submit job posting for approval
     */
    public JobPostingResponse submitForApproval(String id, String submittedBy) {
        logger.info("Submitting job posting {} for approval by user {}", id, submittedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (!jobPosting.canBeSubmittedForApproval()) {
            throw new IllegalStateException("Job posting cannot be submitted for approval in current status: " + jobPosting.getStatus());
        }
        
        LocalDateTime now = LocalDateTime.now();
        jobPosting.setSubmittedForApprovalAt(now);

        boolean selfApproves = holdsSelfApprovalAuthority(submittedBy);

        if (selfApproves) {
            // Delegated authority — the submitter is a hiring manager or above, so the posting is
            // approved on submission rather than queuing for someone more senior. Recorded as a
            // real approval, with who and why, so the audit trail explains the shortcut.
            jobPosting.setStatus(JobPostingStatus.APPROVED);
            jobPosting.setApprovedBy(submittedBy);
            jobPosting.setApprovedAt(now);
            jobPosting.setApprovalNotes("Approved under delegated authority: submitter holds "
                    + SELF_APPROVAL_THRESHOLD.getDisplayName() + " authority or above.");
        } else {
            jobPosting.setStatus(JobPostingStatus.PENDING_APPROVAL);
        }

        JobPosting updatedJobPosting = jobPostingRepository.save(jobPosting);

        // Log to audit
        auditLogService.logUserAction(submittedBy,
                selfApproves ? "JOB_POSTING_APPROVED_UNDER_DELEGATED_AUTHORITY"
                             : "JOB_POSTING_SUBMITTED_FOR_APPROVAL",
                "JOB_POSTING",
                updatedJobPosting.getTitle() + " (ID: " + updatedJobPosting.getId() + ")");

        if (!selfApproves) {
            notificationService.notifyApprovalRequired(submittedBy, "Job Posting", jobPosting.getTitle());
        }

        logger.info("Job posting {} submitted for approval", id);

        return JobPostingResponse.fromEntity(updatedJobPosting);
    }
    
    /**
     * Approve job posting
     */
    public JobPostingResponse approveJobPosting(String id, String approvedBy, String approvalNotes) {
        logger.info("Approving job posting {} by user {}", id, approvedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (!jobPosting.canBeApproved()) {
            throw new IllegalStateException("Job posting cannot be approved in current status: " + jobPosting.getStatus());
        }
        
        jobPosting.setStatus(JobPostingStatus.APPROVED);
        jobPosting.setApprovedBy(approvedBy);
        jobPosting.setApprovedAt(LocalDateTime.now());
        jobPosting.setApprovalNotes(approvalNotes);
        
        JobPosting approvedJobPosting = jobPostingRepository.save(jobPosting);
        
        // Log to audit
        auditLogService.logUserAction(approvedBy, "JOB_POSTING_APPROVED", "JOB_POSTING", 
                                     approvedJobPosting.getTitle() + " (ID: " + approvedJobPosting.getId() + ")");
        
        notificationService.notifyApprovalGranted(jobPosting.getCreatedBy(), "Job Posting", jobPosting.getTitle());

        logger.info("Job posting {} approved", id);

        return JobPostingResponse.fromEntity(approvedJobPosting);
    }
    
    /**
     * Reject job posting
     */
    public JobPostingResponse rejectJobPosting(String id, String rejectedBy, String rejectionReason) {
        logger.info("Rejecting job posting {} by user {}", id, rejectedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (!jobPosting.canBeRejected()) {
            throw new IllegalStateException("Job posting cannot be rejected in current status: " + jobPosting.getStatus());
        }
        
        jobPosting.setStatus(JobPostingStatus.REJECTED);
        jobPosting.setRejectionReason(rejectionReason);
        
        JobPosting rejectedJobPosting = jobPostingRepository.save(jobPosting);
        
        // Log to audit
        auditLogService.logUserAction(rejectedBy, "JOB_POSTING_REJECTED", "JOB_POSTING", 
                                     rejectedJobPosting.getTitle() + " (ID: " + rejectedJobPosting.getId() + ")");
        
        notificationService.notifyApprovalDenied(jobPosting.getCreatedBy(), "Job Posting", jobPosting.getTitle(), rejectionReason);

        logger.info("Job posting {} rejected", id);

        return JobPostingResponse.fromEntity(rejectedJobPosting);
    }
    
    /**
     * Publish job posting
     */
    public JobPostingResponse publishJobPosting(String id, String publishedBy) {
        return publishJobPosting(id, publishedBy, true, true);
    }

    public JobPostingResponse publishJobPosting(String id, String publishedBy, Boolean channelInternal, Boolean channelExternal) {
        logger.info("Publishing job posting {} by user {}", id, publishedBy);

        boolean internal = channelInternal == null || channelInternal;
        boolean external = channelExternal == null || channelExternal;
        if (!internal && !external) {
            throw new IllegalArgumentException("At least one of internal or external audience must be enabled");
        }

        JobPosting jobPosting = findJobPostingById(id);

        if (!jobPosting.canBePublished()) {
            throw new IllegalStateException("Job posting cannot be published in current status: " + jobPosting.getStatus());
        }

        assertRequisitionAuthorises(jobPosting);

        jobPosting.setStatus(JobPostingStatus.PUBLISHED);
        jobPosting.setPublishedBy(publishedBy);
        jobPosting.setPublishedAt(LocalDateTime.now());

        JobPosting publishedJobPosting = jobPostingRepository.save(jobPosting);

        // Sync: auto-create or update the corresponding JobAd with the chosen audience
        jobAdSyncService.onJobPostingPublished(publishedJobPosting, internal, external);

        // Log to audit
        auditLogService.logUserAction(publishedBy, "JOB_POSTING_PUBLISHED", "JOB_POSTING",
                                     publishedJobPosting.getTitle() + " (ID: " + publishedJobPosting.getId() + ")");

        notificationService.notifyJobPublished(publishedJobPosting);

        logger.info("Job posting {} published", id);

        return JobPostingResponse.fromEntity(publishedJobPosting);
    }

    /**
     * Unpublish job posting
     */
    public JobPostingResponse unpublishJobPosting(String id, String unpublishedBy) {
        logger.info("Unpublishing job posting {} by user {}", id, unpublishedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (!jobPosting.canBeUnpublished()) {
            throw new IllegalStateException("Job posting cannot be unpublished in current status: " + jobPosting.getStatus());
        }
        
        jobPosting.setStatus(JobPostingStatus.UNPUBLISHED);
        jobPosting.setUnpublishedAt(LocalDateTime.now());
        
        JobPosting unpublishedJobPosting = jobPostingRepository.save(jobPosting);

        // Sync: unpublish the corresponding JobAd
        jobAdSyncService.onJobPostingUnpublished(unpublishedJobPosting);

        // Log to audit
        auditLogService.logUserAction(unpublishedBy, "JOB_POSTING_UNPUBLISHED", "JOB_POSTING",
                                     unpublishedJobPosting.getTitle() + " (ID: " + unpublishedJobPosting.getId() + ")");

        logger.info("Job posting {} unpublished", id);

        return JobPostingResponse.fromEntity(unpublishedJobPosting);
    }
    
    /**
     * Close job posting
     */
    public JobPostingResponse closeJobPosting(String id, String closedBy) {
        logger.info("Closing job posting {} by user {}", id, closedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (!jobPosting.canBeClosed()) {
            throw new IllegalStateException("Job posting cannot be closed in current status: " + jobPosting.getStatus());
        }
        
        jobPosting.setStatus(JobPostingStatus.CLOSED);
        jobPosting.setClosedAt(LocalDateTime.now());
        
        JobPosting closedJobPosting = jobPostingRepository.save(jobPosting);

        // Sync: unpublish the corresponding JobAd
        jobAdSyncService.onJobPostingClosed(closedJobPosting);

        // Log to audit
        auditLogService.logUserAction(closedBy, "JOB_POSTING_CLOSED", "JOB_POSTING",
                                     closedJobPosting.getTitle() + " (ID: " + closedJobPosting.getId() + ")");

        notificationService.notifyJobClosed(closedJobPosting);

        logger.info("Job posting {} closed", id);

        return JobPostingResponse.fromEntity(closedJobPosting);
    }

    /**
     * Get jobs requiring approval
     */
    @Transactional(readOnly = true)
    public List<JobPostingResponse> getJobsRequiringApproval() {
        List<JobPosting> jobPostings = jobPostingRepository.findJobsRequiringApproval();
        return jobPostings.stream()
                .map(JobPostingResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get featured jobs
     */
    @Transactional(readOnly = true)
    public List<JobPostingResponse> getFeaturedJobs() {
        List<JobPosting> jobPostings = jobPostingRepository.findFeaturedJobs();
        return jobPostings.stream()
                .map(JobPostingResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get urgent jobs
     */
    @Transactional(readOnly = true)
    public List<JobPostingResponse> getUrgentJobs() {
        List<JobPosting> jobPostings = jobPostingRepository.findUrgentJobs();
        return jobPostings.stream()
                .map(JobPostingResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get job posting statistics
     */
    @Transactional(readOnly = true)
    public List<Object[]> getJobPostingStatistics() {
        return jobPostingRepository.getJobPostingStatusCounts();
    }
    
    /**
     * Delete job posting (only if in draft or rejected status)
     */
    public void deleteJobPosting(String id, String deletedBy) {
        logger.info("Deleting job posting {} by user {}", id, deletedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (jobPosting.getStatus() != JobPostingStatus.DRAFT && jobPosting.getStatus() != JobPostingStatus.REJECTED) {
            throw new IllegalStateException("Job posting can only be deleted in DRAFT or REJECTED status");
        }
        
        // Log to audit before deletion
        auditLogService.logUserAction(deletedBy, "JOB_POSTING_DELETED", "JOB_POSTING", 
                                     jobPosting.getTitle() + " (ID: " + jobPosting.getId() + ")");
        
        jobPostingRepository.delete(jobPosting);
        
        logger.info("Job posting {} deleted", id);
    }
    
    // Helper methods
    
    private JobPosting findJobPostingById(String id) {
        return jobPostingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job posting not found: " + id));
    }
    
    private void mapRequestToEntity(JobPostingCreateRequest request, JobPosting jobPosting) {
        jobPosting.setRequisitionId(request.getRequisitionId());
        jobPosting.setTitle(request.getTitle());
        jobPosting.setDepartment(request.getDepartment());
        jobPosting.setLocation(request.getLocation());
        jobPosting.setEmploymentType(request.getEmploymentType());
        jobPosting.setExperienceLevel(request.getExperienceLevel());
        jobPosting.setDescription(request.getDescription());
        jobPosting.setRequirements(request.getRequirements());
        jobPosting.setResponsibilities(request.getResponsibilities());
        jobPosting.setQualifications(request.getQualifications());
        jobPosting.setRequiredSkills(request.getRequiredSkills());
        jobPosting.setPreferredSkills(request.getPreferredSkills());
        jobPosting.setMinEducationLevel(request.getMinEducationLevel());
        jobPosting.setBenefits(request.getBenefits());
        jobPosting.setSalaryMin(request.getSalaryMin());
        jobPosting.setSalaryMax(request.getSalaryMax());
        jobPosting.setSalaryCurrency(request.getSalaryCurrency());
        jobPosting.setRemoteWorkAllowed(request.getRemoteWorkAllowed());
        jobPosting.setTravelRequired(request.getTravelRequired());
        jobPosting.setApplicationDeadline(request.getApplicationDeadline());
        jobPosting.setPositionsAvailable(request.getPositionsAvailable());
        jobPosting.setInternalNotes(request.getInternalNotes());
        jobPosting.setExternalJobBoards(request.getExternalJobBoards());
        jobPosting.setSeoTitle(request.getSeoTitle());
        jobPosting.setSeoDescription(request.getSeoDescription());
        jobPosting.setSeoKeywords(request.getSeoKeywords());
        jobPosting.setFeatured(request.getFeatured());
        jobPosting.setUrgent(request.getUrgent());
        jobPosting.setRequiredCheckTypes(request.getRequiredCheckTypes());
        jobPosting.setEnforceCheckCompletion(request.getEnforceCheckCompletion());
    }
    
    private String generateSlug(String title) {
        String baseSlug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        
        String slug = baseSlug;
        int counter = 1;
        
        while (jobPostingRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        
        return slug;
    }
}