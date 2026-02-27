package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.employee.*;
import com.arthmatic.shumelahire.entity.EmployeeDocumentType;
import com.arthmatic.shumelahire.entity.EmployeeStatus;
import com.arthmatic.shumelahire.entity.EmploymentEventType;
import com.arthmatic.shumelahire.service.*;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'HIRING_MANAGER', 'EMPLOYEE')")
public class EmployeeController {

    private static final Logger logger = LoggerFactory.getLogger(EmployeeController.class);

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private EmployeeDocumentService documentService;

    @Autowired
    private EmploymentEventService eventService;

    @Autowired
    private ApplicantToEmployeeService applicantToEmployeeService;

    // ==================== Employee CRUD ====================

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        try {
            logger.info("Creating employee: {} {}", request.getFirstName(), request.getLastName());
            EmployeeResponse response = employeeService.createEmployee(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to create employee: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating employee", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id,
                                           @Valid @RequestBody EmployeeCreateRequest request) {
        try {
            logger.info("Updating employee: {}", id);
            EmployeeResponse response = employeeService.updateEmployee(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to update employee {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEmployee(@PathVariable Long id) {
        try {
            EmployeeResponse response = employeeService.getEmployee(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping
    public ResponseEntity<?> searchEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "lastName") String sort,
            @RequestParam(defaultValue = "asc") String direction) {
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
            Page<EmployeeResponse> results = employeeService.searchEmployees(search, pageable);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error searching employees", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterEmployees(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) EmployeeStatus status,
            @RequestParam(required = false) String jobTitle,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("lastName"));
            Page<EmployeeResponse> results = employeeService.filterEmployees(department, status, jobTitle, location, pageable);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error filtering employees", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/directory")
    public ResponseEntity<?> getDirectory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<EmployeeResponse> results = employeeService.getDirectory(pageable);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error getting directory", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/{id}/direct-reports")
    public ResponseEntity<?> getDirectReports(@PathVariable Long id) {
        try {
            List<EmployeeResponse> reports = employeeService.getDirectReports(id);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            logger.error("Error getting direct reports for {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                         @RequestParam EmployeeStatus status,
                                         @RequestParam(required = false) String reason) {
        try {
            EmployeeResponse response = employeeService.updateStatus(id, status, reason);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating employee status {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartments() {
        try {
            return ResponseEntity.ok(employeeService.getDistinctDepartments());
        } catch (Exception e) {
            logger.error("Error getting departments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/locations")
    public ResponseEntity<?> getLocations() {
        try {
            return ResponseEntity.ok(employeeService.getDistinctLocations());
        } catch (Exception e) {
            logger.error("Error getting locations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/job-titles")
    public ResponseEntity<?> getJobTitles() {
        try {
            return ResponseEntity.ok(employeeService.getDistinctJobTitles());
        } catch (Exception e) {
            logger.error("Error getting job titles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/department-counts")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EXECUTIVE')")
    public ResponseEntity<?> getDepartmentCounts() {
        try {
            Map<String, Long> counts = employeeService.getDepartmentCounts();
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            logger.error("Error getting department counts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    // ==================== Documents ====================

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'EMPLOYEE')")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long id,
            @RequestParam EmployeeDocumentType type,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate,
            @RequestParam("file") MultipartFile file) {
        try {
            EmployeeDocumentResponse response = documentService.uploadDocument(id, type, title, description, expiryDate, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (IOException e) {
            logger.error("IO error uploading document for employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("File upload failed"));
        } catch (Exception e) {
            logger.error("Error uploading document for employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<?> getDocuments(@PathVariable Long id) {
        try {
            List<EmployeeDocumentResponse> documents = documentService.getDocuments(id);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            logger.error("Error getting documents for employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/{id}/documents/type/{type}")
    public ResponseEntity<?> getDocumentsByType(@PathVariable Long id, @PathVariable EmployeeDocumentType type) {
        try {
            List<EmployeeDocumentResponse> documents = documentService.getDocumentsByType(id, type);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            logger.error("Error getting documents by type for employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @DeleteMapping("/{employeeId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> deleteDocument(@PathVariable Long employeeId, @PathVariable Long documentId) {
        try {
            documentService.deleteDocument(employeeId, documentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting document {} for employee {}", documentId, employeeId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/documents/expiring")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> getExpiringDocuments(@RequestParam(defaultValue = "30") int daysAhead) {
        try {
            List<EmployeeDocumentResponse> documents = documentService.getExpiringDocuments(daysAhead);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            logger.error("Error getting expiring documents", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    // ==================== Employment Events ====================

    @PostMapping("/{id}/events")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> createEvent(@PathVariable Long id,
                                        @Valid @RequestBody EmploymentEventRequest request) {
        try {
            request.setEmployeeId(id);
            EmploymentEventResponse response = eventService.createEvent(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating event for employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<?> getEmployeeHistory(@PathVariable Long id) {
        try {
            List<EmploymentEventResponse> events = eventService.getEmployeeHistory(id);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            logger.error("Error getting events for employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/{id}/events/type/{type}")
    public ResponseEntity<?> getEventsByType(@PathVariable Long id, @PathVariable EmploymentEventType type) {
        try {
            List<EmploymentEventResponse> events = eventService.getEmployeeEventsByType(id, type);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            logger.error("Error getting events by type for employee {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    // ==================== Applicant Conversion ====================

    @PostMapping("/convert-applicant")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<?> convertApplicant(@Valid @RequestBody ApplicantToEmployeeRequest request) {
        try {
            EmployeeResponse response = applicantToEmployeeService.convertApplicantToEmployee(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error converting applicant {}", request.getApplicantId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    // Error response DTO (reuse pattern from ApplicantController)
    public static class ErrorResponse {
        private String message;
        private long timestamp;

        public ErrorResponse(String message) {
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    }
}
