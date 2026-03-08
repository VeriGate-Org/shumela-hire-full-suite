package com.arthmatic.shumelahire.service.integration.sage;

import com.arthmatic.shumelahire.dto.integration.SageSyncScheduleRequest;
import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageSyncSchedule;
import com.arthmatic.shumelahire.entity.integration.SyncFrequency;
import com.arthmatic.shumelahire.repository.integration.SageConnectorConfigRepository;
import com.arthmatic.shumelahire.repository.integration.SageSyncScheduleRepository;
import com.arthmatic.shumelahire.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class SageSyncScheduleService {

    private static final Logger logger = LoggerFactory.getLogger(SageSyncScheduleService.class);

    @Autowired
    private SageSyncScheduleRepository scheduleRepository;

    @Autowired
    private SageConnectorConfigRepository connectorConfigRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<SageSyncSchedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public SageSyncSchedule getScheduleById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sage sync schedule not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<SageSyncSchedule> getSchedulesByConnector(Long connectorId) {
        return scheduleRepository.findByConnectorId(connectorId);
    }

    @Transactional(readOnly = true)
    public List<SageSyncSchedule> getDueSchedules() {
        return scheduleRepository.findByIsActiveTrueAndNextRunAtBefore(LocalDateTime.now());
    }

    public SageSyncSchedule createSchedule(SageSyncScheduleRequest request) {
        SageConnectorConfig connector = connectorConfigRepository.findById(request.getConnectorId())
                .orElseThrow(() -> new RuntimeException("Sage connector config not found with id: " + request.getConnectorId()));

        SageSyncSchedule schedule = new SageSyncSchedule();
        schedule.setConnector(connector);
        schedule.setEntityType(request.getEntityType());
        schedule.setDirection(request.getDirection());
        schedule.setFrequency(request.getFrequency());
        schedule.setCronExpression(request.getCronExpression());
        schedule.setIsActive(true);
        schedule.setNextRunAt(calculateNextRunAt(request.getFrequency()));

        SageSyncSchedule saved = scheduleRepository.save(schedule);
        auditLogService.logSystemAction("CREATE", "SAGE_SYNC_SCHEDULE",
                "Created sync schedule: " + saved.getEntityType() + " " + saved.getDirection()
                        + " for connector " + connector.getName() + " (id=" + saved.getId() + ")");
        logger.info("Created Sage sync schedule: {} {} for connector {} (id={})",
                saved.getEntityType(), saved.getDirection(), connector.getName(), saved.getId());
        return saved;
    }

    public SageSyncSchedule updateSchedule(Long id, SageSyncScheduleRequest request) {
        SageSyncSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sage sync schedule not found with id: " + id));

        if (request.getConnectorId() != null) {
            SageConnectorConfig connector = connectorConfigRepository.findById(request.getConnectorId())
                    .orElseThrow(() -> new RuntimeException("Sage connector config not found with id: " + request.getConnectorId()));
            schedule.setConnector(connector);
        }

        if (request.getEntityType() != null) {
            schedule.setEntityType(request.getEntityType());
        }
        if (request.getDirection() != null) {
            schedule.setDirection(request.getDirection());
        }
        if (request.getFrequency() != null) {
            schedule.setFrequency(request.getFrequency());
            schedule.setNextRunAt(calculateNextRunAt(request.getFrequency()));
        }
        if (request.getCronExpression() != null) {
            schedule.setCronExpression(request.getCronExpression());
        }

        SageSyncSchedule saved = scheduleRepository.save(schedule);
        auditLogService.logSystemAction("UPDATE", "SAGE_SYNC_SCHEDULE",
                "Updated sync schedule: " + saved.getEntityType() + " " + saved.getDirection() + " (id=" + saved.getId() + ")");
        logger.info("Updated Sage sync schedule (id={})", saved.getId());
        return saved;
    }

    public void deleteSchedule(Long id) {
        SageSyncSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sage sync schedule not found with id: " + id));

        scheduleRepository.delete(schedule);
        auditLogService.logSystemAction("DELETE", "SAGE_SYNC_SCHEDULE",
                "Deleted sync schedule (id=" + id + ")");
        logger.info("Deleted Sage sync schedule (id={})", id);
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
