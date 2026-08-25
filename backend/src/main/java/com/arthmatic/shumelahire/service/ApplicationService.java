package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.dto.ApplicationCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicationResponse;
import com.arthmatic.shumelahire.dto.ApplicationWithdrawRequest;
import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.dto.ApplicationSummaryResponse;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.StatusStageAlignment;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationDataRepository applicationRepository;
    private final ApplicantDataRepository applicantRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public ApplicationService(ApplicationDataRepository applicationRepository,
                             ApplicantDataRepository applicantRepository,
                             AuditLogService auditLogService,
                             NotificationService notificationService) {
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    /**
     * Optional so a deployment with no retention policy is not a wiring failure, and so services
     * constructed directly in unit tests do not need it. Guarded at every call site.
     */
    @Autowired(required = false)
    private TalentPoolRetentionService talentPoolRetentionService;


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

        // Applying again is the clearest engagement signal there is. Without this, a candidate who
        // reapplied every year would still age out of the talent pool on the date they first joined.
        if (talentPoolRetentionService != null) {
            talentPoolRetentionService.recordEngagement(
                    request.getApplicantId(), "submitted an application");
        }

        // Log to audit
        auditLogService.logUserAction(request.getApplicantId(), "APPLICATION_SUBMITTED", "APPLICATION", savedApplication.getId(),
                                     "Job: " + request.getJobTitle() + " (ID: " + request.getJobAdId() + ")");

        logger.info("Application submitted with ID: {}", savedApplication.getId());

        return ApplicationResponse.fromEntity(savedApplication);
    }

    /**
     * Get application by ID
     */
    @Transactional(readOnly = true)
    public ApplicationResponse getApplication(String id) {
        Application application = findApplicationById(id);
        return ApplicationResponse.fromEntity(application);
    }

    /**
     * Get applications by applicant
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByApplicant(String applicantId) {
        List<Application> applications = applicationRepository.findByApplicantIdOrderBySubmittedAtDesc(applicantId);
        hydrateApplicants(applications);
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get applications by job ad
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByJobAd(String jobAdId) {
        List<Application> applications = applicationRepository.findByJobPostingIdOrderBySubmittedAtDesc(jobAdId);
        hydrateApplicants(applications);
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
        return searchApplications(searchTerm, statuses, null, pageable);
    }

    /**
     * Search, filter and page the application set.
     *
     * <p><b>Department filtering was implemented and unreachable.</b>
     * {@code searchApplicationsFiltered} takes a {@code departments} argument and every caller
     * passed {@code null} for it, so the applications list filtered by department in the browser,
     * across the twenty rows it had loaded — which silently means "of this page". It now filters
     * the whole set, server-side, like every other filter here.
     */
    @Transactional(readOnly = true)
    public Page<ApplicationResponse> searchApplications(String searchTerm, List<ApplicationStatus> statuses,
                                                        List<String> departments, Pageable pageable) {
        Page<Application> applications;

        boolean filtered = (statuses != null && !statuses.isEmpty())
                || (departments != null && !departments.isEmpty());
        boolean searching = searchTerm != null && !searchTerm.trim().isEmpty();

        if (filtered) {
            // The only path that honours every filter together. Taken whenever any structured
            // filter is present, not only when a status is — a department on its own used to fall
            // through to the unfiltered query and quietly return everything.
            List<Application> matches = applicationRepository.searchApplicationsFiltered(
                    searchTerm, statuses, departments, null, null, null, null, null);
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), matches.size());
            List<Application> pageContent = start < matches.size() ? matches.subList(start, end) : List.of();
            applications = new PageImpl<>(pageContent, pageable, matches.size());
        } else if (searching) {
            applications = applicationRepository.searchApplications(searchTerm, pageable);
        } else {
            applications = applicationRepository.findAll(pageable);
        }

        hydrateApplicants(applications.getContent());
        return applications.map(ApplicationResponse::fromEntity);
    }

    /**
     * Get applications by status
     */
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByStatus(ApplicationStatus status) {
        List<Application> applications = applicationRepository.findByStatusOrderBySubmittedAtDesc(status);
        hydrateApplicants(applications);
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Update application status
     */
    public ApplicationResponse updateApplicationStatus(String id, ApplicationStatus newStatus, String notes) {
        return updateApplicationStatus(id, newStatus, notes, null);
    }

    /**
     * Move an application to another status, recording who did it.
     *
     * <p>The audit entry used to name {@code application.getApplicant().getId()} as the acting
     * user, because this method took no actor and that was the only id in reach — so the trail
     * stated that each candidate screened, advanced and rejected themselves. That is worse than
     * absent attribution: it is present and wrong, and it is why the application record page shows
     * no names against its stages.
     *
     * @param actorUserId the authenticated user taking the action, or null for an internal call
     */
    public ApplicationResponse updateApplicationStatus(String id, ApplicationStatus newStatus, String notes,
                                                       String actorUserId) {
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
        alignPipelineStage(application, newStatus);

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
        auditLogService.logUserAction(actor(actorUserId), "STATUS_UPDATED", "APPLICATION", id,
                                     String.format("From %s to %s - %s", oldStatus, newStatus,
                                                  notes != null ? notes : "No notes"));

        logger.info("Application {} status updated to {}", id, newStatus);

        return ApplicationResponse.fromEntity(updatedApplication);
    }

    /**
     * The id to record as the actor.
     *
     * <p>"SYSTEM" when there is no authenticated user — an internal or scheduled call. Never the
     * candidate: an unattributable action is honestly unattributed, whereas naming the subject of
     * the record produces a trail that is confidently wrong.
     */
    private static String actor(String actorUserId) {
        return actorUserId != null && !actorUserId.isBlank() ? actorUserId : "SYSTEM";
    }

    /**
     * Keep the pipeline stage from contradicting the status this method just set.
     *
     * <p>This method previously moved {@code status} alone. An application also carries
     * {@code pipelineStage} and {@code pipelineStageEnteredAt}, which {@code PipelineService} and
     * {@code ApplicationManagementService} maintain — so advancing a candidate here left the
     * pipeline board showing them at the stage they had already left, with an entry timestamp that
     * no longer described anything.
     *
     * <p>Only a genuine contradiction moves the stage. A candidate a recruiter placed at
     * {@code PANEL_INTERVIEW} stays there when someone marks {@code INTERVIEW_COMPLETED}, because
     * the status cannot tell you which round it was and demoting them to {@code FIRST_INTERVIEW}
     * would lose information the pipeline had. See {@link StatusStageAlignment}.
     */
    private void alignPipelineStage(Application application, ApplicationStatus newStatus) {
        if (!StatusStageAlignment.needsAlignment(application.getPipelineStage(), newStatus)) {
            return;
        }
        PipelineStage aligned = StatusStageAlignment.canonicalStage(newStatus);
        application.setPipelineStage(aligned);
        // Restamped only on an actual move: this field means "when this stage was entered", not
        // "when this record was last written".
        application.setPipelineStageEnteredAt(LocalDateTime.now());
        logger.info("Application {} pipeline stage aligned to {} for status {}",
                application.getId(), aligned, newStatus);
    }

    /**
     * Counts describing the whole application set.
     *
     * <p>Reads every status once and derives the headline figures from the same result rather than
     * counting and then reading again — on the DynamoDB backend {@code countByStatus} runs the same
     * index query as fetching and calls {@code size()}, so counting is not the cheaper operation.
     */
    public ApplicationSummaryResponse summary() {
        Map<ApplicationStatus, List<Application>> byStatus = new EnumMap<>(ApplicationStatus.class);
        for (ApplicationStatus status : ApplicationStatus.values()) {
            byStatus.put(status, applicationRepository.findByStatusOrderBySubmittedAtDesc(status));
        }
        return ApplicationSummaryResponse.from(byStatus, LocalDateTime.now());
    }

    /**
     * Withdraw application
     */
    public ApplicationResponse withdrawApplication(String id, ApplicationWithdrawRequest request) {
        return withdrawApplication(id, request, null);
    }

    /** Withdraw an application. The actor may be the candidate or a recruiter — either is recorded. */
    public ApplicationResponse withdrawApplication(String id, ApplicationWithdrawRequest request,
                                                   String actorUserId) {
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
        auditLogService.logUserAction(actor(actorUserId), "APPLICATION_WITHDRAWN", "APPLICATION", id,
                                     "Reason: " + request.getReason());

        logger.info("Application {} withdrawn", id);

        return ApplicationResponse.fromEntity(withdrawnApplication);
    }

    /**
     * Rate application
     */
    public ApplicationResponse rateApplication(String id, Integer rating, String feedback) {
        return rateApplication(id, rating, feedback, null);
    }

    /** Rate an application. A candidate cannot rate themselves; the actor is the reviewer. */
    public ApplicationResponse rateApplication(String id, Integer rating, String feedback,
                                               String actorUserId) {
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
        auditLogService.logUserAction(actor(actorUserId), "APPLICATION_RATED", "APPLICATION", id,
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
        hydrateApplicants(applications);
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
    public boolean canApplicantApplyForJob(String applicantId, String jobAdId) {
        return !applicationRepository.existsByApplicantIdAndJobPostingId(applicantId, jobAdId);
    }

    /**
     * Delete application completely
     */
    public void deleteApplication(String id) {
        deleteApplication(id, null);
    }

    /** Delete an application, recording the administrator who did it rather than its subject. */
    public void deleteApplication(String id, String actorUserId) {
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
        auditLogService.logUserAction(actor(actorUserId), "APPLICATION_DELETED", "APPLICATION", id,
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
        hydrateApplicants(applications);
        return applications.stream()
                .map(ApplicationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ── Applicant hydration ─────────────────────────────────────────────────

    /**
     * Populate full Applicant data on applications that only have a stub (ID-only) applicant.
     */
    private void hydrateApplicants(List<Application> applications) {
        if (applications == null || applications.isEmpty()) return;

        Set<String> applicantIds = applications.stream()
                .filter(app -> app.getApplicant() != null && app.getApplicant().getId() != null
                        && app.getApplicant().getName() == null)
                .map(app -> app.getApplicant().getId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (applicantIds.isEmpty()) return;

        Map<String, Applicant> applicantMap = new HashMap<>();
        for (String id : applicantIds) {
            applicantRepository.findById(id).ifPresent(a -> applicantMap.put(a.getId(), a));
        }

        for (Application app : applications) {
            if (app.getApplicant() != null && app.getApplicant().getId() != null) {
                Applicant full = applicantMap.get(app.getApplicant().getId());
                if (full != null) {
                    app.setApplicant(full);
                }
            }
        }
    }

    // Helper methods

    private Application findApplicationById(String id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + id));
    }

    private Applicant findApplicantById(String id) {
        return applicantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Applicant not found: " + id));
    }
}
