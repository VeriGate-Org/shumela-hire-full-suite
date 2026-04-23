package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.integration.LmsConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.LmsProviderType;
import com.arthmatic.shumelahire.repository.LmsConnectorConfigDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.LmsConnectorConfigItem;

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
public class DynamoLmsConnectorConfigRepository extends DynamoRepository<LmsConnectorConfigItem, LmsConnectorConfig>
        implements LmsConnectorConfigDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoLmsConnectorConfigRepository(DynamoDbClient dynamoDbClient,
                                               DynamoDbEnhancedClient enhancedClient,
                                               String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, LmsConnectorConfigItem.class);
    }

    @Override
    protected String entityType() {
        return "LMS_CONFIG";
    }

    @Override
    public List<LmsConnectorConfig> findByTenantIdOrderByCreatedAtDesc(String tenantId) {
        return findAll().stream()
                .sorted(Comparator.comparing(LmsConnectorConfig::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    @Override
    public List<LmsConnectorConfig> findByTenantIdAndIsActiveOrderByNameAsc(String tenantId, Boolean isActive) {
        return findAll().stream()
                .filter(e -> isActive.equals(e.getIsActive()))
                .sorted(Comparator.comparing(LmsConnectorConfig::getName, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    @Override
    protected LmsConnectorConfig toEntity(LmsConnectorConfigItem item) {
        var e = new LmsConnectorConfig();
        if (item.getId() != null) {
            e.setId(item.getId());
        }
        e.setTenantId(item.getTenantId());
        e.setName(item.getName());
        if (item.getProviderType() != null) {
            e.setProviderType(LmsProviderType.valueOf(item.getProviderType()));
        }
        e.setBaseUrl(item.getBaseUrl());
        e.setApiKey(item.getApiKey());
        e.setIsActive(item.getIsActive());
        if (item.getLastSyncedAt() != null) {
            e.setLastSyncedAt(LocalDateTime.parse(item.getLastSyncedAt(), ISO_FMT));
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
    protected LmsConnectorConfigItem toItem(LmsConnectorConfig entity) {
        var item = new LmsConnectorConfigItem();
        String id = entity.getId() != null ? entity.getId() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("LMS_CONFIG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        if (entity.getProviderType() != null) {
            item.setProviderType(entity.getProviderType().name());
        }
        item.setBaseUrl(entity.getBaseUrl());
        item.setApiKey(entity.getApiKey());
        item.setIsActive(entity.getIsActive());
        if (entity.getLastSyncedAt() != null) {
            item.setLastSyncedAt(entity.getLastSyncedAt().format(ISO_FMT));
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
