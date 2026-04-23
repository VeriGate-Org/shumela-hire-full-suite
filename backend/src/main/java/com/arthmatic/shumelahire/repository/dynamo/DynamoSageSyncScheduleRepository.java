package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageSyncSchedule;
import com.arthmatic.shumelahire.entity.integration.SageSyncEntityType;
import com.arthmatic.shumelahire.entity.integration.SyncDirection;
import com.arthmatic.shumelahire.entity.integration.SyncFrequency;
import com.arthmatic.shumelahire.repository.SageSyncScheduleDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SageSyncScheduleItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSageSyncScheduleRepository extends DynamoRepository<SageSyncScheduleItem, SageSyncSchedule>
        implements SageSyncScheduleDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSageSyncScheduleRepository(DynamoDbClient dynamoDbClient,
                                             DynamoDbEnhancedClient enhancedClient,
                                             String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SageSyncScheduleItem.class);
    }

    @Override
    protected String entityType() {
        return "SAGE_SCHEDULE";
    }

    @Override
    public List<SageSyncSchedule> findByConnectorId(String connectorId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "SAGE_SCHED_CONN#" + tenantId + "#" + connectorId);
    }

    @Override
    public List<SageSyncSchedule> findByIsActiveTrueAndNextRunAtBefore(LocalDateTime dateTime) {
        return findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsActive())
                        && e.getNextRunAt() != null
                        && e.getNextRunAt().isBefore(dateTime))
                .collect(Collectors.toList());
    }

    @Override
    protected SageSyncSchedule toEntity(SageSyncScheduleItem item) {
        var e = new SageSyncSchedule();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());

        // Create connector stub
        if (item.getConnectorId() != null) {
            var connector = new SageConnectorConfig();
            connector.setId(item.getConnectorId());
            e.setConnector(connector);
        }

        if (item.getEntityType() != null) {
            e.setEntityType(SageSyncEntityType.valueOf(item.getEntityType()));
        }
        if (item.getDirection() != null) {
            e.setDirection(SyncDirection.valueOf(item.getDirection()));
        }
        if (item.getFrequency() != null) {
            e.setFrequency(SyncFrequency.valueOf(item.getFrequency()));
        }
        e.setCronExpression(item.getCronExpression());
        e.setIsActive(item.getIsActive());
        if (item.getLastRunAt() != null) {
            e.setLastRunAt(LocalDateTime.parse(item.getLastRunAt(), ISO_FMT));
        }
        if (item.getNextRunAt() != null) {
            e.setNextRunAt(LocalDateTime.parse(item.getNextRunAt(), ISO_FMT));
        }
        if (item.getCreatedAt() != null) {
            e.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            e.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return e;
    }

    @Override
    protected SageSyncScheduleItem toItem(SageSyncSchedule entity) {
        var item = new SageSyncScheduleItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String connectorId = entity.getConnector() != null && entity.getConnector().getId() != null
                ? entity.getConnector().getId()
                : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("SAGE_SCHEDULE#" + id);
        item.setGsi1pk("SAGE_SCHED_CONN#" + tenantId + "#" + connectorId);
        item.setGsi1sk("SAGE_SCHEDULE#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setConnectorId(connectorId);
        if (entity.getEntityType() != null) {
            item.setEntityType(entity.getEntityType().name());
        }
        if (entity.getDirection() != null) {
            item.setDirection(entity.getDirection().name());
        }
        if (entity.getFrequency() != null) {
            item.setFrequency(entity.getFrequency().name());
        }
        item.setCronExpression(entity.getCronExpression());
        item.setIsActive(entity.getIsActive());
        if (entity.getLastRunAt() != null) {
            item.setLastRunAt(entity.getLastRunAt().format(ISO_FMT));
        }
        if (entity.getNextRunAt() != null) {
            item.setNextRunAt(entity.getNextRunAt().format(ISO_FMT));
        }
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        return item;
    }
}
