package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.PlatformFeature;
import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.entity.TenantFeatureEntitlement;
import com.arthmatic.shumelahire.service.PlatformAdminService;
import com.arthmatic.shumelahire.service.PlatformAdminService.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/platform")
@PreAuthorize("hasRole('PLATFORM_OWNER')")
public class PlatformAdminController {

    private static final Logger logger = LoggerFactory.getLogger(PlatformAdminController.class);

    private final PlatformAdminService platformAdminService;

    public PlatformAdminController(PlatformAdminService platformAdminService) {
        this.platformAdminService = platformAdminService;
    }

    // --- Feature CRUD ---

    @GetMapping("/features")
    public ResponseEntity<List<PlatformFeature>> getAllFeatures() {
        return ResponseEntity.ok(platformAdminService.getAllFeatures());
    }

    @PostMapping("/features")
    public ResponseEntity<?> createFeature(@RequestBody CreateFeatureRequest request) {
        try {
            PlatformFeature feature = platformAdminService.createFeature(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(feature);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/features/{id}")
    public ResponseEntity<?> updateFeature(@PathVariable String id, @RequestBody UpdateFeatureRequest request) {
        try {
            PlatformFeature feature = platformAdminService.updateFeature(id, request);
            return ResponseEntity.ok(feature);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/features/{id}")
    public ResponseEntity<?> deleteFeature(@PathVariable String id) {
        try {
            platformAdminService.deleteFeature(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- Tenant Management ---

    @GetMapping("/tenants")
    public ResponseEntity<Page<Tenant>> listTenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(platformAdminService.listAllTenants(
                PageRequest.of(page, size, Sort.by("name"))));
    }

    @GetMapping("/tenants/{id}")
    public ResponseEntity<?> getTenant(@PathVariable String id) {
        try {
            return ResponseEntity.ok(platformAdminService.getTenant(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tenants/{id}/features")
    public ResponseEntity<?> getTenantFeatures(@PathVariable String id) {
        try {
            List<TenantFeatureSummary> summary = platformAdminService.getTenantFeatureSummary(id);
            return ResponseEntity.ok(summary);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // --- Entitlement Overrides ---

    @PutMapping("/tenants/{tenantId}/features/{featureId}")
    public ResponseEntity<?> setEntitlement(
            @PathVariable String tenantId,
            @PathVariable String featureId,
            @RequestBody SetEntitlementRequest request) {
        try {
            TenantFeatureEntitlement entitlement =
                    platformAdminService.setEntitlement(tenantId, featureId, request);
            return ResponseEntity.ok(entitlement);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/tenants/{tenantId}/features/{featureId}")
    public ResponseEntity<?> removeEntitlement(
            @PathVariable String tenantId,
            @PathVariable String featureId) {
        try {
            platformAdminService.removeEntitlement(tenantId, featureId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
