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

import com.arthmatic.shumelahire.entity.Applicant;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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

        List<Application> filtered = new ArrayList<>(applicationRepository.searchApplicationsFiltered(
            searchTerm, statuses, departments, jobTitle, dateFrom, dateTo, minRating, maxRating));

        // Apply sorting
        Comparator<Application> comparator = getComparator(sortBy, sortDirection);
        if (comparator != null) {
            filtered.sort(comparator);
        }

        // Apply pagination
        if (pageable.isUnpaged()) {
            return new PageImpl<>(filtered);
        }
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Application> pageContent = start < filtered.size() ? filtered.subList(start, end) : List.of();
        hydrateApplicants(pageContent);
        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

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
            List<String> applicationIds,
            ApplicationStatus newStatus,
            String reason) {

        List<Application> applications = applicationRepository.findAllByIds(applicationIds);
        List<String> updatedIds = new ArrayList<>();
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
     * Bulk assign applications to specific pipeline stage.
     *
     * <p>Bulk is held to the SAME rules as a single move. It previously wrote the target stage
     * straight onto every record, checking only background checks — so selecting a column of
     * candidates and choosing a stage could take someone from Application Received to Offer
     * Extended in one action, skipping every interview, while the single-candidate path refused
     * the identical move. A control that a checkbox can walk around is not a control.</p>
     *
     * <p>Each application is judged on its own current stage: some may move and others be refused
     * in the same request, so the caller is told exactly which and why via {@code errors} — it
     * must not read {@code updatedCount} alone as success.</p>
     */
    @Transactional
    public Map<String, Object> bulkAssignPipelineStage(
            List<String> applicationIds,
            PipelineStage pipelineStage) {

        List<Application> applications = applicationRepository.findAllByIds(applicationIds);
        List<String> updatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Application application : applications) {
            try {
                // The same ordering rules the single-candidate path enforces (no backward moves
                // outside the defined re-evaluation paths, nothing out of a terminal stage, no
                // skipping more than two stages ahead).
                if (!application.canProgressToStage(pipelineStage)) {
                    throw new IllegalStateException(String.format(
                            "%s cannot move from %s to %s",
                            describe(application),
                            application.getPipelineStage() != null
                                    ? application.getPipelineStage().getDisplayName() : "an unset stage",
                            pipelineStage.getDisplayName()));
                }

                // The same verification rule the single-candidate path applies, asked in the
                // same place, so the two cannot drift apart.
                if (backgroundCheckService != null
                        && PipelineStage.requiresCompletedChecks(application.getPipelineStage(), pipelineStage)) {
                    backgroundCheckService.enforceBackgroundCheckCompletion(application);
                }

                application.setPipelineStage(pipelineStage);
                application.setPipelineStageEnteredAt(LocalDateTime.now());
                application.setUpdatedAt(LocalDateTime.now());

                applicationRepository.save(application);
                updatedIds.add(application.getId());

            } catch (IllegalStateException e) {
                // A refusal, not a failure — the message is already written for a human to read.
                errors.add(e.getMessage());
            } catch (Exception e) {
                errors.add("Could not move " + describe(application) + ": " + e.getMessage());
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
     * Names the candidate for a message a recruiter will read. Falls back to the application id
     * only when there is no name to use — an id alone tells the reader nothing about who was
     * blocked.
     */
    private String describe(Application application) {
        Applicant applicant = application.getApplicant();
        if (applicant != null) {
            String name = ((applicant.getName() != null ? applicant.getName() : "") + " "
                    + (applicant.getSurname() != null ? applicant.getSurname() : "")).trim();
            if (!name.isEmpty()) {
                return name;
            }
        }
        return "application " + application.getId();
    }

    /**
     * Rate multiple applications
     */
    @Transactional
    public Map<String, Object> bulkRateApplications(Map<String, Integer> applicationRatings) {
        List<String> updatedIds = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Map.Entry<String, Integer> entry : applicationRatings.entrySet()) {
            try {
                String applicationId = entry.getKey();
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
    public Map<String, Object> bulkAddScreeningNotes(List<String> applicationIds, String notes) {
        List<Application> applications = applicationRepository.findAllByIds(applicationIds);
        List<String> updatedIds = new ArrayList<>();
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
     * Append one screening note to one application, stamped with when it was made and by whom.
     *
     * <p>Notes accumulate rather than overwrite: this field is the running record of what people
     * thought about a candidate as they moved through the pipeline, and a later comment replacing
     * an earlier one would destroy exactly the history that makes a hiring decision defensible.
     *
     * <p>The bulk path writes {@code [2026-08-24T09:15:22.481] note} — a raw
     * {@code LocalDateTime.toString()} with microseconds, and no author. This writes a stamp meant
     * to be read by a person, and names who wrote it.
     */
    @Transactional
    public Map<String, Object> addScreeningNote(String applicationId, String note, String authorName) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        String stamp = String.format("[%s · %s]",
            LocalDateTime.now().format(NOTE_TIMESTAMP),
            authorName == null || authorName.isBlank() ? "Unknown user" : authorName);

        String existing = application.getScreeningNotes();
        String entry = stamp + "\n" + note;
        String updated = existing == null || existing.isBlank() ? entry : existing + "\n\n" + entry;

        if (updated.length() > 10000) {
            throw new IllegalArgumentException(
                "This application's notes are full (10 000 characters). Remove earlier notes before adding another.");
        }

        application.setScreeningNotes(updated);
        application.setUpdatedAt(LocalDateTime.now());
        applicationRepository.save(application);

        Map<String, Object> result = new HashMap<>();
        result.put("applicationId", applicationId);
        result.put("screeningNotes", updated);
        return result;
    }

    private static final java.time.format.DateTimeFormatter NOTE_TIMESTAMP =
        java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy 'at' HH:mm");

    /**
     * The options a filter control can legitimately offer.
     *
     * <p>Departments come from the applications themselves. This list used to be ten literals —
     * Engineering, Marketing, Sales, HR, Finance, Operations, Product, Customer Support, Legal,
     * R&amp;D — carrying the comment "this could be fetched from database". None of them exist in a
     * tenant whose departments are Strategic Business Unit, Information Technology and Enterprise
     * Risk Management, and the filter matches on exact equality, so choosing any option emptied the
     * table. That reads as "no applications" rather than "wrong filter", which is why a control
     * that cannot match anything is worse than no control at all.
     *
     * <p>Statuses and stages are returned as value/label pairs rather than bare enum constants, so
     * a caller does not have to keep its own copy of the display names to avoid printing
     * INTERVIEW_SCHEDULED at a person.
     */
    public Map<String, Object> getFilterOptions() {
        Map<String, Object> options = new LinkedHashMap<>();

        options.put("statuses", java.util.Arrays.stream(ApplicationStatus.values())
            .map(s -> Map.of("value", s.name(), "label", s.getDisplayName()))
            .collect(Collectors.toList()));

        options.put("pipelineStages", java.util.Arrays.stream(PipelineStage.values())
            .map(s -> Map.of("value", s.name(), "label", s.getDisplayName()))
            .collect(Collectors.toList()));

        List<String> departments = applicationRepository.countByDepartment().stream()
            .map(row -> row[0])
            .filter(Objects::nonNull)
            .map(String::valueOf)
            .filter(d -> !d.isBlank())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        options.put("departments", departments);

        options.put("ratingRange", Map.of("min", 1, "max", 5));
        options.put("sortFields", List.of(
            "submittedAt", "updatedAt", "rating", "jobTitle", "department", "status"));

        return options;
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

        // Source distribution — which channel each application arrived through.
        List<Object[]> sourceCounts = applicationRepository.countByApplicationSource();
        Map<String, Long> sourceDistribution = sourceCounts.stream()
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> (Long) row[1]
            ));
        stats.put("sourceDistribution", sourceDistribution);

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
            List<String> applicationIds,
            List<String> fields) {

        List<Application> applications = applicationIds != null && !applicationIds.isEmpty() ?
            applicationRepository.findAllByIds(applicationIds) :
            applicationRepository.findAll();

        // The repository rebuilds application.applicant as an id-only stub, so without this every
        // exported name and email came back null. The search path already does this; export was
        // simply never given the same treatment — and it could not be noticed while the endpoint
        // rejected every id it was handed.
        hydrateApplicants(applications);

        return applications.stream().map(app -> {
            Map<String, Object> record = new HashMap<>();
            Applicant applicant = app.getApplicant();

            if (fields == null || fields.contains("id")) {
                record.put("id", app.getId());
            }
            // Guarded rather than assumed. An applicant record that has been deleted, or an
            // application written before the association existed, would otherwise fail the whole
            // export on one row — and a bulk export that dies on record 400 of 500 is worse than
            // one that reports a blank cell.
            if (fields == null || fields.contains("applicantName")) {
                record.put("applicantName", applicant == null ? null : applicant.getFullName());
            }
            if (fields == null || fields.contains("applicantEmail")) {
                record.put("applicantEmail", applicant == null ? null : applicant.getEmail());
            }
            if (fields == null || fields.contains("jobTitle")) {
                record.put("jobTitle", app.getJobTitle());
            }
            if (fields == null || fields.contains("department")) {
                record.put("department", app.getDepartment());
            }
            // Both the stored value and the label. The value keeps the file machine-readable; the
            // label is what the person opening the spreadsheet needs, and saves them decoding
            // INTERVIEW_SCHEDULED by eye.
            if (fields == null || fields.contains("status")) {
                record.put("status", app.getStatus() == null ? null : app.getStatus().name());
                record.put("statusLabel", app.getStatus() == null ? null : app.getStatus().getDisplayName());
            }
            if (fields == null || fields.contains("pipelineStage")) {
                record.put("pipelineStage", app.getPipelineStage() == null ? null : app.getPipelineStage().name());
                record.put("pipelineStageLabel", app.getPipelineStage() == null ? null : app.getPipelineStage().getDisplayName());
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
