package com.arthmatic.shumelahire.controller.integration;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.integration.*;
import com.arthmatic.shumelahire.entity.AuditLog;
import com.arthmatic.shumelahire.entity.integration.SsoConfiguration;
import com.arthmatic.shumelahire.service.AuditLogService;
import com.arthmatic.shumelahire.service.integration.sso.SsoConfigurationService;
import com.arthmatic.shumelahire.service.integration.sso.SsoGroupMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/integrations/sso")
@FeatureGate("AD_SSO")
@PreAuthorize("hasRole('ADMIN')")
public class SsoController {

    @Autowired
    private SsoConfigurationService ssoConfigurationService;

    @Autowired
    private SsoGroupMappingService ssoGroupMappingService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Get SSO configuration for the current tenant.
     * Returns the first configuration found, or 204 No Content if none exists.
     */
    @GetMapping("/config")
    public ResponseEntity<SsoConfigResponse> getConfig() {
        List<SsoConfiguration> configs = ssoConfigurationService.getAllConfigurations();
        if (configs.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(SsoConfigResponse.fromEntity(configs.get(0)));
    }

    /**
     * Create or update SSO configuration for the current tenant.
     * Since a tenant can only have one SSO config (unique constraint),
     * this endpoint upserts the configuration.
     */
    @PostMapping("/config")
    public ResponseEntity<SsoConfigResponse> saveConfig(@RequestBody SsoConfigRequest request) {
        SsoConfiguration saved = ssoConfigurationService.saveConfiguration(request);
        return ResponseEntity.ok(SsoConfigResponse.fromEntity(saved));
    }

    /**
     * Test the SSO connection for the current tenant's configuration.
     */
    @PostMapping("/test")
    public ResponseEntity<SsoTestResult> testConnection() {
        List<SsoConfiguration> configs = ssoConfigurationService.getAllConfigurations();
        if (configs.isEmpty()) {
            return ResponseEntity.ok(new SsoTestResult(
                    false,
                    "No SSO configuration found. Please save a configuration before testing.",
                    Map.of()
            ));
        }
        SsoTestResult result = ssoConfigurationService.testConnection(configs.get(0).getId());
        return ResponseEntity.ok(result);
    }

    /**
     * Get AD group-to-role mappings for the current tenant's SSO configuration.
     */
    @GetMapping("/mappings")
    public ResponseEntity<List<SsoGroupMapping>> getMappings() {
        List<SsoGroupMapping> mappings = ssoGroupMappingService.getGroupMappingsForTenant();
        return ResponseEntity.ok(mappings);
    }

    /**
     * Update AD group-to-role mappings for the current tenant's SSO configuration.
     */
    @PutMapping("/mappings")
    public ResponseEntity<List<SsoGroupMapping>> updateMappings(@RequestBody List<SsoGroupMapping> mappings) {
        List<SsoGroupMapping> updated = ssoGroupMappingService.updateGroupMappingsForTenant(mappings);
        return ResponseEntity.ok(updated);
    }

    /**
     * List AD groups. Placeholder implementation — in production this would query
     * Azure AD Graph API or on-prem AD via LDAP.
     */
    @GetMapping("/groups")
    public ResponseEntity<List<Map<String, String>>> getAdGroups() {
        // Placeholder: return common AD group names
        List<Map<String, String>> groups = List.of(
            Map.of("id", "1", "name", "HR_Department", "description", "Human Resources department group"),
            Map.of("id", "2", "name", "IT_Department", "description", "Information Technology department group"),
            Map.of("id", "3", "name", "Finance_Department", "description", "Finance department group"),
            Map.of("id", "4", "name", "Management", "description", "Management team group"),
            Map.of("id", "5", "name", "All_Employees", "description", "All employees group")
        );
        return ResponseEntity.ok(groups);
    }

    /**
     * Get SSO-related audit log entries with pagination.
     */
    @GetMapping("/audit")
    public ResponseEntity<?> getSsoAuditLog(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<AuditLog> auditPage = auditLogService.getLogsByEntityType("SSO_CONFIG", pageable);
            return ResponseEntity.ok(auditPage);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
