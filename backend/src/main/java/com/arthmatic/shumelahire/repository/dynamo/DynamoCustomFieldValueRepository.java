package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import com.arthmatic.shumelahire.entity.CustomFieldValue;
import com.arthmatic.shumelahire.repository.CustomFieldValueDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.CustomFieldValueItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class DynamoCustomFieldValueRepository extends DynamoRepository<CustomFieldValueItem, CustomFieldValue>
        implements CustomFieldValueDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoCustomFieldValueRepository(DynamoDbClient dynamoDbClient,
                                             DynamoDbEnhancedClient enhancedClient,
                                             @org.springframework.beans.factory.annotation.Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, CustomFieldValueItem.class);
    }

    @Override
    protected String entityType() {
        return "CF_VALUE";
    }

    @Override
    public List<CustomFieldValue> findByEntityIdAndEntityType(Long entityId, CustomFieldEntityType entityType) {
        String gsi2pk = "CFV_ENTITY#" + entityType.name() + "#" + entityId;
        return queryGsiAll("GSI2", gsi2pk);
    }

    @Override
    public Optional<CustomFieldValue> findByCustomFieldIdAndEntityIdAndEntityType(
            Long customFieldId, Long entityId, CustomFieldEntityType entityType) {
        String gsi2pk = "CFV_ENTITY#" + entityType.name() + "#" + entityId;
        String skPrefix = "CF_VALUE#" + customFieldId;
        return queryGsiAll("GSI2", gsi2pk).stream()
                .filter(v -> v.getCustomField() != null &&
                        v.getCustomField().getId().equals(customFieldId))
                .findFirst();
    }

    @Override
    public void deleteByEntityIdAndEntityType(Long entityId, CustomFieldEntityType entityType) {
        List<CustomFieldValue> values = findByEntityIdAndEntityType(entityId, entityType);
        for (CustomFieldValue value : values) {
            deleteById(String.valueOf(value.getId()));
        }
    }

    @Override
    protected CustomFieldValue toEntity(CustomFieldValueItem item) {
        var entity = new CustomFieldValue();
        if (item.getId() != null) {
            entity.setId(Long.parseLong(item.getId()));
        }
        if (item.getEntityId() != null) {
            entity.setEntityId(Long.parseLong(item.getEntityId()));
        }
        if (item.getEntityType() != null) {
            entity.setEntityType(CustomFieldEntityType.valueOf(item.getEntityType()));
        }
        entity.setFieldValue(item.getFieldValue());
        if (item.getCreatedAt() != null) {
            entity.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entity.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        entity.setTenantId(item.getTenantId());
        return entity;
    }

    @Override
    protected CustomFieldValueItem toItem(CustomFieldValue entity) {
        var item = new CustomFieldValueItem();
        String id = entity.getId() != null ? String.valueOf(entity.getId()) : UUID.randomUUID().toString();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        item.setPk("TENANT#" + tenantId);
        item.setSk("CF_VALUE#" + id);

        String entityTypeStr = entity.getEntityType() != null ? entity.getEntityType().name() : "";
        String entityIdStr = entity.getEntityId() != null ? String.valueOf(entity.getEntityId()) : "";
        String customFieldId = entity.getCustomField() != null ?
                String.valueOf(entity.getCustomField().getId()) : "";

        item.setGsi2pk("CFV_ENTITY#" + entityTypeStr + "#" + entityIdStr);
        item.setGsi2sk("CF_VALUE#" + customFieldId);

        item.setId(id);
        item.setCustomFieldId(customFieldId);
        item.setEntityId(entityIdStr);
        item.setEntityType(entityTypeStr);
        item.setFieldValue(entity.getFieldValue());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }
        item.setTenantId(tenantId);

        return item;
    }
}
