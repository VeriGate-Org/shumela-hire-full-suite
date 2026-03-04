package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ApplicationCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicationResponse;
import com.arthmatic.shumelahire.dto.ApplicationWithdrawRequest;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public ApplicationService(ApplicationRepository applicationRepository,
                             ApplicantRepository applicantRepository,
                             AuditLogService auditLogService,
                             NotificationService notificationService) {
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    /**
     * Submit a new job application
     */
    public ApplicationResponse submitApplication(ApplicationCreateRequest request) {
        logger.info("Submitting application for applicant {} to job {}",
                   request.getApplicantId(), request.getJobAdId());

        // Validate applicant exists
        Applicant applicant = findApplicantById(request.getApplicantId());

        // Check if applicant has already applied for this job
        if (applicationRepository.existsByApplicantIdAndJobPostingId(request.getApplicantId(), request.getJobAdId())) {
            throw new IllegalArgumentException("Applicant has already applied for this job");
        }

        // Create new application
        Application application = new Application();
        application.setApplicant(applicant);
        application.setJobPostingId(request.getJobAdId()); // Map jobAdId to jobPostingId
        application.setJobTitle(request.getJobTitle());
        application.setDepartment(request.getDepartment());
        application.setCoverLetter(request.getCoverLetter());
        application.setApplicationSource(request.getApplicationSource());
        application.setStatus(ApplicationStatus.SUBMITTED);

        Application savedApplication = applicationRepository.save(application);

        // Send notification
        notificationService.notifyApplicationSubmitted(savedApplication);

        // Log to audit
        auditLogService.logUserAction(request.getApplicantId(), "APPLICATION_SUBMITTED", "APPLICATION",
                                     "Job: " + request.getJobTitle() + " (ID: " + request.getJobAdId() + ")");

        logger.info("Application submitted with ID: {}", savedApplication.getId());

        return ApplicationResponse.fromEntity(savedApplication);
    }

    /**
     * Get application by ID
     */
    @Transactional(readOnly = true)
    public ApplicationResponse getApplication(Long id) {
        Application application = findApplicationById(id);
        return ApplicationResponse.fromEntity(application);
    }

    /**
     * Get applications by applicant
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByApplicant(Long applicantId) {
        List<Application> applications = applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(applicantId);
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get applications by job ad
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByJobAd(Long jobAdId) {
        List<Application> applications = applicationRepository.findByJobPostingIdOrderBySubmittedAtDesc(jobAdId);
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Search applications with pagination and optional status filter
     */
    @Transactional(readOnly = true)
    public Page<ApplicationResponse> searchApplications(String searchTerm, ApplicationStatus status, Pageable pageable) {
        return searchApplications(searchTerm, status != null ? List.of(status) : null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationResponse> searchApplications(String searchTerm, List<ApplicationStatus> statuses, Pageable pageable) {
        Page<Application> applications;

        if ((searchTerm == null || searchTerm.trim().isEmpty()) && (statuses == null || statuses.isEmpty())) {
            applications = applicationRepository.findAll(pageable);
        } else if (statuses == null || statuses.isEmpty()) {
            applications = applicationRepository.searchApplications(searchTerm, pageable);
        } else {
            Specification<Application> spec = (root, query, criteriaBuilder) -> {
                List<Predicate> predicates = new ArrayList<>();

                if (statuses.size() == 1) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), statuses.get(0)));
                } else {
                    predicates.add(root.get("status").in(statuses));
                }

                if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                    String likePattern = "%" + searchTerm.toLowerCase() + "%";
                    Predicate searchPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(
                            criteriaBuilder.lower(
                                criteriaBuilder.concat(
                                    criteriaBuilder.concat(root.get("applicant").get("name"), " "),
                                    root.get("applicant").get("surname")
                                )
                            ),
                            likePattern
                        ),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("jobTitle")), likePattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("applicant").get("email")), likePattern)
                    );
                    predicates.add(searchPredicate);
                }

                return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
            };
            applications = applicationRepository.findAll(spec, pageable);
        }

        return applications.map(ApplicationResponse::fromEntity);
    }

    /**
     * Get applications by status
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByStatus(ApplicationStatus status) {
        List<Application> applications = applicationRepository.findByStatusOrderBySubmittedAtDesc(status);
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Update application status
     */
    public ApplicationResponse updateApplicationStatus(Long id, ApplicationStatus newStatus, String notes) {
        logger.info("Updating application {} to status {}", id, newStatus);

        Application application = findApplicationById(id);

        // Validate status transition
        if (!application.getStatus().canTransitionTo(newStatus)) {
            throw new IllegalArgumentException(
                String.format("Cannot transition from %s to %s",
                             application.getStatus(), newStatus));
        }

        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(newStatus);

        // Set additional fields based on status
        switch (newStatus) {
            case SUBMITTED:
                // Initial submission - no additional fields needed
                break;
            case SCREENING:
                application.setScreeningNotes(notes);
                break;
            case INTERVIEW_SCHEDULED:
                // Interview scheduling - no additional fields needed
                break;
            case INTERVIEW_COMPLETED:
                application.setInterviewFeedback(notes);
                break;
            case REFERENCE_CHECK:
                // Reference check - no additional fields needed
                break;
            case REJECTED:
                application.setRejectionReason(notes);
                break;
            case OFFERED:
            case OFFER_PENDING:
                application.setOfferDetails(notes);
                break;
            case OFFER_ACCEPTED:
                application.setOfferDetails(notes);
                break;
            case OFFER_DECLINED:
                application.setRejectionReason(notes);
                break;
            case HIRED:
                // Set start date if provided in notes
                break;
            case WITHDRAWN:
                application.setWithdrawalReason(notes);
                application.setWithdrawnAt(LocalDateTime.now());
                break;
        }

        Application updatedApplication = applicationRepository.save(application);

        // Send status change notification
        notificationService.notifyStatusChange(updatedApplication, oldStatus);

        // Log to audit
        auditLogService.logUserAction(application.getApplicant().getId(), "STATUS_UPDATED", "APPLICATION",
                                     String.format("From %s to %s - %s", oldStatus, newStatus,
                                                  notes != null ? notes : "No notes"));

        logger.info("Application {} status updated to {}", id, newStatus);

        return ApplicationResponse.fromEntity(updatedApplication);
    }

    /**
     * Withdraw application
     */
    public ApplicationResponse withdrawApplication(Long id, ApplicationWithdrawRequest request) {
        logger.info("Withdrawing application {}", id);

        Application application = findApplicationById(id);

        // Check if application can be withdrawn
        if (!application.canBeWithdrawn()) {
            throw new IllegalArgumentException(
                "Application cannot be withdrawn in current status: " + application.getStatus());
        }

        application.setStatus(ApplicationStatus.WITHDRAWN);
        application.setWithdrawnAt(LocalDateTime.now());
        application.setWithdrawalReason(request.getReason());

        Application withdrawnApplication = applicationRepository.save(application);

        // Send withdrawal notification
        notificationService.notifyApplicationWithdrawn(withdrawnApplication);

        // Log to audit
        auditLogService.logUserAction(application.getApplicant().getId(), "APPLICATION_WITHDRAWN", "APPLICATION",
                                     "Reason: " + request.getReason());

        logger.info("Application {} withdrawn", id);

        return ApplicationResponse.fromEntity(withdrawnApplication);
    }

    /**
     * Rate application
     */
    public ApplicationResponse rateApplication(Long id, Integer rating, String feedback) {
        logger.info("Rating application {} with {} stars", id, rating);

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Application application = findApplicationById(id);
        application.setRating(rating);

        if (feedback != null) {
            application.setInterviewFeedback(feedback);
        }

        Application ratedApplication = applicationRepository.save(application);

        // Log to audit
        auditLogService.logUserAction(application.getApplicant().getId(), "APPLICATION_RATED", "APPLICATION",
                                     rating + " stars - " + (feedback != null ? feedback : "No feedback"));

        logger.info("Application {} rated with {} stars", id, rating);

        return ApplicationResponse.fromEntity(ratedApplication);
    }

    /**
     * Get applications requiring action
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsRequiringAction() {
        List<Application> applications = applicationRepository.findApplicationsRequiringAction();
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get application statistics by status
     */
    @Transactional(readOnly = true)
    public List<Object[]> getApplicationStatusStatistics() {
        return applicationRepository.getApplicationStatusCounts();
    }

    /**
     * Check if applicant can apply for job
     */
    @Transactional(readOnly = true)
    public boolean canApplicantApplyForJob(Long applicantId, Long jobAdId) {
        return !applicationRepository.existsByApplicantIdAndJobPostingId(applicantId, jobAdId);
    }

    /**
     * Delete application completely
     */
    public void deleteApplication(Long id) {
        logger.info("Deleting application {}", id);

        Application application = findApplicationById(id);

        // Check if application can be deleted (not in certain final states)
        if (application.getStatus() == ApplicationStatus.HIRED ||
            application.getStatus() == ApplicationStatus.OFFERED) {
            throw new IllegalArgumentException(
                "Cannot delete application in status: " + application.getStatus());
        }

        // Delete the application and associated data
        applicationRepository.delete(application);

        // Log to audit
        auditLogService.logUserAction(application.getApplicant().getId(), "APPLICATION_DELETED", "APPLICATION",
                                     "Job: " + application.getJobTitle() + " (ID: " + application.getJobPostingId() + ")");

        logger.info("Application {} deleted", id);
    }

    /**
     * Get recent applications
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getRecentApplications(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<Application> applications = applicationRepository.findRecentApplications(since);
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // Helper methods

    private Application findApplicationById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + id));
    }

    private Applicant findApplicantById(Long id) {
        return applicantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Applicant not found: " + id));
    }
}
