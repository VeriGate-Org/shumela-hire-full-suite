package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantRepository;
import com.arthmatic.shumelahire.service.FileStorageService;
import com.arthmatic.shumelahire.service.TenantOnboardingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/tenants")
@PreAuthorize("hasRole('ADMIN')")
public class TenantController {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TenantOnboardingService onboardingService;

    @Autowired
    private FileStorageService fileStorageService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final long MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/svg+xml", "image/webp"
    );

    @PostMapping
    public ResponseEntity<Tenant> createTenant(
            @Valid @RequestBody TenantOnboardingService.CreateTenantRequest request) {
        try {
            Tenant tenant = onboardingService.createTenant(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(tenant);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<Page<Tenant>> listTenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Tenant> tenants = tenantRepository.findAll(pageable);
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tenant> getTenant(@PathVariable String id) {
        Optional<Tenant> tenant = tenantRepository.findById(id);
        return tenant.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tenant> updateTenant(
            @PathVariable String id,
            @Valid @RequestBody TenantOnboardingService.UpdateTenantRequest request) {
        try {
            Tenant tenant = onboardingService.updateTenant(id, request);
            return ResponseEntity.ok(tenant);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/suspend")
    public ResponseEntity<Void> suspendTenant(@PathVariable String id) {
        try {
            onboardingService.suspendTenant(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activateTenant(@PathVariable String id) {
        try {
            onboardingService.activateTenant(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTenant(@PathVariable String id) {
        if (!tenantRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tenantRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadLogo(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        Optional<Tenant> optTenant = tenantRepository.findById(id);
        if (optTenant.isEmpty()) return ResponseEntity.notFound().build();

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }
        if (file.getSize() > MAX_LOGO_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "File exceeds 2MB limit"));
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid image type. Allowed: PNG, JPEG, GIF, SVG, WebP"));
        }

        try {
            Tenant tenant = optTenant.get();
            // Delete old logo if exists
            JsonNode settings = objectMapper.readTree(tenant.getSettings() != null ? tenant.getSettings() : "{}");
            String oldLogoKey = settings.path("branding").path("logoKey").asText(null);
            if (oldLogoKey != null && !oldLogoKey.isEmpty()) {
                try { fileStorageService.delete(oldLogoKey); } catch (IOException ignored) {}
            }

            // Store new logo
            String logoKey = fileStorageService.store(file);

            // Update settings JSON
            ObjectNode settingsNode = settings.isObject() ? (ObjectNode) settings : objectMapper.createObjectNode();
            ObjectNode brandingNode = settingsNode.has("branding") && settingsNode.get("branding").isObject()
                    ? (ObjectNode) settingsNode.get("branding")
                    : objectMapper.createObjectNode();
            brandingNode.put("logoKey", logoKey);
            settingsNode.set("branding", brandingNode);
            tenant.setSettings(objectMapper.writeValueAsString(settingsNode));
            tenantRepository.save(tenant);

            return ResponseEntity.ok(Map.of("logoKey", logoKey));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload logo"));
        }
    }

    @DeleteMapping("/{id}/logo")
    public ResponseEntity<?> deleteLogo(@PathVariable String id) {
        Optional<Tenant> optTenant = tenantRepository.findById(id);
        if (optTenant.isEmpty()) return ResponseEntity.notFound().build();

        try {
            Tenant tenant = optTenant.get();
            JsonNode settings = objectMapper.readTree(tenant.getSettings() != null ? tenant.getSettings() : "{}");
            String logoKey = settings.path("branding").path("logoKey").asText(null);

            if (logoKey != null && !logoKey.isEmpty()) {
                try { fileStorageService.delete(logoKey); } catch (IOException ignored) {}
            }

            // Remove logoKey from settings
            ObjectNode settingsNode = settings.isObject() ? (ObjectNode) settings : objectMapper.createObjectNode();
            if (settingsNode.has("branding")) {
                ObjectNode brandingNode = (ObjectNode) settingsNode.get("branding");
                brandingNode.remove("logoKey");
                settingsNode.set("branding", brandingNode);
            }
            tenant.setSettings(objectMapper.writeValueAsString(settingsNode));
            tenantRepository.save(tenant);

            return ResponseEntity.ok(Map.of("message", "Logo removed"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove logo"));
        }
    }
}
