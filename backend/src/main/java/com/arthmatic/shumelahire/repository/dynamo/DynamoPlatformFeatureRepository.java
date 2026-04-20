package com.arthmatic.shumelahire.repository.dynamo;

import com.arthmatic.shumelahire.entity.PlatformFeature;
import com.arthmatic.shumelahire.repository.PlatformFeatureDataRepository;
import com.arthmatic.shumelahire.repository.dynamo.items.PlatformFeatureItem;

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
 * DynamoDB repository for the PlatformFeature entity.
 * <p>
 * PlatformFeature is a global (non-tenant-scoped) entity. Its PK is always "PLATFORM"
 * instead of "TENANT#{tenantId}".
 * <p>
 * Key schema:
 * <pre>
 *   PK:     PLATFORM
 *   SK:     FEATURE#{id}
 *   GSI1PK: FEATURE_ACTIVE#{isActive}     GSI1SK: FEATURE#{code}
 *   GSI3PK: FEATURE_CATEGORY#{category}   GSI3SK: FEATURE#{code}
 *   GSI4PK: FEATURE_CODE#{code}           GSI4SK: FEATURE#{id}
 * </pre>
 */
@Repository
public class DynamoPlatformFeatureRepository extends DynamoRepository<PlatformFeatureItem, PlatformFeature>
        implements PlatformFeatureDataRepository {

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String PLATFORM_PK = "PLATFORM";

    public DynamoPlatformFeatureRepository(DynamoDbClient dynamoDbClient,
                                            DynamoDbEnhancedClient enhancedClient,
                                            String dynamoDbTableName) {
        super(dynamoDbClient, enhancedClient, dynamoDbTableName, PlatformFeatureItem.class);
    }

    @Override
    protected String entityType() {
        return "FEATURE";
    }

    /**
     * Override tenantPk() — PlatformFeature is global, not tenant-scoped.
     * PK is always "PLATFORM".
     */
    @Override
    protected String tenantPk() {
        return PLATFORM_PK;
    }

    // ── Override CRUD to use PLATFORM PK (no TenantContext needed) ────────────

    @Override
    public Optional<PlatformFeature> findById(String id) {
        var item = table.getItem(Key.builder()
                .partitionValue(PLATFORM_PK)
                .sortValue(entitySk(id))
                .build());
        return Optional.ofNullable(item).map(this::toEntity);
    }

    @Override
    public void deleteById(String id) {
        table.deleteItem(Key.builder()
                .partitionValue(PLATFORM_PK)
                .sortValue(entitySk(id))
                .build());
    }

    @Override
    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    @Override
    public List<PlatformFeature> findAll() {
        var response = dynamoDbClient.query(QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :skPrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.builder().s(PLATFORM_PK).build(),
                        ":skPrefix", AttributeValue.builder().s("FEATURE#").build()
                ))
                .build());

        return response.items().stream()
                .map(item -> table.tableSchema().mapToItem(item))
                .map(this::toEntity)
                .collect(Collectors.toList());
    }

    // ── PlatformFeatureDataRepository implementation ─────────────────────────

    @Override
    public Optional<PlatformFeature> findByCode(String code) {
        return findByGsiUnique("GSI4", "FEATURE_CODE#" + code);
    }

    @Override
    public List<PlatformFeature> findByIsActiveTrue() {
        return queryGsiAll("GSI1", "FEATURE_ACTIVE#true");
    }

    @Override
    public List<PlatformFeature> findByCategory(String category) {
        return queryGsiAll("GSI3", "FEATURE_CATEGORY#" + category);
    }

    @Override
    public boolean existsByCode(String code) {
        return findByCode(code).isPresent();
    }

    // ── Conversion: PlatformFeatureItem <-> PlatformFeature ──────────────────

    @Override
    protected PlatformFeature toEntity(PlatformFeatureItem item) {
        var feature = new PlatformFeature();
        if (item.getId() != null) {
            feature.setId(safeParseLong(item.getId()));
        }
        feature.setCode(item.getCode());
        feature.setName(item.getName());
        feature.setDescription(item.getDescription());
        feature.setCategory(item.getCategory());
        feature.setIncludedPlans(item.getIncludedPlans());
        if (item.getIsActive() != null) {
            feature.setActive(item.getIsActive());
        }
        if (item.getCreatedAt() != null) {
            feature.setCreatedAt(LocalDateTime.parse(item.getCreatedAt(), ISO_FMT));
        }
        if (item.getUpdatedAt() != null) {
            feature.setUpdatedAt(LocalDateTime.parse(item.getUpdatedAt(), ISO_FMT));
        }
        return feature;
    }

    @Override
    protected PlatformFeatureItem toItem(PlatformFeature entity) {
        var item = new PlatformFeatureItem();
        String id = entity.getId() != null ? entity.getId().toString() : java.util.UUID.randomUUID().toString();

        // Table keys — global, not tenant-scoped
        item.setPk(PLATFORM_PK);
        item.setSk("FEATURE#" + id);

        // GSI1: Active status index
        item.setGsi1pk("FEATURE_ACTIVE#" + entity.isActive());
        item.setGsi1sk("FEATURE#" + entity.getCode());

        // GSI3: Category index
        item.setGsi3pk("FEATURE_CATEGORY#" + entity.getCategory());
        item.setGsi3sk("FEATURE#" + entity.getCode());

        // GSI4: Unique constraint on code
        item.setGsi4pk("FEATURE_CODE#" + entity.getCode());
        item.setGsi4sk("FEATURE#" + id);

        // Entity fields
        item.setId(id);
        item.setCode(entity.getCode());
        item.setName(entity.getName());
        item.setDescription(entity.getDescription());
        item.setCategory(entity.getCategory());
        item.setIncludedPlans(entity.getIncludedPlans());
        item.setIsActive(entity.isActive());
        if (entity.getCreatedAt() != null) {
            item.setCreatedAt(entity.getCreatedAt().format(ISO_FMT));
        }
        if (entity.getUpdatedAt() != null) {
            item.setUpdatedAt(entity.getUpdatedAt().format(ISO_FMT));
        }

        return item;
    }
}
