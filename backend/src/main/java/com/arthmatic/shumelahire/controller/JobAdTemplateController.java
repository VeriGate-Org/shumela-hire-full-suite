package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.*;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import com.arthmatic.shumelahire.service.JobAdTemplateService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/job-templates")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
public class JobAdTemplateController {

    private static final Logger logger = LoggerFactory.getLogger(JobAdTemplateController.class);

    @Autowired
    private JobAdTemplateService templateService;

    @Autowired
    private UserDataRepository userRepository;

    /**
     * POST /api/job-templates - Create a new template
     */
    @PostMapping
    public ResponseEntity<ApiResponse<JobAdTemplateResponse>> createTemplate(
            @Valid @RequestBody JobAdTemplateCreateRequest request) {
        try {
            logger.info("Creating job ad template: {}", request.getName());
            JobAdTemplateResponse response = templateService.createTemplate(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Template created successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for creating template: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * GET /api/job-templates - List templates with optional filters
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobAdTemplateResponse>>> getTemplates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false, defaultValue = "false") boolean showArchived) {
        try {
            logger.info("Fetching job ad templates - search: {}, type: {}, archived: {}", search, employmentType, showArchived);
            List<JobAdTemplateResponse> response = templateService.getAllTemplates(
                    search, employmentType, location, createdBy, showArchived);
            return ResponseEntity.ok(ApiResponse.success(response, "Templates retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error fetching templates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * GET /api/job-templates/stats - Get template statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<JobAdTemplateStatsResponse>> getTemplateStats() {
        try {
            logger.info("Fetching template statistics");
            JobAdTemplateStatsResponse stats = templateService.getTemplateStats();
            return ResponseEntity.ok(ApiResponse.success(stats, "Stats retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error fetching template stats", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * GET /api/job-templates/{id} - Get a single template
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobAdTemplateResponse>> getTemplate(@PathVariable String id) {
        try {
            logger.info("Fetching template: {}", id);
            JobAdTemplateResponse response = templateService.getTemplate(id);
            return ResponseEntity.ok(ApiResponse.success(response, "Template retrieved successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Template not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching template: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * PUT /api/job-templates/{id} - Update a template
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobAdTemplateResponse>> updateTemplate(
            @PathVariable String id,
            @RequestBody JobAdTemplateUpdateRequest request) {
        try {
            logger.info("Updating template: {}", id);
            JobAdTemplateResponse response = templateService.updateTemplate(id, request);
            return ResponseEntity.ok(ApiResponse.success(response, "Template updated successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for updating template {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating template: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * DELETE /api/job-templates/{id} - Delete a template
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable String id) {
        try {
            logger.info("Deleting template: {}", id);
            templateService.deleteTemplate(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Template deleted successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Template not found for deletion: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error deleting template: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * POST /api/job-templates/{id}/duplicate - Duplicate a template
     */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<JobAdTemplateResponse>> duplicateTemplate(
            @PathVariable String id,
            @Valid @RequestBody JobAdTemplateDuplicateRequest request,
            Authentication authentication) {
        try {
            String actorId = resolveActorId(authentication);
            logger.info("Duplicating template {} as '{}'", id, request.getName());
            JobAdTemplateResponse response = templateService.duplicateTemplate(id, request.getName(), actorId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Template duplicated successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for duplicating template {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error duplicating template: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * POST /api/job-templates/generate-draft - Generate a job ad draft from a template
     */
    @PostMapping("/generate-draft")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateDraft(
            @RequestBody GenerateJobAdDraftRequest request) {
        try {
            logger.info("Generating job ad draft from template");
            Map<String, Object> draft = templateService.generateJobAdDraft(request);
            return ResponseEntity.ok(ApiResponse.success(draft, "Draft generated successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for generating draft: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error generating draft", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    private String resolveActorId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .map(u -> u.getId())
                        .orElse(email);
            }
        } else if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user.getId();
        }
        return "unknown";
    }
}
