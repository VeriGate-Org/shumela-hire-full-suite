package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.service.ApplicationManagementService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Application Management Console
 */
@RestController
@RequestMapping("/api/applications/manage")
public class ApplicationManagementController {

    private final ApplicationManagementService applicationManagementService;

    public ApplicationManagementController(ApplicationManagementService applicationManagementService) {
        this.applicationManagementService = applicationManagementService;
    }

    /**
     * Advanced search for applications with filtering
     * GET /api/applications/manage/search
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> searchApplications(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) List<ApplicationStatus> statuses,
            @RequestParam(required = false) List<String> departments,
            @RequestParam(required = false) String jobTitle,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Integer maxRating,
            @RequestParam(defaultValue = "submittedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            Sort.Direction direction = Sort.Direction.fromString(sortDirection);
            Sort sort = Sort.by(direction, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);

            var searchResults = applicationManagementService.searchApplications(
                searchTerm, statuses, departments, jobTitle,
                dateFrom, dateTo, minRating, maxRating,
                sortBy, sortDirection, pageable
            );

            Map<String, Object> response = new HashMap<>();
            response.put("content", searchResults.getContent());
            response.put("page", searchResults.getNumber());
            response.put("size", searchResults.getSize());
            response.put("totalElements", searchResults.getTotalElements());
            response.put("totalPages", searchResults.getTotalPages());
            response.put("first", searchResults.isFirst());
            response.put("last", searchResults.isLast());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Search failed: " + e.getMessage()));
        }
    }

    /**
     * Bulk update application status
     * PUT /api/applications/manage/bulk/status
     */
    @PutMapping("/bulk/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> bulkUpdateStatus(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> applicationIds = (List<Long>) request.get("applicationIds");
            String statusName = (String) request.get("status");
            String reason = (String) request.get("reason");

            ApplicationStatus status = ApplicationStatus.valueOf(statusName);

            var result = applicationManagementService.bulkUpdateStatus(applicationIds, status, reason);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Invalid status: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Bulk update failed: " + e.getMessage()));
        }
    }

    /**
     * Bulk assign pipeline stage
     * PUT /api/applications/manage/bulk/pipeline-stage
     */
    @PutMapping("/bulk/pipeline-stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> bulkAssignPipelineStage(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> applicationIds = (List<Long>) request.get("applicationIds");
            String stageName = (String) request.get("pipelineStage");

            PipelineStage stage = PipelineStage.valueOf(stageName);

            var result = applicationManagementService.bulkAssignPipelineStage(applicationIds, stage);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Invalid pipeline stage: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Bulk pipeline stage assignment failed: " + e.getMessage()));
        }
    }

    /**
     * Bulk rate applications
     * PUT /api/applications/manage/bulk/rating
     */
    @PutMapping("/bulk/rating")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> bulkRateApplications(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Integer> ratings = (Map<String, Integer>) request.get("ratings");

            // Convert String keys to Long
            Map<Long, Integer> applicationRatings = new HashMap<>();
            for (Map.Entry<String, Integer> entry : ratings.entrySet()) {
                applicationRatings.put(Long.parseLong(entry.getKey()), entry.getValue());
            }

            var result = applicationManagementService.bulkRateApplications(applicationRatings);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Bulk rating failed: " + e.getMessage()));
        }
    }

    /**
     * Bulk add screening notes
     * PUT /api/applications/manage/bulk/screening-notes
     */
    @PutMapping("/bulk/screening-notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> bulkAddScreeningNotes(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Long> applicationIds = (List<Long>) request.get("applicationIds");
            String notes = (String) request.get("notes");

            if (notes == null || notes.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Notes cannot be empty"));
            }

            if (notes.length() > 2000) {
                return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Screening notes must not exceed 2000 characters"));
            }

            var result = applicationManagementService.bulkAddScreeningNotes(applicationIds, notes);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Bulk screening notes update failed: " + e.getMessage()));
        }
    }

    /**
     * Get application statistics
     * GET /api/applications/manage/statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getApplicationStatistics() {
        try {
            var stats = applicationManagementService.getApplicationStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Failed to get statistics: " + e.getMessage()));
        }
    }

    /**
     * Get applications requiring attention
     * GET /api/applications/manage/attention
     */
    @GetMapping("/attention")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getApplicationsRequiringAttention(
            @RequestParam(defaultValue = "7") int daysThreshold) {
        try {
            var applications = applicationManagementService.getApplicationsRequiringAttention(daysThreshold);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Failed to get applications requiring attention: " + e.getMessage()));
        }
    }

    /**
     * Export applications data
     * GET /api/applications/manage/export
     */
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> exportApplications(
            @RequestParam(required = false) List<Long> applicationIds,
            @RequestParam(required = false) List<String> fields,
            @RequestParam(defaultValue = "json") String format) {
        try {
            var data = applicationManagementService.exportApplications(applicationIds, fields);

            Map<String, Object> response = new HashMap<>();
            response.put("format", format);
            response.put("recordCount", data.size());
            response.put("data", data);
            response.put("exportedAt", LocalDateTime.now());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Export failed: " + e.getMessage()));
        }
    }

    /**
     * Get available filter options
     * GET /api/applications/manage/filter-options
     */
    @GetMapping("/filter-options")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<?> getFilterOptions() {
        try {
            Map<String, Object> options = new HashMap<>();

            // Application statuses
            options.put("statuses", ApplicationStatus.values());

            // Pipeline stages
            options.put("pipelineStages", PipelineStage.values());

            // Common departments (this could be fetched from database)
            options.put("departments", List.of(
                "Engineering", "Marketing", "Sales", "HR", "Finance",
                "Operations", "Product", "Customer Support", "Legal", "R&D"
            ));

            // Rating range
            options.put("ratingRange", Map.of("min", 1, "max", 5));

            // Sort fields
            options.put("sortFields", List.of(
                "submittedAt", "updatedAt", "rating", "jobTitle",
                "department", "status", "applicant.name"
            ));

            return ResponseEntity.ok(options);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("Failed to get filter options: " + e.getMessage()));
        }
    }
}
