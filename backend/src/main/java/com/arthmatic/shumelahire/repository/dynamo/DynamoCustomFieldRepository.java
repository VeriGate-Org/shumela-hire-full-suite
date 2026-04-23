package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.CustomField;
import com.arthmatic.shumelahire.entity.CustomFieldDataType;
import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import com.arthmatic.shumelahire.repository.CustomFieldDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.CustomFieldItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * DynamoDB repository for the CustomField entity.
 *
 * Key design:
 *   PK: TENANT#{tenantId}
 *   SK: CUSTOM_FIELD#{id}
 *
 * GSI1: entity type + active filter, sorted by display order
 *   GSI1PK: CF_ENTITY_TYPE#{entityType}_ACTIVE#{isActive}
 *   GSI1SK: CF_ORDER#{displayOrder padded}#{id}
 *
 * GSI4: unique constraint on fieldName + entityType
 *   GSI4PK: CF_UNIQUE#{entityType}#{fieldName}
 *   GSI4SK: CUSTOM_FIELD#{id}
 */
@Repository
public class DynamoCustomFieldRepository extends DynamoRepository<CustomFieldItem, CustomField>
        implements CustomFieldDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoCustomFieldRepository(DynamoDbClient dynamoDbClient,
                                        DynamoDbEnhancedClient enhancedClient,
                                        @org.springframework.beans.factory.annotation.Value("${aws.dynamodb.table-name}") String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, CustomFieldItem.class);
    }

    @Override
    protected String entityType() {
        return "CUSTOM_FIELD";
    }

    // ── Domain-specific queries ──────────────────────────────────────────────

    @Override
    public List<CustomField> findByEntityTypeAndActive(CustomFieldEntityType entityType) {
        // GSI1PK = CF_ENTITY_TYPE#{entityType}_ACTIVE#true — returns sorted by GSI1SK (display order)
        String gsi1pk = "CF_ENTITY_TYPE#" + entityType.name() + "_ACTIVE#true";
        return queryGsiAll("GSI1", gsi1pk);
    }

    @Override
    public Optional<CustomField> findByFieldNameAndEntityType(String fieldName, CustomFieldEntityType entityType) {
        // GSI4PK = CF_UNIQUE#{entityType}#{fieldName}
        String gsi4pk = "CF_UNIQUE#" + entityType.name() + "#" + fieldName;
        return findByGsiUnique("GSI4", gsi4pk);
    }

    @Override
    public boolean existsByFieldNameAndEntityType(String fieldName, CustomFieldEntityType entityType) {
        return findByFieldNameAndEntityType(fieldName, entityType).isPresent();
    }

    @Override
    public List<CustomField> findByEntityType(CustomFieldEntityType entityType) {
        return findAll().stream()
                .filter(cf -> entityType.equals(cf.getEntityType()))
                .sorted(java.util.Comparator.comparing(
                        cf -> cf.getDisplayOrder() != null ? cf.getDisplayOrder() : Integer.MAX_VALUE))
                .collect(java.util.stream.Collectors.toList());
    }

    // ── Conversion ───────────────────────────────────────────────────────────

    @Override
    protected CustomField toEntity(CustomFieldItem item) {
        var entity = new CustomField();
        if (item.getId() != null) {
            entity.setId(item.getId());
        }
        entity.setFieldName(item.getFieldName());
        entity.setFieldLabel(item.getFieldLabel());
        if (item.getEntityType() != null) {
            entity.setEntityType(CustomFieldEntityType.valueOf(item.getEntityType()));
        }
        if (item.getDataType() != null) {
            entity.setDataType(CustomFieldDataType.valueOf(item.getDataType()));
        }
        if (item.getIsRequired() != null) {
            entity.setIsRequired(Boolean.parseBoolean(item.getIsRequired()));
        }
        if (item.getIsActive() != null) {
            entity.setIsActive(Boolean.parseBoolean(item.getIsActive()));
        }
        entity.setDisplayOrder(item.getDisplayOrder());
        entity.setOptions(item.getOptions());
        entity.setDefaultValue(item.getDefaultValue());
        entity.setValidationRegex(item.getValidationRegex());
        entity.setHelpText(item.getHelpText());
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
    protected CustomFieldItem toItem(CustomField entity) {
        var item = new CustomFieldItem();
        String id = entity.getId() != null ? entity.getId() : null;
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("CUSTOM_FIELD#" + id);

        // GSI1: entity type + active filter, sorted by display order
        String activeStr = entity.getIsActive() != null ? String.valueOf(entity.getIsActive()) : "true";
        String entityTypeStr = entity.getEntityType() != null ? entity.getEntityType().name() : "";
        item.setGsi1pk("CF_ENTITY_TYPE#" + entityTypeStr + "_ACTIVE#" + activeStr);
        int order = entity.getDisplayOrder() != null ? entity.getDisplayOrder() : 0;
        item.setGsi1sk("CF_ORDER#" + String.format("%010d", order) + "#" + id);

        // GSI4: unique constraint on fieldName + entityType
        item.setGsi4pk("CF_UNIQUE#" + entityTypeStr + "#" + entity.getFieldName());
        item.setGsi4sk("CUSTOM_FIELD#" + id);

        // Entity fields
        item.setId(id);
        item.setFieldName(entity.getFieldName());
        item.setFieldLabel(entity.getFieldLabel());
        item.setEntityType(entityTypeStr);
        if (entity.getDataType() != null) {
            item.setDataType(entity.getDataType().name());
        }
        item.setIsRequired(entity.getIsRequired() != null ? String.valueOf(entity.getIsRequired()) : "false");
        item.setIsActive(activeStr);
        item.setDisplayOrder(entity.getDisplayOrder());
        item.setOptions(entity.getOptions());
        item.setDefaultValue(entity.getDefaultValue());
        item.setValidationRegex(entity.getValidationRegex());
        item.setHelpText(entity.getHelpText());
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
