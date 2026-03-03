package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.*;
import com.arthmatic.shumelahire.entity.JobAdHistory;
import com.arthmatic.shumelahire.entity.JobAdStatus;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import com.arthmatic.shumelahire.service.JobAdService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ads")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class JobAdController {
    
    private static final Logger logger = LoggerFactory.getLogger(JobAdController.class);
    
    @Autowired
    private JobAdService jobAdService;

    @Autowired
    private UserRepository userRepository;
    
    /**
     * GET /ads/internal - List published internal job ads (any authenticated user)
     */
    @GetMapping("/internal")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<JobAdResponse>>> getInternalJobAds(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<JobAdResponse> ads = jobAdService.getPublishedInternalAds(pageable);
            return ResponseEntity.ok(ApiResponse.success(ads, "Internal job ads retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error fetching internal job ads", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    /**
     * POST /ads - Create job ad (draft or publish)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<JobAdResponse>> createJobAd(@Valid @RequestBody JobAdCreateRequest request) {
        try {
            logger.info("Creating job ad: {}", request.getTitle());
            JobAdResponse response = jobAdService.createJobAd(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(response, "Job ad created successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request for creating job ad: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating job ad", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }
    
    /**
     * PUT /ads/{id} - Update job ad
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobAdResponse>> updateJobAd(
            @PathVariable Long id,
            @Valid @RequestBody JobAdUpdateRequest request,
            Authentication authentication) {
        try {
            String userId = resolveActorId(authentication);
            logger.info("Updating job ad: {}", id);
            JobAdResponse response = jobAdService.updateJobAd(id, request, userId);
            return ResponseEntity.ok(ApiResponse.success(response, "Job ad updated successfully"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Invalid request for updating job ad {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating job ad: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }
    
    /**
     * POST /ads/{id}/publish - Publish job ad
     */
    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<JobAdResponse>> publishJobAd(
            @PathVariable Long id, 
            @Valid @RequestBody JobAdPublishRequest request) {
        try {
            logger.info("Publishing job ad: {}", id);
            JobAdResponse response = jobAdService.publishJobAd(id, request);
            return ResponseEntity.ok(ApiResponse.success(response, "Job ad published successfully"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Invalid request for publishing job ad {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error publishing job ad: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }
    
    /**
     * POST /ads/{id}/unpublish - Unpublish job ad
     */
    @PostMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<JobAdResponse>> unpublishJobAd(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userId = resolveActorId(authentication);
            logger.info("Unpublishing job ad: {}", id);
            JobAdResponse response = jobAdService.unpublishJobAd(id, userId);
            return ResponseEntity.ok(ApiResponse.success(response, "Job ad unpublished successfully"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            logger.warn("Invalid request for unpublishing job ad {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error unpublishing job ad: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }
    
    /**
     * GET /ads - List/filter job ads
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobAdResponse>>> getJobAds(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            logger.info("Searching job ads with filters - status: {}, channel: {}, query: {}", status, channel, q);
            
            JobAdStatus statusEnum = null;
            if (status != null) {
                try {
                    statusEnum = JobAdStatus.valueOf(status.toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid status: " + status));
                }
            }
            
            Page<JobAdResponse> response = jobAdService.searchJobAds(statusEnum, channel, q, pageable);
            return ResponseEntity.ok(ApiResponse.success(response, "Job ads retrieved successfully"));
        } catch (Exception e) {
            logger.error("Error searching job ads", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }
    
    /**
     * GET /ads/{slug} - Public fetch by slug
     */
    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<JobAdResponse>> getJobAdBySlug(@PathVariable String slug) {
        try {
            logger.info("Fetching job ad by slug: {}", slug);
            
            // Try to parse as ID first (for internal use)
            try {
                Long id = Long.parseLong(slug);
                JobAdResponse response = jobAdService.getJobAd(id);
                return ResponseEntity.ok(ApiResponse.success(response, "Job ad retrieved successfully"));
            } catch (NumberFormatException e) {
                // Not an ID, treat as slug
                JobAdResponse response = jobAdService.getJobAdBySlug(slug);
                return ResponseEntity.ok(ApiResponse.success(response, "Job ad retrieved successfully"));
            }
        } catch (IllegalArgumentException e) {
            logger.warn("Job ad not found with slug: {}", slug);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching job ad by slug: {}", slug, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }
    
    /**
     * GET /ads/{id}/history - Get job ad history
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<JobAdHistory>>> getJobAdHistory(@PathVariable Long id) {
        try {
            logger.info("Fetching history for job ad: {}", id);
            List<JobAdHistory> history = jobAdService.getJobAdHistory(id);
            return ResponseEntity.ok(ApiResponse.success(history, "Job ad history retrieved successfully"));
        } catch (IllegalArgumentException e) {
            logger.warn("Job ad not found with ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching job ad history: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }
    
    /**
     * POST /ads/expire - Manual trigger for expiring ads (admin only)
     */
    @PostMapping("/expire")
    public ResponseEntity<ApiResponse<String>> expireAds(Authentication authentication) {
        try {
            String userId = resolveActorId(authentication);
            logger.info("Manually triggering ad expiration by user: {}", userId);
            int expiredCount = jobAdService.expireAds();
            String message = String.format("Expired %d job ads", expiredCount);
            return ResponseEntity.ok(ApiResponse.success(message, "Ad expiration completed"));
        } catch (Exception e) {
            logger.error("Error during manual ad expiration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Internal server error"));
        }
    }

    private String resolveActorId(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email)
                        .map(u -> String.valueOf(u.getId()))
                        .orElse(email);
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            return String.valueOf(user.getId());
        }
        return "unknown";
    }
}