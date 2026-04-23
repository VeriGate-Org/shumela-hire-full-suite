package com.arthmatic.shumelahire.controller.integration;

import com.arthmatic.shumelahire.annotation.FeatureGate;
import com.arthmatic.shumelahire.dto.integration.*;
import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageSyncLog;
import com.arthmatic.shumelahire.entity.integration.SageSyncSchedule;
import com.arthmatic.shumelahire.service.integration.sage.SageConnectorService;
import com.arthmatic.shumelahire.service.integration.sage.SageSyncEngine;
import com.arthmatic.shumelahire.service.integration.sage.SageSyncScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/integrations/sage")
@FeatureGate("SAGE_300_PEOPLE")
@PreAuthorize("hasRole('ADMIN')")
public class SageIntegrationController {

    @Autowired
    private SageConnectorService connectorService;

    @Autowired
    private SageSyncScheduleService scheduleService;

    @Autowired
    private SageSyncEngine syncEngine;

    // ==================== Connector Endpoints ====================

    @GetMapping("/connectors")
    public ResponseEntity<List<SageConnectorConfigResponse>> getAllConnectors() {
        List<SageConnectorConfig> connectors = connectorService.getAllConnectors();
        List<SageConnectorConfigResponse> response = connectors.stream()
                .map(SageConnectorConfigResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/connectors")
    public ResponseEntity<SageConnectorConfigResponse> createConnector(
            @RequestBody SageConnectorConfigRequest request) {
        SageConnectorConfig created = connectorService.createConnector(request);
        return ResponseEntity.ok(SageConnectorConfigResponse.fromEntity(created));
    }

    @GetMapping("/connectors/{id}")
    public ResponseEntity<SageConnectorConfigResponse> getConnector(@PathVariable String id) {
        SageConnectorConfig config = connectorService.getConnectorById(id);
        return ResponseEntity.ok(SageConnectorConfigResponse.fromEntity(config));
    }

    @PutMapping("/connectors/{id}")
    public ResponseEntity<SageConnectorConfigResponse> updateConnector(
            @PathVariable String id,
            @RequestBody SageConnectorConfigRequest request) {
        SageConnectorConfig updated = connectorService.updateConnector(id, request);
        return ResponseEntity.ok(SageConnectorConfigResponse.fromEntity(updated));
    }

    @DeleteMapping("/connectors/{id}")
    public ResponseEntity<Map<String, String>> deleteConnector(@PathVariable String id) {
        connectorService.deleteConnector(id);
        return ResponseEntity.ok(Map.of("message", "Connector deleted successfully"));
    }

    @PostMapping("/connectors/{id}/test")
    public ResponseEntity<SageConnectionTestResult> testConnection(@PathVariable String id) {
        SageConnectionTestResult result = connectorService.testConnection(id);
        return ResponseEntity.ok(result);
    }

    // ==================== Schedule Endpoints ====================

    @GetMapping("/schedules")
    public ResponseEntity<List<SageSyncScheduleResponse>> getAllSchedules() {
        List<SageSyncSchedule> schedules = scheduleService.getAllSchedules();
        List<SageSyncScheduleResponse> response = schedules.stream()
                .map(SageSyncScheduleResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/schedules")
    public ResponseEntity<SageSyncScheduleResponse> createSchedule(
            @RequestBody SageSyncScheduleRequest request) {
        SageSyncSchedule created = scheduleService.createSchedule(request);
        return ResponseEntity.ok(SageSyncScheduleResponse.fromEntity(created));
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<SageSyncScheduleResponse> updateSchedule(
            @PathVariable String id,
            @RequestBody SageSyncScheduleRequest request) {
        SageSyncSchedule updated = scheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(SageSyncScheduleResponse.fromEntity(updated));
    }

    @PostMapping("/schedules/{id}/run")
    public ResponseEntity<SageSyncLogResponse> runScheduleNow(@PathVariable String id) {
        SageSyncLog log = syncEngine.executeSyncJob(id);
        return ResponseEntity.ok(SageSyncLogResponse.fromEntity(log));
    }

    // ==================== Log Endpoints ====================

    @GetMapping("/logs")
    public ResponseEntity<List<SageSyncLogResponse>> getAllLogs() {
        List<SageSyncLog> logs = syncEngine.getAllLogs();
        List<SageSyncLogResponse> response = logs.stream()
                .map(SageSyncLogResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs/{connectorId}")
    public ResponseEntity<List<SageSyncLogResponse>> getLogsByConnector(
            @PathVariable String connectorId) {
        List<SageSyncLog> logs = syncEngine.getLogsByConnector(connectorId);
        List<SageSyncLogResponse> response = logs.stream()
                .map(SageSyncLogResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
