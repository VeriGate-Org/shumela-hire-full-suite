package com.arthmatic.shumelahire.controller.integration;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.entity.integration.LmsConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.LmsSyncLog;
import com.arthmatic.shumelahire.service.integration.lms.LmsIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/integrations/lms")
@FeatureGate("LMS_INTEGRATION")
@PreAuthorize("hasRole('ADMIN')")
public class LmsController {

    @Autowired
    private LmsIntegrationService lmsIntegrationService;

    // ==================== Connector Endpoints ====================

    @GetMapping("/connectors")
    public ResponseEntity<List<Map<String, Object>>> getConnectors() {
        List<LmsConnectorConfig> connectors = lmsIntegrationService.getAllConnectors();
        List<Map<String, Object>> response = connectors.stream()
                .map(this::mapConnector)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/connectors")
    public ResponseEntity<Map<String, Object>> createConnector(@RequestBody Map<String, Object> request) {
        LmsConnectorConfig connector = lmsIntegrationService.createConnector(request);
        return ResponseEntity.ok(mapConnector(connector));
    }

    @GetMapping("/connectors/{id}")
    public ResponseEntity<Map<String, Object>> getConnector(@PathVariable String id) {
        LmsConnectorConfig connector = lmsIntegrationService.getConnectorById(id);
        return ResponseEntity.ok(mapConnector(connector));
    }

    @PutMapping("/connectors/{id}")
    public ResponseEntity<Map<String, Object>> updateConnector(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        LmsConnectorConfig connector = lmsIntegrationService.updateConnector(id, request);
        return ResponseEntity.ok(mapConnector(connector));
    }

    @DeleteMapping("/connectors/{id}")
    public ResponseEntity<Map<String, String>> deleteConnector(@PathVariable String id) {
        lmsIntegrationService.deleteConnector(id);
        return ResponseEntity.ok(Map.of("message", "LMS connector deleted successfully"));
    }

    @PostMapping("/connectors/{id}/test")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable String id) {
        Map<String, Object> result = lmsIntegrationService.testConnection(id);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/connectors/{id}/sync")
    public ResponseEntity<Map<String, Object>> triggerSync(
            @PathVariable String id,
            @RequestParam(defaultValue = "COURSES") String syncType) {
        LmsSyncLog log = lmsIntegrationService.triggerSync(id, syncType);
        return ResponseEntity.ok(mapSyncLog(log));
    }

    // ==================== Log Endpoints ====================

    @GetMapping("/logs")
    public ResponseEntity<List<Map<String, Object>>> getSyncLogs() {
        List<LmsSyncLog> logs = lmsIntegrationService.getSyncLogs();
        List<Map<String, Object>> response = logs.stream()
                .map(this::mapSyncLog)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs/{connectorId}")
    public ResponseEntity<List<Map<String, Object>>> getLogsByConnector(
            @PathVariable String connectorId) {
        List<LmsSyncLog> logs = lmsIntegrationService.getSyncLogsByConnector(connectorId);
        List<Map<String, Object>> response = logs.stream()
                .map(this::mapSyncLog)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // ==================== Mapping Helpers ====================

    private Map<String, Object> mapConnector(LmsConnectorConfig config) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", config.getId());
        map.put("name", config.getName());
        map.put("providerType", config.getProviderType().name());
        map.put("baseUrl", config.getBaseUrl());
        map.put("isActive", config.getIsActive());
        map.put("lastSyncedAt", config.getLastSyncedAt() != null ? config.getLastSyncedAt().toString() : null);
        map.put("createdAt", config.getCreatedAt() != null ? config.getCreatedAt().toString() : null);
        map.put("updatedAt", config.getUpdatedAt() != null ? config.getUpdatedAt().toString() : null);
        // Do not expose apiKey in responses
        return map;
    }

    private Map<String, Object> mapSyncLog(LmsSyncLog log) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", log.getId());
        map.put("connectorId", log.getConnector() != null ? log.getConnector().getId() : null);
        map.put("connectorName", log.getConnector() != null ? log.getConnector().getName() : null);
        map.put("syncType", log.getSyncType().name());
        map.put("status", log.getStatus().name());
        map.put("recordsSynced", log.getRecordsSynced());
        map.put("errorMessage", log.getErrorMessage());
        map.put("startedAt", log.getStartedAt() != null ? log.getStartedAt().toString() : null);
        map.put("completedAt", log.getCompletedAt() != null ? log.getCompletedAt().toString() : null);
        return map;
    }
}
