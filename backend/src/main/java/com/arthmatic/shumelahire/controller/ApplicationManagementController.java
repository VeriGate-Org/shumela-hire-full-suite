package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.service.ApplicationManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications/manage")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
public class ApplicationManagementController {

    @Autowired
    private ApplicationManagementService applicationManagementService;

    /**
     * Search applications with advanced filtering
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchApplications(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Integer maxRating,
            @RequestParam(required = false) String experience,
            @RequestParam(required = false) String location
    ) {
        try {
            var applications = applicationManagementService.searchApplications(
                keyword, status, position, fromDate, toDate, minRating, maxRating, experience, location
            );
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to search applications: " + e.getMessage()));
        }
    }

    /**
     * Bulk update application status
     */
    @PostMapping("/bulk-update-status")
    public ResponseEntity<?> bulkUpdateStatus(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> applicationIdObjects = (List<Object>) request.get("applicationIds");
            String newStatus = (String) request.get("status");
            String reason = (String) request.get("reason");

            if (applicationIdObjects == null || applicationIdObjects.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Application IDs are required"));
            }

            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "New status is required"));
            }

            // Convert Integer/Long objects to Long
            List<Long> applicationIds = applicationIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .toList();

            applicationManagementService.bulkUpdateStatus(applicationIds, newStatus, reason);
            
            return ResponseEntity.ok(Map.of(
                "message", "Successfully updated " + applicationIds.size() + " applications",
                "updatedCount", applicationIds.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to update applications: " + e.getMessage()));
        }
    }

    /**
     * Bulk rate applications
     */
    @PutMapping("/bulk-rate")
    public ResponseEntity<?> bulkRateApplications(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> applicationIdObjects = (List<Object>) request.get("applicationIds");
            Integer rating = (Integer) request.get("rating");
            String feedback = (String) request.get("feedback");

            if (applicationIdObjects == null || applicationIdObjects.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Application IDs are required"));
            }

            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Rating must be between 1 and 5"));
            }

            // Convert Integer/Long objects to Long
            List<Long> applicationIds = applicationIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .toList();

            applicationManagementService.bulkRateApplications(applicationIds, rating, feedback);
            
            return ResponseEntity.ok(Map.of(
                "message", "Successfully rated " + applicationIds.size() + " applications",
                "updatedCount", applicationIds.size(),
                "rating", rating
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to rate applications: " + e.getMessage()));
        }
    }

    /**
     * Bulk add screening notes
     */
    @PutMapping("/bulk-notes")
    public ResponseEntity<?> bulkAddScreeningNotes(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> applicationIdObjects = (List<Object>) request.get("applicationIds");
            String notes = (String) request.get("notes");

            if (applicationIdObjects == null || applicationIdObjects.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Application IDs are required"));
            }

            if (notes == null || notes.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Notes are required"));
            }

            // Convert Integer/Long objects to Long
            List<Long> applicationIds = applicationIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .toList();

            applicationManagementService.bulkAddScreeningNotes(applicationIds, notes);
            
            return ResponseEntity.ok(Map.of(
                "message", "Successfully added notes to " + applicationIds.size() + " applications",
                "updatedCount", applicationIds.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to add notes: " + e.getMessage()));
        }
    }

    /**
     * Get application statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            Map<String, Object> statistics = applicationManagementService.getApplicationStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get statistics: " + e.getMessage()));
        }
    }

    /**
     * Export applications data
     */
    @GetMapping("/export")
    public ResponseEntity<?> exportApplications(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate
    ) {
        try {
            var exportData = applicationManagementService.exportApplications(
                keyword, status, position, fromDate, toDate
            );
            return ResponseEntity.ok(Map.of(
                "data", exportData,
                "count", exportData.size(),
                "exportedAt", LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to export applications: " + e.getMessage()));
        }
    }

    /**
     * Get applications requiring action
     */
    @GetMapping("/requiring-action")
    public ResponseEntity<?> getApplicationsRequiringAction() {
        try {
            var applications = applicationManagementService.getApplicationsRequiringAction();
            return ResponseEntity.ok(Map.of(
                "applications", applications,
                "count", applications.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get applications requiring action: " + e.getMessage()));
        }
    }

    /**
     * Get high-rated applications
     */
    @GetMapping("/high-rated")
    public ResponseEntity<?> getHighRatedApplications() {
        try {
            var applications = applicationManagementService.getHighRatedApplications();
            return ResponseEntity.ok(Map.of(
                "applications", applications,
                "count", applications.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get high-rated applications: " + e.getMessage()));
        }
    }
}
