package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.integration.LmsConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.LmsSyncLog;
import com.arthmatic.shumelahire.entity.integration.LmsSyncType;
import com.arthmatic.shumelahire.entity.integration.LmsSyncStatus;
import com.arthmatic.shumelahire.repository.LmsSyncLogDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LmsSyncLogItem;

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
public class DynamoLmsSyncLogRepository extends DynamoRepository<LmsSyncLogItem, LmsSyncLog>
        implements LmsSyncLogDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoLmsSyncLogRepository(DynamoDbClient dynamoDbClient,
                                       DynamoDbEnhancedClient enhancedClient,
                                       String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, LmsSyncLogItem.class);
    }

    @Override
    protected String entityType() {
        return "LMS_LOG";
    }

    @Override
    public List<LmsSyncLog> findByConnectorIdOrderByStartedAtDesc(String connectorId) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "LMS_LOG_CONN#" + tenantId + "#" + connectorId).stream()
                .sorted(Comparator.comparing(LmsSyncLog::getStartedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<LmsSyncLog> findByTenantIdOrderByStartedAtDesc(String tenantId) {
        return findAll().stream()
                .sorted(Comparator.comparing(LmsSyncLog::getStartedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    protected LmsSyncLog toEntity(LmsSyncLogItem item) {
        var e = new LmsSyncLog();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());

        // Create connector stub
        if (item.getConnectorId() != null) {
            var connector = new LmsConnectorConfig();
            connector.setId(item.getConnectorId());
            e.setConnector(connector);
        }

        if (item.getSyncType() != null) {
            e.setSyncType(LmsSyncType.valueOf(item.getSyncType()));
        }
        if (item.getStatus() != null) {
            e.setStatus(LmsSyncStatus.valueOf(item.getStatus()));
        }
        e.setRecordsSynced(item.getRecordsSynced());
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
    protected LmsSyncLogItem toItem(LmsSyncLog entity) {
        var item = new LmsSyncLogItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String connectorId = entity.getConnector() != null && entity.getConnector().getId() != null
                ? entity.getConnector().getId()
                : "";

        item.setPk("TENANT#" + tenantId);
        item.setSk("LMS_LOG#" + id);
        item.setGsi1pk("LMS_LOG_CONN#" + tenantId + "#" + connectorId);
        item.setGsi1sk("LMS_LOG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setConnectorId(connectorId);
        if (entity.getSyncType() != null) {
            item.setSyncType(entity.getSyncType().name());
        }
        if (entity.getStatus() != null) {
            item.setStatus(entity.getStatus().name());
        }
        item.setRecordsSynced(entity.getRecordsSynced());
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
