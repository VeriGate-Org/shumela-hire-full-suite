package com.arthmatic.shumelahire.service;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApplicationManagementService {

    @Autowired
    @Qualifier("shumelahireApplicationRepository")
    private ApplicationRepository applicationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuditLogService auditLogService;

    // Advanced search with filters
    public List<Application> searchApplications(
            String keyword,
            String status,
            String position,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Integer minRating,
            Integer maxRating,
            String experience,
            String location
    ) {
        Specification<Application> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.trim().isEmpty()) {
                String keywordPattern = "%" + keyword.toLowerCase() + "%";
                Predicate keywordPredicate = cb.or(
                    cb.like(cb.lower(root.get("applicant").get("fullName")), keywordPattern),
                    cb.like(cb.lower(root.get("applicant").get("email")), keywordPattern),
                    cb.like(cb.lower(root.get("jobTitle")), keywordPattern)
                );
                predicates.add(keywordPredicate);
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (position != null && !position.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("jobTitle")), "%" + position.toLowerCase() + "%"));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("submittedAt"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("submittedAt"), toDate));
            }

            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }

            if (maxRating != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("rating"), maxRating));
            }

            if (experience != null && !experience.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("applicant").get("experience")), "%" + experience.toLowerCase() + "%"));
            }

            if (location != null && !location.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("applicant").get("location")), "%" + location.toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return applicationRepository.findAll(spec);
    }

    // Bulk status update
    public void bulkUpdateStatus(List<Long> applicationIds, String newStatus, String reason) {
        List<Application> applications = applicationRepository.findAllById(applicationIds);
        
        for (Application application : applications) {
            String oldStatus = application.getStatus();
            application.setStatus(newStatus);
            application.setUpdatedAt(LocalDateTime.now());
            
            if (reason != null && !reason.trim().isEmpty()) {
                // Add reason to screening notes
                String notes = application.getScreeningNotes() != null ? application.getScreeningNotes() : "";
                notes += (notes.isEmpty() ? "" : "\n") + "Status changed from " + oldStatus + " to " + newStatus + ": " + reason;
                application.setScreeningNotes(notes);
            }
            
            // Send notification
            notificationService.notifyStatusChange(application, oldStatus, newStatus);
            
            // Log audit
            auditLogService.saveLog(
                "system",
                "BULK_STATUS_UPDATE",
                "APPLICATION",
                application.getId().toString(),
                "Updated status from " + oldStatus + " to " + newStatus + (reason != null ? ": " + reason : "")
            );
        }
        
        applicationRepository.saveAll(applications);
    }

    // Bulk rating update
    public void bulkRateApplications(List<Long> applicationIds, Integer rating, String feedback) {
        List<Application> applications = applicationRepository.findAllById(applicationIds);
        
        for (Application application : applications) {
            Integer oldRating = application.getRating();
            application.setRating(rating);
            application.setUpdatedAt(LocalDateTime.now());
            
            if (feedback != null && !feedback.trim().isEmpty()) {
                String notes = application.getScreeningNotes() != null ? application.getScreeningNotes() : "";
                notes += (notes.isEmpty() ? "" : "\n") + "Rating updated to " + rating + "/5: " + feedback;
                application.setScreeningNotes(notes);
            }
            
            // Log audit
            auditLogService.saveLog(
                "system",
                "BULK_RATING_UPDATE",
                "APPLICATION",
                application.getId().toString(),
                "Updated rating from " + oldRating + " to " + rating + (feedback != null ? ": " + feedback : "")
            );
        }
        
        applicationRepository.saveAll(applications);
    }

    // Bulk screening notes addition
    public void bulkAddScreeningNotes(List<Long> applicationIds, String notes) {
        List<Application> applications = applicationRepository.findAllById(applicationIds);
        
        for (Application application : applications) {
            String existingNotes = application.getScreeningNotes() != null ? application.getScreeningNotes() : "";
            String newNotes = existingNotes + (existingNotes.isEmpty() ? "" : "\n") + 
                             LocalDateTime.now().toString() + ": " + notes;
            application.setScreeningNotes(newNotes);
            application.setUpdatedAt(LocalDateTime.now());
            
            // Log audit
            auditLogService.saveLog(
                "system",
                "BULK_NOTES_UPDATE",
                "APPLICATION",
                application.getId().toString(),
                "Added screening notes: " + notes
            );
        }
        
        applicationRepository.saveAll(applications);
    }

    // Get application statistics
    public Map<String, Object> getApplicationStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Total applications
        long totalApplications = applicationRepository.count();
        stats.put("totalApplications", totalApplications);
        
        // Applications by status
        Map<String, Long> statusCounts = new HashMap<>();
        statusCounts.put("submitted", applicationRepository.countByStatus("SUBMITTED"));
        statusCounts.put("screening", applicationRepository.countByStatus("SCREENING"));
        statusCounts.put("interviewing", applicationRepository.countByStatus("INTERVIEWING"));
        statusCounts.put("offered", applicationRepository.countByStatus("OFFERED"));
        statusCounts.put("accepted", applicationRepository.countByStatus("ACCEPTED"));
        statusCounts.put("rejected", applicationRepository.countByStatus("REJECTED"));
        statusCounts.put("withdrawn", applicationRepository.countByStatus("WITHDRAWN"));
        stats.put("statusCounts", statusCounts);
        
        // Recent applications (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long recentApplications = applicationRepository.countBySubmittedAtAfter(thirtyDaysAgo);
        stats.put("recentApplications", recentApplications);
        
        // Average rating
        Double avgRating = applicationRepository.findAverageRating();
        stats.put("averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0);
        
        // Top positions by application count
        List<Object[]> topPositions = applicationRepository.findTopPositionsByApplicationCount();
        List<Map<String, Object>> topPositionsList = topPositions.stream()
            .limit(5)
            .map(row -> {
                Map<String, Object> position = new HashMap<>();
                position.put("jobTitle", row[0]);
                position.put("count", row[1]);
                return position;
            })
            .collect(Collectors.toList());
        stats.put("topPositions", topPositionsList);
        
        return stats;
    }

    // Export applications data
    public List<Map<String, Object>> exportApplications(
            String keyword,
            String status,
            String position,
            LocalDateTime fromDate,
            LocalDateTime toDate
    ) {
        List<Application> applications = searchApplications(keyword, status, position, fromDate, toDate, null, null, null, null);
        
        return applications.stream().map(app -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", app.getId());
            data.put("applicantName", app.getApplicant().getFullName());
            data.put("applicantEmail", app.getApplicant().getEmail());
            data.put("jobTitle", app.getJobTitle());
            data.put("status", app.getStatus());
            data.put("rating", app.getRating());
            data.put("submittedAt", app.getSubmittedAt());
            data.put("updatedAt", app.getUpdatedAt());
            data.put("screeningNotes", app.getScreeningNotes());
            data.put("experience", app.getApplicant().getExperience());
            data.put("location", app.getApplicant().getLocation());
            return data;
        }).collect(Collectors.toList());
    }

    // Advanced filtering for dashboard widgets
    public List<Application> getApplicationsRequiringAction() {
        return applicationRepository.findByStatusIn(
            Arrays.asList("SUBMITTED", "SCREENING")
        );
    }

    public List<Application> getHighRatedApplications() {
        return applicationRepository.findByRatingGreaterThanEqual(4);
    }
}
