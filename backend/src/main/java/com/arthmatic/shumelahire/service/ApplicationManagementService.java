package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import com.arthmatic.shumelahire.repository.ApplicantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for advanced application management functionality
 */
@Service
@Transactional
public class ApplicationManagementService {

    private final ApplicationRepository applicationRepository;
    private final ApplicantRepository applicantRepository;
    private final NotificationService notificationService;

    public ApplicationManagementService(ApplicationRepository applicationRepository,
                                       ApplicantRepository applicantRepository,
                                       NotificationService notificationService) {
        this.applicationRepository = applicationRepository;
        this.applicantRepository = applicantRepository;
        this.notificationService = notificationService;
    }

    /**
     * Advanced search and filtering for applications
     */
    public Page<Application> searchApplications(
            String searchTerm,
            List<ApplicationStatus> statuses,
            List<String> departments,
            String jobTitle,
            LocalDateTime dateFrom,
            LocalDateTime dateTo,
            Integer minRating,
            Integer maxRating,
            String sortBy,
            String sortDirection,
            Pageable pageable) {

        Specification<Application> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Text search across applicant name, job title, and cover letter
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
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("coverLetter")), likePattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("applicant").get("email")), likePattern)
                );
                predicates.add(searchPredicate);
            }

            // Status filtering
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }

            // Department filtering
            if (departments != null && !departments.isEmpty()) {
                predicates.add(root.get("department").in(departments));
            }

            // Job title filtering
            if (jobTitle != null && !jobTitle.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("jobTitle")),
                    "%" + jobTitle.toLowerCase() + "%"
                ));
            }

            // Date range filtering
            if (dateFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("submittedAt"), dateFrom));
            }
            if (dateTo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("submittedAt"), dateTo));
            }

            // Rating filtering
            if (minRating != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("rating"), minRating));
            }
            if (maxRating != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("rating"), maxRating));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return applicationRepository.findAll(spec, pageable);
    }

    /**
     * Bulk status update for multiple applications
     */
    @Transactional
    public Map<String, Object> bulkUpdateStatus(
            List<Long> applicationIds,
            ApplicationStatus newStatus,
            String reason) {

        List<Application> applications = applicationRepository.findAllById(applicationIds);
        List<Long> updatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Application application : applications) {
            try {
                application.setStatus(newStatus);
                application.setUpdatedAt(LocalDateTime.now());

                // Add reason for status change
                if (reason != null && !reason.trim().isEmpty()) {
                    if (newStatus == ApplicationStatus.REJECTED) {
                        application.setRejectionReason(reason);
                    } else {
                        // Add to screening notes for other status changes
                        String notes = application.getScreeningNotes() != null ?
                            application.getScreeningNotes() + "\n\n" : "";
                        application.setScreeningNotes(notes + "Status changed to " +
                            newStatus.getDisplayName() + ": " + reason);
                    }
                }

                applicationRepository.save(application);

                // Send notification
                notificationService.notifyStatusChange(application, newStatus);

                updatedIds.add(application.getId());

            } catch (Exception e) {
                errors.add("Failed to update application " + application.getId() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("updatedCount", updatedIds.size());
        result.put("updatedIds", updatedIds);
        result.put("errors", errors);
        result.put("totalRequested", applicationIds.size());

        return result;
    }

    /**
     * Bulk assign applications to specific pipeline stage
     */
    @Transactional
    public Map<String, Object> bulkAssignPipelineStage(
            List<Long> applicationIds,
            PipelineStage pipelineStage) {

        List<Application> applications = applicationRepository.findAllById(applicationIds);
        List<Long> updatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Application application : applications) {
            try {
                application.setPipelineStage(pipelineStage);
                application.setPipelineStageEnteredAt(LocalDateTime.now());
                application.setUpdatedAt(LocalDateTime.now());

                applicationRepository.save(application);
                updatedIds.add(application.getId());

            } catch (Exception e) {
                errors.add("Failed to update application " + application.getId() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("updatedCount", updatedIds.size());
        result.put("updatedIds", updatedIds);
        result.put("errors", errors);
        result.put("totalRequested", applicationIds.size());

        return result;
    }

    /**
     * Rate multiple applications
     */
    @Transactional
    public Map<String, Object> bulkRateApplications(Map<Long, Integer> applicationRatings) {
        List<Long> updatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : applicationRatings.entrySet()) {
            try {
                Long applicationId = entry.getKey();
                Integer rating = entry.getValue();

                if (rating < 1 || rating > 5) {
                    errors.add("Invalid rating for application " + applicationId + ": " + rating);
                    continue;
                }

                Application application = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));

                application.setRating(rating);
                application.setUpdatedAt(LocalDateTime.now());

                applicationRepository.save(application);
                updatedIds.add(applicationId);

            } catch (Exception e) {
                errors.add("Failed to rate application " + entry.getKey() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("updatedCount", updatedIds.size());
        result.put("updatedIds", updatedIds);
        result.put("errors", errors);
        result.put("totalRequested", applicationRatings.size());

        return result;
    }

    /**
     * Add screening notes to multiple applications
     */
    @Transactional
    public Map<String, Object> bulkAddScreeningNotes(List<Long> applicationIds, String notes) {
        List<Application> applications = applicationRepository.findAllById(applicationIds);
        List<Long> updatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Application application : applications) {
            try {
                String existingNotes = application.getScreeningNotes() != null ?
                    application.getScreeningNotes() + "\n\n" : "";
                String newNotes = existingNotes + "[" + LocalDateTime.now() + "] " + notes;

                if (newNotes.length() > 10000) {
                    errors.add("Screening notes for application " + application.getId() + " would exceed 10000 characters; skipped");
                    continue;
                }

                application.setScreeningNotes(newNotes);
                application.setUpdatedAt(LocalDateTime.now());

                applicationRepository.save(application);
                updatedIds.add(application.getId());

            } catch (Exception e) {
                errors.add("Failed to update application " + application.getId() + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("updatedCount", updatedIds.size());
        result.put("updatedIds", updatedIds);
        result.put("errors", errors);
        result.put("totalRequested", applicationIds.size());

        return result;
    }

    /**
     * Get applications statistics for management console
     */
    public Map<String, Object> getApplicationStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Status distribution
        Map<String, Long> statusCounts = new HashMap<>();
        for (ApplicationStatus status : ApplicationStatus.values()) {
            long count = applicationRepository.countByStatus(status);
            statusCounts.put(status.name(), count);
        }
        stats.put("statusDistribution", statusCounts);

        // Department distribution
        List<Object[]> deptCounts = applicationRepository.countByDepartment();
        Map<String, Long> departmentCounts = deptCounts.stream()
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> (Long) row[1]
            ));
        stats.put("departmentDistribution", departmentCounts);

        // Recent applications (last 7 days)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long recentApplications = applicationRepository.countBySubmittedAtAfter(weekAgo);
        stats.put("recentApplications", recentApplications);

        // Rating distribution
        Map<String, Long> ratingCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            long count = applicationRepository.countByRating(i);
            ratingCounts.put(String.valueOf(i), count);
        }
        stats.put("ratingDistribution", ratingCounts);

        // Total counts
        stats.put("totalApplications", applicationRepository.count());
        stats.put("uniqueApplicants", applicantRepository.count());

        return stats;
    }

    /**
     * Get applications requiring attention (no status change in X days, high priority, etc.)
     */
    public List<Application> getApplicationsRequiringAttention(int daysThreshold) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(daysThreshold);

        // Find applications that haven't been updated recently and are in active statuses
        List<ApplicationStatus> activeStatuses = List.of(
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.SCREENING,
            ApplicationStatus.INTERVIEW_SCHEDULED
        );

        return applicationRepository.findByStatusInAndUpdatedAtBeforeOrderBySubmittedAtAsc(
            activeStatuses, threshold);
    }

    /**
     * Export applications data for reporting
     */
    public List<Map<String, Object>> exportApplications(
            List<Long> applicationIds,
            List<String> fields) {

        List<Application> applications = applicationIds != null && !applicationIds.isEmpty() ?
            applicationRepository.findAllById(applicationIds) :
            applicationRepository.findAll();

        return applications.stream().map(app -> {
            Map<String, Object> record = new HashMap<>();

            if (fields == null || fields.contains("id")) {
                record.put("id", app.getId());
            }
            if (fields == null || fields.contains("applicantName")) {
                record.put("applicantName", app.getApplicant().getFullName());
            }
            if (fields == null || fields.contains("applicantEmail")) {
                record.put("applicantEmail", app.getApplicant().getEmail());
            }
            if (fields == null || fields.contains("jobTitle")) {
                record.put("jobTitle", app.getJobTitle());
            }
            if (fields == null || fields.contains("department")) {
                record.put("department", app.getDepartment());
            }
            if (fields == null || fields.contains("status")) {
                record.put("status", app.getStatus().name());
            }
            if (fields == null || fields.contains("pipelineStage")) {
                record.put("pipelineStage", app.getPipelineStage().name());
            }
            if (fields == null || fields.contains("rating")) {
                record.put("rating", app.getRating());
            }
            if (fields == null || fields.contains("submittedAt")) {
                record.put("submittedAt", app.getSubmittedAt());
            }
            if (fields == null || fields.contains("updatedAt")) {
                record.put("updatedAt", app.getUpdatedAt());
            }
            if (fields == null || fields.contains("screeningNotes")) {
                record.put("screeningNotes", app.getScreeningNotes());
            }

            return record;
        }).collect(Collectors.toList());
    }
}
