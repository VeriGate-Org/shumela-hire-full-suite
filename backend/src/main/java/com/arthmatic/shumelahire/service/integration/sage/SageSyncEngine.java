package com.arthmatic.shumelahire.service.integration.sage;

import com.arthmatic.shumelahire.entity.integration.*;
import com.arthmatic.shumelahire.repository.SageConnectorConfigDataRepository;
import com.arthmatic.shumelahire.repository.SageSyncLogDataRepository;
import com.arthmatic.shumelahire.repository.SageSyncScheduleDataRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SageSyncEngine {

    private static final Logger logger = LoggerFactory.getLogger(SageSyncEngine.class);

    @Autowired
    private SageSyncScheduleDataRepository scheduleRepository;

    @Autowired
    private SageSyncLogDataRepository syncLogRepository;

    @Autowired
    private SageConnectorConfigDataRepository connectorConfigRepository;

    @Autowired
    private SageConnectorService connectorService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Execute a sync job for a given schedule.
     * Creates a log entry, calls the appropriate connector, and updates the log with results.
     */
    public SageSyncLog executeSyncJob(String scheduleId) {
        SageSyncSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Sage sync schedule not found with id: " + scheduleId));

        SageConnectorConfig connectorConfig = schedule.getConnector();
        SageConnector connector = connectorService.resolveConnector(connectorConfig.getConnectorType());

        // Create log entry
        SageSyncLog log = new SageSyncLog();
        log.setSchedule(schedule);
        log.setConnector(connectorConfig);
        log.setEntityType(schedule.getEntityType());
        log.setDirection(schedule.getDirection());
        log.setStatus(SyncStatus.RUNNING);
        log = syncLogRepository.save(log);

        if (connector == null) {
            log.setStatus(SyncStatus.FAILED);
            log.setErrorMessage("No connector implementation available for type: " + connectorConfig.getConnectorType());
            log.setCompletedAt(LocalDateTime.now());
            syncLogRepository.save(log);

            logger.error("Sync job failed for schedule {}: no connector for type {}",
                    scheduleId, connectorConfig.getConnectorType());
            return log;
        }

        try {
            switch (schedule.getDirection()) {
                case IMPORT:
                    executeImport(log, connector, schedule, connectorConfig);
                    break;
                case EXPORT:
                    executeExport(log, connector, schedule, connectorConfig);
                    break;
                case BIDIRECTIONAL:
                    executeImport(log, connector, schedule, connectorConfig);
                    executeExport(log, connector, schedule, connectorConfig);
                    break;
            }

            log.setStatus(SyncStatus.COMPLETED);
            log.setCompletedAt(LocalDateTime.now());

            // Update schedule last run and next run
            schedule.setLastRunAt(LocalDateTime.now());
            schedule.setNextRunAt(calculateNextRunAt(schedule.getFrequency()));
            scheduleRepository.save(schedule);

            auditLogService.logSystemAction("SYNC_COMPLETED", "SAGE_SYNC",
                    "Sync completed for schedule " + scheduleId
                            + ": processed=" + log.getRecordsProcessed()
                            + ", succeeded=" + log.getRecordsSucceeded()
                            + ", failed=" + log.getRecordsFailed());

            logger.info("Sync job completed for schedule {}: processed={}, succeeded={}, failed={}",
                    scheduleId, log.getRecordsProcessed(), log.getRecordsSucceeded(), log.getRecordsFailed());

        } catch (Exception e) {
            log.setStatus(SyncStatus.FAILED);
            log.setErrorMessage(e.getMessage());
            log.setCompletedAt(LocalDateTime.now());

            auditLogService.logSystemAction("SYNC_FAILED", "SAGE_SYNC",
                    "Sync failed for schedule " + scheduleId + ": " + e.getMessage());

            logger.error("Sync job failed for schedule {}: {}", scheduleId, e.getMessage(), e);
        }

        return syncLogRepository.save(log);
    }

    /**
     * Scheduled task to check for due schedules and execute them.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedRate = 300000)
    public void checkAndExecuteDueSchedules() {
        try {
            List<SageSyncSchedule> dueSchedules = scheduleRepository
                    .findByIsActiveTrueAndNextRunAtBefore(LocalDateTime.now());

            if (dueSchedules.isEmpty()) {
                logger.debug("No due Sage sync schedules found");
                return;
            }

            logger.info("Found {} due Sage sync schedules to execute", dueSchedules.size());

            for (SageSyncSchedule schedule : dueSchedules) {
                try {
                    executeSyncJob(schedule.getId());
                } catch (Exception e) {
                    logger.error("Error executing scheduled sync job for schedule {}: {}",
                            schedule.getId(), e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            logger.error("Error checking for due sync schedules: {}", e.getMessage(), e);
        }
    }

    /**
     * Get all sync logs.
     */
    @Transactional(readOnly = true)
    public List<SageSyncLog> getAllLogs() {
        return syncLogRepository.findAll();
    }

    /**
     * Get sync logs for a specific connector.
     */
    @Transactional(readOnly = true)
    public List<SageSyncLog> getLogsByConnector(String connectorId) {
        return syncLogRepository.findByConnectorIdOrderByStartedAtDesc(connectorId);
    }

    /**
     * Import entities from Sage.
     */
    private void executeImport(SageSyncLog log, SageConnector connector,
                               SageSyncSchedule schedule, SageConnectorConfig config) {
        List<Map<String, Object>> fetchedData = connector.fetchEntities(
                schedule.getEntityType(), config.getBaseUrl(), config.getCredentials());

        int processed = fetchedData.size();
        int succeeded = processed; // In mock, all succeed
        int failed = 0;

        log.setRecordsProcessed((log.getRecordsProcessed() != null ? log.getRecordsProcessed() : 0) + processed);
        log.setRecordsSucceeded((log.getRecordsSucceeded() != null ? log.getRecordsSucceeded() : 0) + succeeded);
        log.setRecordsFailed((log.getRecordsFailed() != null ? log.getRecordsFailed() : 0) + failed);

        logger.info("Import from Sage: fetched {} {} records (succeeded={}, failed={})",
                processed, schedule.getEntityType(), succeeded, failed);
    }

    /**
     * Export entities to Sage.
     */
    private void executeExport(SageSyncLog log, SageConnector connector,
                               SageSyncSchedule schedule, SageConnectorConfig config) {
        // In a real implementation, this would query local data and push to Sage.
        // For the mock, we create sample data to push.
        List<Map<String, Object>> dataToExport = List.of(
                Map.of("id", "LOCAL-001", "type", schedule.getEntityType().name(), "action", "CREATE"),
                Map.of("id", "LOCAL-002", "type", schedule.getEntityType().name(), "action", "UPDATE")
        );

        int pushed = connector.pushEntities(
                schedule.getEntityType(), dataToExport, config.getBaseUrl(), config.getCredentials());

        int processed = dataToExport.size();
        int failed = processed - pushed;

        log.setRecordsProcessed((log.getRecordsProcessed() != null ? log.getRecordsProcessed() : 0) + processed);
        log.setRecordsSucceeded((log.getRecordsSucceeded() != null ? log.getRecordsSucceeded() : 0) + pushed);
        log.setRecordsFailed((log.getRecordsFailed() != null ? log.getRecordsFailed() : 0) + failed);

        logger.info("Export to Sage: pushed {}/{} {} records",
                pushed, processed, schedule.getEntityType());
    }

    /**
     * Calculate the next run time based on the sync frequency.
     */
    private LocalDateTime calculateNextRunAt(SyncFrequency frequency) {
        LocalDateTime now = LocalDateTime.now();
        switch (frequency) {
            case REALTIME:
                return now.plusMinutes(1);
            case HOURLY:
                return now.plusHours(1);
            case DAILY:
                return now.plusDays(1).withHour(2).withMinute(0).withSecond(0);
            case WEEKLY:
                return now.plusWeeks(1).withHour(2).withMinute(0).withSecond(0);
            case MONTHLY:
                return now.plusMonths(1).withDayOfMonth(1).withHour(2).withMinute(0).withSecond(0);
            case MANUAL:
                return null;
            default:
                return now.plusDays(1);
        }
    }
}
