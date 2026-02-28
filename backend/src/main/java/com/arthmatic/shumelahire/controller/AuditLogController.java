package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.AuditLog;
import com.arthmatic.shumelahire.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @Autowired
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Create a new audit log entry
     * POST /api/audit
     */
    @PostMapping("/audit")
    public ResponseEntity<AuditLogResponse> createAuditLog(@Valid @RequestBody AuditLogRequest request) {
        try {
            AuditLog savedLog;
            if (request.getUserRole() != null && !request.getUserRole().isEmpty()) {
                savedLog = auditLogService.saveLog(
                    request.getUserId(),
                    request.getAction(),
                    request.getEntityType(),
                    request.getEntityId(),
                    request.getDetails(),
                    request.getUserRole()
                );
            } else {
                savedLog = auditLogService.saveLog(
                    request.getUserId(),
                    request.getAction(),
                    request.getEntityType(),
                    request.getEntityId(),
                    request.getDetails()
                );
            }

            AuditLogResponse response = new AuditLogResponse(
                savedLog.getId(),
                savedLog.getTimestamp(),
                savedLog.getUserId(),
                savedLog.getAction(),
                savedLog.getEntityType(),
                savedLog.getEntityId(),
                savedLog.getDetails(),
                savedLog.getUserRole(),
                "Audit log created successfully"
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            AuditLogResponse errorResponse = new AuditLogResponse(
                null, null, null, null, null, null, null, null,
                "Failed to create audit log: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get audit logs by user ID
     * GET /api/audit/user/{userId}
     */
    @GetMapping("/audit/user/{userId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUser(@PathVariable String userId) {
        List<AuditLog> logs = auditLogService.getLogsByUser(userId);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get audit logs by entity
     * GET /api/audit/entity/{entityType}/{entityId}
     */
    @GetMapping("/audit/entity/{entityType}/{entityId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByEntity(
            @PathVariable String entityType,
            @PathVariable String entityId) {
        List<AuditLog> logs = auditLogService.getLogsByEntity(entityType, entityId);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get audit logs by action
     * GET /api/audit/action/{action}
     */
    @GetMapping("/audit/action/{action}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByAction(@PathVariable String action) {
        List<AuditLog> logs = auditLogService.getLogsByAction(action);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get audit logs within a time range
     * GET /api/audit/range?start=2023-12-01T00:00:00&end=2023-12-31T23:59:59
     */
    @GetMapping("/audit/range")
    public ResponseEntity<List<AuditLog>> getAuditLogsByTimeRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<AuditLog> logs = auditLogService.getLogsByTimeRange(start, end);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get all audit logs with pagination (admin endpoint)
     * GET /api/audit/all?page=0&size=50&sort=timestamp&direction=DESC
     */
    @GetMapping("/audit/all")
    public ResponseEntity<Page<AuditLog>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "timestamp") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        Page<AuditLog> logs = auditLogService.getAllLogs(pageRequest);
        return ResponseEntity.ok(logs);
    }

    /**
     * Health check endpoint
     * GET /api/audit/health
     */
    @GetMapping("/audit/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Audit Log Service is running");
    }

    // DTOs for request and response
    public static class AuditLogRequest {
        private String userId;
        private String action;
        private String entityType;
        private String entityId;
        private String details;
        private String userRole;

        // Constructors
        public AuditLogRequest() {}

        public AuditLogRequest(String userId, String action, String entityType, String entityId, String details, String userRole) {
            this.userId = userId;
            this.action = action;
            this.entityType = entityType;
            this.entityId = entityId;
            this.details = details;
            this.userRole = userRole;
        }

        // Getters and Setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }

        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }

        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }

        public String getUserRole() { return userRole; }
        public void setUserRole(String userRole) { this.userRole = userRole; }
    }

    public static class AuditLogResponse {
        private Long id;
        private LocalDateTime timestamp;
        private String userId;
        private String action;
        private String entityType;
        private String entityId;
        private String details;
        private String userRole;
        private String message;

        // Constructors
        public AuditLogResponse() {}

        public AuditLogResponse(Long id, LocalDateTime timestamp, String userId, String action,
                               String entityType, String entityId, String details, String userRole, String message) {
            this.id = id;
            this.timestamp = timestamp;
            this.userId = userId;
            this.action = action;
            this.entityType = entityType;
            this.entityId = entityId;
            this.details = details;
            this.userRole = userRole;
            this.message = message;
        }

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }

        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }

        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }

        public String getUserRole() { return userRole; }
        public void setUserRole(String userRole) { this.userRole = userRole; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}