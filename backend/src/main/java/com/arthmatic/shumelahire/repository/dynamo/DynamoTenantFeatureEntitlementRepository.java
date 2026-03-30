package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.TenantFeatureEntitlement;
import com.arthmatic.shumelahire.repository.TenantFeatureEntitlementDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.TenantFeatureEntitlementItem;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * DynamoDB repository for the TenantFeatureEntitlement entity.
 * <p>
 * TenantFeatureEntitlement has a tenantId field but does NOT extend TenantAwareEntity.
 * The SK uses featureId (not a separate entitlement ID) since the combination of
 * tenantId + featureId is the natural unique key.
 * <p>
 * Key schema:
 * <pre>
 *   PK:     TENANT#{tenantId}
 *   SK:     ENTITLEMENT#{featureId}
 *   GSI2PK: ENTITLEMENT_FEATURE#{featureId}   GSI2SK: TENANT#{tenantId}
 * </pre>
 */
@Repository
public class DynamoTenantFeatureEntitlementRepository
        extends DynamoRepository<TenantFeatureEntitlementItem, TenantFeatureEntitlement>
        implements TenantFeatureEntitlementDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public DynamoTenantFeatureEntitlementRepository(DynamoDbClient dynamoDbClient,
                                                     DynamoDbEnhancedClient enhancedClient,
                                                     String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, TenantFeatureEntitlementItem.class);
    }

    @Override
    protected String entityType() {
        return "ENTITLEMENT";
    }

    // ── TenantFeatureEntitlementDataRepository implementation ────────────────

    @Override
    public Optional<TenantFeatureEntitlement> findByTenantIdAndFeatureId(String tenantId, String featureId) {
        var item = table.getItem(Key.builder()
                .partitionValue("TENANT#" + tenantId)
                .sortValue("ENTITLEMENT#" + featureId)
                .build());
        return Optional.ofNullable(item).map(this::toEntity);
    }

    @Override
    public List<TenantFeatureEntitlement> findByTenantId(String tenantId) {
        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s("TENANT#" + tenantId).build(),
                        ":skPrefix", AttributeValue.builder().s("ENTITLEMENT#").build()
                ))
                .build());

        return response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<TenantFeatureEntitlement> findByFeatureId(String featureId) {
        return queryGsiAll("GSI2", "ENTITLEMENT_FEATURE#" + featureId);
    }

    @Override
    public void deleteByTenantIdAndFeatureId(String tenantId, String featureId) {
        table.deleteItem(Key.builder()
                .partitionValue("TENANT#" + tenantId)
                .sortValue("ENTITLEMENT#" + featureId)
                .build());
    }

    // ── Conversion: TenantFeatureEntitlementItem <-> TenantFeatureEntitlement ─

    @Override
    protected TenantFeatureEntitlement toEntity(TenantFeatureEntitlementItem item) {
        var entitlement = new TenantFeatureEntitlement();
        if (item.getId() != null) {
            entitlement.setId(Long.parseLong(item.getId()));
        }
        entitlement.setTenantId(item.getTenantId());
        if (item.getFeatureId() != null) {
            entitlement.setFeatureId(Long.parseLong(item.getFeatureId()));
        }
        if (item.getIsEnabled() != null) {
            entitlement.setEnabled(item.getIsEnabled());
        }
        entitlement.setReason(item.getReason());
        entitlement.setGrantedBy(item.getGrantedBy());
        if (item.getExpiresAt() != null) {
            entitlement.setExpiresAt(LocalDateTime.parse(item.getExpiresAt(), ISO_FMT));
        }
        if (item.getCreatedAt() != null) {
            entitlement.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            entitlement.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return entitlement;
    }

    @Override
    protected TenantFeatureEntitlementItem toItem(TenantFeatureEntitlement entity) {
        var item = new TenantFeatureEntitlementItem();
        String tenantId = entity.getTenantId() != null ? entity.getTenantId() : currentTenantId();
        String featureId = entity.getFeatureId() != null ? entity.getFeatureId().toString() : "";
        String id = entity.getId() != null ? entity.getId().toString() : java.util.UUID.randomUUID().toString();

        // Table keys
        item.setPk("TENANT#" + tenantId);
        item.setSk("ENTITLEMENT#" + featureId);

        // GSI2: Feature lookup across tenants
        item.setGsi2pk("ENTITLEMENT_FEATURE#" + featureId);
        item.setGsi2sk("TENANT#" + tenantId);

        // Entity fields
        item.setId(id);
        item.setTenantId(tenantId);
        item.setFeatureId(featureId);
        item.setIsEnabled(entity.isEnabled());
        item.setReason(entity.getReason());
        item.setGrantedBy(entity.getGrantedBy());
        if (entity.getExpiresAt() != null) {
            item.setExpiresAt(entity.getExpiresAt().format(ISO_FMT));
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
