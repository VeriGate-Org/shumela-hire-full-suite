package com.arthmatic.shumelahire.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DataResidencyService {

    @Value("${data-residency.region:ZA}")
    private String region;

    @Value("${data-residency.provider:local}")
    private String provider;

    @Value("${data-residency.compliance-standard:POPIA}")
    private String complianceStandard;

    public Map<String, Object> generateResidencyReport() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("region", region);
        report.put("provider", provider);
        report.put("complianceStandard", complianceStandard);
        report.put("storageLocations", getStorageLocations());
        report.put("encryptionStatus", Map.of(
            "atRest", true,
            "inTransit", true,
            "algorithm", "AES-256-GCM"
        ));
        report.put("generatedAt", LocalDateTime.now().toString());
        return report;
    }

    public List<Map<String, String>> getStorageLocations() {
        return List.of(
            Map.of("type", "database", "region", region, "provider", provider),
            Map.of("type", "fileStorage", "region", region, "provider", provider),
            Map.of("type", "backup", "region", region, "provider", provider)
        );
    }
}
