package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.dto.LinkedInConnectionStatus;
import com.arthmatic.shumelahire.dto.LinkedInPostRequest;
import com.arthmatic.shumelahire.dto.LinkedInPostResponse;
import com.arthmatic.shumelahire.service.LinkedInSocialService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/linkedin/social")
@ConditionalOnBean(LinkedInSocialService.class)
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'RECRUITER')")
public class LinkedInSocialController {

    private static final Logger logger = LoggerFactory.getLogger(LinkedInSocialController.class);

    private final LinkedInSocialService linkedInSocialService;

    @Autowired
    public LinkedInSocialController(LinkedInSocialService linkedInSocialService) {
        this.linkedInSocialService = linkedInSocialService;
    }

    @GetMapping("/auth/url")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAuthorizationUrl() {
        try {
            String tenantId = TenantContext.requireCurrentTenant();
            String authUrl = linkedInSocialService.generateAuthorizationUrl(tenantId);
            return ResponseEntity.ok(Map.of("authUrl", authUrl));
        } catch (Exception e) {
            logger.error("Failed to generate LinkedIn auth URL: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate authorization URL: " + e.getMessage()));
        }
    }

    @GetMapping("/auth/callback")
    public ResponseEntity<?> handleOAuthCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state,
            @RequestParam(value = "error", required = false) String error) {

        if (error != null) {
            logger.warn("LinkedIn OAuth error: {}", error);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "/integrations?linkedin=error&reason=" + error)
                    .build();
        }

        try {
            linkedInSocialService.handleOAuthCallback(code, state);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "/integrations?linkedin=success")
                    .build();
        } catch (Exception e) {
            logger.error("LinkedIn OAuth callback failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "/integrations?linkedin=error")
                    .build();
        }
    }

    @GetMapping("/status")
    public ResponseEntity<LinkedInConnectionStatus> getConnectionStatus() {
        String tenantId = TenantContext.requireCurrentTenant();
        return ResponseEntity.ok(linkedInSocialService.getConnectionStatus(tenantId));
    }

    @DeleteMapping("/disconnect")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> disconnectOrganization(Authentication authentication) {
        try {
            String tenantId = TenantContext.requireCurrentTenant();
            String userId = authentication.getName();
            linkedInSocialService.disconnectOrganization(tenantId, userId);
            return ResponseEntity.ok(Map.of("message", "LinkedIn organization disconnected"));
        } catch (Exception e) {
            logger.error("Failed to disconnect LinkedIn: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to disconnect: " + e.getMessage()));
        }
    }

    @PostMapping("/posts")
    public ResponseEntity<LinkedInPostResponse> createPost(
            @Valid @RequestBody LinkedInPostRequest request,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            LinkedInPostResponse response = linkedInSocialService.postJobToCompanyPage(
                    request.getJobPostingId(), request.getCustomText(), userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to create LinkedIn post: {}", e.getMessage());
            return ResponseEntity.ok(new LinkedInPostResponse(false, null, e.getMessage()));
        }
    }
}
