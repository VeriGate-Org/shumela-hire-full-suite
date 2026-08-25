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
import com.arthmatic.shumelahire.security.ApplicantAccess;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    private final ApplicantAccess applicantAccess;

    public ApplicantController(ApplicantService applicantService, ApplicantAccess applicantAccess) {
        this.applicantService = applicantService;
        this.applicantAccess = applicantAccess;
    }

    /**
     * Create new applicant
     * POST /api/applicants
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'APPLICANT', 'EMPLOYEE')")
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
    // The staff half is the role set this endpoint already had — HIRING_MANAGER was never on it and
    // is not being added here. The new clause is the ownership check: previously any signed-in
    // candidate could PUT over any applicant record by changing the id.
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER') "
            + "or @applicantAccess.isSelf(authentication, #id)")
    public ResponseEntity<?> updateApplicant(Authentication authentication,
                                           @PathVariable String id,
                                           @Valid @RequestBody ApplicantCreateRequest request) {
        try {
            logger.info("Updating applicant: {}", id);
            ApplicantResponse response = applicantService.updateApplicant(id, request, authentication);
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
     * The caller's own applicant record.
     * GET /api/applicants/me
     *
     * <p>Self-service used to find its own record by searching the whole applicant list for the
     * signed-in user's email address — which is why {@code APPLICANT} and {@code EMPLOYEE} had
     * access to that list at all, and therefore to everybody else on it. Asking "who am I" should
     * not require the ability to ask "who else is there", and this endpoint takes no parameter, so
     * it cannot be pointed at anybody else.
     *
     * <p>404 when the caller has no applicant record. That is the ordinary state of a staff user
     * who has never applied, and of a candidate who has signed up but not yet applied.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyApplicantRecord(Authentication authentication) {
        try {
            return applicantAccess.self(authentication)
                    .map(applicant -> ResponseEntity.ok(
                            (Object) applicantService.getApplicant(applicant.getId(), authentication)))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error resolving the caller's own applicant record", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Get applicant by ID
     * GET /api/applicants/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("@applicantAccess.maySee(authentication, #id)")
    public ResponseEntity<?> getApplicant(Authentication authentication, @PathVariable String id) {
        try {
            ApplicantResponse response = applicantService.getApplicant(id, authentication);
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
     * This applicant's application history, summarised.
     * GET /api/applicants/{id}/application-summary
     *
     * <p>Returns totals, a per-status breakdown, the last date they applied, and the applications
     * themselves newest first. An applicant who has never applied returns {@code total: 0} with an
     * empty list — distinguishable from a 404, which means the applicant does not exist.
     *
     * <p>Restricted to staff roles. The read is by applicant id with no ownership check, so
     * including {@code APPLICANT} here would let any signed-in candidate walk ids and read other
     * people's application histories. Self-service already has its own route to a candidate's own
     * applications and should keep it.
     */
    @GetMapping("/{id}/application-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getApplicationSummary(@PathVariable String id) {
        try {
            return ResponseEntity.ok(applicantService.getApplicationSummary(id));
        } catch (IllegalArgumentException e) {
            logger.warn("Applicant not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error getting application summary for applicant {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Application summaries for several applicants at once, keyed by applicant id.
     * GET /api/applicants/application-summaries?applicantIds=a,b,c
     *
     * <p>So a list view can show application history in one round trip instead of one request per
     * row. Mirrors {@code GET /api/background-checks/summary?applicationIds=...}.
     *
     * <p>Every requested id appears in the response; an applicant with no applications returns a
     * zeroed summary rather than being omitted. Requesting more than
     * {@link ApplicantService#MAX_SUMMARY_BATCH} ids is rejected rather than silently truncated —
     * a partial answer that looks complete is worse than an error.
     */
    @GetMapping("/application-summaries")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> getApplicationSummaries(@RequestParam List<String> applicantIds) {
        try {
            return ResponseEntity.ok(applicantService.getApplicationSummaries(applicantIds));
        } catch (IllegalArgumentException e) {
            logger.warn("Rejected application-summaries batch: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error getting application summaries", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal server error"));
        }
    }

    /**
     * Counts describing the whole applicant base.
     * GET /api/applicants/summary
     *
     * <p>Separate from both the list and the batch on purpose. The list is paged, so counting from
     * it describes a page; the batch caps at {@link ApplicantService#MAX_SUMMARY_BATCH} ids, so it
     * cannot answer a question about everybody however many times it is called.
     *
     * <p>Not authorised for {@code APPLICANT} or {@code EMPLOYEE}, unlike the list beside it. These
     * are figures about the recruitment base rather than about the caller, and a new endpoint is
     * the one place where the narrower default costs nothing to choose.
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<?> summary() {
        try {
            return ResponseEntity.ok(applicantService.summary());
        } catch (Exception e) {
            logger.error("Error building applicant summary", e);
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
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction) {
        try {
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            Page<ApplicantResponse> results =
                    applicantService.searchApplicants(search, pageable, authentication);
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
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER') "
            + "or @applicantAccess.isSelf(authentication, #id)")
    public ResponseEntity<?> uploadDocument(
            @PathVariable String id,
            @RequestParam(required = false) String applicationId,
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
    @PreAuthorize("@applicantAccess.maySee(authentication, #id)")
    public ResponseEntity<?> getApplicantDocuments(@PathVariable String id) {
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
    // Recruiters could not delete documents before and still cannot.
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER') "
            + "or @applicantAccess.isSelf(authentication, #applicantId)")
    public ResponseEntity<?> deleteDocument(@PathVariable String applicantId,
                                          @PathVariable String documentId) {
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
