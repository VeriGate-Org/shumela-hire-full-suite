package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageConnectorType;
import com.arthmatic.shumelahire.entity.integration.SageAuthMethod;
import com.arthmatic.shumelahire.repository.SageConnectorConfigDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.SageConnectorConfigItem;

import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class DynamoSageConnectorConfigRepository extends DynamoRepository<SageConnectorConfigItem, SageConnectorConfig>
        implements SageConnectorConfigDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoSageConnectorConfigRepository(DynamoDbClient dynamoDbClient,
                                                DynamoDbEnhancedClient enhancedClient,
                                                String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, SageConnectorConfigItem.class);
    }

    @Override
    protected String entityType() {
        return "SAGE_CONFIG";
    }

    @Override
    public List<SageConnectorConfig> findByIsActiveTrue() {
        return findAll().stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsActive()))
                .collect(Collectors.toList());
    }

    @Override
    public List<SageConnectorConfig> findByConnectorType(SageConnectorType connectorType) {
        String tenantId = currentTenantId();
        return queryGsiAll("GSI1", "SAGE_TYPE#" + tenantId + "#" + connectorType.name());
    }

    @Override
    protected SageConnectorConfig toEntity(SageConnectorConfigItem item) {
        var e = new SageConnectorConfig();
        if (item.getId() != null) {
            e.setId(safeParseLong(item.getId()));
        }
        e.setTenantId(item.getTenantId());
        e.setName(item.getName());
        if (item.getConnectorType() != null) {
            e.setConnectorType(SageConnectorType.valueOf(item.getConnectorType()));
        }
        if (item.getAuthMethod() != null) {
            e.setAuthMethod(SageAuthMethod.valueOf(item.getAuthMethod()));
        }
        e.setBaseUrl(item.getBaseUrl());
        e.setCredentials(item.getCredentials());
        e.setIsActive(item.getIsActive());
        if (item.getLastTestedAt() != null) {
            e.setLastTestedAt(LocalDateTime.parse(item.getLastTestedAt(), ISO_FMT));
        }
        e.setLastTestSuccess(item.getLastTestSuccess());
        if (item.getCreatedAt() != null) {
            e.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            e.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return e;
    }

    @Override
    protected SageConnectorConfigItem toItem(SageConnectorConfig entity) {
        var item = new SageConnectorConfigItem();
        String id = entity.getId() != null ? entity.getId().toString() : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("SAGE_CONFIG#" + id);
        item.setGsi1pk("SAGE_TYPE#" + tenantId + "#" + (entity.getConnectorType() != null ? entity.getConnectorType().name() : ""));
        item.setGsi1sk("SAGE_CONFIG#" + id);

        item.setId(id);
        item.setTenantId(tenantId);
        item.setName(entity.getName());
        if (entity.getConnectorType() != null) {
            item.setConnectorType(entity.getConnectorType().name());
        }
        if (entity.getAuthMethod() != null) {
            item.setAuthMethod(entity.getAuthMethod().name());
        }
        item.setBaseUrl(entity.getBaseUrl());
        item.setCredentials(entity.getCredentials());
        item.setIsActive(entity.getIsActive());
        if (entity.getLastTestedAt() != null) {
            item.setLastTestedAt(entity.getLastTestedAt().format(ISO_FMT));
        }
        item.setLastTestSuccess(entity.getLastTestSuccess());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        return item;
    }
}
