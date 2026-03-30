package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.repository.ApplicationDataRepository;
import com.arthmatic.shumelahire.repository.ApplicantDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
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

    private final ApplicationDataRepository applicationRepository;
    private final ApplicantDataRepository applicantRepository;
    private final NotificationService notificationService;

    @Autowired(required = false)
    private BackgroundCheckService backgroundCheckService;

    public ApplicationManagementService(ApplicationDataRepository applicationRepository,
                                       ApplicantDataRepository applicantRepository,
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

        List<Application> filtered = applicationRepository.searchApplicationsFiltered(
            searchTerm, statuses, departments, jobTitle, dateFrom, dateTo, minRating, maxRating);

        // Apply sorting
        Comparator<Application> comparator = getComparator(sortBy, sortDirection);
        if (comparator != null) {
            filtered.sort(comparator);
        }

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Application> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    private Comparator<Application> getComparator(String sortBy, String sortDirection) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.reverseOrder()));
        }
        Comparator<Application> comparator;
        switch (sortBy) {
            case "submittedAt":
                comparator = Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "updatedAt":
                comparator = Comparator.comparing(Application::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "rating":
                comparator = Comparator.comparing(Application::getRating, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "status":
                comparator = Comparator.comparing(a -> a.getStatus() != null ? a.getStatus().name() : "", Comparator.naturalOrder());
                break;
            default:
                comparator = Comparator.comparing(Application::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder()));
                break;
        }
        if ("desc".equalsIgnoreCase(sortDirection)) {
            comparator = comparator.reversed();
        }
        return comparator;
    }

    /**
     * Bulk status update for multiple applications
     */
    @Transactional
    public Map<String, Object> bulkUpdateStatus(
            List<Long> applicationIds,
            ApplicationStatus newStatus,
            String reason) {

        List<Application> applications = applicationRepository.findAllByIds(applicationIds.stream().map(String::valueOf).collect(Collectors.toList()));
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

        List<Application> applications = applicationRepository.findAllByIds(applicationIds.stream().map(String::valueOf).collect(Collectors.toList()));
        List<Long> updatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Application application : applications) {
            try {
                // Enforce background check completion when moving past BACKGROUND_CHECK
                if (backgroundCheckService != null
                        && application.getPipelineStage() == PipelineStage.BACKGROUND_CHECK
                        && pipelineStage.getOrder() > PipelineStage.BACKGROUND_CHECK.getOrder()) {
                    backgroundCheckService.enforceBackgroundCheckCompletion(application);
                }

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

                Application application = applicationRepository.findById(String.valueOf(applicationId))
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
        List<Application> applications = applicationRepository.findAllByIds(applicationIds.stream().map(String::valueOf).collect(Collectors.toList()));
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
            applicationRepository.findAllByIds(applicationIds.stream().map(String::valueOf).collect(Collectors.toList())) :
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
