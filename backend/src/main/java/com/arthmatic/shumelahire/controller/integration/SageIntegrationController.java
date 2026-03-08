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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    public ResponseEntity<SageConnectorConfigResponse> getConnector(@PathVariable Long id) {
        SageConnectorConfig config = connectorService.getConnectorById(id);
        return ResponseEntity.ok(SageConnectorConfigResponse.fromEntity(config));
    }

    @PutMapping("/connectors/{id}")
    public ResponseEntity<SageConnectorConfigResponse> updateConnector(
            @PathVariable Long id,
            @RequestBody SageConnectorConfigRequest request) {
        SageConnectorConfig updated = connectorService.updateConnector(id, request);
        return ResponseEntity.ok(SageConnectorConfigResponse.fromEntity(updated));
    }

    @DeleteMapping("/connectors/{id}")
    public ResponseEntity<Map<String, String>> deleteConnector(@PathVariable Long id) {
        connectorService.deleteConnector(id);
        return ResponseEntity.ok(Map.of("message", "Connector deleted successfully"));
    }

    @PostMapping("/connectors/{id}/test")
    public ResponseEntity<SageConnectionTestResult> testConnection(@PathVariable Long id) {
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
            @PathVariable Long id,
            @RequestBody SageSyncScheduleRequest request) {
        SageSyncSchedule updated = scheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(SageSyncScheduleResponse.fromEntity(updated));
    }

    @PostMapping("/schedules/{id}/run")
    public ResponseEntity<SageSyncLogResponse> runScheduleNow(@PathVariable Long id) {
        SageSyncLog log = syncEngine.executeSyncJob(id);
        return ResponseEntity.ok(SageSyncLogResponse.fromEntity(log));
    }

    // ==================== Log Endpoints ====================

    @GetMapping("/logs")
    public ResponseEntity<Page<SageSyncLogResponse>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));
        Page<SageSyncLog> logs = syncEngine.getAllLogs(pageable);
        Page<SageSyncLogResponse> response = logs.map(SageSyncLogResponse::fromEntity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/logs/{connectorId}")
    public ResponseEntity<Page<SageSyncLogResponse>> getLogsByConnector(
            @PathVariable Long connectorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SageSyncLog> logs = syncEngine.getLogsByConnector(connectorId, pageable);
        Page<SageSyncLogResponse> response = logs.map(SageSyncLogResponse::fromEntity);
        return ResponseEntity.ok(response);
    }
}
