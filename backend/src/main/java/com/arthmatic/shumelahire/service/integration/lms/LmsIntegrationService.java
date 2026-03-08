package com.arthmatic.shumelahire.service.integration.lms;

import com.arthmatic.shumelahire.config.tenant.TenantContext;
import com.arthmatic.shumelahire.entity.integration.*;
import com.arthmatic.shumelahire.repository.integration.LmsConnectorConfigRepository;
import com.arthmatic.shumelahire.repository.integration.LmsSyncLogRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class LmsIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(LmsIntegrationService.class);

    @Autowired
    private LmsConnectorConfigRepository connectorConfigRepository;

    @Autowired
    private LmsSyncLogRepository syncLogRepository;

    @Autowired
    private LmsConnector lmsConnector;

    @Autowired
    private AuditLogService auditLogService;

    // ==================== Connector Management ====================

    @Transactional(readOnly = true)
    public List<LmsConnectorConfig> getAllConnectors() {
        String tenantId = TenantContext.requireCurrentTenant();
        return connectorConfigRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public LmsConnectorConfig getConnectorById(Long id) {
        return connectorConfigRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LMS connector not found: " + id));
    }

    public LmsConnectorConfig createConnector(Map<String, Object> request) {
        logger.info("Creating LMS connector: {}", request.get("name"));

        LmsConnectorConfig config = new LmsConnectorConfig();
        config.setName((String) request.get("name"));
        config.setProviderType(LmsProviderType.valueOf((String) request.get("providerType")));
        config.setBaseUrl((String) request.get("baseUrl"));
        config.setApiKey((String) request.get("apiKey"));
        config.setIsActive(request.get("isActive") != null ? (Boolean) request.get("isActive") : false);

        LmsConnectorConfig saved = connectorConfigRepository.save(config);

        auditLogService.logSystemAction("CREATE", "LMS_CONNECTOR",
                "Created LMS connector: " + config.getName() + " (" + config.getProviderType() + ")");

        return saved;
    }

    public LmsConnectorConfig updateConnector(Long id, Map<String, Object> request) {
        LmsConnectorConfig config = getConnectorById(id);

        if (request.containsKey("name")) config.setName((String) request.get("name"));
        if (request.containsKey("providerType")) config.setProviderType(LmsProviderType.valueOf((String) request.get("providerType")));
        if (request.containsKey("baseUrl")) config.setBaseUrl((String) request.get("baseUrl"));
        if (request.containsKey("apiKey")) config.setApiKey((String) request.get("apiKey"));
        if (request.containsKey("isActive")) config.setIsActive((Boolean) request.get("isActive"));

        LmsConnectorConfig saved = connectorConfigRepository.save(config);

        auditLogService.logSystemAction("UPDATE", "LMS_CONNECTOR",
                "Updated LMS connector: " + config.getName());

        return saved;
    }

    public void deleteConnector(Long id) {
        LmsConnectorConfig config = getConnectorById(id);
        connectorConfigRepository.delete(config);

        auditLogService.logSystemAction("DELETE", "LMS_CONNECTOR",
                "Deleted LMS connector: " + config.getName());
    }

    public Map<String, Object> testConnection(Long connectorId) {
        LmsConnectorConfig config = getConnectorById(connectorId);
        logger.info("Testing LMS connection for connector: {}", config.getName());

        boolean success = lmsConnector.testConnection(config.getBaseUrl(), config.getApiKey());

        auditLogService.logSystemAction("TEST", "LMS_CONNECTOR",
                "Connection test " + (success ? "succeeded" : "failed") + " for: " + config.getName());

        return Map.of(
                "connectorId", connectorId,
                "connectorName", config.getName(),
                "success", success,
                "testedAt", LocalDateTime.now().toString(),
                "message", success ? "Connection successful" : "Connection failed. Please verify URL and API key."
        );
    }

    // ==================== Sync Operations ====================

    public LmsSyncLog triggerSync(Long connectorId, String syncTypeStr) {
        LmsConnectorConfig config = getConnectorById(connectorId);
        LmsSyncType syncType = LmsSyncType.valueOf(syncTypeStr.toUpperCase());

        logger.info("Triggering {} sync for connector: {}", syncType, config.getName());

        // Create sync log entry
        LmsSyncLog syncLog = new LmsSyncLog();
        syncLog.setConnector(config);
        syncLog.setSyncType(syncType);
        syncLog.setStatus(LmsSyncStatus.RUNNING);
        syncLog.setStartedAt(LocalDateTime.now());
        syncLog = syncLogRepository.save(syncLog);

        try {
            int recordsSynced = 0;

            switch (syncType) {
                case COURSES:
                    List<Map<String, Object>> courses = lmsConnector.syncCourses(config.getBaseUrl(), config.getApiKey());
                    recordsSynced = courses.size();
                    break;
                case ENROLLMENTS:
                case COMPLETIONS:
                    List<Map<String, Object>> enrollments = lmsConnector.syncEnrollments(config.getBaseUrl(), config.getApiKey());
                    recordsSynced = enrollments.size();
                    break;
            }

            syncLog.setStatus(LmsSyncStatus.COMPLETED);
            syncLog.setRecordsSynced(recordsSynced);
            syncLog.setCompletedAt(LocalDateTime.now());

            // Update last synced timestamp on connector
            config.setLastSyncedAt(LocalDateTime.now());
            connectorConfigRepository.save(config);

            auditLogService.logSystemAction("SYNC", "LMS_CONNECTOR",
                    syncType + " sync completed for " + config.getName() + ": " + recordsSynced + " records");

        } catch (Exception e) {
            logger.error("LMS sync failed for connector: {}", config.getName(), e);
            syncLog.setStatus(LmsSyncStatus.FAILED);
            syncLog.setErrorMessage(e.getMessage());
            syncLog.setCompletedAt(LocalDateTime.now());

            auditLogService.logSystemAction("SYNC_FAILED", "LMS_CONNECTOR",
                    syncType + " sync failed for " + config.getName() + ": " + e.getMessage());
        }

        return syncLogRepository.save(syncLog);
    }

    // ==================== Sync Logs ====================

    @Transactional(readOnly = true)
    public Page<LmsSyncLog> getSyncLogs(int page, int size) {
        String tenantId = TenantContext.requireCurrentTenant();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));
        return syncLogRepository.findByTenantIdOrderByStartedAtDesc(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<LmsSyncLog> getSyncLogsByConnector(Long connectorId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startedAt"));
        return syncLogRepository.findByConnectorIdOrderByStartedAtDesc(connectorId, pageable);
    }
}
