package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.JobPostingCreateRequest;
import com.arthmatic.shumelahire.dto.JobPostingResponse;
import com.arthmatic.shumelahire.entity.*;
import com.arthmatic.shumelahire.repository.JobPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class JobPostingService {
    
    private static final Logger logger = LoggerFactory.getLogger(JobPostingService.class);

    private final JobPostingRepository jobPostingRepository;
    private final AuditLogService auditLogService;
    private final JobAdSyncService jobAdSyncService;

    public JobPostingService(JobPostingRepository jobPostingRepository,
                             AuditLogService auditLogService,
                             JobAdSyncService jobAdSyncService) {
        this.jobPostingRepository = jobPostingRepository;
        this.auditLogService = auditLogService;
        this.jobAdSyncService = jobAdSyncService;
    }
    
    /**
     * Create a new job posting
     */
    public JobPostingResponse createJobPosting(JobPostingCreateRequest request, Long createdBy) {
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
    public JobPostingResponse updateJobPosting(Long id, JobPostingCreateRequest request, Long updatedBy) {
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
     * Get job posting by ID
     */
    @Transactional(readOnly = true)
    public JobPostingResponse getJobPosting(Long id) {
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
    public Page<JobPostingResponse> getJobPostingsByCreator(Long createdBy, Pageable pageable) {
        Page<JobPosting> jobPostings = jobPostingRepository.findByCreatedBy(createdBy, pageable);
        return jobPostings.map(JobPostingResponse::fromEntity);
    }
    
    /**
     * Submit job posting for approval
     */
    public JobPostingResponse submitForApproval(Long id, Long submittedBy) {
        logger.info("Submitting job posting {} for approval by user {}", id, submittedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (!jobPosting.canBeSubmittedForApproval()) {
            throw new IllegalStateException("Job posting cannot be submitted for approval in current status: " + jobPosting.getStatus());
        }
        
        jobPosting.setStatus(JobPostingStatus.PENDING_APPROVAL);
        jobPosting.setSubmittedForApprovalAt(LocalDateTime.now());
        
        JobPosting updatedJobPosting = jobPostingRepository.save(jobPosting);
        
        // Log to audit
        auditLogService.logUserAction(submittedBy, "JOB_POSTING_SUBMITTED_FOR_APPROVAL", "JOB_POSTING", 
                                     updatedJobPosting.getTitle() + " (ID: " + updatedJobPosting.getId() + ")");
        
        logger.info("Job posting {} submitted for approval", id);
        
        return JobPostingResponse.fromEntity(updatedJobPosting);
    }
    
    /**
     * Approve job posting
     */
    public JobPostingResponse approveJobPosting(Long id, Long approvedBy, String approvalNotes) {
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
        
        logger.info("Job posting {} approved", id);
        
        return JobPostingResponse.fromEntity(approvedJobPosting);
    }
    
    /**
     * Reject job posting
     */
    public JobPostingResponse rejectJobPosting(Long id, Long rejectedBy, String rejectionReason) {
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
        
        logger.info("Job posting {} rejected", id);
        
        return JobPostingResponse.fromEntity(rejectedJobPosting);
    }
    
    /**
     * Publish job posting
     */
    public JobPostingResponse publishJobPosting(Long id, Long publishedBy) {
        logger.info("Publishing job posting {} by user {}", id, publishedBy);
        
        JobPosting jobPosting = findJobPostingById(id);
        
        if (!jobPosting.canBePublished()) {
            throw new IllegalStateException("Job posting cannot be published in current status: " + jobPosting.getStatus());
        }
        
        jobPosting.setStatus(JobPostingStatus.PUBLISHED);
        jobPosting.setPublishedBy(publishedBy);
        jobPosting.setPublishedAt(LocalDateTime.now());
        
        JobPosting publishedJobPosting = jobPostingRepository.save(jobPosting);

        // Sync: auto-create or update the corresponding JobAd
        jobAdSyncService.onJobPostingPublished(publishedJobPosting);

        // Log to audit
        auditLogService.logUserAction(publishedBy, "JOB_POSTING_PUBLISHED", "JOB_POSTING",
                                     publishedJobPosting.getTitle() + " (ID: " + publishedJobPosting.getId() + ")");

        logger.info("Job posting {} published", id);

        return JobPostingResponse.fromEntity(publishedJobPosting);
    }
    
    /**
     * Unpublish job posting
     */
    public JobPostingResponse unpublishJobPosting(Long id, Long unpublishedBy) {
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
    public JobPostingResponse closeJobPosting(Long id, Long closedBy) {
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
    public void deleteJobPosting(Long id, Long deletedBy) {
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
    
    private JobPosting findJobPostingById(Long id) {
        return jobPostingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job posting not found: " + id));
    }
    
    private void mapRequestToEntity(JobPostingCreateRequest request, JobPosting jobPosting) {
        jobPosting.setTitle(request.getTitle());
        jobPosting.setDepartment(request.getDepartment());
        jobPosting.setLocation(request.getLocation());
        jobPosting.setEmploymentType(request.getEmploymentType());
        jobPosting.setExperienceLevel(request.getExperienceLevel());
        jobPosting.setDescription(request.getDescription());
        jobPosting.setRequirements(request.getRequirements());
        jobPosting.setResponsibilities(request.getResponsibilities());
        jobPosting.setQualifications(request.getQualifications());
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