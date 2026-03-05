package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.ApplicantCreateRequest;
import com.arthmatic.shumelahire.dto.ApplicantResponse;
import com.arthmatic.shumelahire.dto.DocumentResponse;
import com.arthmatic.shumelahire.dto.ErrorResponse;
import com.arthmatic.shumelahire.entity.Document;
import com.arthmatic.shumelahire.entity.DocumentType;
import com.arthmatic.shumelahire.service.ApplicantService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applicants")
public class ApplicantController {

    private static final Logger logger = LoggerFactory.getLogger(ApplicantController.class);

    private final ApplicantService applicantService;

    public ApplicantController(ApplicantService applicantService) {
        this.applicantService = applicantService;
    }

    /**
     * Create new applicant
     * POST /api/applicants
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> createApplicant(@Valid @RequestBody ApplicantCreateRequest request) {
        try {
            logger.info("Creating applicant: {}", request.getEmail());
            ApplicantResponse response = applicantService.createApplicant(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to create applicant: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating applicant", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Update existing applicant
     * PUT /api/applicants/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> updateApplicant(@PathVariable Long id,
                                           @Valid @RequestBody ApplicantCreateRequest request) {
        try {
            logger.info("Updating applicant: {}", id);
            ApplicantResponse response = applicantService.updateApplicant(id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to update applicant {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating applicant {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get applicant by ID
     * GET /api/applicants/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT')")
    public ResponseEntity<?> getApplicant(@PathVariable Long id) {
        try {
            ApplicantResponse response = applicantService.getApplicant(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Applicant not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting applicant {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Search applicants with pagination
     * GET /api/applicants?search={term}&page={page}&size={size}&sort={field}
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> searchApplicants(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            Page<ApplicantResponse> results = applicantService.searchApplicants(search, pageable);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error searching applicants", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Upload document for applicant
     * POST /api/applicants/{id}/documents
     */
    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT')")
    public ResponseEntity<?> uploadDocument(
            @PathVariable Long id,
            @RequestParam(required = false) Long applicationId,
            @RequestParam DocumentType type,
            @RequestParam("file") MultipartFile file) {
        try {
            logger.info("Uploading {} document for applicant: {}", type, id);
            Document document = applicantService.uploadDocument(id, applicationId, type, file);
            DocumentResponse response = DocumentResponse.fromEntity(document);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to upload document for applicant {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (IOException e) {
            logger.error("IO error uploading document for applicant {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("File upload failed"));
        } catch (Exception e) {
            logger.error("Error uploading document for applicant {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get documents for applicant
     * GET /api/applicants/{id}/documents
     */
    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'APPLICANT')")
    public ResponseEntity<?> getApplicantDocuments(@PathVariable Long id) {
        try {
            List<Document> documents = applicantService.getApplicantDocuments(id);
            List<DocumentResponse> responses = documents.stream()
                    .map(DocumentResponse::fromEntity)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            logger.error("Error getting documents for applicant {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Delete document
     * DELETE /api/applicants/{applicantId}/documents/{documentId}
     */
    @DeleteMapping("/{applicantId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'APPLICANT')")
    public ResponseEntity<?> deleteDocument(@PathVariable Long applicantId,
                                          @PathVariable Long documentId) {
        try {
            logger.info("Deleting document {} for applicant: {}", documentId, applicantId);
            applicantService.deleteDocument(applicantId, documentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            logger.warn("Failed to delete document {} for applicant {}: {}",
                       documentId, applicantId, e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting document {} for applicant {}", documentId, applicantId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }
}
