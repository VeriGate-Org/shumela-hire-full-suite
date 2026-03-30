package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.Tenant;
import com.arthmatic.shumelahire.repository.TenantDataRepository;
import com.arthmatic.shumelahire.service.FileStorageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/tenants")
public class PublicTenantController {

    @Autowired
    private TenantDataRepository tenantRepository;

    @Autowired
    private FileStorageService fileStorageService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/resolve/{subdomain}")
    public ResponseEntity<TenantInfo> resolveTenant(@PathVariable String subdomain) {
        Optional<Tenant> tenant = tenantRepository.findBySubdomain(subdomain);

        return tenant
                .filter(Tenant::isActive)
                .map(t -> ResponseEntity.ok(new TenantInfo(t.getId(), t.getName(), t.getSubdomain(), t.getPlan(), t.getSettings())))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/resolve/{subdomain}/logo")
    public ResponseEntity<?> getTenantLogo(@PathVariable String subdomain) {
        Optional<Tenant> tenant = tenantRepository.findBySubdomain(subdomain);

        return tenant
                .filter(Tenant::isActive)
                .map(t -> {
                    try {
                        JsonNode settings = objectMapper.readTree(t.getSettings() != null ? t.getSettings() : "{}");
                        JsonNode branding = settings.path("branding");
                        String logoKey = branding.path("logoKey").asText(null);
                        if (logoKey == null || logoKey.isEmpty()) {
                            return ResponseEntity.notFound().build();
                        }
                        String signedUrl = fileStorageService.generateSignedUrl(logoKey, Duration.ofMinutes(15));
                        return ResponseEntity.ok(Map.of("url", signedUrl));
                    } catch (Exception e) {
                        return ResponseEntity.notFound().build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    public static class TenantInfo {
        private final String id;
        private final String name;
        private final String subdomain;
        private final String plan;
        private final String settings;

        public TenantInfo(String id, String name, String subdomain, String plan, String settings) {
            this.id = id;
            this.name = name;
            this.subdomain = subdomain;
            this.plan = plan;
            this.settings = settings;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getSubdomain() { return subdomain; }
        public String getPlan() { return plan; }
        public String getSettings() { return settings; }
    }
}
