package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageSyncLog;
import com.arthmatic.shumelahire.entity.integration.SageSyncEntityType;
import com.arthmatic.shumelahire.entity.integration.SyncDirection;
import com.arthmatic.shumelahire.entity.integration.SyncStatus;
import com.arthmatic.shumelahire.entity.integration.SageSyncSchedule;
import com.arthmatic.shumelahire.repository.SageSyncLogDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SageSyncLogItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSageSyncLogRepository extends DynamoRepository<SageSyncLogItem, SageSyncLog>
        implements SageSyncLogDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSageSyncLogRepository(DynamoDbClient dynamoDbClient,
                                        DynamoDbEnhancedClient enhancedClient,
                                        String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SageSyncLogItem.class);
    }

    @Override
    protected String entityType() {
        return "SAGE_LOG";
    }

    @Override
    public List<SageSyncLog> findByConnectorIdOrderByStartedAtDesc(String connectorId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "SAGE_LOG_CONN#" + tenantId + "#" + connectorId).stream()
                .sorted(Comparator.comparing(SageSyncLog::getStartedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<SageSyncLog> findByStatusOrderByStartedAtDesc(SyncStatus status) {
        return findAll().stream()
                .filter(e -> e.getStatus() == status)
                .sorted(Comparator.comparing(SageSyncLog::getStartedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    protected SageSyncLog toEntity(SageSyncLogItem item) {
        var e = new SageSyncLog();
        if (item.getId() != null) {
            try {
                e.setId(Long.parseLong(item.getId()));
            } catch (NumberFormatException ex) {
                // skip invalid ID
            }
        }
        e.setTenantId(item.getTenantId());

        // Create schedule stub
        if (item.getScheduleId() != null) {
            var schedule = new SageSyncSchedule();
            try {
                schedule.setId(Long.parseLong(item.getScheduleId()));
            } catch (NumberFormatException ex) {
                // skip invalid schedule ID
            }
            e.setSchedule(schedule);
        }

        // Create connector stub
        if (item.getConnectorId() != null) {
            var connector = new SageConnectorConfig();
            try {
                connector.setId(Long.parseLong(item.getConnectorId()));
            } catch (NumberFormatException ex) {
                // skip invalid connector ID
            }
            e.setConnector(connector);
        }

        if (item.getEntityType() != null) {
            e.setEntityType(SageSyncEntityType.valueOf(item.getEntityType()));
        }
        if (item.getDirection() != null) {
            e.setDirection(SyncDirection.valueOf(item.getDirection()));
        }
        if (item.getStatus() != null) {
            e.setStatus(SyncStatus.valueOf(item.getStatus()));
        }
        e.setRecordsProcessed(item.getRecordsProcessed());
        e.setRecordsSucceeded(item.getRecordsSucceeded());
        e.setRecordsFailed(item.getRecordsFailed());
        e.setErrorMessage(item.getErrorMessage());
        if (item.getStartedAt() != null) {
            e.setStartedAt(LocalDateTime.parse(item.getStartedAt(), ISO_FMT));
        }
        if (item.getCompletedAt() != null) {
            e.setCompletedAt(LocalDateTime.parse(item.getCompletedAt(), ISO_FMT));
        }
        return e;
    }

    @Override
    protected SageSyncLogItem toItem(SageSyncLog entity) {
        var item = new SageSyncLogItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String connectorId = entity.getConnector() != null && entity.getConnector().getId() != null
                ? entity.getConnector().getId().toString()
                : "";
        String scheduleId = entity.getSchedule() != null && entity.getSchedule().getId() != null
                ? entity.getSchedule().getId().toString()
                : null;

        item.setPk("TENANT#" + tenantId);
        item.setSk("SAGE_LOG#" + id);
        item.setGsi1pk("SAGE_LOG_CONN#" + tenantId + "#" + connectorId);
        item.setGsi1sk("SAGE_LOG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setScheduleId(scheduleId);
        item.setConnectorId(connectorId);
        if (entity.getEntityType() != null) {
            item.setEntityType(entity.getEntityType().name());
        }
        if (entity.getDirection() != null) {
            item.setDirection(entity.getDirection().name());
        }
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        item.setRecordsProcessed(entity.getRecordsProcessed());
        item.setRecordsSucceeded(entity.getRecordsSucceeded());
        item.setRecordsFailed(entity.getRecordsFailed());
        item.setErrorMessage(entity.getErrorMessage());
        if (entity.getStartedAt() != null) {
            item.setStartedAt(entity.getStartedAt().format(ISO_FMT));
        }
        if (entity.getCompletedAt() != null) {
            item.setCompletedAt(entity.getCompletedAt().format(ISO_FMT));
        }
        return item;
    }
}
